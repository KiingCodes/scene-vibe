import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReviews, useSubmitReview } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface ClubReviewsProps {
  clubId: string;
}

const ClubReviews = ({ clubId }: ClubReviewsProps) => {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useReviews(clubId);
  const submitReview = useSubmitReview();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await submitReview.mutateAsync({ clubId, rating, content });
      setContent('');
      setRating(5);
      toast.success('Review submitted!');
    } catch {
      toast.error('You already reviewed this club.');
    }
  };

  const avgRating = reviews?.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">⭐ Reviews</h3>
        {avgRating && (
          <span className="text-primary font-bold text-lg">{avgRating}/5</span>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3 border-b border-border/30 pb-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    star <= (hoverRating || rating) ? 'fill-primary text-primary' : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share your experience..."
            className="bg-muted/50 border-border/50 text-sm min-h-[60px]"
          />
          <Button type="submit" size="sm" disabled={submitReview.isPending} className="gradient-primary text-primary-foreground">
            Submit Review
          </Button>
        </form>
      ) : (
        <div className="text-center py-2 border-b border-border/30">
          <Link to="/auth" className="text-primary text-sm hover:underline">Sign in to leave a review</Link>
        </div>
      )}

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {isLoading && <p className="text-muted-foreground text-xs">Loading reviews...</p>}
        {reviews?.length === 0 && !isLoading && (
          <p className="text-muted-foreground text-xs text-center">No reviews yet.</p>
        )}
        {reviews?.map((review, i) => {
          const profile = review.profiles as any;
          return (
            <motion.div
              key={review.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-muted/30 rounded-lg p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{profile?.username || 'Anonymous'}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-3 h-3 ${j < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                  ))}
                </div>
              </div>
              {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ClubReviews;
