import { Check, Clock3, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePendingNightReplays, useReviewNightReplay } from "@/hooks/useNightReplays";

const NightReplayReview = ({ clubId }: { clubId: string }) => {
  const { data: submissions, isLoading, isError } = usePendingNightReplays(clubId);
  const reviewReplay = useReviewNightReplay();

  const handleReview = async (videoId: string, status: "approved" | "rejected") => {
    try {
      await reviewReplay.mutateAsync({ videoId, status, clubId });
      toast.success(status === "approved" ? "Highlight approved and live on Night Replay." : "Highlight rejected.");
    } catch {
      toast.error("Could not update the highlight review");
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-zinc-950/70 p-5 backdrop-blur-xl">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Night Replay submissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">Review clips tagged to your venue before they appear on Night Replay.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading submissions…</p>}
      {isError && <p role="alert" className="text-sm text-red-300">Could not load replay submissions. Please try again.</p>}
      {!isLoading && !isError && !submissions?.length && (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
          No highlights are waiting for review.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {submissions?.map(submission => (
          <article key={submission.id} className="overflow-hidden rounded-xl border border-fuchsia-500/20 bg-black/30">
            <video src={submission.video_url} controls playsInline className="aspect-[9/16] max-h-[420px] w-full bg-black object-contain" />
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Clock3 className="h-3.5 w-3.5" />
                Submitted {format(new Date(submission.created_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
              {submission.caption && <p className="text-sm text-white">{submission.caption}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => handleReview(submission.id, "approved")}
                  disabled={reviewReplay.isPending}
                  className="flex-1 bg-cyan-400 font-semibold text-black hover:bg-cyan-300"
                >
                  <Check className="mr-1.5 h-4 w-4" /> Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleReview(submission.id, "rejected")}
                  disabled={reviewReplay.isPending}
                  className="flex-1 border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-red-100"
                >
                  <X className="mr-1.5 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default NightReplayReview;
