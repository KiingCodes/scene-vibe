import { TrendingUp, Heart, Flame, Car, ShieldCheck, Star } from "lucide-react";
import { GlassCard, SectionTitle } from "./GlassCard";
import { useVenueAnalytics } from "@/hooks/useVenueOwner";
import type { Club } from "@/hooks/useClubs";
import { cn } from "@/lib/utils";

interface AnalyticsTabProps {
  venue?: Club;
}

export const AnalyticsTab = ({ venue }: AnalyticsTabProps) => {
  const { data, isLoading } = useVenueAnalytics(venue?.id, venue?.lat, venue?.lng);

  const cards = [
    { id: "visits", label: "Profile interest (7d)", value: `${data?.vibes7d ?? 0}`, sub: "vibes dropped at your venue", tone: "violet" as const, icon: <Flame className="h-5 w-5" /> },
    { id: "saves", label: "Saves / favourites", value: `${data?.favorites ?? 0}`, sub: `${data?.reviews ?? 0} reviews left`, tone: "cyan" as const, icon: <Heart className="h-5 w-5" /> },
    { id: "pullups", label: "Pull-ups (7d)", value: `${data?.pullUps7d ?? 0}`, sub: "people headed your way", tone: "pink" as const, icon: <Car className="h-5 w-5" /> },
    { id: "walks", label: "Walk Me Home nearby", value: `${data?.nearbyArrivals ?? 0}`, sub: "safe walks ending within 500 m", tone: "violet" as const, icon: <ShieldCheck className="h-5 w-5" /> },
  ];

  if (!venue) {
    return <GlassCard><p className="text-sm text-muted-foreground">Select a venue to see analytics.</p></GlassCard>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <GlassCard key={c.id} glow={c.tone}>
            <div
              className={cn(
                "mb-3 inline-flex rounded-xl border p-2",
                c.tone === "violet" && "border-portal-violet/40 bg-portal-violet/10 text-portal-violet",
                c.tone === "cyan" && "border-portal-cyan/40 bg-portal-cyan/10 text-portal-cyan",
                c.tone === "pink" && "border-portal-pink/40 bg-portal-pink/10 text-portal-pink",
              )}
            >
              {c.icon}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</div>
            <div className="font-display text-xl font-bold text-foreground">{isLoading ? "—" : c.value}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-portal-cyan" /> {c.sub}
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Crowd density by hour" subtitle="Based on vibes at your venue over the last 7 nights" />
        <div className="flex h-40 items-end gap-2">
          {(data?.hourly || []).map((b) => (
            <div key={b.hour} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-portal-violet/40 via-portal-pink/60 to-portal-cyan"
                style={{ height: `${Math.max(b.pct, 3)}%` }}
                role="img"
                aria-label={`${b.hour}: ${b.pct}% of peak`}
              />
              <span className="text-[9px] text-muted-foreground">{b.hour}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
