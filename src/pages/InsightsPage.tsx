import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, TrendingUp, Shield, Star, Music2, Headphones, Flame } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useClubs } from '@/hooks/useClubs';
import { useAllVibes } from '@/hooks/useVibes';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const useInsightsData = () => {
  return useQuery({
    queryKey: ['insights-data'],
    queryFn: async () => {
      // Fetch all vibes (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: vibes } = await supabase
        .from('vibes')
        .select('club_id, created_at')
        .gte('created_at', thirtyDaysAgo);

      // Fetch all reviews (last 30 days)
      const { data: reviews } = await supabase
        .from('reviews')
        .select('club_id, rating, created_at')
        .gte('created_at', thirtyDaysAgo);

      // Fetch all club ratings
      const { data: ratings } = await supabase
        .from('club_ratings')
        .select('club_id, dj_rating, music_rating, created_at')
        .gte('created_at', thirtyDaysAgo);

      // Fetch pulling up data
      const { data: pullingUp } = await supabase
        .from('pulling_up')
        .select('club_id, created_at, eta_minutes')
        .gte('created_at', thirtyDaysAgo);

      return { vibes: vibes || [], reviews: reviews || [], ratings: ratings || [], pullingUp: pullingUp || [] };
    },
  });
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const InsightsPage = () => {
  const { data: clubs } = useClubs();
  const { data: insightsRaw, isLoading } = useInsightsData();

  const insights = useMemo(() => {
    if (!insightsRaw || !clubs) return null;
    const { vibes, reviews, ratings, pullingUp } = insightsRaw;

    // Peak vibe times (hour distribution)
    const hourCounts = new Array(24).fill(0);
    vibes.forEach(v => {
      const h = new Date(v.created_at).getHours();
      hourCounts[h]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Best arrival time (1-2 hours before peak)
    const bestArrival = (peakHour - 2 + 24) % 24;

    // Day distribution
    const dayCounts = new Array(7).fill(0);
    vibes.forEach(v => {
      const d = new Date(v.created_at).getDay();
      dayCounts[d]++;
    });
    const busiestDay = DAYS[dayCounts.indexOf(Math.max(...dayCounts))];
    const quietestDay = DAYS[dayCounts.indexOf(Math.min(...dayCounts))];

    // Average rating by day
    const dayRatings: Record<string, number[]> = {};
    DAYS.forEach(d => { dayRatings[d] = []; });
    reviews.forEach(r => {
      const d = DAYS[new Date(r.created_at).getDay()];
      dayRatings[d].push(r.rating);
    });
    const avgRatingByDay = DAYS.map(d => ({
      day: d,
      avg: dayRatings[d].length > 0 ? Math.round((dayRatings[d].reduce((s, v) => s + v, 0) / dayRatings[d].length) * 10) / 10 : 0,
      count: dayRatings[d].length,
    }));

    // DJ & Music averages across all clubs
    const avgDj = ratings.length > 0 ? Math.round((ratings.reduce((s, r) => s + r.dj_rating, 0) / ratings.length) * 10) / 10 : 0;
    const avgMusic = ratings.length > 0 ? Math.round((ratings.reduce((s, r) => s + r.music_rating, 0) / ratings.length) * 10) / 10 : 0;

    // Top clubs by vibe count
    const clubVibes: Record<string, number> = {};
    vibes.forEach(v => { clubVibes[v.club_id] = (clubVibes[v.club_id] || 0) + 1; });
    const topClubs = Object.entries(clubVibes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ club: clubs.find(c => c.id === id), count }));

    // Safest nights (least activity = least crowded)
    const safestNights = [...avgRatingByDay].sort((a, b) => a.count - b.count).slice(0, 2);

    return {
      peakHour,
      bestArrival,
      busiestDay,
      quietestDay,
      avgRatingByDay,
      avgDj,
      avgMusic,
      topClubs,
      safestNights,
      hourCounts,
      dayCounts,
      totalVibes: vibes.length,
      totalReviews: reviews.length,
      totalRatings: ratings.length,
    };
  }, [insightsRaw, clubs]);

  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h > 12 ? `${h - 12}pm` : `${h}am`;
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground flex items-center justify-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" /> Night Insights
          </h1>
          <p className="text-muted-foreground mt-2">AI-powered analytics from the last 30 days</p>
        </motion.div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {insights && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Key Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Flame className="w-5 h-5 text-secondary" />, label: 'Total Vibes', value: insights.totalVibes },
                { icon: <Star className="w-5 h-5 text-yellow-400" />, label: 'Reviews', value: insights.totalReviews },
                { icon: <Headphones className="w-5 h-5 text-accent" />, label: 'DJ Ratings', value: insights.totalRatings },
                { icon: <TrendingUp className="w-5 h-5 text-primary" />, label: 'Busiest Day', value: insights.busiestDay },
              ].map((stat, i) => (
                <motion.div key={i} variants={item} className="glass rounded-xl p-4 text-center">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Peak Times & Best Arrival */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={item} className="glass rounded-xl p-5 space-y-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Best Time to Arrive
                </h3>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-primary neon-text">{formatHour(insights.bestArrival)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Get there early before the peak</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Peak vibe time: <span className="text-foreground font-semibold">{formatHour(insights.peakHour)}</span></p>
                </div>
              </motion.div>

              <motion.div variants={item} className="glass rounded-xl p-5 space-y-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" /> Quietest Nights
                </h3>
                <div className="space-y-2">
                  {insights.safestNights.map(n => (
                    <div key={n.day} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                      <span className="font-semibold text-foreground">{n.day}</span>
                      <span className="text-xs text-muted-foreground">{n.count} reviews · avg {n.avg || 'N/A'}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-center">Less crowded, more chill vibes</p>
                </div>
              </motion.div>
            </div>

            {/* Hour Distribution Chart */}
            <motion.div variants={item} className="glass rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" /> Vibe Activity by Hour
              </h3>
              <div className="flex items-end gap-1 h-32">
                {HOURS.map(h => {
                  const max = Math.max(...insights.hourCounts, 1);
                  const pct = (insights.hourCounts[h] / max) * 100;
                  return (
                    <motion.div
                      key={h}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, 2)}%` }}
                      transition={{ delay: h * 0.02, duration: 0.5 }}
                      className={`flex-1 rounded-t-sm ${h === insights.peakHour ? 'bg-secondary' : 'bg-primary/60'}`}
                      title={`${formatHour(h)}: ${insights.hourCounts[h]} vibes`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
              </div>
            </motion.div>

            {/* Day Distribution */}
            <motion.div variants={item} className="glass rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" /> Average Rating by Day
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {insights.avgRatingByDay.map(d => (
                  <div key={d.day} className="text-center">
                    <div className={`rounded-lg p-2 ${d.day === insights.busiestDay ? 'bg-primary/20 border border-primary/30' : 'bg-muted/30'}`}>
                      <p className="text-lg font-bold text-foreground">{d.avg || '-'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{d.day}</p>
                    <p className="text-[10px] text-muted-foreground/50">{d.count}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* DJ & Music Overall */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={item} className="glass rounded-xl p-5 text-center space-y-2">
                <Headphones className="w-8 h-8 text-accent mx-auto" />
                <p className="text-3xl font-bold text-foreground">{insights.avgDj}<span className="text-sm text-muted-foreground">/5</span></p>
                <p className="text-sm text-muted-foreground">Average DJ Rating</p>
              </motion.div>
              <motion.div variants={item} className="glass rounded-xl p-5 text-center space-y-2">
                <Music2 className="w-8 h-8 text-secondary mx-auto" />
                <p className="text-3xl font-bold text-foreground">{insights.avgMusic}<span className="text-sm text-muted-foreground">/5</span></p>
                <p className="text-sm text-muted-foreground">Average Music Quality</p>
              </motion.div>
            </div>

            {/* Top Clubs */}
            {insights.topClubs.length > 0 && (
              <motion.div variants={item} className="glass rounded-xl p-5 space-y-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-secondary" /> Most Active Clubs (30 days)
                </h3>
                <div className="space-y-2">
                  {insights.topClubs.map((tc, i) => (
                    <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-lg px-3 py-2">
                      <span className="text-lg font-bold text-primary w-6">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{tc.club?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{tc.club?.area}</p>
                      </div>
                      <span className="text-sm font-bold text-secondary">{tc.count} vibes</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default InsightsPage;
