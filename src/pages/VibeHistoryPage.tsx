import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { History, Flame, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useClubs } from '@/hooks/useClubs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';

const useVibeHistory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vibe-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('vibes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

const useReviewHistory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['review-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, x: -15 },
  show: { opacity: 1, x: 0 },
};

const VibeHistoryPage = () => {
  const { user } = useAuth();
  const { data: clubs } = useClubs();
  const { data: vibes, isLoading: vibesLoading } = useVibeHistory();
  const { data: reviews, isLoading: reviewsLoading } = useReviewHistory();

  const clubMap = useMemo(() => {
    const map = new Map<string, any>();
    clubs?.forEach(c => map.set(c.id, c));
    return map;
  }, [clubs]);

  // Merge into timeline
  const timeline = useMemo(() => {
    const items: { type: 'vibe' | 'review'; created_at: string; club_id: string; data?: any }[] = [];
    vibes?.forEach(v => items.push({ type: 'vibe', created_at: v.created_at, club_id: v.club_id }));
    reviews?.forEach(r => items.push({ type: 'review', created_at: r.created_at, club_id: r.club_id, data: r }));
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [vibes, reviews]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof timeline> = {};
    timeline.forEach(item => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return Object.entries(groups);
  }, [timeline]);

  if (!user) {
    return (
      <div className="min-h-screen gradient-dark">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to see your vibe history
          </p>
        </div>
      </div>
    );
  }

  const isLoading = vibesLoading || reviewsLoading;

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-foreground flex items-center justify-center gap-3">
            <History className="w-8 h-8 text-primary" /> Vibe History
          </h1>
          <p className="text-muted-foreground mt-2">Your nightlife timeline</p>
        </motion.div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && timeline.length === 0 && (
          <div className="text-center py-16">
            <Flame className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No activity yet. Start vibing!</p>
          </div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">{format(new Date(date), 'EEEE, MMM d, yyyy')}</p>
                <span className="text-xs text-muted-foreground">({items.length} activities)</span>
              </div>
              <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                {items.map((entry, i) => {
                  const club = clubMap.get(entry.club_id);
                  return (
                    <motion.div key={i} variants={item}>
                      <Link to={`/club/${entry.club_id}`} className="flex items-center gap-3 bg-muted/20 hover:bg-muted/40 rounded-lg px-3 py-2.5 transition-all group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${entry.type === 'vibe' ? 'bg-primary/20' : 'bg-secondary/20'}`}>
                          {entry.type === 'vibe' ? <Flame className="w-4 h-4 text-primary" /> : <span className="text-sm">⭐</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {entry.type === 'vibe' ? 'Vibed' : 'Reviewed'} {club?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {club?.area || ''}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default VibeHistoryPage;
