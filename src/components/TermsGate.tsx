import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, FileText, ShieldCheck, Check } from 'lucide-react';
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
          className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-cyan-500/25 bg-slate-950/95 p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)] backdrop-blur-2xl"
        >
          <div className="relative isolate space-y-4 text-center">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-6 -z-10 h-28 w-28 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#D946EF]/20 to-[#06B6D4]/20 blur-2xl"
            />
            <div className="relative mx-auto w-fit rounded-2xl border border-cyan-400/40 p-2 shadow-lg shadow-cyan-500/20">
              <img src={logoUrl} alt="SCENE" className="h-14 w-14 rounded-xl" />
            </div>
            <h2 className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-2xl font-black tracking-wide text-transparent">
              Step Into The Night
            </h2>
            <p className="text-sm text-slate-300">
              To keep our nightlife community safe and vibrant, please confirm your entry requirements.
            </p>
          </div>

          <div className="mt-7 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
              <p className="text-slate-300">
                <span className="font-semibold text-white">18+ Verified:</span> You are at least 18 years old and agree to party responsibly.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-400" />
              <p className="text-slate-300">
                <span className="font-semibold text-white">Guidelines:</span> You agree to our{' '}
                <Link to="/terms" className="text-cyan-400 underline hover:text-cyan-300">Terms of Service</Link>
                {' and '}
                <Link to="/privacy" className="text-cyan-400 underline hover:text-cyan-300">Privacy Policy</Link>.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
              <p className="text-slate-300">
                <span className="font-semibold text-white">Safety Code:</span> You agree to respect venue rules and support community safety.
              </p>
            </div>

            <label
              className={`flex cursor-pointer select-none items-center gap-3 rounded-2xl border p-4 transition-all ${
                agreed
                  ? 'border-cyan-400 bg-cyan-500/10 shadow-md shadow-cyan-500/20'
                  : 'border-white/15 bg-white/5 hover:bg-white/10'
              }`}
            >
              <Checkbox
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="h-5 w-5 border-cyan-400/60 data-[state=checked]:border-cyan-400 data-[state=checked]:bg-cyan-400 data-[state=checked]:text-slate-950"
              />
              <span className="text-sm font-medium text-white">I am 18+ and agree to the SCENE Code of Conduct</span>
            </label>
          </div>

          <div className="mt-6">
            <Button
              onClick={accept}
              disabled={!agreed}
              className="h-auto w-full rounded-2xl bg-cyan-400 py-4 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-colors hover:bg-cyan-300 active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              <Check className="h-4 w-4" /> Unlock SCENE Access
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TermsGate;