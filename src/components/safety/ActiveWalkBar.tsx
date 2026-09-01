import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, MapPin, BatteryMedium, X, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DuressPinPad from './DuressPinPad';
import {
  DURESS_PIN,
  getSafePin,
  triggerSafetyEscalation,
  useActiveSafetySession,
  useEndSafetySession,
  useSafetyTracker,
} from '@/hooks/useSafety';

/**
 * Global status strip shown while a Walk Me Home session is running.
 * Ending the walk requires the user's safe PIN — entering the duress PIN
 * silently escalates to emergency contacts while showing a normal "ended" UI.
 */
const ActiveWalkBar = () => {
  const { data: session } = useActiveSafetySession();
  const { position, error } = useSafetyTracker(session ?? null);
  const end = useEndSafetySession();
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!session) return null;

  const handlePin = async (pin: string) => {
    setBusy(true);
    const safe = getSafePin();
    if (pin === DURESS_PIN || (safe && pin !== safe)) {
      // Duress (or wrong PIN under pressure) — escalate silently.
      await triggerSafetyEscalation(session.id, 'duress');
      await end.mutateAsync(session.id).catch(() => {});
      setPinOpen(false);
      setBusy(false);
      toast.success('Walk ended. Stay safe.');
      return;
    }
    await end.mutateAsync(session.id).catch(() => {});
    setPinOpen(false);
    setBusy(false);
    toast.success('Walk ended. Glad you made it.');
  };

  const escalated = session.status === 'escalated';

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="fixed top-14 left-0 right-0 z-40 px-3 pt-2"
        >
          <div
            className={`max-w-lg mx-auto rounded-xl border backdrop-blur-xl px-3 py-2 flex items-center gap-3 ${
              escalated
                ? 'bg-[#ff2e93]/15 border-[#ff2e93]/50 shadow-[0_0_24px_rgba(255,46,147,0.35)]'
                : 'bg-[#0a0a0f]/90 border-[#00e6d6]/30 shadow-[0_0_20px_rgba(0,230,214,0.2)]'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute h-full w-full rounded-full opacity-70 ${escalated ? 'bg-[#ff2e93]' : 'bg-[#00e6d6]'}`} />
              <span className={`relative rounded-full h-2.5 w-2.5 ${escalated ? 'bg-[#ff2e93]' : 'bg-[#00e6d6]'}`} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/90 flex items-center gap-1.5">
                {escalated ? <Siren className="w-3.5 h-3.5 text-[#ff2e93]" /> : <Shield className="w-3.5 h-3.5 text-[#00e6d6]" />}
                {escalated ? 'Alert sent' : 'Walking home'}
              </div>
              <div className="text-[11px] text-white/60 truncate flex items-center gap-2">
                <MapPin className="w-3 h-3 shrink-0" />
                {session.destination_label || 'Destination'}
                {session.battery_level != null && (
                  <span className="flex items-center gap-0.5">
                    <BatteryMedium className="w-3 h-3" />
                    {session.battery_level}%
                  </span>
                )}
              </div>
              {error && <div className="text-[10px] text-[#facc15]">Location: {error}</div>}
              {!error && position && (
                <div className="text-[10px] text-white/35">
                  Live · accuracy ±{Math.round(position.coords.accuracy)}m
                </div>
              )}
            </div>

            <Link
              to={`/track/${session.id}`}
              className="text-[10px] font-bold uppercase tracking-wider text-[#00e6d6] hover:underline shrink-0"
            >
              Track
            </Link>
            <Button
              size="icon"
              variant="ghost"
              aria-label="End walk"
              onClick={() => setPinOpen(true)}
              className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      <Dialog open={pinOpen} onOpenChange={o => !busy && setPinOpen(o)}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">End your walk</DialogTitle>
          </DialogHeader>
          <DuressPinPad
            title="Enter your safe PIN"
            hint="Under threat? Enter your duress PIN instead — contacts are alerted silently."
            submitting={busy}
            onSubmit={handlePin}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActiveWalkBar;
