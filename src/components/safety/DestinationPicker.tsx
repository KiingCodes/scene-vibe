import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import scenePinLogo from '@/assets/logo.png';

export type Destination = { lat: number; lng: number; label: string };

const pinIcon = L.divIcon({
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

const ClickCatcher = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const Recenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

/** Tap-the-map destination picker with a "use my location" shortcut. */
const DestinationPicker = ({
  value,
  onChange,
}: {
  value: Destination | null;
  onChange: (d: Destination) => void;
}) => {
  const [center, setCenter] = useState<[number, number]>(
    value ? [value.lat, value.lng] : [-26.2041, 28.0473],
  );
  const [locating, setLocating] = useState(false);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setCenter([latitude, longitude]);
        onChange({ lat: latitude, lng: longitude, label: value?.label || 'My location' });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative h-56 rounded-xl overflow-hidden border border-white/10">
        <MapContainer center={center} zoom={14} className="h-full w-full" zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ClickCatcher onPick={(lat, lng) => onChange({ lat, lng, label: value?.label || '' })} />
          <Recenter lat={center[0]} lng={center[1]} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
        </MapContainer>
        <Button
          type="button"
          size="sm"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute bottom-2 right-2 z-[1000] h-8 rounded-full bg-[#0a0a0f]/90 border border-white/15 text-white text-xs hover:bg-white/10"
        >
          <Locate className="w-3.5 h-3.5 mr-1" />
          {locating ? 'Locating…' : 'My location'}
        </Button>
      </div>
      <p className="text-[11px] text-white/45">Tap the map to drop your destination pin.</p>
    </div>
  );
};

export default DestinationPicker;
