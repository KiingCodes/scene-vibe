import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, TrendingUp, Shield, Star, Music2, Headphones, Flame } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useClubs } from '@/hooks/useClubs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { SkeletonBlock, LogoSkeleton } from '@/components/BrandedSkeleton';

const useInsightsData = () => {
  return useQuery({
    queryKey: ['insights-data'],
    queryFn: async () => {
      // Fetch all vibes (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: vibes, error: vibesError } = await supabase
        .from('vibes')
        .select('club_id, created_at')
        .gte('created_at', thirtyDaysAgo);
      if (vibesError) throw vibesError;

      // Fetch all reviews (last 30 days)
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('club_id, rating, created_at')
        .gte('created_at', thirtyDaysAgo);
      if (reviewsError) throw reviewsError;

      // Fetch all club ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('club_ratings')
        .select('club_id, dj_rating, music_rating, created_at')
        .gte('created_at', thirtyDaysAgo);
      if (ratingsError) throw ratingsError;

      // Fetch pulling up data
      const { data: pullingUp, error: pullingUpError } = await supabase
        .from('pulling_up')
        .select('club_id, created_at, eta_minutes')
        .gte('created_at', thirtyDaysAgo);
      if (pullingUpError) throw pullingUpError;

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
  const { data: clubs, isError: clubsError } = useClubs();
  const { data: insightsRaw, isLoading, isError } = useInsightsData();

  const insights = useMemo(() => {
    if (!insightsRaw || !clubs) return null;
    const { vibes, reviews, ratings, pullingUp } = insightsRaw;

    // Peak vibe times (hour distribution)
    const hourCounts = new Array(24).fill(0);
    vibes.forEach(v => {
      const h = new Date(v.created_at).getHours();
      hourCounts[h]++;
    });
    const peakHour = vibes.length > 0 ? hourCounts.indexOf(Math.max(...hourCounts)) : null;

    // Best arrival time (1-2 hours before peak)
    const bestArrival = peakHour === null ? null : (peakHour - 2 + 24) % 24;

    // Day distribution
    const dayCounts = new Array(7).fill(0);
    vibes.forEach(v => {
      const d = new Date(v.created_at).getDay();
      dayCounts[d]++;
    });
    const busiestDay = vibes.length > 0 ? DAYS[dayCounts.indexOf(Math.max(...dayCounts))] : null;
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
      hasTelemetry: vibes.length > 0 || reviews.length > 0 || ratings.length > 0 || pullingUp.length > 0,
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
          <h1 className="flex items-center justify-center gap-3 bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-2xl font-black text-transparent">
            <BarChart3 className="h-7 w-7 text-cyan-400" /> Night Insights
          </h1>
          <p className="mt-2 text-sm text-slate-400">AI-powered analytics from the last 30 days</p>
        </motion.div>

        {isLoading && (
          <div className="space-y-4">
            <LogoSkeleton label="Crunching the night data…" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-24" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonBlock className="h-44" />
              <SkeletonBlock className="h-44" />
            </div>
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-36" />
          </div>
        )}

        {(isError || clubsError) && (
          <div role="alert" className="rounded-2xl border border-rose-400/20 bg-slate-950/80 p-8 text-center text-sm text-slate-300">
            Unable to load nightlife telemetry. Please try again.
          </div>
        )}

        {insights && (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {(!insights.hasTelemetry || insights.totalVibes === 0) && (
              <motion.div
                variants={item}
                className="flex items-center gap-4 rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 backdrop-blur-xl"
              >
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full border border-cyan-400/30 motion-reduce:animate-none" />
                  <span className="absolute inset-2 rounded-full border border-cyan-400/40" />
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                </div>
                <div>
                  <p className="font-semibold text-cyan-300">Telemetry Calibrating</p>
                  <p className="mt-1 text-sm text-slate-400">Check back post-weekend for live vibe analytics</p>
                </div>
              </motion.div>
            )}

            {/* Key Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Flame className="h-5 w-5 text-[#D946EF] drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]" />, label: 'Total Vibes', value: insights.totalVibes },
                { icon: <Star className="h-5 w-5 text-[#FF6B4A] drop-shadow-[0_0_8px_rgba(255,107,74,0.5)]" />, label: 'Reviews', value: insights.totalReviews },
                { icon: <Headphones className="h-5 w-5 text-[#06B6D4] drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />, label: 'DJ Ratings', value: insights.totalRatings },
                {
                  icon: (
                    <svg className="h-5 w-5 drop-shadow-[0_0_8px_rgba(217,70,239,0.4)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <defs>
                        <linearGradient id="busiest-day-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06B6D4" />
                          <stop offset="100%" stopColor="#D946EF" />
                        </linearGradient>
                      </defs>
                      <path d="M3 17l6-6 4 4 8-8M15 7h6v6" stroke="url(#busiest-day-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  label: 'Busiest Day',
                  value: insights.busiestDay ?? '—',
                },
              ].map((stat, i) => (
                <motion.div key={i} variants={item} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-center shadow-lg backdrop-blur-xl transition-all hover:border-fuchsia-500/30">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Peak Times & Best Arrival */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={item} className="rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  <Clock className="h-5 w-5 text-cyan-400" /> Best Time to Arrive
                </h3>
                <div className="text-center py-4">
                  <p className="text-4xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                    {insights.bestArrival === null ? '—' : formatHour(insights.bestArrival)}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {insights.bestArrival === null ? 'Waiting for vibe activity' : 'Get there early before the peak'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">
                    Peak vibe time:{' '}
                    <span className="font-semibold text-white">
                      {insights.peakHour === null ? 'Collecting data' : formatHour(insights.peakHour)}
                    </span>
                  </p>
                </div>
              </motion.div>

              <motion.div variants={item} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg backdrop-blur-xl">
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  <Shield className="h-5 w-5 text-cyan-400" /> Quietest Nights
                </h3>
                <div className="mt-3 space-y-2">
                  {insights.totalReviews > 0 ? insights.safestNights.map(n => (
                      <div key={n.day} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                        <span className="font-semibold text-white">{n.day}</span>
                        <span className="text-xs text-slate-400">{n.count} reviews · avg {n.avg || 'N/A'}</span>
                      </div>
                    )) : (
                      <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                        Waiting for review data
                      </p>
                    )}
                  <p className="pt-1 text-center text-xs text-slate-400">Less crowded, more chill vibes</p>
                </div>
              </motion.div>
            </div>

            {/* Hour Distribution Chart */}
            <motion.div variants={item} className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-lg backdrop-blur-xl">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <TrendingUp className="h-5 w-5 text-fuchsia-400" /> Vibe Activity by Hour
              </h3>
              <div className="mt-4 flex h-32 items-end gap-1">
                {HOURS.map(h => {
                  const max = Math.max(...insights.hourCounts, 1);
                  const pct = (insights.hourCounts[h] / max) * 100;
                  const peakWindow = h >= 22 || h <= 2;
                  const isPeak = h === insights.peakHour;
                  return (
                    <div key={h} className="relative flex h-full flex-1 items-end" title={`${formatHour(h)}: ${insights.hourCounts[h]} vibes`}>
                      {peakWindow && (
                        <span className="absolute -top-2 left-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(255,107,74,0.9)]" />
                      )}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(pct, 2)}%` }}
                        transition={{ delay: h * 0.02, duration: 0.5 }}
                        className={`w-full rounded-t-sm bg-gradient-to-t ${
                          isPeak
                            ? 'from-orange-500 via-orange-400 to-amber-200 shadow-[0_0_12px_rgba(255,107,74,0.55)]'
                            : peakWindow
                              ? 'from-fuchsia-600/80 via-orange-400/70 to-orange-200'
                              : 'from-fuchsia-600/80 via-cyan-500/80 to-cyan-200'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between px-1 text-xs text-slate-500">
                <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
              </div>
            </motion.div>

            {/* Day Distribution */}
            <motion.div variants={item} className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 shadow-lg backdrop-blur-xl">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Star className="h-5 w-5 text-[#FF6B4A]" /> Average Rating by Day
              </h3>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {insights.avgRatingByDay.map(d => (
                  <div key={d.day} className="text-center">
                    <div className={`relative overflow-hidden rounded-xl border p-2 sm:p-3 ${
                      d.avg > 0
                        ? 'border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_16px_rgba(6,182,212,0.12)]'
                        : 'border-white/10 bg-white/5'
                    }`}>
                      {d.avg > 0 && (
                        <span
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/10"
                          style={{ width: `${Math.min((d.avg / 5) * 100, 100)}%` }}
                        />
                      )}
                      <p className="relative text-base font-bold text-white sm:text-lg">{d.avg || '-'}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{d.day}</p>
                    <p className="text-[10px] text-slate-500">{d.count}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* DJ & Music Overall */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={item} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-center shadow-lg backdrop-blur-xl">
                <Headphones className="mx-auto h-8 w-8 text-cyan-400" />
                <p className="text-3xl font-bold text-white">{insights.avgDj}<span className="text-sm text-slate-400">/5</span></p>
                <p className="text-sm text-slate-400">Average DJ Rating</p>
              </motion.div>
              <motion.div variants={item} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-center shadow-lg backdrop-blur-xl">
                <Music2 className="mx-auto h-8 w-8 text-fuchsia-400" />
                <p className="text-3xl font-bold text-white">{insights.avgMusic}<span className="text-sm text-slate-400">/5</span></p>
                <p className="text-sm text-slate-400">Average Music Quality</p>
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
