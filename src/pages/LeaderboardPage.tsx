import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Zap, Crown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard, useUserPoints, useUserBadges, BADGE_DEFINITIONS, getLevelFromPoints } from '@/hooks/useGamification';
import { useFollowCounts, useIsFollowing, useToggleFollow } from '@/hooks/useFollows';
import { SkeletonBlock, LogoSkeleton } from '@/components/BrandedSkeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { UserPlus, UserCheck } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

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
          { onSuccess: () => toast.success(isFollowing ? 'Unfollowed' : 'Following ✨') },
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

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2">Earn points, collect badges, climb the ranks</p>
        </motion.div>

        {/* Your Stats */}
        {user && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-xl p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Level</p>
                <p className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  Lv.{levelInfo.level} — {levelInfo.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{myPoints?.points || 0}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Level {levelInfo.level}</span>
                <span>{levelInfo.next === Infinity ? 'MAX' : `${levelInfo.next} pts`}</span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full gradient-primary rounded-full"
                />
              </div>
            </div>

            {/* Social counts */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/20">
              <div className="bg-muted/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{myCounts?.followers ?? 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Followers</p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{myCounts?.following ?? 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Following</p>
              </div>
            </div>

            {/* Badges */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Your Badges</p>
              <div className="flex flex-wrap gap-2">
                {BADGE_DEFINITIONS.map(badge => {
                  const earned = earnedBadgeTypes.has(badge.type);
                  return (
                    <motion.div
                      key={badge.type}
                      whileHover={{ scale: 1.1 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        earned
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-muted/20 text-muted-foreground/40 border border-border/20'
                      }`}
                      title={badge.description}
                    >
                      <span className={earned ? '' : 'grayscale opacity-40'}>{badge.emoji}</span>
                      {badge.name}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* How to earn */}
        <motion.div variants={container} initial="hidden" animate="show" className="glass rounded-xl p-5 mb-6">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> How to Earn Points
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Every action you take in the scene earns points. Level up to unlock badges, verified status (Lv. 8) and the leaderboard.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { action: 'Vibe a club', pts: 5, emoji: '🔥' },
              { action: 'Leave a review', pts: 10, emoji: '⭐' },
              { action: 'Rate DJ/Music', pts: 8, emoji: '🎧' },
              { action: 'Suggest a spot', pts: 20, emoji: '💡' },
              { action: 'Pull up', pts: 5, emoji: '🚗' },
              { action: 'Save a club', pts: 3, emoji: '❤️' },
              { action: 'Send a message', pts: 2, emoji: '💬' },
              { action: 'Post a video', pts: 15, emoji: '🎬' },
              { action: 'Like a video', pts: 1, emoji: '👍' },
              { action: 'Comment on video', pts: 2, emoji: '💭' },
              { action: 'Check-in to experience', pts: 6, emoji: '✅' },
              { action: 'Going to experience', pts: 3, emoji: '🙋' },
              { action: 'Interested in experience', pts: 1, emoji: '⭐' },
              { action: 'Submit an experience', pts: 20, emoji: '🪩' },
              { action: 'Join a crew', pts: 8, emoji: '👯' },
              { action: 'Create a crew', pts: 15, emoji: '🛸' },
              { action: 'Follow a user', pts: 1, emoji: '➕' },
              { action: 'Night-replay shared', pts: 10, emoji: '🌙' },
              { action: 'Daily login streak', pts: 5, emoji: '🔁' },
              { action: 'Active after midnight', pts: 5, emoji: '🦉' },
            ].map((item, i) => (
              <motion.div key={i} variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="bg-muted/20 rounded-lg p-2 text-center hover:bg-muted/30 transition-colors">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-xs text-foreground font-medium mt-0.5">{item.action}</p>
                <p className="text-xs text-primary font-bold">+{item.pts} pts</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-lg p-3">
              <p className="font-semibold text-foreground mb-1">🛡️ Anti-fake protection</p>
              <p className="text-muted-foreground">Each device can only vibe, pull-up or attend once every 30 minutes. Counts decay automatically so numbers stay real-time and trustworthy.</p>
            </div>
            <div className="bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 rounded-lg p-3">
              <p className="font-semibold text-foreground mb-1">🏆 Level perks</p>
              <p className="text-muted-foreground">Lv. 5 unlocks early venue suggestions · Lv. 8 = Verified ✓ · Lv. 10 = Legend · Top 10 weekly earns the 🏆 badge.</p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div variants={container} initial="hidden" animate="show" className="glass rounded-xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Medal className="w-5 h-5 text-yellow-400" /> Top Players
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
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <motion.div
                  key={entry.id}
                  variants={item}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    isMe ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20'
                  }`}
                >
                  <span className="text-lg font-bold w-8 text-center">
                    {i < 3 ? medals[i] : <span className="text-muted-foreground">{i + 1}</span>}
                  </span>
                  <Avatar className="w-9 h-9 ring-1 ring-border/50">
                    <AvatarImage src={(entry.profile as any)?.avatar_url || undefined} alt={entry.profile?.username || 'user'} />
                    <AvatarFallback className="text-[10px] font-bold bg-muted">
                      {(entry.profile?.username || 'A').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {entry.profile?.username || 'Anonymous'}
                      {isMe && <span className="text-primary ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Lv.{lvl.level} {lvl.title}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <RowFollowBtn targetId={entry.user_id} />
                    <div>
                    <p className="text-sm font-bold text-primary">{entry.points}</p>
                    <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {leaderboard?.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">No players yet. Start vibing!</p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
