import { Radio, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { GlassCard, SectionTitle } from "./GlassCard";
import { CROWD_LEVELS, useUpdateVenue } from "@/hooks/useVenueOwner";
import type { Club } from "@/hooks/useClubs";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  SPACIOUS: "border-sky-400/60 bg-sky-500/15 text-sky-300",
  BUSY: "border-cyan-400/60 bg-cyan-500/15 text-cyan-300",
  PACKED: "border-orange-400/60 bg-orange-500/15 text-orange-300",
  "FULL LINE": "border-rose-400/60 bg-rose-500/15 text-rose-300",
};

export const OwnerLiveStatusCard = ({ venue }: { venue: Club }) => {
  const update = useUpdateVenue();

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
                    active ? TONE[level] : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Radio className={cn("h-4 w-4", venue.is_live ? "text-emerald-400" : "text-muted-foreground")} />
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
