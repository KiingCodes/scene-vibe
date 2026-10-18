import { motion } from 'framer-motion';
import {
  Trophy, Medal, Star, Zap, Crown, UserPlus, UserCheck, ShieldCheck,
} from 'lucide-react';
import Animated3DEmoji, { type Animated3DEmojiName } from '@/components/ui/Animated3DEmoji';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard, useUserPoints, useUserBadges, BADGE_DEFINITIONS, getLevelFromPoints } from '@/hooks/useGamification';
import { useFollowCounts, useIsFollowing, useToggleFollow } from '@/hooks/useFollows';
import { SkeletonBlock, LogoSkeleton } from '@/components/BrandedSkeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const pointActions: { action: string; pts: number; emoji: Animated3DEmojiName; featured?: boolean }[] = [
  { action: 'Vibe a club', pts: 5, emoji: 'fire' },
  { action: 'Leave a review', pts: 10, emoji: 'star' },
  { action: 'Rate DJ/Music', pts: 8, emoji: 'headphones' },
  { action: 'Suggest a spot', pts: 20, emoji: 'lightbulb' },
  { action: 'Pull up', pts: 5, emoji: 'car' },
  { action: 'Save a club', pts: 3, emoji: 'heart' },
  { action: 'Send a message', pts: 2, emoji: 'chat' },
  { action: 'Post a video', pts: 15, emoji: 'video' },
  { action: 'Like a video', pts: 1, emoji: 'thumbsUp' },
  { action: 'Comment on video', pts: 2, emoji: 'chat' },
  { action: 'Join a crew', pts: 8, emoji: 'users' },
  { action: 'Create a crew', pts: 15, emoji: 'rocket' },
  { action: 'Follow a user', pts: 1, emoji: 'user' },
  { action: 'Night-replay shared', pts: 10, emoji: 'moon' },
  { action: 'Daily login streak', pts: 5, emoji: 'fire', featured: true },
  { action: 'Active after midnight', pts: 5, emoji: 'moon' },
];

const RowFollowBtn = ({ targetId }: { targetId: string }) => {
  const { user } = useAuth();
  const { data: isFollowing } = useIsFollowing(targetId);
  const toggle = useToggleFollow();
  if (!user || user.id === targetId) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate(
          { targetId, isFollowing: !!isFollowing },
          { onSuccess: () => toast.success(isFollowing ? 'Unfollowed' : 'Following') },
        );
      }}
      className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
        isFollowing
          ? 'bg-primary/15 border-primary/40 text-primary'
          : 'gradient-primary text-primary-foreground border-transparent'
      }`}
    >
      {isFollowing ? <UserCheck className="w-3 h-3 inline" /> : <UserPlus className="w-3 h-3 inline" />}
    </button>
  );
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { data: myPoints } = useUserPoints();
  const { data: myBadges } = useUserBadges();
  const { data: myCounts } = useFollowCounts(user?.id);

  const levelInfo = getLevelFromPoints(myPoints?.points || 0);
  const progressPct = myPoints ? Math.min(((myPoints.points) / (levelInfo.next)) * 100, 100) : 0;

  const earnedBadgeTypes = new Set(myBadges?.map(b => b.badge_type) || []);
  const badgeEmojis: Record<string, Animated3DEmojiName> = {
    first_vibe: 'fire',
    vibe_master: 'lightning',
    reviewer: 'microphone',
    dj_rater: 'headphones',
    explorer: 'map',
    spot_suggester: 'lightbulb',
    regular: 'crown',
    social: 'butterfly',
    night_owl: 'owl',
    top_10: 'trophy',
    scene_legend: 'crown',
  };
  const badgeDefinitions = [
    ...BADGE_DEFINITIONS,
    { type: 'scene_legend', name: 'SCENE Legend', emoji: '', description: 'Reach Level 10 to become a SCENE Legend', points: 0 },
  ];

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 pt-24 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="flex items-center justify-center gap-3 bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-2xl font-black text-transparent">
            <Trophy className="h-7 w-7 text-amber-300 drop-shadow-[0_0_10px_rgba(255,190,70,0.5)]" /> Leaderboard
          </h1>
          <p className="mt-2 text-sm text-slate-400">Earn points, collect badges, climb the ranks</p>
        </motion.div>

        {/* Your Stats */}
        {user && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 space-y-5 rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Your VIP Credential</p>
                <p className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                  <Crown className="h-6 w-6 text-amber-300" />
                  Lv.{levelInfo.level} — {levelInfo.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-cyan-300">{myPoints?.points || 0}</p>
                <p className="text-xs text-slate-400">points</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Level {levelInfo.level}</span>
                <span>{levelInfo.next === Infinity ? 'MAX' : `${levelInfo.next} pts`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                />
              </div>
            </div>

            {/* Social counts */}
            <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-2xl font-bold text-white">{myCounts?.followers ?? 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Followers</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-2xl font-bold text-white">{myCounts?.following ?? 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Following</p>
              </div>
            </div>

            {/* Badges */}
            <div>
              <p className="mb-3 text-sm font-semibold text-white">Your Badge Vault</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {badgeDefinitions.map(badge => {
                  const earned = badge.type === 'scene_legend'
                    ? levelInfo.level === 10 || earnedBadgeTypes.has('top_10')
                    : earnedBadgeTypes.has(badge.type);
                  const badgeEmoji = badgeEmojis[badge.type] ?? 'star';
                  return (
                    <motion.div
                      key={badge.type}
                      whileHover={{ y: -2 }}
                      className={`flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        earned
                          ? badge.type === 'scene_legend'
                            ? 'border-amber-300/40 bg-amber-400/10 text-amber-200 shadow-[0_0_16px_rgba(255,190,70,0.12)]'
                            : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200 shadow-[0_0_14px_rgba(6,182,212,0.1)]'
                          : 'border-white/10 bg-white/5 text-slate-400 opacity-40 grayscale'
                      }`}
                      title={badge.description}
                    >
                      <Animated3DEmoji name={badgeEmoji} label={badge.name} />
                      <span className="truncate">{badge.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* How to earn */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-6 rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-lg backdrop-blur-xl">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
            <Zap className="h-5 w-5 text-amber-300" /> How to Earn Points
          </h3>
          <p className="mb-4 text-[11px] text-slate-400">
            Every action you take in the scene earns points. Level up to unlock badges, verified status (Lv. 8) and the leaderboard.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {pointActions.map(({ action, pts, emoji, featured }) => (
              <motion.div
                key={action}
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                className={`flex min-h-24 items-center gap-3 rounded-2xl border p-3 transition-all hover:border-cyan-500/30 ${
                  featured
                    ? 'border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-slate-900/60 shadow-[0_0_18px_rgba(255,107,74,0.1)]'
                    : 'border-white/10 bg-slate-900/60'
                }`}
              >
                <Animated3DEmoji name={emoji} label={action} featured={featured} />
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-snug text-white">{action}</p>
                  <p className="mt-1 text-sm font-black text-cyan-300">+{pts} pts</p>
                  {featured && <p className="text-[10px] text-orange-200/80">Consecutive daily logins</p>}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 text-[11px] sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
              <p className="mb-1 flex items-center gap-2 font-semibold text-cyan-200">
                <ShieldCheck className="h-4 w-4 text-cyan-400" /> Anti-fake protection
              </p>
              <p className="text-slate-400">Each device can only vibe, pull-up or attend once every 30 minutes. Counts decay automatically so numbers stay real-time and trustworthy.</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-transparent p-4">
              <p className="mb-1 flex items-center gap-2 font-semibold text-fuchsia-200">
                <Trophy className="h-4 w-4 text-fuchsia-300" /> Level perks
              </p>
              <p className="text-slate-400">Lv. 5 unlocks early venue suggestions · Lv. 8 = Verified · Lv. 10 = Legend · Top 10 weekly earns the leaderboard badge.</p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div variants={container} initial="hidden" animate="show" className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-lg backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Medal className="h-5 w-5 text-amber-300" /> Top Night Owls &amp; Squads
          </h3>
          {isLoading && (
            <div className="space-y-2">
              <LogoSkeleton label="Tallying ranks…" />
              {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-12" />)}
            </div>
          )}
          <div className="space-y-2">
            {leaderboard?.map((entry, i) => {
              const lvl = getLevelFromPoints(entry.points);
              const isMe = entry.user_id === user?.id;
              const podiumStyles = [
                'border-2 border-[#FF6B4A] bg-gradient-to-r from-orange-500/10 to-slate-950/90 shadow-[0_0_25px_rgba(255,107,74,0.3)]',
                'border border-fuchsia-500/40 bg-fuchsia-500/5',
                'border border-cyan-500/40 bg-cyan-500/5',
              ];
              const rankEmoji: Animated3DEmojiName = i === 0 ? 'trophy' : i === 1 ? 'medal' : 'star';
              return (
                <motion.div
                  key={entry.id}
                  variants={item}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition-all ${
                    i < 3
                      ? podiumStyles[i]
                      : isMe
                        ? 'border-cyan-400/30 bg-cyan-500/5'
                        : 'border-white/10 bg-slate-900/60'
                  }`}
                >
                  <div className="flex w-11 shrink-0 items-center justify-center">
                    {i < 3 ? (
                      <Animated3DEmoji name={rankEmoji} label={`Rank ${i + 1}`} featured={i === 0} />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{i + 1}</span>
                    )}
                  </div>
                  <Avatar className="h-10 w-10 shrink-0 ring-1 ring-white/15">
                    <AvatarImage src={entry.profile?.avatar_url || undefined} alt={entry.profile?.username || 'user'} />
                    <AvatarFallback className="bg-white/10 text-[10px] font-bold text-white">
                      {(entry.profile?.username || 'A').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {entry.profile?.username || 'Anonymous'}
                      {isMe && <span className="ml-1 text-cyan-300">(You)</span>}
                    </p>
                    <p className="text-xs text-slate-400">Lv.{lvl.level} {lvl.title}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <RowFollowBtn targetId={entry.user_id} />
                    <div>
                    <p className="text-sm font-bold text-cyan-300">{entry.points}</p>
                    <p className="text-[10px] text-slate-400">pts</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {leaderboard?.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">No players yet. Start vibing!</p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
