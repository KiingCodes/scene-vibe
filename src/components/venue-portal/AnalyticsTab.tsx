import { TrendingUp, Clock4, Wallet, MapPinned } from "lucide-react";
import { GlassCard, SectionTitle } from "./GlassCard";
import { AnalyticsCard } from "./types";
import { cn } from "@/lib/utils";

const cards: (AnalyticsCard & { icon: React.ReactNode })[] = [
  { id: "peak", label: "Peak crowd hour", value: "23:00 – 01:00", delta: "+18% vs last weekend", tone: "violet", icon: <Clock4 className="h-5 w-5" /> },
  { id: "revenue", label: "LinePass revenue", value: "R48 250", delta: "+R6 400 this week", tone: "cyan", icon: <Wallet className="h-5 w-5" /> },
  { id: "geofence", label: "Geofence conversion", value: "37.4%", delta: "142 of 380 pull-ups arrived", tone: "pink", icon: <MapPinned className="h-5 w-5" /> },
];

const bars = [
  { hour: "20:00", pct: 22 },
  { hour: "21:00", pct: 38 },
  { hour: "22:00", pct: 61 },
  { hour: "23:00", pct: 88 },
  { hour: "00:00", pct: 96 },
  { hour: "01:00", pct: 74 },
  { hour: "02:00", pct: 45 },
];

export const AnalyticsTab = () => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
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
          <div className="font-display text-xl font-bold text-foreground">{c.value}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-portal-cyan" /> {c.delta}
          </div>
        </GlassCard>
      ))}
    </div>

    <GlassCard>
      <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Crowd density by hour" subtitle="Rolling 30-night average" />
      <div className="flex h-40 items-end gap-2">
        {bars.map((b) => (
          <div key={b.hour} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-portal-violet/40 via-portal-pink/60 to-portal-cyan"
              style={{ height: `${b.pct}%` }}
              role="img"
              aria-label={`${b.hour}: ${b.pct}% capacity`}
            />
            <span className="text-[9px] text-muted-foreground">{b.hour}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  </div>
);