import { useState } from 'react';
import { Car } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useHasPulledUp, usePullUp } from '@/hooks/usePullingUp';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface PullingUpButtonProps {
  clubId: string;
  pullingUpCount: number;
  size?: 'sm' | 'default';
}

const ETA_OPTIONS = [15, 30, 45, 60];

const PullingUpButton = ({ clubId, pullingUpCount, size = 'sm' }: PullingUpButtonProps) => {
  const { user } = useAuth();
  const { data: hasPulledUp } = useHasPulledUp(clubId);
  const pullUpMutation = usePullUp();
  const [open, setOpen] = useState(false);

  const handlePullUp = async (minutes: number) => {
    setOpen(false);
    if (!user) {
      toast.error('Sign in to pull up!');
      return;
    }
    if (hasPulledUp) {
      toast.info("You're already pulling up!");
      return;
    }
    try {
      await pullUpMutation.mutateAsync({ clubId, etaMinutes: minutes });
      toast.success(`🚗 Pulling up in ${minutes} min!`);
    } catch {
      toast.error('Could not pull up. Try again later.');
    }
  };

  if (hasPulledUp) {
    return (
      <Button
        size={size}
        disabled
        className="gap-1.5 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30"
      >
        <Car className="w-3.5 h-3.5" />
        {pullingUpCount} Pulling Up
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size={size}
          disabled={pullUpMutation.isPending}
          className="gap-1.5 rounded-full text-xs font-semibold bg-accent/80 text-accent-foreground hover:bg-accent hover:shadow-lg"
        >
          <Car className="w-3.5 h-3.5" />
          {pullingUpCount} Pull Up
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end" onClick={e => e.stopPropagation()}>
        <p className="text-xs text-muted-foreground mb-2 px-1">ETA to the club?</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ETA_OPTIONS.map(min => (
            <Button
              key={min}
              size="sm"
              variant="outline"
              className="text-xs border-border/50"
              onClick={e => { e.preventDefault(); e.stopPropagation(); handlePullUp(min); }}
            >
              {min} min
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PullingUpButton;
