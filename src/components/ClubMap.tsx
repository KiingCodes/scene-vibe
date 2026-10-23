import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Navigation, Flame, Plus, Minus, Locate } from 'lucide-react';
import type { Club } from '@/hooks/useClubs';
import scenePinLogo from '@/assets/logo.png';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createClubIcon = (isTrending: boolean) => {
  return L.divIcon({
    className: 'scene-logo-marker',
    html: `<div class="relative flex h-10 w-10 items-center justify-center">
      <div class="absolute -inset-2 animate-ping rounded-full ${isTrending ? 'bg-pink-500/30' : 'bg-cyan-500/30'}"></div>
      <div class="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 ${isTrending ? 'border-pink-400' : 'border-cyan-400'} bg-slate-950 p-1 shadow-[0_0_20px_rgba(6,182,212,0.6)]">
        <img src="${scenePinLogo}" alt="SCENE" class="h-full w-full object-contain" />
      </div>
      <div class="absolute -bottom-1 h-2 w-2 rotate-45 ${isTrending ? 'bg-pink-400' : 'bg-cyan-400'}"></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const CATEGORY_COLOR: Record<string, string> = {
  workshop: 'hsl(45,100%,55%)',
  popup: 'hsl(310,100%,60%)',
  market: 'hsl(150,80%,50%)',
  food: 'hsl(20,100%,55%)',
  lounge: 'hsl(260,90%,65%)',
  street_event: 'hsl(190,100%,55%)',
};

interface ClubMapProps {
  clubs: Club[];
  vibeCounts?: Record<string, number>;
  selectedClubId?: string;
  showLabels?: boolean;
}

const FlyToClub = ({ club }: { club: Club | undefined }) => {
  const map = useMap();
  useEffect(() => {
    if (club) {
      map.flyTo([club.lat, club.lng], 17, { duration: 1 });
    }
  }, [club, map]);
  return null;
};

/** Floating map density / zoom controls */
const DensityControls = () => {
  const map = useMap();
  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1 }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  return (
    <div className="absolute right-3 bottom-24 z-[500] flex flex-col gap-1.5">
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="w-10 h-10 rounded-full glass border border-border/50 backdrop-blur-xl flex items-center justify-center text-foreground hover:bg-primary/15 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="w-10 h-10 rounded-full glass border border-border/50 backdrop-blur-xl flex items-center justify-center text-foreground hover:bg-primary/15 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        onClick={locate}
        aria-label="Locate me"
        className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-lg"
      >
        <Locate className="w-4 h-4" />
      </button>
    </div>
  );
};

const ClubMap = ({ clubs, vibeCounts = {}, selectedClubId, showLabels = false }: ClubMapProps) => {
  const selectedClub = clubs.find(c => c.id === selectedClubId);
  const focusedClub = selectedClub ?? (clubs.length === 1 ? clubs[0] : undefined);
  const initialCenter: [number, number] = focusedClub
    ? [focusedClub.lat, focusedClub.lng]
    : [-26.15, 28.05];

  const directionsUrl = (lat: number, lng: number, mode: 'driving' | 'walking' | 'transit') =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${mode}`;

  const DirButtons = ({ lat, lng }: { lat: number; lng: number }) => (
    <div className="flex gap-1 mt-1">
      {(['driving','walking','transit'] as const).map(m => (
        <a key={m} href={directionsUrl(lat, lng, m)} target="_blank" rel="noopener noreferrer">
          <button className="text-[10px] px-2 py-1 bg-gray-200 hover:bg-cyan-200 text-black rounded font-semibold capitalize flex items-center gap-1">
            <Navigation className="w-2.5 h-2.5" />
            {m === 'driving' ? 'Drive' : m === 'walking' ? 'Walk' : 'Transit'}
          </button>
        </a>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border/50">
      <MapContainer
        center={initialCenter}
        zoom={focusedClub ? 17 : 11}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: 'hsl(240 10% 4%)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DensityControls />
        {focusedClub && <FlyToClub club={focusedClub} />}
        {clubs.map(club => {
          const isTrending = (vibeCounts[club.id] || 0) >= 3;
          // Only show permanent label for trending clubs or the selected one — reduces overcrowding
          const labelPermanent = showLabels && (isTrending || club.id === selectedClubId);
          return (
            <Marker key={club.id} position={[club.lat, club.lng]} icon={createClubIcon(isTrending)}>
              <Tooltip
                direction="top"
                offset={[0, -28]}
                permanent={labelPermanent}
                className="club-label"
              >
                {club.name}
              </Tooltip>
              <Popup className="club-popup">
                <div className="p-1 min-w-[200px]">
                  <h3 className="font-bold text-sm mb-1 flex items-center gap-1">
                    {club.name}
                    {(club.status === 'approved' && (club.owner_id || club.verified_at)) && (
                      <span title="Verified venue" style={{ color: 'rgb(16,185,129)' }}>✔</span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">{club.address}</p>
                  <p className="text-xs text-gray-600 mb-1">{club.area}</p>
                  {vibeCounts[club.id] && (
                    <p className="text-xs flex items-center gap-1 mb-2">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {vibeCounts[club.id]} vibes
                    </p>
                  )}
                  <div className="flex gap-1">
                    <Link to={`/club/${club.id}`}>
                      <button className="text-xs px-2 py-1 bg-cyan-500 text-black rounded font-semibold">View</button>
                    </Link>
                  </div>
                  <DirButtons lat={club.lat} lng={club.lng} />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ClubMap;
