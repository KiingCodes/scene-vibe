import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Prominent "Verified Venue" badge for claimed & approved venues. */
export const VerifiedVenueBadge = ({
  size = 'default',
  className,
  label = 'Verified Venue',
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
}) => (
  <span
    title="This venue is claimed and verified by its owner"
    className={cn(
      'inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 text-emerald-300 font-black uppercase tracking-widest backdrop-blur-md shadow-[0_0_16px_hsl(158_80%_45%/0.25)]',
      size === 'sm' && 'px-1.5 py-0.5 text-[9px]',
      size === 'default' && 'px-2 py-0.5 text-[10px]',
      size === 'lg' && 'px-3 py-1 text-xs',
      className,
    )}
  >
    <ShieldCheck className={cn(size === 'lg' ? 'w-4 h-4' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
    {label}
  </span>
);

/** Small "Official Account" tag shown next to venue-owner authored content. */
export const OfficialAccountTag = ({ className }: { className?: string }) => (
  <span
    title="Posted by a verified venue owner"
    className={cn(
      'inline-flex items-center gap-1 rounded-full border border-primary/50 bg-primary/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary',
      className,
    )}
  >
    <BadgeCheck className="w-2.5 h-2.5" /> Official
  </span>
);

export default VerifiedVenueBadge;
