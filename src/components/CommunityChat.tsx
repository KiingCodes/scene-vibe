import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LogoSkeleton as SceneLoadingSkeleton } from "@/components/BrandedSkeleton";
import logoWatermark from "@/assets/scene-logo.jpg";
import { useIsAdmin } from "@/hooks/useAdmin";
import {
  useCommunityMessages,
  useSendCommunityMessage,
  useMessageReactions,
  useToggleMessageReaction,
  CHAT_REACTIONS,
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
import { getLevelFromPoints } from "@/hooks/useGamification";

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
import { BROADCAST_CHANNELS } from '@/lib/venueCommand';

const MAX_IMAGE_MB = 5;
const MAX_AUDIO_MB = 8;
const MAX_VIDEO_MB = 20;
const CHANNELS = ['#Global-Vibes', '#Amapiano & Deep House', '#Johannesburg / #CapeTown', '#Live-Clubs', '#Johannesburg', '#CapeTown'];
/** Stable ids stored on each message for its channel. */
const CHANNEL_IDS: Record<string, string> = Object.fromEntries(BROADCAST_CHANNELS.map(({ id, label }) => [label, id]));
const REACTIONS = CHAT_REACTIONS;

const SceneLevelBadge = ({ points }: { points?: number }) => {
  if (points == null) return null;

  const { level, title } = getLevelFromPoints(points);
  const label = title === "Regular" ? "SCENE Regular" : `Lv.${level} ${title}`;

  return (
    <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200">
      {label}
    </span>
  );
};

const CommunityChat = () => {
  const { data: ownerIds } = useVenueOwnerIds();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const deviceId = useDeviceId();
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const channelId = CHANNEL_IDS[activeChannel] ?? "global";
  const {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityMessages(channelId);
  const messageIds = useMemo(() => messages.map((m) => m.id), [messages]);
  const messageUserIds = useMemo(
    () => [...new Set(messages.map((message) => message.user_id))].sort(),
    [messages],
  );
  const {
    data: userPoints = [],
    error: userPointsError,
  } = useQuery({
    queryKey: ["community-chat-user-points", messageUserIds],
    enabled: messageUserIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_points")
        .select("user_id, points")
        .in("user_id", messageUserIds);
      if (error) throw error;
      return data ?? [];
    },
  });
  useEffect(() => {
    if (userPointsError) toast.error("Could not load chat level badges");
  }, [userPointsError]);
  const pointsByUser = useMemo(
    () => new Map(userPoints.map(({ user_id, points }) => [user_id, points])),
    [userPoints],
  );
  const { summary: reactions, key: reactionsKey } = useMessageReactions(messageIds);
  const toggleReaction = useToggleMessageReaction(reactionsKey);
  const sendMessage = useSendCommunityMessage();
  const deleteMessage = useDeleteCommunityMessage();
  const flagMessage = useFlagMessage();

  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
          channelId,
        });
      }
      setText("");
      setPreviewFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send");
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
        channelId,
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
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("duplicate"))
        toast.info("Already reported");
      else toast.error("Could not flag");
    }
  };

  const addEmoji = (emoji: string) => {
    setText((p) => p + emoji);
    setShowEmojis(false);
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!user) {
      toast.error("Sign in to react");
      return;
    }
    const on = !!reactions[messageId]?.[emoji]?.mine;
    toggleReaction.mutate(
      { messageId, emoji, on },
      { onError: () => toast.error("Could not save that reaction") },
    );
    if (on) return;
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
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl">
      {/* Header */}
      <div className="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-slate-950/90 px-4 pb-3 pt-4 shadow-[0_10px_35px_rgba(6,182,212,0.06)] backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981] animate-pulse" />
              SCENE Pulse
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                Live
              </span>
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Live city signals · Messages auto-clear after 24h
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] font-semibold text-emerald-400">
              {onlineCount} in room
            </span>
            {messages && (
              <span className="text-[10px] text-slate-500">
                {messages.length} messages
              </span>
            )}
          </div>
        </div>
        <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto pb-1">
          {CHANNELS.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => setActiveChannel(channel)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                activeChannel === channel
                  ? "border border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20"
              }`}
            >
              {channel}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="z-10 shrink-0 border-b border-white/5 bg-slate-950/70 px-4 py-2 backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || "Search..."}
            className="h-10 rounded-xl border border-white/10 bg-slate-950/80 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/40"
          />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto overscroll-contain bg-slate-950/45 px-4 py-3 pb-5"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden"
        >
          <div className="absolute h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl md:h-64 md:w-64" />
          <img
            src={logoWatermark}
            alt=""
            className="relative h-64 w-64 object-contain opacity-10 md:h-80 md:w-80"
          />
        </div>
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
          <SceneLoadingSkeleton label="Loading older messages…" size={24} className="relative z-10 border-0 bg-transparent py-2" />
        )}
        {hasNextPage && !isFetchingNextPage && (
          <button
            onClick={() => {
              prevScrollHeight.current = scrollRef.current?.scrollHeight ?? 0;
              fetchNextPage();
            }}
            className="relative z-10 mx-auto flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <ArrowUp className="w-3 h-3" /> Load older
          </button>
        )}
        {isLoading && (
          <SceneLoadingSkeleton label="Loading the scene…" size={36} className="relative z-10 border-0 bg-transparent py-4" />
        )}
        {filteredMessages?.length === 0 && !isLoading && search && (
          <div className="relative z-10 my-auto w-full py-12 text-center text-muted-foreground text-sm">
            No messages match your search.
          </div>
        )}
        <AnimatePresence initial={false}>
          {filteredMessages?.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            const profile = msg.profile;
            const isVenue = msg.sender_type === 'venue' && msg.is_verified_venue;
            const username = isVenue ? msg.sender_name || 'Venue' : profile?.username || 'Anon';
            const initials = username.slice(0, 2).toUpperCase();
            const color = getUserColor(msg.user_id);
            const mediaUrl = msg.media_url;
            const msgType = msg.message_type || "text";
            const createdAt = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], {
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
                className={`relative z-10 flex ${isOwn ? "justify-end" : "justify-start"} group`}
              >
                <div
                  className={`max-w-[88%] flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className="relative mb-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
                    style={{
                      color: color.name,
                      borderColor: color.border,
                      background: color.bubble,
                    }}
                  >
                    {initials}
                    <span className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2">
                      <SceneLevelBadge points={pointsByUser.get(msg.user_id)} />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`mb-1 flex items-center gap-1.5 ${isOwn ? "justify-end" : ""}`}
                    >
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: color.name }}
                      >
                        {isOwn && !isVenue ? "You" : username}
                      </span>
                      {(isVenue || ownerIds?.has(msg.user_id)) && <OfficialAccountTag />}
                      <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        {isVenue
                          ? 'Venue announcement'
                          : ownerIds?.has(msg.user_id)
                          ? "Venue VIP"
                          : isAdmin && isOwn
                            ? "Admin"
                            : "Clubber"}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {createdAt}
                      </span>
                      {isOwn && (
                        <CheckCheck
                          className="h-3 w-3 text-primary"
                          aria-label="Read"
                        />
                      )}
                    </div>
                    <div
                      className={`relative border p-3.5 text-sm backdrop-blur-xl ${
                        isOwn
                          ? "rounded-2xl rounded-tr-none border-cyan-400/30 bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                          : "rounded-2xl rounded-tl-none border-white/10 bg-slate-900/90 text-slate-100"
                      }`}
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
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
                            <Mic className="w-4 h-4" />
                          </span>
                          <div className="flex flex-1 items-center gap-0.5 opacity-70">
                            {Array.from({ length: 18 }).map((_, index) => (
                              <span
                                key={index}
                                className="w-1 rounded-full bg-cyan-400"
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
                        const r = reactions[msg.id]?.[emoji];
                        const count = r?.count || 0;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => addReaction(msg.id, emoji)}
                            aria-pressed={!!r?.mine}
                            disabled={toggleReaction.isPending}
                            className={`rounded-full border px-2 py-0.5 text-[11px] transition hover:-translate-y-0.5 ${r?.mine ? "border-primary bg-primary/20 shadow-[0_0_10px_hsl(var(--primary)/0.4)]" : count ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/[0.04]"}`}
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
        <div className="sticky bottom-0 z-20 shrink-0 border-t border-white/10 bg-slate-950/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl">
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
            className="m-3 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-2xl"
          >
            <button
              type="button"
              onClick={() => setShowEmojis((s) => !s)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-slate-400 transition-all hover:border-cyan-400/50 hover:text-cyan-200 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-slate-400 transition-all hover:border-cyan-400/50 hover:text-cyan-200 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] disabled:opacity-40"
              title="Attach image or audio"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            {recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-400/40 bg-rose-500/10 text-rose-300 animate-pulse"
                title="Stop recording"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={uploadProgress != null}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-slate-400 transition-all hover:border-cyan-400/50 hover:text-cyan-200 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] disabled:opacity-40"
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
              className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={
                (!text.trim() && !previewFile) ||
                sendMessage.isPending ||
                uploadProgress != null
              }
              className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
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
        <div className="sticky bottom-0 z-20 shrink-0 border-t border-white/10 bg-slate-950/85 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center backdrop-blur-2xl">
          <Link
            to="/auth"
            className="text-sm font-semibold text-cyan-300 hover:underline"
          >
            Sign in to join the chat
          </Link>
        </div>
      )}
    </div>
  );
};

export default CommunityChat;
