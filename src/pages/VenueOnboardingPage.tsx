import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, MapPin, Upload, ShieldCheck, Building2, Sparkles, X, Loader2, LocateFixed, PartyPopper } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DRAFT_KEY = 'scene:venue-onboarding-draft';

const STEPS = [
  { id: 1, key: 'business', label: 'Business & Owner' },
  { id: 2, key: 'geofence', label: 'Location & Proof' },
];

const TAG_OPTIONS = ['Nightclub', 'Lounge', 'Bar', 'Rooftop', 'Techno', 'House', 'R&B', 'Amapiano', 'Hip-Hop', 'Afrobeats', 'Mix', 'Live Music'];
const ROLE_OPTIONS = ['Owner', 'Co-Owner', 'General Manager', 'Marketing Manager', 'Promoter', 'Other'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s()-]{9,16}$/;

const NeonField = ({
  label, value, onChange, placeholder, type = 'text', error,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string | null }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">{label}</label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      aria-invalid={!!error}
      className={`h-11 rounded-xl bg-black/50 border-white/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary/60 focus-visible:shadow-[0_0_20px_hsl(var(--primary)/0.25)] transition-all ${error ? 'border-destructive/60' : ''}`}
    />
    {error && <p role="alert" className="text-[11px] text-rose-400">{error}</p>}
  </div>
);

const VenueOnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTouched, setShowTouched] = useState(false);
  const [done, setDone] = useState(false);

  // Target venue (when arriving from a venue profile "Claim This Venue" CTA)
  const [venueId, setVenueId] = useState<string | null>(null);

  // Step 1 — business + owner
  const [venueName, setVenueName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rolePosition, setRolePosition] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Step 2 — location + proof
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState<number[]>([100]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [docPath, setDocPath] = useState<string | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const hydrated = useRef(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    headingRef.current?.focus();
    setAnnounce(`Step ${step} of ${STEPS.length}: ${STEPS[step - 1].label}`);
    setShowTouched(false);
  }, [step]);

  // ---------- Hydrate from localStorage ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setStep(Math.min(d.step ?? 1, STEPS.length));
        setVenueName(d.venueName ?? '');
        setLegalName(d.legalName ?? '');
        setFullName(d.fullName ?? '');
        setEmail(d.email ?? '');
        setPhone(d.phone ?? '');
        setRolePosition(d.rolePosition ?? '');
        setTags(d.tags ?? []);
        setAddress(d.address ?? '');
        setRadius([d.radius ?? 100]);
        setCoords(d.coords ?? null);
        setClaimId(d.claimId ?? null);
        setDocPath(d.docPath ?? null);
        setDocName(d.docName ?? null);
        setNotes(d.notes ?? '');
        setVenueId(d.venueId ?? null);
      }
    } catch { /* ignore */ }
    // A venue passed in the URL always wins over the stored draft
    const qId = params.get('venue');
    const qName = params.get('name');
    const qAddress = params.get('address');
    if (qId) setVenueId(qId);
    if (qName) setVenueName(qName);
    if (qAddress) setAddress(qAddress);
    hydrated.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Persist draft locally ----------
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      step, venueName, legalName, fullName, email, phone, rolePosition, tags,
      address, radius: radius[0], coords, claimId, docPath, docName, notes, venueId,
    }));
  }, [step, venueName, legalName, fullName, email, phone, rolePosition, tags, address, radius, coords, claimId, docPath, docName, notes, venueId]);

  // ---------- Cloud persistence ----------
  const persistDraft = async (status: 'draft' | 'pending_approval' = 'draft') => {
    if (!user) return null;
    const payload = {
      user_id: user.id,
      venue_id: venueId,
      venue_name: venueName.trim() || 'Untitled venue',
      legal_name: legalName.trim() || null,
      full_name: fullName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      role_position: rolePosition || null,
      notes: notes.trim() || null,
      tags,
      address: address.trim() || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      radius_m: radius[0],
      geofence_verified: !!coords,
      verification_method: docPath ? 'document' : 'notes',
      document_url: docPath,
      document_name: docName,
      status,
      step,
    } as any;
    setSaving(true);
    try {
      if (claimId) {
        const { error } = await supabase.from('venue_claims').update(payload).eq('id', claimId);
        if (error) throw error;
        return claimId;
      }
      const { data, error } = await supabase.from('venue_claims').insert(payload).select('id').single();
      if (error) throw error;
      setClaimId(data.id);
      return data.id as string;
    } catch (e: any) {
      console.error('[claim] save error', e);
      toast.error(e.message || 'Could not save your claim — please try again.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ---------- Geolocation ----------
  const detectLocation = () => {
    if (!('geolocation' in navigator)) { setGeoError('Geolocation not supported by this browser.'); return; }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success('📍 Geofence pinned to your current position');
      },
      (err) => {
        setLocating(false);
        setGeoError(err.message || 'Could not access location');
        toast.error('Location permission denied');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  // ---------- Document upload ----------
  const handleFile = async (f: File | null) => {
    setFile(f);
    if (!f) { setDocPath(null); setDocName(null); return; }
    if (!user) { toast.error('Sign in to upload your document'); navigate('/auth'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); setFile(null); return; }
    if (!(f.type.startsWith('image/') || f.type === 'application/pdf')) {
      toast.error('Only images or PDF files are accepted'); setFile(null); return;
    }
    setUploading(true);
    try {
      const ext = f.name.split('.').pop() || 'bin';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('venue-docs').upload(path, f, { upsert: false, contentType: f.type });
      if (error) throw error;
      setDocPath(path);
      setDocName(f.name);
      toast.success('📄 Document uploaded securely');
    } catch (e: any) {
      console.error('[claim] upload error', e);
      toast.error(e.message || 'Upload failed');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  // ---------- Validation ----------
  const errors = {
    venueName: venueName.trim().length < 2 ? 'Venue name is required' : null,
    legalName: legalName.trim().length < 2 ? 'Registered business name is required' : null,
    fullName: fullName.trim().length < 3 ? 'Your full name is required' : null,
    email: !EMAIL_RE.test(email.trim()) ? 'Enter a valid business email' : null,
    phone: !PHONE_RE.test(phone.trim()) ? 'Enter a valid mobile number' : null,
    rolePosition: !rolePosition ? 'Select your role at the venue' : null,
    tags: tags.length === 0 ? 'Pick at least one tag' : null,
    address: address.trim().length < 5 ? 'Enter the full street address' : null,
    coords: !coords ? 'Pin the venue location to set the geofence' : null,
    proof: !docPath && notes.trim().length < 20 ? 'Upload a document or write at least 20 characters of proof notes' : null,
  };
  const step1Valid = !errors.venueName && !errors.legalName && !errors.fullName && !errors.email && !errors.phone && !errors.rolePosition && !errors.tags;
  const step2Valid = !errors.address && !errors.coords && !errors.proof && !uploading;
  const canContinue = step === 1 ? step1Valid : step2Valid;
  const err = (k: keyof typeof errors) => (showTouched ? errors[k] : null);

  const handleNext = async () => {
    if (!user) { toast.error('Sign in to save your claim'); navigate('/auth'); return; }
    if (!canContinue) { setShowTouched(true); toast.error('Please complete every field before continuing.'); return; }
    if (step < STEPS.length) {
      await persistDraft('draft');
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    const id = await persistDraft('pending_approval');
    setSubmitting(false);
    if (!id) return;
    localStorage.removeItem(DRAFT_KEY);
    setDone(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-black border border-white/10 overflow-hidden shadow-2xl">
          <span className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <span className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

          {/* Progress */}
          <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-primary font-bold">Venue Manager Onboarding</p>
                <h1 className="font-display text-2xl font-bold text-white mt-0.5">Claim your business on SCENE</h1>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                {saving ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{saving ? 'Saving…' : 'Free · 48h review'}</span>
              </div>
            </div>

            <p className="sr-only" role="status" aria-live="polite">{announce}</p>
            <div
              className="flex items-center gap-2"
              role="progressbar"
              aria-label="Onboarding progress"
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={step}
              aria-valuetext={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1].label}`}
            >
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
                    <Building2 className="w-5 h-5" aria-hidden="true" />
                    <h2 ref={headingRef} tabIndex={-1} className="font-display text-lg font-bold text-white outline-none">Business &amp; owner details</h2>
                  </div>

                  {venueId && (
                    <p className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2">
                      You're claiming an existing SCENE listing — {venueName || 'this venue'}.
                    </p>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <NeonField label="Venue Name" value={venueName} onChange={setVenueName} placeholder="e.g. Skybar Rooftop" error={err('venueName')} />
                    <NeonField label="Legal Entity Name" value={legalName} onChange={setLegalName} placeholder="Registered company name" error={err('legalName')} />
                    <NeonField label="Your Full Name" value={fullName} onChange={setFullName} placeholder="e.g. Thabo Nkosi" error={err('fullName')} />
                    <NeonField label="Business Email" value={email} onChange={setEmail} placeholder="owner@venue.com" type="email" error={err('email')} />
                    <NeonField label="Mobile Number" value={phone} onChange={setPhone} placeholder="+27 82 000 0000" type="tel" error={err('phone')} />
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold" htmlFor="role-position">Role / Position at Venue</label>
                      <select
                        id="role-position"
                        value={rolePosition}
                        onChange={(e) => setRolePosition(e.target.value)}
                        className={`w-full h-11 rounded-xl bg-black/50 border border-white/10 px-3 text-sm text-foreground focus:outline-none focus:border-primary/60 ${err('rolePosition') ? 'border-destructive/60' : ''}`}
                      >
                        <option value="">Select your role…</option>
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {err('rolePosition') && <p role="alert" className="text-[11px] text-rose-400">{errors.rolePosition}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span id="tags-label" className="block text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Venue Tags &amp; Genres</span>
                    <div className="flex flex-wrap gap-2" role="group" aria-labelledby="tags-label">
                      {TAG_OPTIONS.map((t) => {
                        const active = tags.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            aria-pressed={active}
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
                    {err('tags') && <p role="alert" className="text-[11px] text-rose-400">{errors.tags}</p>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="w-5 h-5" aria-hidden="true" />
                    <h2 ref={headingRef} tabIndex={-1} className="font-display text-lg font-bold text-white outline-none">Location &amp; proof of ownership</h2>
                  </div>
                  <NeonField label="Physical Address" value={address} onChange={setAddress} placeholder="Street, City, Country" error={err('address')} />

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={detectLocation}
                      disabled={locating}
                      aria-label={coords ? 'Re-pin geofence to my current location' : 'Use my current location to pin the geofence'}
                      className="rounded-full bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 h-9 px-4 gap-2"
                    >
                      {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {coords ? 'Re-pin location' : 'Use my current location'}
                      </span>
                    </Button>
                    {coords && (
                      <span className="text-[10px] text-emerald-300 font-mono">
                        ✓ {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                      </span>
                    )}
                  </div>
                  {(geoError || err('coords')) && <p role="alert" className="text-[11px] text-rose-400">{geoError || errors.coords}</p>}

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

                  <label className="block cursor-pointer">
                    <div className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                      file ? 'border-primary/60 bg-primary/5' : 'border-white/15 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/[0.03]'
                    }`}>
                      <input
                        type="file"
                        className="sr-only"
                        aria-label="Upload proof of ownership document (image or PDF, max 10MB)"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFile(e.target.files?.[0] || null)}
                      />
                      {uploading
                        ? <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" aria-hidden="true" />
                        : <Upload className="w-8 h-8 mx-auto mb-2 text-primary" strokeWidth={1.5} aria-hidden="true" />}
                      {uploading ? (
                        <p className="text-sm font-semibold text-foreground">Uploading securely…</p>
                      ) : file ? (
                        <div>
                          <p className="text-sm font-semibold text-foreground">{file.name}</p>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleFile(null); }}
                            aria-label={`Remove uploaded document ${file.name}`}
                            className="mt-1 text-[11px] text-muted-foreground hover:text-secondary inline-flex items-center gap-1"
                          >
                            <X className="w-3 h-3" aria-hidden="true" /> Remove
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

                  <div className="space-y-1.5">
                    <label htmlFor="claim-notes" className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Proof / Notes for our team</label>
                    <Textarea
                      id="claim-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tell us how you're connected to this venue — company registration number, social handles we can check, anything that speeds up review."
                      className="min-h-[100px] rounded-xl bg-black/50 border-white/10 text-sm"
                    />
                    {err('proof') && <p role="alert" className="text-[11px] text-rose-400">{errors.proof}</p>}
                  </div>

                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Our admin team reviews every claim manually — usually within 48 hours.
                  </p>
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
              disabled={submitting || uploading}
              className="rounded-full gradient-primary text-primary-foreground font-semibold px-6 shadow-[0_0_20px_hsl(var(--primary)/0.4)] disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {step === STEPS.length ? (submitting ? 'Submitting…' : 'Submit Claim') : 'Continue'} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>

      <Dialog open={done} onOpenChange={(o) => { if (!o) { setDone(false); navigate('/'); } }}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="w-14 h-14 rounded-2xl grid place-items-center bg-emerald-500/15 border border-emerald-400/40 mb-2">
              <PartyPopper className="w-7 h-7 text-emerald-300" />
            </div>
            <DialogTitle className="font-display text-xl">Claim Submitted!</DialogTitle>
            <DialogDescription>
              Our admin team will review your application for <span className="text-foreground font-semibold">{venueName}</span> shortly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => { setDone(false); navigate('/'); }} className="rounded-full gradient-primary text-primary-foreground px-6">
              Back to SCENE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueOnboardingPage;
