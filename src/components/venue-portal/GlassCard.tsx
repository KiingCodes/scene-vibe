import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: "violet" | "cyan" | "pink" | "none";
}

const glowMap: Record<string, string> = {
  violet: "shadow-[0_0_40px_-12px_hsl(var(--portal-violet)/0.55)]",
  cyan: "shadow-[0_0_40px_-12px_hsl(var(--portal-cyan)/0.55)]",
  pink: "shadow-[0_0_40px_-12px_hsl(var(--portal-pink)/0.55)]",
  none: "",
};

export const GlassCard = ({ children, className, glow = "none" }: GlassCardProps) => (
  <div
    className={cn(
      "rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl p-4 sm:p-5",
      glowMap[glow],
      className,
    )}
  >
    {children}
  </div>
);

export const SectionTitle = ({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-portal-cyan">{icon}</div>
    <div>
      <h3 className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  </div>
);