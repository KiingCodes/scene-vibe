import { Radio, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { LogoSkeleton } from "@/components/BrandedSkeleton";
import { GlassCard, SectionTitle } from "./GlassCard";
import { CROWD_LEVELS, useUpdateVenue } from "@/hooks/useVenueOwner";
import type { Club } from "@/hooks/useClubs";
import { cn } from "@/lib/utils";

export const OwnerLiveStatusCard = ({ venue }: { venue: Club }) => {
  const update = useUpdateVenue();
  const [waitMinutes, setWaitMinutes] = useState(venue.wait_time_minutes);

  useEffect(() => {
    setWaitMinutes(venue.wait_time_minutes);
  }, [venue.id, venue.wait_time_minutes]);

  const save = (patch: Parameters<typeof update.mutate>[0]["patch"], msg: string) =>
    update.mutate(
      { clubId: venue.id, patch },
      { onSuccess: () => toast.success(msg), onError: (e: Error) => toast.error(e.message) },
    );

  return (
    <GlassCard glow="cyan" className="lg:col-span-2">
      <SectionTitle
        icon={<Users className="h-4 w-4" />}
        title="Real-Time Door Status"
        subtitle="Goes live on the home feed, map and your venue page instantly"
      />

      <div className="space-y-5">
        {update.isPending && (
          <LogoSkeleton label="Publishing live status…" size={24} className="border-0 bg-transparent py-1" />
        )}
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Label className="text-xs uppercase tracking-widest text-slate-400">Door wait time</Label>
            <span className="text-sm font-bold text-cyan-200">{waitMinutes === 0 ? "No wait" : `${waitMinutes} min`}</span>
          </div>
          <Slider
            value={[waitMinutes]}
            min={0}
            max={90}
            step={5}
            aria-label="Door wait time in minutes"
            disabled={update.isPending}
            onValueChange={([value]) => setWaitMinutes(value)}
            onValueCommit={([value]) => save({ wait_time_minutes: value }, `Door wait set to ${value} minutes`)}
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Capacity right now</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CROWD_LEVELS.map((level) => {
              const active = venue.live_status === level;
              return (
                <button
                  key={level}
                  disabled={update.isPending}
                  aria-pressed={active}
                  onClick={() => save({ live_status: active ? null : level }, active ? "Status cleared" : `Status set to ${level}`)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-bold tracking-wide transition-all disabled:opacity-60",
                    active
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                      : "border-white/10 bg-slate-950/50 text-slate-400 hover:border-white/20 hover:text-white",
                  )}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Radio className={cn("h-4 w-4", venue.is_live ? "text-emerald-400" : "text-slate-500")} />
            <Label htmlFor="venue-live" className="text-sm font-semibold">
              We're LIVE tonight
            </Label>
          </div>
          <Switch
            id="venue-live"
            checked={!!venue.is_live}
            disabled={update.isPending}
            onCheckedChange={(v) => save({ is_live: v }, v ? "You're live tonight" : "Live mode off")}
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default OwnerLiveStatusCard;
