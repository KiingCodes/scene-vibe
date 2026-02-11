import { motion } from 'framer-motion';
import { Flame, TrendingUp, MapPin, Clock, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHasVibed, useVibe } from '@/hooks/useVibes';
import { Button } from '@/components/ui/button';
import PullingUpButton from '@/components/PullingUpButton';
import { toast } from 'sonner';
import type { Club } from '@/hooks/useClubs';
import CrowdLevel from './CrowdLevel';

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
  const isTrending = vibeCount >= 3;

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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/club/${club.id}`}>
        <div className={`glass rounded-xl overflow-hidden group hover:border-primary/30 transition-all duration-300 ${isTrending ? 'trending-glow border-secondary/40' : ''}`}>
          <div className="relative h-48 overflow-hidden">
            <img
              src={club.image_url || '/placeholder.svg'}
              alt={club.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

            {isTrending && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full gradient-secondary text-secondary-foreground text-xs font-semibold"
              >
                <TrendingUp className="w-3 h-3" />
                TRENDING
              </motion.div>
            )}

            <div className="absolute bottom-3 right-3 flex gap-1.5">
              <PullingUpButton clubId={club.id} pullingUpCount={pullingUpCount} />
              <Button
                size="sm"
                onClick={handleVibe}
                disabled={hasVibed || vibeMutation.isPending}
                className={`gap-1.5 rounded-full text-xs font-semibold transition-all ${
                  hasVibed
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'gradient-primary text-primary-foreground hover:shadow-lg'
                } ${!hasVibed && !vibeMutation.isPending ? 'vibe-pulse' : ''}`}
              >
                <Flame className="w-3.5 h-3.5" />
                {vibeCount} {hasVibed ? 'Vibed' : 'Vibe'}
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
              {club.name}
            </h3>

            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5 text-primary/70" />
              <span className="truncate">{club.area}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              </div>
              <CrowdLevel vibeCount={vibeCount} size="sm" showLabel={false} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ClubCard;
