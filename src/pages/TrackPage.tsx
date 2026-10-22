import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Shield, Siren } from 'lucide-react';
import scenePinLogo from '@/assets/logo.png';
import { usePublicSafetySession } from '@/hooks/useSafety';
import { LogoSkeleton } from '@/components/BrandedSkeleton';

const walkerIcon = L.divIcon({
  className: 'scene-logo-marker',
  html: `<div class="relative flex h-10 w-10 items-center justify-center">
    <div class="absolute -inset-2 animate-ping rounded-full bg-cyan-500/30"></div>
    <div class="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-cyan-400 bg-slate-950 p-1 shadow-[0_0_20px_rgba(6,182,212,0.6)]">
      <img src="${scenePinLogo}" alt="SCENE" class="h-full w-full object-contain" />
    </div>
    <div class="absolute -bottom-1 h-2 w-2 rotate-45 bg-cyan-400"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const Follow = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true });
  }, [lat, lng, map]);
  return null;
};

const TrackPage = () => {
  const { token: shareToken } = useParams();
  const { session, loading, notFound } = usePublicSafetySession(shareToken);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-4 pt-24">
        <LogoSkeleton label="Loading live track…" className="mx-auto max-w-xl" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-3 text-center px-6">
        <Shield className="w-10 h-10 text-white/30" />
        <h1 className="text-xl font-black text-white">Track link unavailable</h1>
        <p className="text-white/50 text-sm">This walk could not be found.</p>
      </div>
    );
  }

  const current: [number, number] = [
    session.current_lat ?? session.start_lat,
    session.current_lng ?? session.start_lng,
  ];
  const start: [number, number] = [session.start_lat, session.start_lng];
  const alerted = session.status === 'panic_alert';
  const completed = session.status === 'completed';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <header
        className={`px-4 py-3 border-b ${
          alerted ? 'bg-[#ff2e93]/15 border-[#ff2e93]/40' : 'bg-white/[0.03] border-white/10'
        }`}
      >
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {alerted ? <Siren className="w-5 h-5 text-[#ff2e93]" /> : <Shield className="w-5 h-5 text-[#00e6d6]" />}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black uppercase tracking-[0.18em]">
              {completed ? 'Walk completed' : alerted ? 'PANIC / HELP NEEDED' : 'Live walk tracking'}
            </h1>
            <p className="text-[11px] text-white/55 truncate">
              Destination: {session.destination_name || 'Unknown'} · ETA {session.eta_minutes} min
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapContainer center={current} zoom={16} className="h-full w-full min-h-[60vh]" zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Polyline positions={[start, current]} pathOptions={{ color: '#10b981', weight: 4, opacity: 0.75 }} />
          <Marker position={current} icon={walkerIcon}>
            <Tooltip permanent direction="top" offset={[0, -12]}>Live position</Tooltip>
          </Marker>
          <Follow lat={current[0]} lng={current[1]} />
        </MapContainer>
      </div>

      <footer className="border-t border-white/10 bg-[#0a0a0f]/95 px-4 py-3">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-[10px] uppercase tracking-wider text-white/40 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" /> Last location update
          </div>
          <div className="text-sm font-bold">
            {formatDistanceToNow(new Date(session.last_ping_at), { addSuffix: true })}
          </div>
        </div>
        <a
          href={`https://www.google.com/maps?q=${current[0]},${current[1]}`}
          target="_blank"
          rel="noreferrer"
          className="block mt-3 text-center text-xs font-bold text-[#00e6d6] hover:underline"
        >
          Open last known location in Google Maps
        </a>
      </footer>
    </div>
  );
};

export default TrackPage;
