import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistanceToNow } from 'date-fns';
import {
  Check,
  Clock3,
  Copy,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  Radio,
  Share2,
  Shield,
  Siren,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import sceneLogo from '@/assets/scene-logo.jpg';
import Animated3DEmoji from '@/components/ui/Animated3DEmoji';
import DestinationPicker, { type Destination } from '@/components/safety/DestinationPicker';
import { LogoSkeleton } from '@/components/BrandedSkeleton';
import {
  triggerLocalSafetyAlert,
  useActiveSafetySession,
  useEndSafetySession,
  useSetSafetyAlert,
  useStartSafetySession,
} from '@/hooks/useSafety';

const WALK_TIMES = [10, 15, 20, 30, 45, 60];

const walkerIcon = L.divIcon({
  className: 'safety-hud-marker',
  html: '<div style="width:22px;height:22px;border:3px solid white;border-radius:50%;background:#10b981;box-shadow:0 0 22px rgba(16,185,129,.9)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const FollowWalker = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true, duration: 0.5 });
  }, [lat, lng, map]);
  return null;
};

const SafetyPage = () => {
  const { user } = useAuth();
  const { data: active, isLoading: activeLoading } = useActiveSafetySession();
  const start = useStartSafetySession();
  const end = useEndSafetySession();
  const setAlert = useSetSafetyAlert();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [walkMinutes, setWalkMinutes] = useState(20);
  const [now, setNow] = useState(Date.now());
  const activeId = active?.id;

  useEffect(() => {
    if (!activeId) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeId]);

  const trackingUrl = active ? `${window.location.origin}/track/${active.share_token}` : '';
  const remainingSeconds = useMemo(() => {
    if (!active) return 0;
    const startedAt = new Date(active.started_at).getTime();
    const expiresAt = startedAt + active.eta_minutes * 60_000;
    return Math.max(0, Math.ceil((expiresAt - now) / 1000));
  }, [active, now]);
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
    remainingSeconds % 60,
  ).padStart(2, '0')}`;

  const startWalk = async () => {
    if (!destination) {
      toast.error('Choose your destination on the map first');
      return;
    }
    if (!('geolocation' in navigator)) {
      toast.error('This device does not support location tracking');
      return;
    }
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
        }),
      );
      await start.mutateAsync({
        destination_name: destination.label.trim() || 'Destination',
        start_lat: position.coords.latitude,
        start_lng: position.coords.longitude,
        eta_minutes: walkMinutes,
      });
      toast.success('Your safety walk is live');
    } catch (error) {
      toast.error((error as Error).message || 'Could not start your safety walk');
    }
  };

  const shareViaWhatsApp = () => {
    if (!active) return;
    const destinationName = active.destination_name || 'my destination';
    const message = `I'm walking to ${destinationName}. Follow my live location: ${trackingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const shareViaDevice = async () => {
    if (!active) return;
    const shareData = {
      title: 'Walk Me Home',
      text: `I'm walking to ${active.destination_name || 'my destination'}. Follow my live location:`,
      url: trackingUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          toast.error((error as Error).message || 'Could not open device sharing');
        }
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success('Device sharing is unavailable here. Link copied instead.');
    } catch (error) {
      toast.error((error as Error).message || 'Could not share or copy the tracking link');
    }
  };

  const copyTrackingLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success('Tracking link copied');
    } catch (error) {
      toast.error((error as Error).message || 'Could not copy the tracking link');
    }
  };

  const panic = async () => {
    if (!active || active.status === 'panic_alert') return;
    triggerLocalSafetyAlert();
    try {
      await setAlert.mutateAsync(active);
      toast.error('Help alert activated. Your shared tracking page now shows the alert.');
    } catch (error) {
      toast.error(`Could not activate help alert: ${(error as Error).message}`);
    }
  };

  const arriveSafely = async () => {
    if (!active) return;
    try {
      await end.mutateAsync(active);
      toast.success('Walk completed. Glad you made it safely.');
    } catch (error) {
      toast.error(`Could not finish the walk: ${(error as Error).message}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-[#070b0a] text-white">
        <Navbar />
        <main className="relative isolate mx-auto flex min-h-screen w-full max-w-lg items-center justify-center overflow-hidden px-4 pb-16 pt-24 text-center">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden">
            <div className="absolute h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.12),rgba(217,70,239,0.06)_48%,transparent_72%)] blur-3xl md:h-96 md:w-96" />
            <img src={sceneLogo} alt="" className="h-72 w-72 object-contain opacity-[0.06] md:h-96 md:w-96" />
          </div>
          <section className="relative z-10 w-full rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <img
              src={sceneLogo}
              alt="SCENE"
              className="mx-auto mb-5 h-20 w-20 rounded-2xl border border-cyan-300/30 object-cover shadow-[0_0_28px_rgba(6,182,212,0.28)]"
            />
            <h1 className="text-2xl font-black tracking-tight">Walk Me Home</h1>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Sign in to start a private live safety walk.
            </p>
            <Link to="/auth" className="mt-6 block w-full">
              <Button className="h-12 w-full rounded-2xl bg-cyan-500 py-3.5 px-8 font-bold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] hover:bg-cyan-400 active:scale-[0.98]">
                Sign in to continue
              </Button>
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#070b0a] text-white">
      <Navbar />
      <main className="w-full max-w-md mx-auto px-4 pt-24 pb-12">
        {activeLoading ? (
          <LogoSkeleton label="Checking your safety status…" className="min-h-48" />
        ) : !active ? (
          <section className="w-full space-y-5">
            <header className="flex min-w-0 items-center gap-3 py-1">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,.12)]">
                <Shield className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300/75">
                  Personal safety
                </p>
                <h1 className="truncate text-2xl font-black tracking-tight">Walk Me Home</h1>
              </div>
            </header>

            <div className="w-full min-w-0 rounded-3xl border border-white/[0.09] bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-emerald-300" />
                <h2 className="text-sm font-bold">Where are you headed?</h2>
              </div>
              <DestinationPicker value={destination} onChange={setDestination} />
              <label htmlFor="destination-name" className="mt-4 block text-xs font-semibold text-white/55">
                Destination name
              </label>
              <Input
                id="destination-name"
                value={destination?.label ?? ''}
                onChange={(event) =>
                  destination && setDestination({ ...destination, label: event.target.value })
                }
                disabled={!destination}
                placeholder="Home, hotel, or a friend's place"
                className="mt-1.5 h-11 w-full min-w-0 rounded-xl border-white/10 bg-black/25 text-white placeholder:text-white/30 focus-visible:ring-emerald-400/50"
              />
            </div>

            <div className="w-full min-w-0 rounded-3xl border border-white/[0.09] bg-white/[0.035] p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-emerald-300" />
                <h2 className="text-sm font-bold">Estimated walk time</h2>
              </div>
              <div className="grid w-full grid-cols-3 gap-2">
                {WALK_TIMES.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={walkMinutes === minutes}
                    onClick={() => setWalkMinutes(minutes)}
                    className={`h-10 min-w-0 rounded-xl border text-sm font-bold transition-colors ${
                      walkMinutes === minutes
                        ? 'border-emerald-300/50 bg-emerald-300 text-emerald-950'
                        : 'border-white/10 bg-black/20 text-white/65 hover:border-white/25'
                    }`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={startWalk}
              disabled={start.isPending}
              className="h-14 w-full rounded-2xl bg-emerald-400 text-base font-black tracking-wide text-emerald-950 shadow-[0_0_32px_rgba(16,185,129,.25)] transition-shadow hover:bg-emerald-300 hover:shadow-[0_0_42px_rgba(16,185,129,.36)] disabled:opacity-60"
            >
              <Shield className="mr-2 h-5 w-5" />
              {start.isPending ? 'Starting your walk…' : 'Start Walk'}
            </Button>
            <p className="px-2 text-center text-[11px] leading-5 text-white/35">
              Your live location is shared only with people you send your private link to.
            </p>
          </section>
        ) : (
          <section className="w-full min-w-0 space-y-4">
            <header className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300">
                  {active.status === 'panic_alert' ? (
                    <Siren className="h-5 w-5 text-rose-400" />
                  ) : (
                    <Radio className="h-5 w-5" />
                  )}
                  {active.status === 'active' && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className={`truncate text-[10px] font-black uppercase tracking-[0.2em] ${active.status === 'panic_alert' ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {active.status === 'panic_alert' ? 'Help alert active' : 'Safety walk active'}
                  </p>
                  <h1 className="truncate text-base font-bold">{active.destination_name || 'Your destination'}</h1>
                </div>
              </div>
              <Link
                to={`/track/${active.share_token}`}
                className="shrink-0 text-xs font-bold text-emerald-300 underline-offset-4 hover:underline"
              >
                Live link
              </Link>
            </header>

            <div className="relative h-[min(42vh,360px)] min-h-[250px] w-full min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1110] shadow-[0_16px_50px_rgba(0,0,0,.4)]">
              {active.current_lat != null && active.current_lng != null ? (
                <MapContainer
                  center={[active.current_lat, active.current_lng]}
                  zoom={16}
                  className="h-full w-full"
                  zoomControl={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap, &copy; CARTO"
                  />
                  <Polyline
                    positions={[[active.start_lat, active.start_lng], [active.current_lat, active.current_lng]]}
                    pathOptions={{ color: '#10b981', weight: 4, opacity: 0.75, dashArray: '7 8' }}
                  />
                  <Marker position={[active.current_lat, active.current_lng]} icon={walkerIcon}>
                    <Tooltip permanent direction="top" offset={[0, -12]}>You · live</Tooltip>
                  </Marker>
                  <FollowWalker lat={active.current_lat} lng={active.current_lng} />
                </MapContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-white/45">
                  <LocateFixed className="h-6 w-6 text-emerald-300" />
                  <span className="text-sm">Waiting for your location…</span>
                </div>
              )}
              <div className="pointer-events-none absolute left-3 top-3 z-[500] flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/10 bg-[#07100d]/85 px-3 py-1.5 text-[10px] font-bold text-emerald-200 backdrop-blur-md">
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-300" />
                <span className="truncate">
                  {active.current_lat != null && active.current_lng != null
                    ? `Updated ${formatDistanceToNow(new Date(active.last_ping_at), { addSuffix: true })}`
                    : 'Getting live location'}
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 backdrop-blur-xl">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Walk countdown</p>
                <p className={`mt-0.5 font-mono text-3xl font-black tabular-nums ${remainingSeconds === 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {countdown}
                </p>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Destination</p>
                <p className="mt-1 max-w-36 truncate text-sm font-semibold text-white/80">
                  <MapPin className="mr-1 inline h-3.5 w-3.5 text-rose-300" />
                  {active.destination_name || 'Destination'}
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2.5">
              <Button
                onClick={shareViaWhatsApp}
                className="h-12 min-w-0 rounded-xl bg-[#25D366] px-2 text-sm font-black text-[#062c16] hover:bg-[#55e487]"
              >
                <MessageCircle className="mr-1.5 h-4 w-4 shrink-0" />
                <span className="truncate">Share on WhatsApp</span>
              </Button>
              <Button
                onClick={shareViaDevice}
                variant="outline"
                className="h-12 min-w-0 rounded-xl border-emerald-300/30 bg-emerald-300/[0.08] px-2 text-sm font-bold text-emerald-100 hover:bg-emerald-300/[0.15]"
              >
                <Share2 className="mr-1.5 h-4 w-4 shrink-0" />
                <span className="truncate">Share via Device</span>
              </Button>
            </div>
            <Button
              onClick={copyTrackingLink}
              variant="outline"
              className="h-11 w-full rounded-xl border-white/10 bg-white/[0.035] font-semibold text-white/75 hover:bg-white/[0.08]"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy tracking link
            </Button>

            <Button
              onClick={panic}
              disabled={active.status === 'panic_alert' || setAlert.isPending}
              className="h-14 w-full rounded-2xl border border-rose-300/25 bg-rose-500/[0.12] text-base font-black tracking-wide text-rose-300 shadow-[0_0_24px_rgba(244,63,94,.08)] hover:bg-rose-500/20 disabled:opacity-70"
            >
              <Siren className="mr-2 h-5 w-5" />
              {active.status === 'panic_alert' ? 'HELP ALERT IS ACTIVE' : 'PANIC / NEED HELP'}
            </Button>
            <Button
              onClick={arriveSafely}
              disabled={end.isPending}
              className="h-14 w-full rounded-2xl bg-emerald-300 text-base font-black text-emerald-950 shadow-[0_0_28px_rgba(16,185,129,.2)] hover:bg-emerald-200 disabled:opacity-60"
            >
              <Check className="mr-2 h-5 w-5" />
              {end.isPending ? 'Finishing walk…' : 'I Arrived Safely'}
            </Button>
          </section>
        )}
      </main>
    </div>
  );
};

export default SafetyPage;
