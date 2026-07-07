import { motion } from 'framer-motion';
import { Flame, TrendingUp, MapPin, Clock, Music, Users, Heart, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHasVibed, useVibe, useVibeFreshness } from '@/hooks/useVibes';
import { useFeedbackSummary, FEEDBACK_OPTIONS } from '@/hooks/useReviews';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import PullingUpButton from '@/components/PullingUpButton';
import { toast } from 'sonner';
import type { Club } from '@/hooks/useClubs';
import { getOpenStatus } from '@/lib/openHours';
import { useEffect, useState } from 'react';
import logoFallback from '@/assets/scene-logo.jpg';

interface ClubCardProps {
  club: Club;
  vibeCount?: number;
  pullingUpCount?: number;
  index: number;
}

const ClubCard = ({ club, vibeCount = 0, pullingUpCount = 0, index }: ClubCardProps) => {
  const { user } = useAuth();
  const { data: hasVibed } = useHasVibed(club.id);
  const vibeMutation = useVibe();
  const { data: summary } = useFeedbackSummary(club.id);
  const { data: favorites } = useFavorites();
  const { data: freshness } = useVibeFreshness();
  const toggleFav = useToggleFavorite();
  const isTrending = vibeCount >= 3;
  const isFav = favorites?.has(club.id) || false;

  // Tick every minute to keep open/closed badge fresh
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const status = getOpenStatus(club.opening_hours, now);

  const lastVibeAt = freshness?.[club.id];
  const freshnessLabel = (() => {
    if (!lastVibeAt || vibeCount === 0) return null;
    const diffSec = Math.max(0, Math.floor((now.getTime() - new Date(lastVibeAt).getTime()) / 1000));
    if (diffSec < 60) return 'just now';
    const m = Math.floor(diffSec / 60);
    return `${m}m ago`;
  })();
  const isFresh = lastVibeAt ? (now.getTime() - new Date(lastVibeAt).getTime()) < 10 * 60 * 1000 : false;

  // Crisp crowd micro-badge — colored, not gray.
  const crowdBadge = (() => {
    if (vibeCount === 0) return { label: 'Spacious', text: 'text-sky-300', bg: 'bg-sky-500/15', border: 'border-sky-400/40', dot: 'bg-sky-400' };
    if (vibeCount < 3)   return { label: 'Warming Up', text: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-400/40', dot: 'bg-cyan-400' };
    if (vibeCount < 5)   return { label: 'Vibing', text: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/40', dot: 'bg-primary' };
    if (vibeCount < 8)   return { label: 'Packed', text: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-400/40', dot: 'bg-orange-400' };
    return { label: 'On Fire', text: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-400/40', dot: 'bg-rose-400' };
  })();

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Sign in to save clubs!'); return; }
    toggleFav.mutate({ clubId: club.id, isFav });
  };

  const dominantVibe = summary && summary.total > 0
    ? FEEDBACK_OPTIONS.reduce((best, opt) =>
        (summary.counts[opt.value] || 0) > (summary.counts[best.value] || 0) ? opt : best
      , FEEDBACK_OPTIONS[0])
    : null;

  const handleVibe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to vibe a club!');
      return;
    }
    if (hasVibed) {
      toast.info('You already vibed this club today!');
      return;
    }
    try {
      await vibeMutation.mutateAsync(club.id);
      toast.success('🔥 Vibed!');
    } catch {
      toast.error('Could not vibe. Try again later.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link to={`/club/${club.id}`}>
        <div className={`glass rounded-2xl overflow-hidden group hover:border-primary/30 transition-all duration-300 ${isTrending ? 'trending-glow border-secondary/40' : ''}`}>
          <div className="relative h-40 overflow-hidden rounded-2xl">
            <img
              src={club.image_url || logoFallback}
              alt={club.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = logoFallback; }}
            />
            {/* Soft top vignette + bottom gradient for legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

            {/* TOP-LEFT: LIVE / CLOSED glassmorphic badge with pulsing neon dot */}
            {status && (
              <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-xl border text-[10px] font-black tracking-[0.15em] shadow-lg ${
                status.isOpen
                  ? 'bg-white/5 border-emerald-400/50 text-emerald-300 shadow-emerald-500/20'
                  : 'bg-white/5 border-rose-400/40 text-rose-300 shadow-rose-500/10'
              }`}>
                <span className="relative flex w-1.5 h-1.5">
                  {status.isOpen && <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-70 animate-ping" />}
                  <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${status.isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                </span>
                <span>{status.isOpen ? 'LIVE' : 'CLOSED'}</span>
              </div>
            )}

            {/* TOP-RIGHT: favorite + trending chip */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              {isTrending && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-secondary/50 text-secondary text-[9px] font-black tracking-[0.15em]">
                  <TrendingUp className="w-2.5 h-2.5" /> HOT
                </span>
              )}
              <button onClick={handleFavorite} className="p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:scale-110 transition-transform">
                <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-secondary fill-secondary' : 'text-white/80'}`} />
              </button>
            </div>

            {/* BOTTOM ACTION BAR — semi-transparent glass strip with counters */}
            <div className="absolute inset-x-2 bottom-2 flex items-stretch gap-1.5">
              <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/45 backdrop-blur-xl border border-accent/30 shadow-[0_0_18px_hsl(var(--accent)/0.25)]">
                <PullingUpButton clubId={club.id} pullingUpCount={pullingUpCount} />
              </div>
              <button
                onClick={handleVibe}
                disabled={hasVibed || vibeMutation.isPending}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl backdrop-blur-xl border text-[11px] font-black transition-all ${
                  hasVibed
                    ? 'bg-primary/20 border-primary/60 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.35)]'
                    : 'bg-black/45 border-primary/40 text-primary hover:border-primary hover:shadow-[0_0_22px_hsl(var(--primary)/0.55)]'
                } ${!hasVibed && !vibeMutation.isPending ? 'vibe-pulse' : ''}`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="tabular-nums">{vibeCount}</span>
                <span className="uppercase tracking-widest text-[9px] opacity-80">{hasVibed ? 'Vibed' : 'Vibe'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-black text-[17px] leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                {club.name}
              </h3>
              {/* Crisp colored micro-badge crowd status */}
              <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full border ${crowdBadge.bg} ${crowdBadge.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${crowdBadge.dot} ${isFresh ? 'animate-pulse' : ''}`} />
                <span className={`text-[10px] font-black tracking-wider uppercase ${crowdBadge.text}`}>{crowdBadge.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <MapPin className="w-3 h-3 text-primary/70" />
              <span className="truncate">{club.area}</span>
              {dominantVibe && (
                <span className="ml-auto flex items-center gap-0.5 text-[10px]">
                  <span>{dominantVibe.emoji}</span>
                  <span className="text-muted-foreground/70">{summary!.total}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {club.genre && (
                <span className="flex items-center gap-1">
                  <Music className="w-3 h-3 text-secondary/70" />
                  {club.genre}
                </span>
              )}
              {club.opening_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent/70" />
                  {club.opening_hours}
                </span>
              )}
              {freshnessLabel && (
                <span className="ml-auto text-[10px] text-muted-foreground/70">· {freshnessLabel}</span>
              )}
            </div>

            {club.is_community_added && (
              <div className="flex items-center gap-1 text-[10px] text-secondary/90 font-bold uppercase tracking-widest">
                <Users className="w-3 h-3" />
                Community Added
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ClubCard;
