import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: "violet" | "cyan" | "pink" | "none";
}

const glowMap: Record<string, string> = {
  violet: "ring-1 ring-portal-violet/10",
  cyan: "ring-1 ring-portal-cyan/10",
  pink: "ring-1 ring-portal-pink/10",
  none: "",
};

export const GlassCard = ({ children, className, glow = "none" }: GlassCardProps) => (
  <div
    className={cn(
      "rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-2xl sm:p-6",
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