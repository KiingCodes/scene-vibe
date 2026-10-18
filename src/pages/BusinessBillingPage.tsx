import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  PLANS,
  type SubscriptionPlan,
  type VenueTier,
} from "@/components/business/types";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyClaim,
  useMySubscription,
  useUpsertSubscription,
} from "@/hooks/useBusinessAdmin";

const glass =
  "rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl";

export default function BusinessBillingPage() {
  const { user } = useAuth();
  const { data: sub, isLoading } = useMySubscription();
  const { data: claim } = useMyClaim();
  const upsert = useUpsertSubscription();
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);

  const current: VenueTier = (sub?.tier as VenueTier) ?? "basic";
  const venueName = sub?.venue_name ?? claim?.venue_name ?? "Your venue";

  const confirm = async () => {
    if (!selected) return;
    if (!user) return toast.error("Sign in to manage your plan");
    try {
      await upsert.mutateAsync({
        id: sub?.id,
        claim_id: sub?.claim_id ?? claim?.id ?? null,
        venue_name: venueName,
        tier: selected.id,
        status: sub?.status ?? "pending",
      });
      toast.success(`${selected.name} requested — payment gateway pending`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Could not update plan";
      toast.error(message);
    }
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-28 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-medium text-slate-300 backdrop-blur-xl transition-all hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-200">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-[0_0_30px_rgba(6,182,212,0.06)] backdrop-blur-2xl"
        >
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              {venueName}
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Crown className="h-6 w-6 text-[#F59E0B]" />
              {PLANS.find((p) => p.id === current)!.name}
              {current === "basic" && (
                <span className="text-zinc-400">- Free</span>
              )}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              {isLoading
                ? "Loading plan…"
                : sub?.renews_at
                  ? `Renews ${new Date(sub.renews_at).toLocaleDateString()} · billed monthly`
                  : "No billing cycle yet · billed monthly once active"}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              sub?.status === "active"
                ? "border-[#10B981]/40 bg-emerald-500/10 text-emerald-300"
                : sub?.status === "suspended"
                  ? "border-[#EC4899]/40 bg-pink-500/10 text-pink-300"
                  : "border-amber-400/30 bg-amber-500/10 text-amber-300"
            }
          >
            {sub?.status ?? "pending"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => {
            const isCurrent = p.id === current;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`relative flex flex-col rounded-2xl p-6 backdrop-blur-2xl ${
                  p.popular
                    ? "border-2 border-purple-500/50 bg-slate-950/90 shadow-[0_0_30px_rgba(168,85,247,0.25)]"
                    : p.id === "basic"
                      ? "border border-white/10 bg-slate-900/60"
                      : "border border-white/10 bg-slate-900/80"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#8B5CF6] px-3 py-0.5 text-[11px] font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <div className="text-sm uppercase tracking-widest text-zinc-500">
                  {p.name}
                </div>
                <div className="mt-1 text-3xl font-bold">
                  R{p.priceZar.toLocaleString()}
                  <span className="text-sm font-normal text-zinc-500">
                    {" "}
                    /mo
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  ≈ ${p.priceUsd} per month · {p.tagline}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-zinc-300">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  disabled={isCurrent}
                  onClick={() => setSelected(p)}
                  className={`mt-5 w-full ${
                    isCurrent
                      ? "border border-white/10 bg-white/5 text-slate-400 opacity-70"
                      : p.popular
                        ? "rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:opacity-90"
                        : "border border-cyan-400/20 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {isCurrent ? "Current Plan" : p.cta}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="border-white/10 bg-zinc-950/95 text-zinc-100 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#EC4899]" /> Upgrade to{" "}
              {selected?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              R{selected?.priceZar.toLocaleString()} per month. You unlock:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {selected?.features.map((f) => (
              <li key={f} className="flex gap-2">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
                {f}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={upsert.isPending}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:opacity-90"
            >
              Continue to checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
