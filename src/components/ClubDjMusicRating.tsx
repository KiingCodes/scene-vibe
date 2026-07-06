import { useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Music2, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClubRatingSummary, useHasRatedToday, useSubmitClubRating } from '@/hooks/useClubRatings';
import { useAwardPoints, useEarnBadge } from '@/hooks/useGamification';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const StarRating = ({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        disabled={disabled}
        onClick={() => onChange(star)}
        className={`transition-all duration-200 ${disabled ? 'cursor-not-allowed' : 'hover:scale-125 active:scale-90'}`}
      >
        <Star className={`w-6 h-6 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
      </button>
    ))}
  </div>
);

const ClubDjMusicRating = ({ clubId }: { clubId: string }) => {
  const { user } = useAuth();
  const { data: summary } = useClubRatingSummary(clubId);
  const { data: hasRated } = useHasRatedToday(clubId);
  const submitRating = useSubmitClubRating();
  const awardPoints = useAwardPoints();
  const earnBadge = useEarnBadge();
  const [djRating, setDjRating] = useState(0);
  const [musicRating, setMusicRating] = useState(0);

  const handleSubmit = async () => {
    if (!user || djRating === 0 || musicRating === 0) return;
    try {
      await submitRating.mutateAsync({ clubId, djRating, musicRating });
      awardPoints.mutate({ action: 'rating' });
      earnBadge.mutate({ badgeType: 'dj_rater' });
      toast.success('🎧 Rating submitted!');
      setDjRating(0);
      setMusicRating(0);
    } catch {
      toast.error('Could not submit rating.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Headphones className="w-5 h-5 text-accent" /> DJ & Music Ratings
        </h3>
        {summary && summary.total > 0 && (
          <span className="text-xs text-muted-foreground">{summary.total} ratings</span>
        )}
      </div>

      {/* Summary */}
      {summary && summary.total > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <Headphones className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">DJ Rating</p>
            <p className="text-lg font-bold text-foreground">{summary.avgDj}<span className="text-xs text-muted-foreground">/5</span></p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <Music2 className="w-4 h-4 text-secondary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Music Quality</p>
            <p className="text-lg font-bold text-foreground">{summary.avgMusic}<span className="text-xs text-muted-foreground">/5</span></p>
          </div>
        </div>
      )}

      {/* Rating form */}
      {user ? (
        <div className="space-y-3">
          {hasRated ? (
            <p className="text-xs text-center text-primary">You already rated tonight ✓</p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5" /> DJ
                  </span>
                  <StarRating value={djRating} onChange={setDjRating} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Music2 className="w-3.5 h-3.5" /> Music
                  </span>
                  <StarRating value={musicRating} onChange={setMusicRating} />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={djRating === 0 || musicRating === 0 || submitRating.isPending}
                className="w-full py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitRating.isPending ? 'Submitting...' : 'Submit Rating'}
              </motion.button>
            </>
          )}
        </div>
      ) : (
        <Link
          to="/auth"
          className="block relative rounded-xl p-4 border border-primary/25 bg-gradient-to-br from-primary/5 to-accent/5 hover:border-primary/60 hover:from-primary/10 hover:to-accent/10 transition-all group overflow-hidden"
        >
          <span className="absolute -inset-1 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" /> DJ
              </span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 text-primary/30 group-hover:text-primary/60 transition-colors" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.4))' }} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5" /> Music
              </span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 text-secondary/30 group-hover:text-secondary/60 transition-colors" style={{ filter: 'drop-shadow(0 0 4px hsl(var(--secondary) / 0.4))' }} />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-center text-primary/80 font-semibold uppercase tracking-widest">Tap to sign in & rate</p>
          </div>
        </Link>
      )}
    </motion.div>
  );
};

export default ClubDjMusicRating;
