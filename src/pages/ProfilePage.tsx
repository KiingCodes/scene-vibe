import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Crown, Flame, Star, MessageCircle, Heart, Trophy, Settings, LogOut, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useUserPoints, useUserBadges, BADGE_DEFINITIONS, getLevelFromPoints } from '@/hooks/useGamification';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const useProfileStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [vibes, reviews, messages, favorites] = await Promise.all([
        supabase.from('vibes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
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
    queryKey: ['recent-activity', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: vibes } = await supabase
        .from('vibes')
        .select('club_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      const clubIds = [...new Set(vibes?.map(v => v.club_id) || [])];
      if (clubIds.length === 0) return [];
      const { data: clubs } = await supabase
        .from('clubs')
        .select('id, name, area')
        .in('id', clubIds);
      const clubMap = new Map(clubs?.map(c => [c.id, c]) || []);
      return vibes?.map(v => ({ ...v, club: clubMap.get(v.club_id) })) || [];
    },
    enabled: !!user,
  });
};

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { data: points } = useUserPoints();
  const { data: badges } = useUserBadges();
  const { data: stats } = useProfileStats();
  const { data: recentActivity } = useRecentActivity();

  const levelInfo = getLevelFromPoints(points?.points || 0);
  const progressPct = points ? Math.min((points.points / levelInfo.next) * 100, 100) : 0;
  const earnedBadgeTypes = new Set(badges?.map(b => b.badge_type) || []);
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Anonymous';

  if (!user) {
    return (
      <div className="min-h-screen gradient-dark">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl text-foreground mb-2">Join the Scene</h1>
          <p className="text-muted-foreground mb-6">Sign in to track your nightlife journey, earn badges, and climb the leaderboard.</p>
          <Link to="/auth">
            <Button className="gradient-primary text-primary-foreground">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Vibes Sent', value: stats?.vibes || 0, icon: Flame, color: 'text-primary' },
    { label: 'Reviews', value: stats?.reviews || 0, icon: Star, color: 'text-secondary' },
    { label: 'Messages', value: stats?.messages || 0, icon: MessageCircle, color: 'text-accent' },
    { label: 'Saved Spots', value: stats?.favorites || 0, icon: Heart, color: 'text-destructive' },
  ];

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 mb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center mb-4"
          >
            <span className="text-3xl font-bold text-primary-foreground">{username[0]?.toUpperCase()}</span>
          </motion.div>
          <h1 className="font-display font-bold text-2xl text-foreground">{username}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-foreground">Lv.{levelInfo.level} — {levelInfo.title}</span>
          </div>

          {/* Level progress */}
          <div className="mt-4 max-w-xs mx-auto space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{points?.points || 0} pts</span>
              <span>{levelInfo.next === Infinity ? 'MAX' : `${levelInfo.next} pts`}</span>
            </div>
            <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full gradient-primary rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
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
              className="glass rounded-xl p-4 text-center"
            >
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-xl p-5 mb-6"
        >
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> Badges ({badges?.length || 0}/{BADGE_DEFINITIONS.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BADGE_DEFINITIONS.map(badge => {
              const earned = earnedBadgeTypes.has(badge.type);
              return (
                <motion.div
                  key={badge.type}
                  whileHover={{ scale: 1.03 }}
                  className={`flex items-center gap-2 rounded-lg p-2.5 text-sm transition-all ${
                    earned
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-muted/10 border border-border/10 opacity-40'
                  }`}
                >
                  <span className="text-xl">{badge.emoji}</span>
                  <div className="min-w-0">
                    <p className={`font-semibold text-xs truncate ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{badge.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-5 mb-6"
        >
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Recent Activity
          </h2>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <Link key={i} to={`/club/${a.club_id}`} className="flex items-center gap-3 bg-muted/20 hover:bg-muted/40 rounded-lg px-3 py-2 transition-all">
                  <Flame className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Vibed {a.club?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {a.club?.area || ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No activity yet — start vibing!</p>
          )}
          <div className="mt-3 text-center">
            <Link to="/history">
              <Button variant="outline" size="sm" className="border-border/50 text-muted-foreground">View Full History</Button>
            </Link>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex gap-3 justify-center">
          <Link to="/leaderboard">
            <Button variant="outline" size="sm" className="gap-2 border-border/50 text-muted-foreground">
              <Trophy className="w-4 h-4" /> Leaderboard
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-2 border-border/50 text-muted-foreground">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
