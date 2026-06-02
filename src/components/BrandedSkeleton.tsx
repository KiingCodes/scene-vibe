import { cn } from '@/lib/utils';

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