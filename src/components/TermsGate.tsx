import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ShieldCheck, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import logoUrl from '@/assets/scene-logo.jpg';

const KEY = 'scene_terms_accepted_v2';

const TermsGate = () => {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== '1') setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/85 backdrop-blur-md flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          className="glass max-w-md w-full rounded-2xl border border-primary/30 shadow-2xl shadow-primary/10 overflow-hidden"
        >
          <div className="p-6 text-center space-y-3 border-b border-border/30 bg-gradient-to-b from-primary/10 to-transparent">
            <img src={logoUrl} alt="SCENE" className="w-14 h-14 mx-auto rounded-xl ring-2 ring-primary/40" />
            <h2 className="font-display font-bold text-xl text-foreground">Welcome to SCENE</h2>
            <p className="text-sm text-muted-foreground">
              Before stepping into the night, please review and agree to how we keep this community safe.
            </p>
          </div>

          <div className="p-5 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                You're 18+ and responsible for your own safety when going out.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                You agree to our{' '}
                <Link to="/terms" className="text-primary underline">Terms</Link>
                {' & '}
                <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
              </p>
            </div>

            <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
              <span className="text-foreground">I'm 18+ and I agree</span>
            </label>
          </div>

          <div className="p-4 border-t border-border/30 bg-background/40">
            <Button
              onClick={accept}
              disabled={!agreed}
              className="w-full gradient-primary text-primary-foreground gap-1.5"
            >
              <Check className="w-4 h-4" /> Enter SCENE
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TermsGate;