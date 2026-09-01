import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistanceToNow } from 'date-fns';
import { Shield, BatteryMedium, Siren, MapPin, Clock } from 'lucide-react';
import { usePublicSafetySession } from '@/hooks/useSafety';
import { distanceMeters } from '@/lib/geo';

const walkerIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#00e6d6;border:3px solid white;box-shadow:0 0 18px rgba(0,230,214,0.9)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:22px;height:22px;border-radius:6px;background:#ff2e93;border:3px solid white;box-shadow:0 0 14px rgba(255,46,147,0.8)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const Follow = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true });
  }, [lat, lng, map]);
  return null;
};

const TrackPage = () => {
  const { sessionId } = useParams();
  const { session, loading, notFound } = usePublicSafetySession(sessionId);

  const remaining = useMemo(() => {
    if (!session?.current_lat || !session?.current_lng) return null;
    return Math.round(
      distanceMeters(session.current_lat, session.current_lng, session.destination_lat, session.destination_lng),
    );
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/60">
        Loading live track…
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-3 text-center px-6">
        <Shield className="w-10 h-10 text-white/30" />
        <h1 className="text-xl font-black text-white">Track link unavailable</h1>
        <p className="text-white/50 text-sm">This walk has ended or the link has expired.</p>
      </div>
    );
  }

  const cur: [number, number] = [
    session.current_lat ?? session.destination_lat,
    session.current_lng ?? session.destination_lng,
  ];
  const dest: [number, number] = [session.destination_lat, session.destination_lng];
  const escalated = session.status === 'escalated' || session.duress_flagged;
  const done = session.status === 'completed';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <header
        className={`px-4 py-3 border-b ${
          escalated ? 'bg-[#ff2e93]/15 border-[#ff2e93]/40' : 'bg-white/[0.03] border-white/10'
        }`}
      >
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {escalated ? <Siren className="w-5 h-5 text-[#ff2e93]" /> : <Shield className="w-5 h-5 text-[#00e6d6]" />}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black uppercase tracking-[0.18em]">
              {done ? 'Arrived safely' : escalated ? 'Emergency alert active' : 'Live walk tracking'}
            </h1>
            <p className="text-[11px] text-white/55 truncate">
              {session.destination_label || 'Destination'} · ETA {session.eta_minutes} min
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapContainer center={cur} zoom={16} className="h-full w-full min-h-[60vh]" zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap, &copy; CARTO" />
          <Polyline positions={[cur, dest]} pathOptions={{ color: '#00e6d6', weight: 3, dashArray: '6 8', opacity: 0.7 }} />
          <Marker position={cur} icon={walkerIcon}>
            <Tooltip permanent direction="top" offset={[0, -12]}>Live position</Tooltip>
          </Marker>
          <Marker position={dest} icon={destIcon}>
            <Tooltip permanent direction="top" offset={[0, -12]}>{session.destination_label || 'Destination'}</Tooltip>
          </Marker>
          <Follow lat={cur[0]} lng={cur[1]} />
        </MapContainer>
      </div>

      <footer className="border-t border-white/10 bg-[#0a0a0f]/95 px-4 py-3">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Last ping
            </div>
            <div className="text-sm font-bold">{formatDistanceToNow(new Date(session.last_ping_at), { addSuffix: true })}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> Distance left
            </div>
            <div className="text-sm font-bold">{remaining != null ? `${remaining} m` : '—'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 flex items-center justify-center gap-1">
              <BatteryMedium className="w-3 h-3" /> Battery
            </div>
            <div className="text-sm font-bold">{session.battery_level != null ? `${session.battery_level}%` : '—'}</div>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps?q=${cur[0]},${cur[1]}`}
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
