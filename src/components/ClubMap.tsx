import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Navigation, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Club } from '@/hooks/useClubs';
import type { Experience } from '@/hooks/useExperiences';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createClubIcon = (isTrending: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: ${isTrending ? 'linear-gradient(135deg, hsl(330,100%,60%), hsl(280,100%,60%))' : 'linear-gradient(135deg, hsl(174,100%,50%), hsl(200,100%,50%))'};
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 ${isTrending ? '15px' : '8px'} ${isTrending ? 'hsl(330,100%,60%,0.5)' : 'hsl(174,100%,50%,0.4)'};
      border: 2px solid white;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
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

const createExperienceIcon = (category: string) => {
  const color = CATEGORY_COLOR[category] || 'hsl(280,100%,65%)';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 26px; height: 26px; border-radius: 8px;
      background: ${color};
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 10px ${color};
      border: 2px solid white;
      transform: rotate(45deg);
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style="transform: rotate(-45deg);">
        <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.6z"/>
      </svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
};

interface ClubMapProps {
  clubs: Club[];
  vibeCounts?: Record<string, number>;
  selectedClubId?: string;
  experiences?: Experience[];
  showLabels?: boolean;
}

const FlyToClub = ({ club }: { club: Club | undefined }) => {
  const map = useMap();
  useEffect(() => {
    if (club) {
      map.flyTo([club.lat, club.lng], 15, { duration: 1 });
    }
  }, [club, map]);
  return null;
};

const ClubMap = ({ clubs, vibeCounts = {}, selectedClubId, experiences = [], showLabels = false }: ClubMapProps) => {
  const selectedClub = clubs.find(c => c.id === selectedClubId);

  const getDirectionsUrl = (club: Club) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${club.lat},${club.lng}&travelmode=driving`;
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border/50">
      <MapContainer
        center={[-26.15, 28.05]}
        zoom={11}
        className="w-full h-full"
        style={{ background: 'hsl(240 10% 4%)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {selectedClub && <FlyToClub club={selectedClub} />}
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
                  <h3 className="font-bold text-sm mb-1">{club.name}</h3>
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
                    <a href={getDirectionsUrl(club)} target="_blank" rel="noopener noreferrer">
                      <button className="text-xs px-2 py-1 bg-gray-200 text-black rounded font-semibold flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> Directions
                      </button>
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {experiences.filter(e => e.lat != null && e.lng != null).map(exp => (
          <Marker
            key={exp.id}
            position={[exp.lat as number, exp.lng as number]}
            icon={createExperienceIcon(exp.category)}
          >
            <Tooltip direction="top" offset={[0, -22]} permanent={showLabels} className="exp-label">
              {exp.name}
            </Tooltip>
            <Popup className="club-popup">
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1 flex items-center gap-1">
                  <span style={{ textTransform: 'capitalize' }}>{exp.category.replace('_', ' ')}</span>
                </h3>
                <p className="text-xs text-gray-700 font-medium">{exp.name}</p>
                <p className="text-xs text-gray-600 mb-2">{exp.area}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${exp.lat},${exp.lng}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <button className="text-xs px-2 py-1 bg-gray-200 text-black rounded font-semibold flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> Directions
                  </button>
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ClubMap;
