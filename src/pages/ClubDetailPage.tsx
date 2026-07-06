import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Music, Flame, TrendingUp, Navigation, Globe, Instagram, Car, MessageCircle, Users, Sparkles } from 'lucide-react';
import PullingUpButton from '@/components/PullingUpButton';
import Navbar from '@/components/Navbar';
import ClubReviews from '@/components/ClubReviews';
import ClubDjMusicRating from '@/components/ClubDjMusicRating';
import ClubMap from '@/components/ClubMap';
import { useClub } from '@/hooks/useClubs';
import { useVibeCount, useHasVibed, useVibe, useAllVibes } from '@/hooks/useVibes';
import { usePullingUpCount, useHasPulledUp, usePullUp } from '@/hooks/usePullingUp';
import { useAuth } from '@/hooks/useAuth';
import { useAwardPoints, useEarnBadge } from '@/hooks/useGamification';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCommunityMessages } from '@/hooks/useCommunityChat';
import { useMemo } from 'react';

// Neon capacity badge — replaces the faint grey bar next to "Empty"
const CapacityBadge = ({ vibeCount }: { vibeCount: number }) => {
  const tier = (() => {
    if (vibeCount === 0) return { label: 'Chill', pct: 8, color: 'from-slate-400 to-slate-500', ring: 'ring-slate-400/40', text: 'text-slate-300', dot: 'bg-slate-300' };
    if (vibeCount < 3) return { label: 'Warming Up', pct: 30, color: 'from-cyan-400 to-blue-500', ring: 'ring-cyan-400/50', text: 'text-cyan-300', dot: 'bg-cyan-300' };
    if (vibeCount < 5) return { label: 'Filling Up', pct: 55, color: 'from-primary to-cyan-400', ring: 'ring-primary/50', text: 'text-primary', dot: 'bg-primary' };
    if (vibeCount < 8) return { label: 'Vibing Hard', pct: 78, color: 'from-orange-400 to-secondary', ring: 'ring-orange-400/50', text: 'text-orange-300', dot: 'bg-orange-400' };
    return { label: 'Peak Capacity', pct: 100, color: 'from-secondary via-pink-500 to-orange-400', ring: 'ring-secondary/60', text: 'text-secondary', dot: 'bg-secondary' };
  })();
  return (
    <div className="space-y-2 min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className={`relative flex w-2 h-2`}>
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${tier.dot} opacity-60`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${tier.dot}`} />
        </span>
        <span className={`text-xs font-bold tracking-wide uppercase ${tier.text}`}>{tier.label}</span>
      </div>
      <div className={`relative h-2 rounded-full bg-black/40 overflow-hidden ring-1 ${tier.ring}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${tier.pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${tier.color}`}
          style={{ boxShadow: '0 0 12px currentColor' }}
        />
      </div>
    </div>
  );
};

const ClubDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: club, isLoading } = useClub(id!);
  const { data: vibeCount } = useVibeCount(id!);
  const { data: vibeCounts } = useAllVibes();
  const { data: hasVibed } = useHasVibed(id!);
  const vibeMutation = useVibe();
  const { data: pullingUpCount } = usePullingUpCount(id!);
  const { user } = useAuth();
  const awardPoints = useAwardPoints();
  const earnBadge = useEarnBadge();
  const isTrending = (vibeCount || 0) >= 3;
  const { messages } = useCommunityMessages();
  const liveChatCount = useMemo(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    const users = new Set<string>();
    (messages || []).forEach((m) => { if (new Date(m.created_at).getTime() >= cutoff) users.add(m.user_id); });
    return users.size;
  }, [messages]);

  const handleVibe = async () => {
    if (!user) {
      toast.error('Sign in to vibe!');
      return;
    }
    if (hasVibed) {
      toast.info('You can only vibe one club every 30 minutes!');
      return;
    }
    try {
      await vibeMutation.mutateAsync(id!);
      awardPoints.mutate({ action: 'vibe' });
      earnBadge.mutate({ badgeType: 'first_vibe' });
      toast.success('🔥 Vibed!');
    } catch {
      toast.error('Could not vibe.');
    }
  };

  if (isLoading || !club) {
    return (
      <div className="min-h-screen gradient-dark">
        <Navbar />
        <div className="pt-24 container mx-auto px-4">
          <div className="glass rounded-xl h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${club.lat},${club.lng}&travelmode=driving`;

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to clubs
        </Link>

        {/* Hero — title & address only, buttons moved below into a dedicated action bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 ring-1 ring-border/40">
            <img src={club.image_url || '/placeholder.svg'} alt={club.name} className="w-full h-full object-cover" />
            {/* Elegant dark gradient overlay along the bottom for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              {isTrending && (
                <motion.span
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full gradient-secondary text-secondary-foreground text-[10px] font-bold tracking-wider uppercase mb-3 shadow-lg"
                >
                  <TrendingUp className="w-3 h-3" /> Trending Tonight
                </motion.span>
              )}
              <h1 className="font-display font-bold text-3xl sm:text-5xl text-white leading-tight tracking-tight drop-shadow-lg">
                {club.name}
              </h1>
              <p className="text-white/80 flex items-center gap-1.5 mt-2 text-sm">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{club.address}</span>
              </p>
            </div>
          </div>

          {/* Sleek horizontal action bar */}
          <div className="mt-3 glass rounded-2xl p-2 flex items-center gap-2 border border-border/50">
            <div className="flex-1">
              <PullingUpButton clubId={id!} pullingUpCount={pullingUpCount || 0} size="default" />
            </div>
            <div className="w-px h-8 bg-border/50" />
            <Button
              onClick={handleVibe}
              disabled={hasVibed || vibeMutation.isPending}
              className={`flex-1 gap-2 rounded-full font-semibold ${
                hasVibed
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'gradient-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)]'
              } ${!hasVibed ? 'vibe-pulse' : ''}`}
            >
              <Flame className="w-5 h-5" />
              {vibeCount || 0} {hasVibed ? 'Vibed' : 'Vibe It'}
            </Button>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
            {/* Details */}
            <div className="glass rounded-2xl p-5 space-y-5">
              <p className="text-muted-foreground text-sm leading-relaxed">{club.description}</p>

              {/* Crowd & Status Grid */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Current Crowd Level</p>
                  <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                </div>
                <CapacityBadge vibeCount={vibeCount || 0} />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl p-3 bg-black/30 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                      <Car className="w-3 h-3 text-accent" /> Pulling Up
                    </div>
                    <p className="text-2xl font-display font-bold text-accent">{pullingUpCount || 0}</p>
                  </div>
                  <div className="rounded-xl p-3 bg-black/30 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                      <Flame className="w-3 h-3 text-primary" /> Vibes Now
                    </div>
                    <p className="text-2xl font-display font-bold text-primary">{vibeCount || 0}</p>
                  </div>
                </div>
              </div>

              {/* Info tiles — unified minimalist row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {club.genre && (
                  <div className="rounded-xl p-3 bg-white/[0.03] border border-white/10 hover:border-primary/30 transition-colors">
                    <Music className="w-4 h-4 text-primary/80 mb-2" strokeWidth={1.75} />
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Genre</p>
                    <p className="text-sm font-semibold text-foreground truncate">{club.genre}</p>
                  </div>
                )}
                {club.opening_hours && (
                  <div className="rounded-xl p-3 bg-white/[0.03] border border-white/10 hover:border-primary/30 transition-colors">
                    <Clock className="w-4 h-4 text-primary/80 mb-2" strokeWidth={1.75} />
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hours</p>
                    <p className="text-sm font-semibold text-foreground truncate">{club.opening_hours}</p>
                  </div>
                )}
                {club.capacity && (
                  <div className="rounded-xl p-3 bg-white/[0.03] border border-white/10 hover:border-primary/30 transition-colors">
                    <Users className="w-4 h-4 text-primary/80 mb-2" strokeWidth={1.75} />
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capacity</p>
                    <p className="text-sm font-semibold text-foreground truncate">{club.capacity}</p>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2 items-center">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="relative group">
                  <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
                  <Button size="sm" className="relative gradient-primary text-primary-foreground gap-1.5 rounded-full font-semibold px-5 shadow-[0_0_25px_hsl(var(--primary)/0.5)]">
                    <Navigation className="w-4 h-4" /> Get Directions
                  </Button>
                </a>
                {club.website && (
                  <a href={club.website} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] text-muted-foreground gap-1 hover:text-foreground hover:border-primary/40">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </Button>
                  </a>
                )}
                {club.instagram && (
                  <a href={`https://instagram.com/${club.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="rounded-full border-white/15 bg-white/[0.03] text-muted-foreground gap-1 hover:text-foreground hover:border-primary/40">
                      <Instagram className="w-3.5 h-3.5" /> {club.instagram}
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="h-64 rounded-xl overflow-hidden">
              <ClubMap clubs={[club]} vibeCounts={vibeCounts || {}} selectedClubId={club.id} />
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <Link
              to="/chat"
              className="relative block rounded-2xl p-4 overflow-hidden border border-primary/25 hover:border-primary/60 transition-all group bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"
            >
              <span className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/25 blur-3xl group-hover:bg-primary/40 transition-colors" />
              <div className="relative flex items-center gap-3">
                <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center shrink-0 shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
                  <MessageCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Join Community Chat</p>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground">{liveChatCount}</span> {liveChatCount === 1 ? 'person' : 'people'} chatting right now
                  </p>
                </div>
              </div>
            </Link>
            <ClubDjMusicRating clubId={club.id} />
            <ClubReviews clubId={club.id} />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ClubDetailPage;
