import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Music, Flame, TrendingUp, Navigation, Globe, Instagram, Car } from 'lucide-react';
import PullingUpButton from '@/components/PullingUpButton';
import Navbar from '@/components/Navbar';
import ClubChat from '@/components/ClubChat';
import ClubReviews from '@/components/ClubReviews';
import ClubMap from '@/components/ClubMap';
import CrowdLevel from '@/components/CrowdLevel';
import { useClub } from '@/hooks/useClubs';
import { useVibeCount, useHasVibed, useVibe, useAllVibes } from '@/hooks/useVibes';
import { usePullingUpCount, useHasPulledUp, usePullUp } from '@/hooks/usePullingUp';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ClubDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: club, isLoading } = useClub(id!);
  const { data: vibeCount } = useVibeCount(id!);
  const { data: vibeCounts } = useAllVibes();
  const { data: hasVibed } = useHasVibed(id!);
  const vibeMutation = useVibe();
  const { data: pullingUpCount } = usePullingUpCount(id!);
  const { user } = useAuth();

  const isTrending = (vibeCount || 0) >= 3;

  const handleVibe = async () => {
    if (!user) {
      toast.error('Sign in to vibe!');
      return;
    }
    if (hasVibed) {
      toast.info('Already vibed today!');
      return;
    }
    try {
      await vibeMutation.mutateAsync(id!);
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

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80">
            <img src={club.image_url || '/placeholder.svg'} alt={club.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end justify-between">
                <div>
                  {isTrending && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full gradient-secondary text-secondary-foreground text-xs font-semibold mb-2">
                      <TrendingUp className="w-3 h-3" /> TRENDING
                    </span>
                  )}
                  <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground">{club.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4 text-primary" /> {club.address}
                  </p>
                </div>

                <div className="flex gap-2">
                  <PullingUpButton clubId={id!} pullingUpCount={pullingUpCount || 0} size="default" />
                  <Button
                    onClick={handleVibe}
                    disabled={hasVibed || vibeMutation.isPending}
                    className={`gap-2 rounded-full font-semibold ${
                      hasVibed
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'gradient-primary text-primary-foreground'
                    } ${!hasVibed ? 'vibe-pulse' : ''}`}
                  >
                    <Flame className="w-5 h-5" />
                    {vibeCount || 0} {hasVibed ? 'Vibed' : 'Vibe It'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
            {/* Details */}
            <div className="glass rounded-xl p-5 space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">{club.description}</p>
              
              {/* Crowd Level Indicator */}
              <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Crowd Level</p>
                  <CrowdLevel vibeCount={vibeCount || 0} size="lg" />
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent flex items-center gap-1"><Car className="w-5 h-5" /> {pullingUpCount || 0}</p>
                    <p className="text-xs text-muted-foreground">pulling up</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{vibeCount || 0}</p>
                    <p className="text-xs text-muted-foreground">vibes now</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {club.genre && (
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Music className="w-4 h-4 text-secondary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Genre</p>
                    <p className="text-sm font-semibold text-foreground">{club.genre}</p>
                  </div>
                )}
                {club.opening_hours && (
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Hours</p>
                    <p className="text-sm font-semibold text-foreground">{club.opening_hours}</p>
                  </div>
                )}
                {club.capacity && (
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Flame className="w-4 h-4 text-accent mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="text-sm font-semibold text-foreground">{club.capacity}</p>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
                    <Navigation className="w-3.5 h-3.5" /> Get Directions
                  </Button>
                </a>
                {club.website && (
                  <a href={club.website} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-border/50 text-muted-foreground gap-1">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </Button>
                  </a>
                )}
                {club.instagram && (
                  <a href={`https://instagram.com/${club.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-border/50 text-muted-foreground gap-1">
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
            <ClubChat clubId={club.id} clubName={club.name} />
            <ClubReviews clubId={club.id} />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ClubDetailPage;
