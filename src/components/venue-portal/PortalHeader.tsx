import { motion } from "framer-motion";
import { ShieldCheck, Clock, Flame, Users } from "lucide-react";
import { PortalMode, VenueStatus } from "./types";
import { cn } from "@/lib/utils";

interface PortalHeaderProps {
  venueName: string;
  mode: PortalMode;
  onModeChange: (mode: PortalMode) => void;
  status: VenueStatus;
}

const modes: { id: PortalMode; label: string }[] = [
  { id: "setup", label: "☀️ Setup Mode" },
  { id: "live", label: "🌙 Live Command" },
];

const Pill = ({
  icon,
  label,
  value,
  tone,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "violet" | "cyan" | "pink";
  pulse?: boolean;
}) => (
  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/70 backdrop-blur-xl px-3 py-2 min-w-0">
    <span
      className={cn(
        "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        tone === "violet" && "bg-portal-violet/15 text-portal-violet",
        tone === "cyan" && "bg-portal-cyan/15 text-portal-cyan",
        tone === "pink" && "bg-portal-pink/15 text-portal-pink",
      )}
    >
      {icon}
      {pulse && (
        <motion.span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full",
            tone === "violet" && "bg-portal-violet/40",
            tone === "cyan" && "bg-portal-cyan/40",
            tone === "pink" && "bg-portal-pink/40",
          )}
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.6, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </span>
    <span className="min-w-0">
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground truncate">{label}</span>
      <span className="block text-sm font-semibold text-foreground truncate">{value}</span>
    </span>
  </div>
);

export const PortalHeader = ({ venueName, mode, onModeChange, status }: PortalHeaderProps) => (
  <header className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{venueName}</h1>
      <motion.span
        className="inline-flex items-center gap-1.5 rounded-full border border-portal-violet/40 bg-portal-violet/10 px-2.5 py-1 text-[11px] font-semibold text-portal-violet"
        animate={{ boxShadow: ["0 0 0 hsl(var(--portal-violet)/0)", "0 0 18px hsl(var(--portal-violet)/0.6)", "0 0 0 hsl(var(--portal-violet)/0)"] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        <ShieldCheck className="h-3.5 w-3.5" /> Verified Venue
      </motion.span>
    </div>

    <div
      role="tablist"
      aria-label="Operating mode"
      className="relative grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-zinc-950/70 p-1 backdrop-blur-xl"
    >
      {modes.map((m) => (
        <button
          key={m.id}
          role="tab"
          aria-selected={mode === m.id}
          onClick={() => onModeChange(m.id)}
          className={cn(
            "relative z-10 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
            mode === m.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {mode === m.id && (
            <motion.span
              layoutId="portal-mode-pill"
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-portal-violet/30 via-portal-cyan/25 to-portal-pink/30 border border-white/10"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          {m.label}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <Pill icon={<Clock className="h-3.5 w-3.5" />} label="Door wait" value={`${status.waitMinutes}-${status.waitMinutes + 5} min`} tone="cyan" />
      <Pill icon={<Flame className="h-3.5 w-3.5" />} label="Live vibe index" value={`🔥 ${status.crowdTag}`} tone="pink" pulse />
      <Pill icon={<Users className="h-3.5 w-3.5" />} label="Inbound pull-ups" value={`${status.inboundPullUps} partygoers`} tone="violet" />
    </div>
  </header>
);