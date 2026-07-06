import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, MapPin, Upload, Phone, ShieldCheck, Building2, Sparkles, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

const STEPS = [
  { id: 1, key: 'business', label: 'Business Info' },
  { id: 2, key: 'geofence', label: 'Geofence & Location' },
  { id: 3, key: 'verify', label: 'Verification & Claiming' },
];

const TAG_OPTIONS = ['Nightclub', 'Lounge', 'Bar', 'Rooftop', 'Techno', 'House', 'R&B', 'Amapiano', 'Hip-Hop', 'Afrobeats', 'Mix', 'Live Music'];

const NeonField = ({
  label, value, onChange, placeholder, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">{label}</label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="h-11 rounded-xl bg-black/50 border-white/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary/60 focus-visible:shadow-[0_0_20px_hsl(var(--primary)/0.25)] transition-all"
    />
  </div>
);

const VenueOnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [venueName, setVenueName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Step 2
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState<number[]>([100]);

  // Step 3
  const [file, setFile] = useState<File | null>(null);
  const [otp, setOtp] = useState(['', '', '', '']);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const canContinue = (() => {
    if (step === 1) return venueName.trim() && legalName.trim() && email.trim() && phone.trim() && tags.length > 0;
    if (step === 2) return address.trim().length > 3;
    if (step === 3) return file !== null || otp.every((d) => d.length === 1);
    return false;
  })();

  const handleNext = () => {
    if (!canContinue) return;
    if (step < 3) return setStep(step + 1);
    toast.success('🎉 Claim submitted — SCENE will verify within 48 hours.');
    setTimeout(() => navigate('/'), 1200);
  };

  const handleOtpChange = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 1);
    const next = [...otp];
    next[i] = clean;
    setOtp(next);
    if (clean && i < 3) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-black border border-white/10 overflow-hidden shadow-2xl">
          {/* Ambient glows */}
          <span className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <span className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

          {/* Progress bar */}
          <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-primary font-bold">Venue Manager Onboarding</p>
                <h1 className="font-display text-2xl font-bold text-white mt-0.5">Claim your business on SCENE</h1>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Free · 48h review</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const isDone = step > s.id;
                const isActive = step === s.id;
                return (
                  <div key={s.id} className="flex-1 flex items-center gap-2 min-w-0">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        boxShadow: isActive ? '0 0 22px hsl(var(--primary) / 0.55)' : '0 0 0px hsl(var(--primary) / 0)',
                      }}
                      className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border ${
                        isDone
                          ? 'bg-primary text-primary-foreground border-primary'
                          : isActive
                          ? 'bg-primary/20 text-primary border-primary'
                          : 'bg-white/5 text-muted-foreground border-white/10'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : s.id}
                    </motion.div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider truncate ${isActive ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 h-px bg-white/10 relative overflow-hidden mx-1">
                        <motion.span
                          initial={false}
                          animate={{ scaleX: step > s.id ? 1 : 0 }}
                          className="absolute inset-0 origin-left bg-gradient-to-r from-primary to-secondary"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step content */}
          <div className="relative p-6 min-h-[420px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="flex items-center gap-2 text-primary">
                    <Building2 className="w-5 h-5" />
                    <h2 className="font-display text-lg font-bold text-white">Business details</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <NeonField label="Venue Name" value={venueName} onChange={setVenueName} placeholder="e.g. Skybar Rooftop" />
                    <NeonField label="Legal Entity Name" value={legalName} onChange={setLegalName} placeholder="Registered company name" />
                    <NeonField label="Business Email" value={email} onChange={setEmail} placeholder="owner@venue.com" type="email" />
                    <NeonField label="Business Phone" value={phone} onChange={setPhone} placeholder="+27 82 000 0000" type="tel" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Venue Tags & Genres</label>
                    <div className="flex flex-wrap gap-2">
                      {TAG_OPTIONS.map((t) => {
                        const active = tags.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              active
                                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_16px_hsl(var(--primary)/0.35)]'
                                : 'bg-white/[0.03] border-white/10 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                          >
                            {active && <Check className="w-3 h-3 inline mr-1" />}
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-5 h-5" />
                    <h2 className="font-display text-lg font-bold text-white">Geofence & precise location</h2>
                  </div>
                  <NeonField label="Physical Address" value={address} onChange={setAddress} placeholder="Street, City, Country" />

                  {/* Dark-mode map placeholder */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 h-56 bg-slate-950">
                    <div className="absolute inset-0 opacity-40" style={{
                      backgroundImage: 'linear-gradient(hsl(var(--primary)/0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.15) 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                    }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
                    {/* pin + radius */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        style={{ width: `${Math.max(60, radius[0] * 1.4)}px`, height: `${Math.max(60, radius[0] * 1.4)}px` }}
                        className="rounded-full bg-primary/15 border border-primary/40 backdrop-blur-sm"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_hsl(var(--primary))]" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] text-white/70 font-mono">
                      DARK · LIVE MAP
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl p-4 bg-white/[0.02] border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Real-Time Tracking Radius</p>
                        <p className="text-[11px] text-muted-foreground">Geofence for accurate check-ins</p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary text-sm font-bold font-mono">
                        {radius[0]}m
                      </div>
                    </div>
                    <Slider value={radius} onValueChange={setRadius} min={50} max={200} step={10} />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                      <span>50m</span><span>200m</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="w-5 h-5" />
                    <h2 className="font-display text-lg font-bold text-white">Verification & claiming</h2>
                  </div>

                  <label className="block cursor-pointer">
                    <div className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                      file ? 'border-primary/60 bg-primary/5' : 'border-white/15 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/[0.03]'
                    }`}>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      <Upload className="w-8 h-8 mx-auto mb-2 text-primary" strokeWidth={1.5} />
                      {file ? (
                        <div>
                          <p className="text-sm font-semibold text-foreground">{file.name}</p>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setFile(null); }}
                            className="mt-1 text-[11px] text-muted-foreground hover:text-secondary inline-flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-foreground">Upload proof of ownership</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Business License · Liquor License · PDF or Image</p>
                        </>
                      )}
                    </div>
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">OR</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="rounded-2xl p-4 bg-gradient-to-br from-secondary/10 to-primary/5 border border-secondary/25 space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-secondary" />
                      <p className="text-sm font-semibold text-white">Fast-Track Phone Verification</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Enter the 4-digit code we sent to your business phone.</p>
                    <div className="flex gap-2 justify-center py-1">
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          value={d}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          inputMode="numeric"
                          maxLength={1}
                          className="w-12 h-14 rounded-xl bg-black/50 border border-white/10 text-center text-2xl font-bold font-mono text-white focus:outline-none focus:border-secondary focus:shadow-[0_0_18px_hsl(var(--secondary)/0.35)] transition-all"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <div className="relative flex items-center justify-between gap-3 px-6 py-4 border-t border-white/5 bg-black/30">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="rounded-full border-white/15 bg-white/[0.03] text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
              Step {step} of {STEPS.length}
            </div>
            <Button
              onClick={handleNext}
              disabled={!canContinue}
              className={`rounded-full gradient-primary text-primary-foreground font-semibold px-6 shadow-[0_0_20px_hsl(var(--primary)/0.4)] disabled:opacity-40 disabled:shadow-none`}
            >
              {step === 3 ? 'Submit Claim' : 'Continue'} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VenueOnboardingPage;