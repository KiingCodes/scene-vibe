import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useReviews, useSubmitReview, useHasGivenFeedback, useFeedbackSummary, FEEDBACK_OPTIONS, ratingToFeedback } from '@/hooks/useReviews';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ClubReviewsProps {
  clubId: string;
}

const ClubReviews = ({ clubId }: ClubReviewsProps) => {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useReviews(clubId);
  const { data: hasGiven } = useHasGivenFeedback(clubId);
  const { data: summary } = useFeedbackSummary(clubId);
  const submitReview = useSubmitReview();

  const handleFeedback = async (rating: number) => {
    if (!user) return;
    if (hasGiven) {
      toast.info('You already gave feedback tonight!');
      return;
    }
    try {
      await submitReview.mutateAsync({ clubId, rating });
      toast.success('Thanks for the feedback!');
    } catch {
      toast.error('Could not submit feedback.');
    }
  };

  const topVibe = summary && summary.total > 0
    ? FEEDBACK_OPTIONS.reduce((best, opt) =>
        (summary.counts[opt.value] || 0) > (summary.counts[best.value] || 0) ? opt : best
      , FEEDBACK_OPTIONS[0])
    : null;

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">🌙 Night Feedback</h3>
        {summary && summary.total > 0 && (
          <span className="text-xs text-muted-foreground">{summary.total} tonight</span>
        )}
      </div>

      {/* Summary bar */}
      {summary && summary.total > 0 && (
        <div className="space-y-2">
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted/30">
            {FEEDBACK_OPTIONS.map(opt => {
              const pct = (summary.counts[opt.value] / summary.total) * 100;
              if (pct === 0) return null;
              const colors: Record<string, string> = {
                lit: 'bg-orange-500',
                good: 'bg-emerald-500',
                mid: 'bg-yellow-500',
                dead: 'bg-slate-500',
              };
              return (
                <motion.div
                  key={opt.value}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className={`${colors[opt.value]} rounded-full`}
                />
              );
            })}
          </div>
          {topVibe && (
            <p className="text-center text-sm text-muted-foreground">
              Tonight is mostly <span className="font-semibold text-foreground">{topVibe.emoji} {topVibe.label}</span>
            </p>
          )}
        </div>
      )}

      {/* Feedback buttons */}
      {user ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">How was the vibe tonight?</p>
          <div className="grid grid-cols-4 gap-2">
            {FEEDBACK_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleFeedback(opt.rating)}
                disabled={hasGiven || submitReview.isPending}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                  hasGiven
                    ? 'opacity-50 cursor-not-allowed bg-muted/20'
                    : 'bg-muted/30 hover:bg-muted/60 hover:scale-105 active:scale-95'
                }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-xs font-medium text-muted-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
          {hasGiven && (
            <p className="text-xs text-center text-primary">You already shared your vibe tonight ✓</p>
          )}
        </div>
      ) : (
        <div className="text-center py-2">
          <Link to="/auth" className="text-primary text-sm hover:underline">Sign in to share your vibe</Link>
        </div>
      )}

      {/* Recent feedback */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {isLoading && <p className="text-muted-foreground text-xs">Loading...</p>}
        {reviews?.length === 0 && !isLoading && (
          <p className="text-muted-foreground text-xs text-center">No feedback tonight yet.</p>
        )}
        <AnimatePresence>
          {reviews?.map((review, i) => {
            const fb = ratingToFeedback(review.rating);
            const profile = review.profiles as any;
            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 bg-muted/20 rounded-lg px-3 py-2"
              >
                <span className="text-lg">{fb.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground">{profile?.username || 'Anonymous'}</span>
                  <span className="text-xs text-muted-foreground ml-2">{fb.label}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClubReviews;
