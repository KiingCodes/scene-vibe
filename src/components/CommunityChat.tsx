import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Trash2,
  Image as ImageIcon,
  Mic,
  Square,
  Flag,
  X,
  Smile,
  Loader2,
  Search,
  ArrowUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import {
  useCommunityMessages,
  useSendCommunityMessage,
  useDeleteCommunityMessage,
  useFlagMessage,
} from "@/hooks/useCommunityChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getUserColor } from "@/lib/userColor";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useVenueOwnerIds } from "@/hooks/useVenueOwner";
import { OfficialAccountTag } from "@/components/VerifiedBadge";

const QUICK_EMOJIS = [
  "🔥",
  "🎉",
  "💃",
  "🕺",
  "🎵",
  "😍",
  "🙌",
  "👀",
  "💀",
  "😂",
  "🥂",
  "🎧",
  "⚡",
  "🌃",
  "✨",
];
const MAX_IMAGE_MB = 5;
const MAX_AUDIO_MB = 8;
const MAX_VIDEO_MB = 20;
const CHANNELS = [
  "#Global-Vibes",
  "#Amapiano & Deep House",
  "#Johannesburg / #CapeTown",
  "#Live-Clubs",
];
const VIBE_PROMPTS = [
  "Where's the pull up tonight? 🔥",
  "Who has the best line-up? 🎧",
  "Share a quick photo/vibe check 📸",
];
const REACTIONS = ["🔥", "🍸", "⚡", "🎧"];

const CommunityChat = () => {
  const { data: ownerIds } = useVenueOwnerIds();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const deviceId = useDeviceId();
  const [onlineCount, setOnlineCount] = useState(1);
  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityMessages();
  const sendMessage = useSendCommunityMessage();
  const deleteMessage = useDeleteCommunityMessage();
  const flagMessage = useFlagMessage();

  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [reactions, setReactions] = useState<
    Record<string, Record<string, number>>
  >({});
  const [reactionParticles, setReactionParticles] = useState<
    { id: string; emoji: string }[]
  >([]);
  const searchPlaceholder = useTypewriter([
    "Search the chat...",
    "Find a vibe...",
    'Try "amapiano" or a name...',
    "Look back at tonight...",
  ]);

  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);
  const stickToBottom = useRef<boolean>(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Realtime presence — count distinct users currently in the chat room.
  useEffect(() => {
    const key =
      user?.id || deviceId || `anon-${Math.random().toString(36).slice(2)}`;
    if (!key) return;
    const channel = supabase.channel("community-chat-presence", {
      config: { presence: { key } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, deviceId]);

  // Auto-scroll to bottom only when user is already near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    } else if (prevScrollHeight.current) {
      // Preserve scroll position after older messages were prepended.
      el.scrollTop = el.scrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 60 && hasNextPage && !isFetchingNextPage) {
      prevScrollHeight.current = el.scrollHeight;
      fetchNextPage();
    }
  };

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(
      (m) =>
        (m.content || "").toLowerCase().includes(q) ||
        (m.profile?.username || "").toLowerCase().includes(q),
    );
  }, [messages, search]);

  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to chat");
      return;
    }
    if (!text.trim() && !previewFile) return;

    try {
      if (previewFile) {
        await uploadAndSend(previewFile, text.trim());
      } else {
        await sendMessage.mutateAsync({
          content: text.trim(),
          messageType: "text",
        });
      }
      setText("");
      setPreviewFile(null);
    } catch (err: any) {
      toast.error(err?.message || "Could not send");
    }
  };

  const uploadAndSend = async (file: File, caption: string) => {
    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isAudio && !isVideo)
      throw new Error("Only photos, short videos, and voice notes are allowed");
    const limitMb = isImage
      ? MAX_IMAGE_MB
      : isAudio
        ? MAX_AUDIO_MB
        : MAX_VIDEO_MB;
    if (file.size > limitMb * 1024 * 1024)
      throw new Error(`File too large (max ${limitMb}MB)`);

    setUploadProgress(5);
    const ext = (
      file.name.split(".").pop() || (isAudio ? "webm" : "jpg")
    ).toLowerCase();
    const path = `community/${user!.id}/${Date.now()}.${ext}`;

    // Simulated progress (Supabase JS SDK upload doesn't expose granular progress events)
    const tick = setInterval(
      () => setUploadProgress((p) => (p == null ? null : Math.min(90, p + 12))),
      200,
    );

    try {
      const { error: upErr } = await supabase.storage
        .from("chat-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from("chat-media")
        .getPublicUrl(path);
      setUploadProgress(100);
      await sendMessage.mutateAsync({
        content:
          caption ||
          (isAudio ? "🎙️ Voice note" : isVideo ? "🎞️ Video" : "📸 Photo"),
        mediaUrl: urlData.publicUrl,
        messageType: isAudio ? "audio" : isVideo ? "video" : "image",
      });
    } finally {
      clearInterval(tick);
      setTimeout(() => setUploadProgress(null), 400);
    }
  };

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (
      !f.type.startsWith("image/") &&
      !f.type.startsWith("audio/") &&
      !f.type.startsWith("video/")
    ) {
      toast.error("Only photos, short videos, and audio allowed");
      return;
    }
    setPreviewFile(f);
  };

  const startRecording = async () => {
    if (!user) {
      toast.error("Sign in to record");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setPreviewFile(file);
        setRecording(false);
      };
      recorderRef.current = mr;
      mr.start();
      setRecording(true);
      // Auto-stop after 60s
      setTimeout(() => {
        if (mr.state === "recording") mr.stop();
      }, 60000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const handleDelete = async (id: string) => {
    // Enforce client-side rule: only own message OR admin can delete. (DB RLS also enforces.)
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    const isOwn = msg.user_id === user?.id;
    if (!isOwn && !isAdmin) {
      toast.error("Only admins can remove others\u2019 messages");
      return;
    }
    try {
      await deleteMessage.mutateAsync(id);
      toast.success(isAdmin && !isOwn ? "Removed by admin" : "Removed");
    } catch {
      toast.error("Could not remove");
    }
  };

  const handleFlag = async (id: string) => {
    if (!user) {
      toast.error("Sign in to flag");
      return;
    }
    try {
      await flagMessage.mutateAsync({ messageId: id });
      toast.success("Reported. Thanks for keeping the scene safe.");
    } catch (e: any) {
      if (e?.message?.includes("duplicate")) toast.info("Already reported");
      else toast.error("Could not flag");
    }
  };

  const addEmoji = (emoji: string) => {
    setText((p) => p + emoji);
    setShowEmojis(false);
  };

  const addReaction = (messageId: string, emoji: string) => {
    setReactions((current) => ({
      ...current,
      [messageId]: {
        ...current[messageId],
        [emoji]: (current[messageId]?.[emoji] || 0) + 1,
      },
    }));
    const particleId = `${messageId}-${Date.now()}`;
    setReactionParticles((current) => [...current, { id: particleId, emoji }]);
    window.setTimeout(
      () =>
        setReactionParticles((current) =>
          current.filter((particle) => particle.id !== particleId),
        ),
      900,
    );
  };

  return (
    <div className="glass rounded-2xl flex flex-col flex-1 min-h-0 h-full overflow-hidden border border-border/50 shadow-2xl">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-primary/15 bg-[linear-gradient(110deg,hsl(240_12%_9%_/_0.94),hsl(290_22%_13%_/_0.9),hsl(190_18%_10%_/_0.94))] backdrop-blur-xl shadow-[inset_0_-1px_0_hsl(174_100%_50%_/_0.12),0_10px_35px_hsl(280_100%_60%_/_0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              Community <span className="text-primary neon-text">Chat</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              The city is online · messages auto-clear after 24h
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              {onlineCount} online
            </span>
            {messages && (
              <span className="text-[10px] text-muted-foreground">
                {messages.length} msgs
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CHANNELS.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => setActiveChannel(channel)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                activeChannel === channel
                  ? "border-primary/70 bg-primary/15 text-primary shadow-[0_0_16px_hsl(174_100%_50%_/_0.2)]"
                  : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-secondary/50 hover:text-foreground"
              }`}
            >
              {channel}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2 border-b border-border/30 bg-background/30">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || "Search..."}
            className="pl-8 h-8 text-xs bg-muted/40 border-border/40"
          />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-background/40"
      >
        <AnimatePresence>
          {reactionParticles.map((particle) => (
            <motion.span
              key={particle.id}
              initial={{ opacity: 0, y: 8, scale: 0.7 }}
              animate={{ opacity: 1, y: -36, scale: 1.25 }}
              exit={{ opacity: 0, y: -60 }}
              className="pointer-events-none absolute right-8 top-1/2 z-10 text-2xl drop-shadow-[0_0_8px_hsl(330_100%_60%_/_0.8)]"
            >
              {particle.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
        {isFetchingNextPage && (
          <p className="text-muted-foreground text-[11px] text-center flex items-center justify-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading older
            messages...
          </p>
        )}
        {hasNextPage && !isFetchingNextPage && (
          <button
            onClick={() => {
              prevScrollHeight.current = scrollRef.current?.scrollHeight ?? 0;
              fetchNextPage();
            }}
            className="text-[11px] text-primary mx-auto hover:underline flex items-center gap-1"
          >
            <ArrowUp className="w-3 h-3" /> Load older
          </button>
        )}
        {isLoading && (
          <p className="text-muted-foreground text-xs text-center">
            Loading the scene...
          </p>
        )}
        {filteredMessages?.length === 0 &&
          !isLoading &&
          (search ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No messages match your search.
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-secondary/25 bg-[radial-gradient(circle_at_85%_10%,hsl(330_100%_60%_/_0.22),transparent_38%),linear-gradient(135deg,hsl(240_10%_10%_/_0.96),hsl(280_25%_14%_/_0.8))] px-5 py-8 text-center shadow-[0_0_35px_hsl(330_100%_60%_/_0.1)]">
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full border border-primary/20" />
              <div className="absolute -bottom-16 -left-8 h-32 w-32 rounded-full border border-secondary/20" />
              <p className="text-3xl">✦</p>
              <p className="mt-2 font-display text-xl font-bold text-foreground">
                Join the Vibe
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Be the first signal in {activeChannel}. Drop a question, a tip,
                or a little proof of life from the dance floor.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {VIBE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setText(prompt)}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] text-foreground transition hover:border-primary/60 hover:bg-primary/10"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        <AnimatePresence initial={false}>
          {filteredMessages?.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            const profile = (msg as any).profile;
            const username = profile?.username || "Anon";
            const initials = username.slice(0, 2).toUpperCase();
            const color = getUserColor(msg.user_id);
            const mediaUrl = (msg as any).media_url;
            const msgType = (msg as any).message_type || "text";
            const createdAt = (msg as any).created_at
              ? new Date((msg as any).created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
              >
                <div
                  className={`max-w-[88%] flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className="mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
                    style={{
                      color: color.name,
                      borderColor: color.border,
                      background: color.bubble,
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`mb-1 flex items-center gap-1.5 ${isOwn ? "justify-end" : ""}`}
                    >
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: color.name }}
                      >
                        {isOwn ? "You" : username}
                      </span>
                      {ownerIds?.has(msg.user_id) && <OfficialAccountTag />}
                      <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        {ownerIds?.has(msg.user_id)
                          ? "Venue VIP"
                          : isAdmin && isOwn
                            ? "Admin"
                            : "Clubber"}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {createdAt}
                      </span>
                    </div>
                    <div
                      className={`relative px-3.5 py-2 text-sm border backdrop-blur-sm ${isOwn ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`}
                      style={{
                        background: color.bubble,
                        borderColor: color.border,
                        boxShadow: color.glow,
                        color: "hsl(0 0% 98%)",
                      }}
                    >
                      {msgType === "image" && mediaUrl ? (
                        <div className="space-y-1.5">
                          <img
                            src={mediaUrl}
                            alt="shared"
                            className="rounded-lg max-h-56 max-w-full object-cover"
                            loading="lazy"
                          />
                          {msg.content && msg.content !== "📸 Photo" && (
                            <p className="text-xs">{msg.content}</p>
                          )}
                        </div>
                      ) : msgType === "video" && mediaUrl ? (
                        <div className="space-y-1.5">
                          <video
                            src={mediaUrl}
                            controls
                            playsInline
                            className="rounded-lg max-h-56 max-w-full"
                          />
                          {msg.content && msg.content !== "🎞️ Video" && (
                            <p className="text-xs">{msg.content}</p>
                          )}
                        </div>
                      ) : msgType === "audio" && mediaUrl ? (
                        <div className="flex min-w-[210px] items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                            <Mic className="w-4 h-4" />
                          </span>
                          <div className="flex flex-1 items-center gap-0.5 opacity-70">
                            {Array.from({ length: 18 }).map((_, index) => (
                              <span
                                key={index}
                                className="w-1 rounded-full bg-primary"
                                style={{
                                  height: `${8 + ((index * 7) % 16)}px`,
                                }}
                              />
                            ))}
                          </div>
                          <audio controls src={mediaUrl} className="h-7 w-24" />
                        </div>
                      ) : (
                        <p className="break-words leading-snug">
                          {msg.content}
                        </p>
                      )}

                      {/* Hover actions */}
                      <div
                        className={`absolute ${isOwn ? "-left-16" : "-right-16"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}
                      >
                        {!isOwn && user && (
                          <button
                            onClick={() => handleFlag(msg.id)}
                            className="p-1.5 rounded-full bg-background/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                            title="Report"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        )}
                        {(isOwn || isAdmin) && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1.5 rounded-full bg-background/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                            title={
                              isAdmin && !isOwn ? "Admin remove" : "Delete"
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div
                      className={`mt-1 flex items-center gap-1 ${isOwn ? "justify-end" : ""}`}
                    >
                      {REACTIONS.map((emoji) => {
                        const count = reactions[msg.id]?.[emoji] || 0;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => addReaction(msg.id, emoji)}
                            className={`rounded-full border px-2 py-0.5 text-[11px] transition hover:-translate-y-0.5 ${count ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/[0.04]"}`}
                          >
                            {emoji}
                            {count ? ` ${count}` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Composer */}
      {user ? (
        <div className="border-t border-border/40 bg-background/60 backdrop-blur">
          {/* Preview */}
          {previewFile && previewUrl && (
            <div className="px-3 pt-3">
              <div className="relative inline-flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 p-2 pr-8">
                {previewFile.type.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="h-14 w-14 object-cover rounded"
                  />
                ) : previewFile.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    controls
                    className="h-14 w-20 object-cover rounded"
                  />
                ) : (
                  <audio src={previewUrl} controls className="h-8" />
                )}
                <span className="text-[11px] text-muted-foreground max-w-[140px] truncate">
                  {previewFile.name}
                </span>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="absolute top-1 right-1 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {uploadProgress != null && (
            <div className="px-3 pt-2">
              <Progress value={uploadProgress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {showEmojis && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-border/30">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => addEmoji(e)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="m-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] p-1.5 pl-3 shadow-[inset_0_1px_0_hsl(0_0%_100%_/_0.06),0_0_24px_hsl(174_100%_50%_/_0.06)] backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => setShowEmojis((s) => !s)}
              className="text-muted-foreground hover:text-foreground shrink-0"
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handlePickFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadProgress != null}
              className="text-muted-foreground hover:text-foreground shrink-0"
              title="Attach image or audio"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            {recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="text-destructive shrink-0 animate-pulse"
                title="Stop recording"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={uploadProgress != null}
                className="text-muted-foreground hover:text-primary shrink-0"
                title="Record voice note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                recording
                  ? "🎙️ Recording... tap stop when done"
                  : "What's the vibe right now?"
              }
              maxLength={500}
              disabled={recording}
              className="h-10 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={
                (!text.trim() && !previewFile) ||
                sendMessage.isPending ||
                uploadProgress != null
              }
              className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground shadow-[0_0_18px_hsl(174_100%_50%_/_0.55)] transition hover:scale-105 hover:bg-primary"
            >
              {uploadProgress != null ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="p-4 border-t border-border/40 text-center bg-background/60">
          <Link
            to="/auth"
            className="text-primary text-sm font-semibold hover:underline"
          >
            Sign in to join the chat
          </Link>
        </div>
      )}
    </div>
  );
};

export default CommunityChat;
