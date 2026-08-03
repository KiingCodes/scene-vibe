import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PLANS, type SubscriptionPlan, type VenueTier } from "@/components/business/types";

const glass = "rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl";

export default function BusinessBillingPage() {
  const [current, setCurrent] = useState<VenueTier>("basic");
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);

  const confirm = () => {
    if (!selected) return;
    setCurrent(selected.id);
    toast.success(`Checkout ready for ${selected.name} — payment gateway pending`);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-28 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className={`${glass} flex flex-wrap items-center justify-between gap-3 p-5`}>
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">Your plan</div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Crown className="h-6 w-6 text-[#F59E0B]" />
              {PLANS.find((p) => p.id === current)!.name}
              {current === "basic" && <span className="text-zinc-400">— Free</span>}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">Renews 01 Sep 2026 · billed monthly</p>
          </div>
          <Badge variant="outline" className="border-[#10B981]/40 text-[#10B981]">Active</Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => {
            const isCurrent = p.id === current;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`${glass} relative flex flex-col p-5 ${p.popular ? "border-[#8B5CF6]/60 shadow-[0_0_40px_-12px_#8B5CF6]" : ""}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#8B5CF6] px-3 py-0.5 text-[11px] font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <div className="text-sm uppercase tracking-widest text-zinc-500">{p.name}</div>
                <div className="mt-1 text-3xl font-bold">
                  R{p.priceZar.toLocaleString()}
                  <span className="text-sm font-normal text-zinc-500"> /mo</span>
                </div>
                <div className="text-xs text-zinc-500">≈ ${p.priceUsd} per month · {p.tagline}</div>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-zinc-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#06B6D4]" />{f}
                    </li>
                  ))}
                </ul>
                <Button
                  disabled={isCurrent}
                  onClick={() => setSelected(p)}
                  className={`mt-5 w-full ${p.popular ? "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90" : "bg-white/10 hover:bg-white/20"} text-white`}>
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
              <Sparkles className="h-5 w-5 text-[#EC4899]" /> Upgrade to {selected?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              R{selected?.priceZar.toLocaleString()} per month. You unlock:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {selected?.features.map((f) => (
              <li key={f} className="flex gap-2"><Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />{f}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={confirm} className="bg-[#10B981] text-black hover:bg-[#10B981]/90">
              Continue to checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}