import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Plus, Trash2, Phone, KeyRound, Siren, Navigation } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import DestinationPicker, { type Destination } from '@/components/safety/DestinationPicker';
import {
  DURESS_PIN,
  getSafePin,
  setSafePin,
  triggerSafetyEscalation,
  useActiveSafetySession,
  useAddEmergencyContact,
  useDeleteEmergencyContact,
  useEmergencyContacts,
  useStartSafetySession,
} from '@/hooks/useSafety';

const ETAS = [10, 15, 20, 30, 45, 60];

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 space-y-3">
    {children}
  </div>
);

const SafetyPage = () => {
  const { user } = useAuth();
  const { data: contacts } = useEmergencyContacts();
  const addContact = useAddEmergencyContact();
  const delContact = useDeleteEmergencyContact();
  const { data: active } = useActiveSafetySession();
  const start = useStartSafetySession();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(getSafePin());
  const [dest, setDest] = useState<Destination | null>(null);
  const [eta, setEta] = useState(20);

  const savePin = () => {
    if (!/^\d{4}$/.test(pin)) return toast.error('PIN must be 4 digits');
    if (pin === DURESS_PIN) return toast.error(`${DURESS_PIN} is reserved as the duress PIN`);
    setSafePin(pin);
    toast.success('Safe PIN saved on this device');
  };

  const addNew = async () => {
    if (!name.trim() || !phone.trim()) return toast.error('Name and phone number required');
    try {
      await addContact.mutateAsync({ name: name.trim(), phone_number: phone.trim() });
      setName('');
      setPhone('');
      toast.success('Emergency contact added');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const startWalk = async () => {
    if (!dest) return toast.error('Pick a destination first');
    if (!getSafePin()) return toast.error('Set your 4-digit safe PIN first');
    if (!contacts?.length) return toast.error('Add at least one emergency contact');

    const begin = (lat?: number, lng?: number) =>
      start
        .mutateAsync({
          destination_lat: dest.lat,
          destination_lng: dest.lng,
          destination_label: dest.label || 'Destination',
          eta_minutes: eta,
          current_lat: lat ?? null,
          current_lng: lng ?? null,
        })
        .then(() => toast.success('Walk Me Home is live — share your track link'))
        .catch(e => toast.error((e as Error).message));

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        p => begin(p.coords.latitude, p.coords.longitude),
        () => begin(),
        { enableHighAccuracy: true, timeout: 12000 },
      );
    } else {
      begin();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <main className="pt-24 pb-28 px-4 max-w-lg mx-auto text-center space-y-4">
          <Shield className="w-10 h-10 mx-auto text-[#00e6d6]" />
          <h1 className="text-2xl font-black">Walk Me Home</h1>
          <p className="text-white/60 text-sm">Sign in to set up live safety tracking and emergency contacts.</p>
          <Link to="/auth"><Button className="bg-[#00e6d6] text-black font-bold hover:bg-[#00c9bb]">Sign in</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <main className="pt-24 pb-32 px-4 max-w-lg mx-auto space-y-4">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00e6d6]" />
            <h1 className="text-2xl font-black tracking-tight">Walk Me Home</h1>
          </div>
          <p className="text-white/55 text-sm">
            Live location tracking with automatic alerts if you stop moving or trigger duress.
          </p>
        </motion.header>

        {active && (
          <div className="rounded-2xl border border-[#00e6d6]/40 bg-[#00e6d6]/10 p-4 text-sm">
            <div className="font-bold text-[#00e6d6] mb-1">A walk is already running</div>
            <p className="text-white/70 text-xs mb-3">Share this link so someone can watch you get home.</p>
            <div className="flex gap-2">
              <Link to={`/track/${active.id}`} className="flex-1">
                <Button className="w-full bg-[#00e6d6] text-black font-bold hover:bg-[#00c9bb]">Open track page</Button>
              </Link>
              <Button
                variant="outline"
                className="border-white/15 bg-transparent"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/track/${active.id}`);
                  toast.success('Track link copied');
                }}
              >
                Copy link
              </Button>
            </div>
          </div>
        )}

        {/* Emergency contacts */}
        <Card>
          <div className="flex items-center gap-2 text-sm font-bold">
            <Phone className="w-4 h-4 text-[#ff2e93]" /> Emergency contacts
          </div>
          <div className="space-y-2">
            {(contacts ?? []).map(c => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-[11px] text-white/50">{c.phone_number}</div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${c.name}`}
                  onClick={() => delContact.mutate(c.id)}
                  className="h-8 w-8 text-white/50 hover:text-[#ff2e93]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {!contacts?.length && <p className="text-xs text-white/45">No contacts yet — add at least one.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="c-name" className="text-[11px] text-white/60">Name</Label>
              <Input id="c-name" value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10" placeholder="Sis Thandi" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-phone" className="text-[11px] text-white/60">Phone</Label>
              <Input id="c-phone" value={phone} onChange={e => setPhone(e.target.value)} className="bg-white/5 border-white/10" placeholder="+2771234567" />
            </div>
          </div>
          <Button onClick={addNew} disabled={addContact.isPending} className="w-full bg-white/10 hover:bg-white/15">
            <Plus className="w-4 h-4 mr-1" /> Add contact
          </Button>
        </Card>

        {/* PIN */}
        <Card>
          <div className="flex items-center gap-2 text-sm font-bold">
            <KeyRound className="w-4 h-4 text-[#facc15]" /> Safe &amp; duress PIN
          </div>
          <p className="text-[11px] text-white/50">
            Your safe PIN ends a walk normally. Entering <span className="text-[#ff2e93] font-bold">{DURESS_PIN}</span> (or a wrong PIN)
            ends the walk on screen but silently alerts your contacts.
          </p>
          <div className="flex gap-2">
            <Input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="4-digit PIN"
              aria-label="Safe PIN"
              className="bg-white/5 border-white/10 tracking-[0.4em]"
            />
            <Button onClick={savePin} className="bg-[#facc15] text-black font-bold hover:bg-[#eab308]">Save</Button>
          </div>
        </Card>

        {/* Start walk */}
        <Card>
          <div className="flex items-center gap-2 text-sm font-bold">
            <Navigation className="w-4 h-4 text-[#00e6d6]" /> Destination &amp; ETA
          </div>
          <DestinationPicker value={dest} onChange={setDest} />
          <Input
            value={dest?.label ?? ''}
            onChange={e => dest && setDest({ ...dest, label: e.target.value })}
            disabled={!dest}
            placeholder="Label (e.g. Home, Res, Mom's place)"
            aria-label="Destination label"
            className="bg-white/5 border-white/10"
          />
          <div className="flex flex-wrap gap-2">
            {ETAS.map(m => (
              <button
                key={m}
                onClick={() => setEta(m)}
                className={`px-3 h-9 rounded-full text-xs font-bold border transition-all ${
                  eta === m
                    ? 'bg-[#00e6d6] text-black border-[#00e6d6]'
                    : 'bg-white/5 text-white/70 border-white/10 hover:border-white/25'
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          <Button
            onClick={startWalk}
            disabled={start.isPending || !!active}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#00e6d6] to-[#ff2e93] text-black font-black tracking-wide"
          >
            <Shield className="w-4 h-4 mr-2" />
            {active ? 'Walk already active' : 'Start Walk Me Home'}
          </Button>
        </Card>

        {active && (
          <Button
            variant="outline"
            onClick={async () => {
              await triggerSafetyEscalation(active.id, 'manual');
              toast.success('Your contacts have been alerted');
            }}
            className="w-full h-12 rounded-xl border-[#ff2e93]/50 bg-[#ff2e93]/10 text-[#ff2e93] font-black"
          >
            <Siren className="w-4 h-4 mr-2" /> Alert my contacts now
          </Button>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SafetyPage;
