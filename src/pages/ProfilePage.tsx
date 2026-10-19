import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Flame,
  Star,
  MessageCircle,
  Heart,
  Trophy,
  Calendar,
  MapPin,
  Edit3,
  Settings,
  Shield,
  CheckCircle,
  Camera,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  useUserPoints,
  useUserBadges,
  BADGE_DEFINITIONS,
  getLevelFromPoints,
} from "@/hooks/useGamification";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useFollowCounts } from "@/hooks/useFollows";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Animated3DEmoji, {
  type Animated3DEmojiName,
} from "@/components/ui/Animated3DEmoji";
import { LogoSkeleton } from "@/components/BrandedSkeleton";
import sceneLogo from "@/assets/scene-logo.jpg";

const VERIFIED_LEVEL = 8; // VIP level = auto-verified
const BADGE_EMOJIS: Record<string, Animated3DEmojiName> = {
  first_vibe: "fire",
  vibe_master: "lightning",
  reviewer: "microphone",
  dj_rater: "headphones",
  explorer: "map",
  spot_suggester: "lightbulb",
  regular: "crown",
  social: "butterfly",
  night_owl: "owl",
  top_10: "trophy",
};

const useProfileStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [vibes, reviews, messages, favorites] = await Promise.all([
        supabase
          .from("vibes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      return {
        vibes: vibes.count ?? 0,
        reviews: reviews.count ?? 0,
        messages: messages.count ?? 0,
        favorites: favorites.count ?? 0,
      };
    },
    enabled: !!user,
  });
};

const useRecentActivity = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recent-activity", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: vibes } = await supabase
        .from("vibes")
        .select("club_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      const clubIds = [...new Set(vibes?.map((v) => v.club_id) || [])];
      if (clubIds.length === 0) return [];
      const { data: clubs } = await supabase
        .from("clubs")
        .select("id, name, area")
        .in("id", clubIds);
      const clubMap = new Map(clubs?.map((c) => [c.id, c]) || []);
      return vibes?.map((v) => ({ ...v, club: clubMap.get(v.club_id) })) || [];
    },
    enabled: !!user,
  });
};

const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: points } = useUserPoints();
  const { data: badges, isLoading: badgesLoading } = useUserBadges();
  const { data: stats } = useProfileStats();
  const { data: recentActivity } = useRecentActivity();
  const { data: isAdmin } = useIsAdmin();
  const { data: followCounts } = useFollowCounts(user?.id);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Pick an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("chat-media")
        .upload(path, file, {
          contentType: file.type,
          upsert: true,
        });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-media").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (dbErr) throw dbErr;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profile photo updated ✨");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not upload photo";
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const levelInfo = getLevelFromPoints(points?.points || 0);
  const progressPct = points
    ? Math.min((points.points / levelInfo.next) * 100, 100)
    : 0;
  const earnedBadgeTypes = new Set(badges?.map((b) => b.badge_type) || []);
  const username =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "Anonymous";
  const isVerified = isAdmin || levelInfo.level >= VERIFIED_LEVEL;

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.trim().length < 2) {
      toast.error("Username must be at least 2 characters");
      return;
    }
    try {
      await supabase.auth.updateUser({
        data: { username: newUsername.trim() },
      });
      await supabase
        .from("profiles")
        .update({ username: newUsername.trim() })
        .eq("user_id", user!.id);
      setEditingUsername(false);
      toast.success("Username updated! ✨");
    } catch {
      toast.error("Could not update username");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-dark">
        <Navbar />
        <main className="relative isolate mx-auto flex min-h-screen max-w-2xl items-center justify-center overflow-hidden px-4 pb-16 pt-24 text-center">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden">
            <div className="absolute h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.12),rgba(217,70,239,0.06)_48%,transparent_72%)] blur-3xl md:h-96 md:w-96" />
            <img src={sceneLogo} alt="" className="h-72 w-72 object-contain opacity-[0.06] md:h-96 md:w-96" />
          </div>
          <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <Animated3DEmoji name="crown" label="Join SCENE" className="mx-auto mb-5 h-16 w-16 rounded-2xl border-cyan-300/20 bg-cyan-400/10" />
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">
              Join the Scene
            </h1>
            <p className="mb-6 text-muted-foreground">
              Sign in to track your nightlife journey.
            </p>
            <Link to="/auth">
              <Button className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-500 px-8 py-3.5 font-bold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]">
                Sign In
              </Button>
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const statCards = [
    {
      label: "Vibes",
      value: stats?.vibes || 0,
      icon: Flame,
      color: "text-cyan-300",
      tile: "border-cyan-400/30 bg-cyan-500/10 shadow-[0_0_16px_rgba(6,182,212,0.12)]",
    },
    {
      label: "Reviews",
      value: stats?.reviews || 0,
      icon: Star,
      color: "text-fuchsia-300",
      tile: "border-fuchsia-400/30 bg-fuchsia-500/10 shadow-[0_0_16px_rgba(217,70,239,0.12)]",
    },
    {
      label: "Messages",
      value: stats?.messages || 0,
      icon: MessageCircle,
      color: "text-purple-300",
      tile: "border-purple-400/30 bg-purple-500/10 shadow-[0_0_16px_rgba(168,85,247,0.12)]",
    },
    {
      label: "Saved",
      value: stats?.favorites || 0,
      icon: Heart,
      color: "text-red-300",
      tile: "border-red-400/30 bg-red-500/10 shadow-[0_0_16px_rgba(239,68,68,0.12)]",
    },
  ];

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass relative mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center backdrop-blur-2xl"
        >
          <Link
            to="/settings"
            aria-label="Open settings"
            className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background/20 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="relative mx-auto mb-4 h-24 w-24 rounded-full ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={profile?.avatar_url || undefined}
                alt={username}
              />
              <AvatarFallback className="text-3xl font-bold text-primary-foreground gradient-primary">
                {username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatarUpload(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/10 bg-slate-950/90 shadow-[0_0_12px_rgba(6,182,212,0.25)] backdrop-blur-xl transition-transform hover:scale-110"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
              ) : (
                <Camera className="h-4 w-4 text-cyan-300" />
              )}
            </button>
          </motion.div>

          <div className="flex items-center justify-center gap-2">
            {editingUsername ? (
              <div className="flex gap-2 items-center">
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="New username"
                  className="bg-muted/50 border-border/50 w-40 text-center"
                  maxLength={20}
                />
                <Button
                  size="sm"
                  onClick={handleUpdateUsername}
                  className="gradient-primary text-primary-foreground"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingUsername(false)}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-white">
                  {username}
                </h1>
                {isVerified && (
                  <CheckCircle
                    aria-label="Verified"
                    className="h-5 w-5 text-cyan-300"
                  />
                )}
                <button
                  onClick={() => {
                    setNewUsername(username);
                    setEditingUsername(true);
                  }}
                  aria-label="Edit username"
                  className="text-slate-400 transition-colors hover:text-cyan-300"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          {isVerified && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-300">
              <Shield className="h-3 w-3" /> Verified Profile
            </span>
          )}

          {/* Followers / Following */}
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-white">
                {followCounts?.followers ?? 0}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Followers
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-white">
                {followCounts?.following ?? 0}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Following
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <Animated3DEmoji name="crown" label="VIP crown" />
            <span className="font-semibold text-white">
              Lv.{levelInfo.level} — {levelInfo.title}
            </span>
          </div>

          <div className="mt-4 max-w-xs mx-auto space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{points?.points || 0} pts</span>
              <span>
                {levelInfo.next === Infinity ? "MAX" : `${levelInfo.next} pts`}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-950/80">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              />
            </div>
          </div>
          {!isVerified && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Reach Lv.{VERIFIED_LEVEL} (VIP) for a verified profile ✓
            </p>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-center backdrop-blur-xl transition-all hover:border-cyan-500/30"
            >
              <span
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${s.tile}`}
              >
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </span>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-2xl"
        >
          <h2 className="font-display mb-3 flex items-center gap-2 font-semibold text-white">
            <Trophy className="w-5 h-5 text-yellow-400" /> Badges (
            {badgesLoading ? "…" : badges?.length || 0}/{BADGE_DEFINITIONS.length})
          </h2>
          {badgesLoading ? (
            <LogoSkeleton label="Loading your badges…" size={40} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BADGE_DEFINITIONS.map((badge) => {
              const earned = earnedBadgeTypes.has(badge.type);
              return (
                <motion.div
                  key={badge.type}
                  whileHover={{ scale: 1.03 }}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-sm transition-all ${earned ? (badge.type === "regular" ? "border-fuchsia-400/40 bg-fuchsia-500/10 shadow-[0_0_15px_rgba(217,70,239,0.16)]" : "border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.16)]") : "border-white/5 bg-white/[0.03] opacity-40 grayscale"}`}
                >
                  <Animated3DEmoji
                    name={BADGE_EMOJIS[badge.type]}
                    label={badge.name}
                  />
                  <div className="min-w-0">
                    <p
                      className={`truncate text-xs font-semibold ${earned ? "text-white" : "text-slate-400"}`}
                    >
                      {badge.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {badge.description}
                    </p>
                  </div>
                </motion.div>
              );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-2xl"
        >
          <h2 className="font-display mb-3 flex items-center gap-2 font-semibold text-white">
            <Calendar className="h-5 w-5 text-cyan-300" /> Recent Activity
          </h2>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <Link
                  key={i}
                  to={`/club/${a.club_id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/60 px-3 py-2 transition-all hover:border-cyan-500/30 hover:bg-slate-950/80"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      Vibed {a.club?.name || "Unknown"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" /> {a.club?.area || ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDistanceToNow(new Date(a.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activity yet. Start vibing!
            </p>
          )}
          <div className="mt-3 text-center">
            <Link to="/history">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border border-white/10 bg-slate-900/80 text-slate-300 transition-colors hover:border-cyan-500/40 hover:bg-slate-900"
              >
                View Full History
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <Link to="/leaderboard">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border border-white/10 bg-slate-900/80 text-slate-300 transition-colors hover:border-cyan-500/40 hover:bg-slate-900"
            >
              <Trophy className="w-4 h-4" /> Leaderboard
            </Button>
          </Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
