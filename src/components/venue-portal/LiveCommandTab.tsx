import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, QrCode, Gauge, Camera, Radio, Send } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { GlassCard, SectionTitle } from "./GlassCard";
import { CrowdTag, FlashPromo, VenueStatus } from "./types";
import { cn } from "@/lib/utils";

const CROWD_TAGS: CrowdTag[] = ["Chilled", "Warming Up", "Vibing", "Packed", "Wall-to-Wall"];
const PROMO_PRESETS = ["Free Entry Before 11 PM", "2-for-1 Cocktails", "R50 Door Special", "VIP Table Drop"];

interface LiveCommandTabProps {
  status: VenueStatus;
  onStatusChange: (next: VenueStatus) => void;
}

export const LiveCommandTab = ({ status, onStatusChange }: LiveCommandTabProps) => {
  const [promo, setPromo] = useState<FlashPromo>({
    headline: PROMO_PRESETS[0],
    radiusKm: 5,
    durationMinutes: 60,
  });
  const [scannerLive, setScannerLive] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [autoAdmit, setAutoAdmit] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassCard glow="cyan">
        <SectionTitle icon={<Gauge className="h-4 w-4" />} title="Vibe & Queue Controls" subtitle="Push live door status to the SCENE feed" />

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Door wait time</Label>
              <span className="text-sm font-bold text-portal-cyan">{status.waitMinutes}-{status.waitMinutes + 5} min</span>
            </div>
            <Slider
              value={[status.waitMinutes]}
              min={0}
              max={90}
              step={5}
              aria-label="Door wait time in minutes"
              onValueChange={([v]) => onStatusChange({ ...status, waitMinutes: v })}
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Crowd intensity</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CROWD_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onStatusChange({ ...status, crowdTag: tag })}
                  aria-pressed={status.crowdTag === tag}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    status.crowdTag === tag
                      ? "border-portal-pink/60 bg-portal-pink/15 text-portal-pink shadow-[0_0_18px_-4px_hsl(var(--portal-pink)/0.8)]"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Inbound pull-ups</Label>
              <span className="text-sm font-bold text-portal-violet">{status.inboundPullUps}</span>
            </div>
            <Slider
              value={[status.inboundPullUps]}
              min={0}
              max={500}
              step={2}
              aria-label="Inbound pull-ups"
              onValueChange={([v]) => onStatusChange({ ...status, inboundPullUps: v })}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard glow="pink" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-portal-pink/20 blur-3xl" />
        <SectionTitle icon={<Zap className="h-4 w-4" />} title="Flash Promo Trigger" subtitle="Instant push alert to nearby partygoers" />

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PROMO_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setPromo((prev) => ({ ...prev, headline: p }))}
                aria-pressed={promo.headline === p}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  promo.headline === p
                    ? "border-portal-violet/60 bg-portal-violet/15 text-portal-violet"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <div>
            <Label htmlFor="promo-headline" className="text-xs uppercase tracking-widest text-muted-foreground">Promo headline</Label>
            <Input
              id="promo-headline"
              value={promo.headline}
              onChange={(e) => setPromo({ ...promo, headline: e.target.value })}
              className="mt-1.5 bg-white/5 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="promo-radius" className="text-xs uppercase tracking-widest text-muted-foreground">Radius (km)</Label>
              <Input
                id="promo-radius"
                type="number"
                min={1}
                max={50}
                value={promo.radiusKm}
                onChange={(e) => setPromo({ ...promo, radiusKm: Number(e.target.value) })}
                className="mt-1.5 bg-white/5 border-white/10"
              />
            </div>
            <div>
              <Label htmlFor="promo-timer" className="text-xs uppercase tracking-widest text-muted-foreground">Timer (min)</Label>
              <Input
                id="promo-timer"
                type="number"
                min={5}
                max={480}
                value={promo.durationMinutes}
                onChange={(e) => setPromo({ ...promo, durationMinutes: Number(e.target.value) })}
                className="mt-1.5 bg-white/5 border-white/10"
              />
            </div>
          </div>

          <Button
            className="w-full h-12 text-sm font-bold bg-gradient-to-r from-portal-violet via-portal-pink to-portal-cyan text-white hover:opacity-90"
            onClick={() =>
              toast.success("Flash promo launched", {
                description: `“${promo.headline}” · ${promo.radiusKm}km radius · live for ${promo.durationMinutes} min`,
              })
            }
          >
            <Send className="h-4 w-4 mr-2" /> Launch Flash Promo
          </Button>
        </div>
      </GlassCard>

      <GlassCard glow="violet" className="lg:col-span-2">
        <SectionTitle icon={<QrCode className="h-4 w-4" />} title="Digital LinePass Scanner" subtitle="Validate entry passes at the door" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative aspect-video rounded-xl border border-white/10 bg-black/60 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-6 rounded-lg border-2 border-portal-cyan/50" />
            <motion.div
              className="absolute left-6 right-6 h-0.5 bg-portal-cyan shadow-[0_0_18px_2px_hsl(var(--portal-cyan)/0.9)]"
              animate={{ top: scannerLive ? ["12%", "86%", "12%"] : "50%" }}
              transition={{ duration: 2.6, repeat: scannerLive ? Infinity : 0, ease: "easeInOut" }}
            />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="h-8 w-8" />
              <span className="text-xs">{scannerLive ? "Scanning for LinePass QR…" : "Camera paused"}</span>
            </div>
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/80 px-2 py-1 text-[10px] font-semibold text-portal-pink backdrop-blur-xl">
              <Radio className="h-3 w-3" /> DOOR CAM 01
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-code" className="text-xs uppercase tracking-widest text-muted-foreground">Manual code entry</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="manual-code"
                  placeholder="SCN-XXXX-XXXX"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="bg-white/5 border-white/10 font-mono tracking-widest"
                />
                <Button
                  variant="secondary"
                  disabled={!manualCode}
                  onClick={() => {
                    toast.success(`Pass ${manualCode} validated`, { description: "Guest admitted · 1 entry redeemed" });
                    setManualCode("");
                  }}
                >
                  Validate
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Label htmlFor="scanner-live" className="text-sm">Live camera scanning</Label>
              <Switch id="scanner-live" checked={scannerLive} onCheckedChange={setScannerLive} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Label htmlFor="auto-admit" className="text-sm">Auto-admit valid VIP passes</Label>
              <Switch id="auto-admit" checked={autoAdmit} onCheckedChange={setAutoAdmit} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Scanned", value: "318" },
                { label: "Admitted", value: "294" },
                { label: "Rejected", value: "24" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 py-2">
                  <div className="text-lg font-bold text-foreground">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};