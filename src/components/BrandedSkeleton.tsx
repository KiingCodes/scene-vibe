import { cn } from '@/lib/utils';
import logoUrl from '@/assets/scene-logo.jpg';

/**
 * Centered logo skeleton used as the universal loading state across the app.
 * Pulses the SCENE logo over a glass card with a shimmer sweep for brand consistency.
 */
export const LogoSkeleton = ({
  label = 'Loading the scene…',
  className,
  size = 80,
}: { label?: string; className?: string; size?: number }) => (
  <div role="status" aria-live="polite" className={cn('relative overflow-hidden glass rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-3 py-10 px-4', className)}>
    <div className="absolute inset-0 shimmer-overlay" aria-hidden />
    <div className="relative">
      <div
        className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse"
        aria-hidden
      />
      <img
        src={logoUrl}
        alt="SCENE"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="relative rounded-2xl ring-2 ring-primary/40 object-cover animate-pulse"
      />
    </div>
    {label && (
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
    )}
  </div>
);