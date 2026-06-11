import { cn } from '@/lib/utils';
import logoUrl from '@/assets/scene-logo.jpg';

/** Dark glass card skeleton with the shimmer-slide overlay used elsewhere in the app. */
export const SkeletonBlock = ({ className }: { className?: string }) => (
  <div className={cn('relative overflow-hidden glass rounded-xl border border-border/30', className)}>
    <div className="absolute inset-0 shimmer-overlay" />
  </div>
);

export const SkeletonGrid = ({ count = 6, itemClass = 'h-40' }: { count?: number; itemClass?: string }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBlock key={i} className={itemClass} />
    ))}
  </div>
);

export const SkeletonList = ({ count = 5, itemClass = 'h-14' }: { count?: number; itemClass?: string }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBlock key={i} className={itemClass} />
    ))}
  </div>
);

/**
 * Centered logo skeleton — used as the universal loading state across pages.
 * Pulses the SCENE logo over a glass card with a shimmer sweep for brand consistency.
 */
export const LogoSkeleton = ({
  label = 'Loading the scene…',
  className,
  size = 80,
}: { label?: string; className?: string; size?: number }) => (
  <div className={cn('relative overflow-hidden glass rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-3 py-10 px-4', className)}>
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

/** Inline logo spinner — smaller variant for in-card loading inside lists/sections. */
export const InlineLogoLoader = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center justify-center py-6', className)}>
    <img src={logoUrl} alt="" className="w-10 h-10 rounded-lg ring-1 ring-primary/40 animate-pulse" />
  </div>
);