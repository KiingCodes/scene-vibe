import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Heart, MapPin, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFavoriteClubs, useToggleFavorite } from '@/hooks/useFavorites';
import type { Club } from '@/hooks/useClubs';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SavedPage = () => {
  const { user } = useAuth();
  const {
    data: favoriteClubs,
    isLoading: favsLoading,
    isError: favsError,
  } = useFavoriteClubs();
  const toggleFavorite = useToggleFavorite();

  const handleRemove = async (clubId: string) => {
    try {
      await toggleFavorite.mutateAsync({ clubId, isFav: true });
      toast.success('Spot removed from your saved list');
    } catch {
      toast.error('Could not remove this spot. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-dark">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-8 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-fuchsia-400" />
          <p className="mb-4 text-muted-foreground">Sign in to save your favorite spots</p>
          <Link to="/auth">
            <Button className="gradient-primary text-primary-foreground">Sign In</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 pb-8 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" aria-label="Back to home" className="text-muted-foreground transition-colors hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-2xl font-black text-transparent">
                Saved Spots
              </h1>
            </div>
            <span className="shrink-0 text-sm font-semibold text-cyan-400">
              {favsLoading ? '— Saved Spots' : `${favoriteClubs?.length ?? 0} Saved Spots`}
            </span>
          </div>

          <div className="space-y-3">
            {favsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-slate-950/80" />
              ))
            ) : favsError ? (
              <div role="alert" className="rounded-2xl border border-rose-400/20 bg-slate-950/80 px-5 py-8 text-center text-sm text-slate-300">
                Unable to load your saved spots. Please try again.
              </div>
            ) : favoriteClubs?.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-12 text-center shadow-lg shadow-cyan-950/20 backdrop-blur-xl">
                <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border border-cyan-400/15" />
                  <span className="absolute inset-3 rounded-full border border-cyan-400/25" />
                  <span className="absolute inset-6 rounded-full border border-fuchsia-400/30" />
                  <Radar className="h-9 w-9 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
                  <span className="absolute right-5 top-5 h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.8)]" />
                </div>
                <h2 className="mb-2 text-lg font-bold text-white">Your vault is waiting</h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
                  No saved spots yet. Tap the heart on any venue to save your favorite spots for quick access!
                </p>
              </div>
            ) : (
              favoriteClubs?.map((club) => (
                <SavedSpotCard
                  key={club.id}
                  club={club as Club}
                  onRemove={() => handleRemove(club.id)}
                  removing={toggleFavorite.isPending}
                />
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

interface SavedSpotCardProps {
  club: Club;
  onRemove: () => void;
  removing: boolean;
}

const SavedSpotCard = ({ club, onRemove, removing }: SavedSpotCardProps) => {
  const [imageFailed, setImageFailed] = useState(!club.image_url);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-lg backdrop-blur-xl transition-all hover:border-cyan-500/40"
    >
      <Link to={`/club/${club.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-slate-900">
          {!imageFailed && club.image_url ? (
            <img
              src={club.image_url}
              alt={club.name}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <MapPin aria-hidden="true" className="h-7 w-7 text-cyan-400/70" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-white">{club.name}</h2>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            {club.area || club.address || 'Location unavailable'}
          </p>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          aria-label={`Remove ${club.name} from saved spots`}
          onClick={onRemove}
          disabled={removing}
          className="cursor-pointer p-2 text-[#D946EF] drop-shadow-[0_0_8px_rgba(217,70,239,0.6)] transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Heart className="h-5 w-5 fill-current" />
        </button>
        <Link
          to={`/club/${club.id}`}
          className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10"
        >
          <span className="hidden sm:inline">View Spot</span>
          <span className="sm:hidden">View</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
};

export default SavedPage;
