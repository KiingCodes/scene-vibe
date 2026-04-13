import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useCrewLocations, useShareLocation, useStopSharingLocation } from '@/hooks/useCrewLocations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

const memberIcon = (username: string) =>
  L.divIcon({
    className: '',
    html: `<div style="background:hsl(var(--primary));color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${(username || '?')[0].toUpperCase()}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const CrewLocationMap = ({ crewId }: { crewId: string }) => {
  const { user } = useAuth();
  const { data: locations } = useCrewLocations(crewId);
  const shareLocation = useShareLocation();
  const stopSharing = useStopSharingLocation();
  const [sharing, setSharing] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const isSharingNow = locations?.some(l => l.user_id === user?.id);

  const startSharing = () => {
    if (!navigator.geolocation) return toast.error('Location not supported');
    const id = navigator.geolocation.watchPosition(
      pos => {
        shareLocation.mutate({ crewId, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => toast.error('Could not get location'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    setWatchId(id);
    setSharing(true);
    toast.success('Sharing location with your crew! 📍');
  };

  const handleStopSharing = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setSharing(false);
    stopSharing.mutate(crewId);
    toast.success('Stopped sharing location');
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  const center = locations && locations.length > 0
    ? [locations[0].latitude, locations[0].longitude] as [number, number]
    : [-26.2041, 28.0473] as [number, number];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="glass rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-3">
        <h4 className="font-display font-semibold text-sm text-foreground flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-primary" /> Live Locations
          {locations && locations.length > 0 && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-green-400 inline-block"
            />
          )}
        </h4>
        {!sharing ? (
          <Button size="sm" onClick={startSharing} className="gap-1 gradient-primary text-primary-foreground text-xs">
            <MapPin className="w-3 h-3" /> Share My Location
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={handleStopSharing} className="gap-1 border-destructive/30 text-destructive text-xs">
            <X className="w-3 h-3" /> Stop Sharing
          </Button>
        )}
      </div>

      {locations && locations.length > 0 && (
        <div className="h-48">
          <MapContainer center={center} zoom={13} className="h-full w-full" zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CartoDB'
            />
            {locations.map(loc => (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={memberIcon(loc.profile?.username || '')}
              >
                <Popup>
                  <span className="font-semibold">{loc.profile?.username || 'Member'}</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {(!locations || locations.length === 0) && !sharing && (
        <div className="px-3 pb-3">
          <p className="text-xs text-muted-foreground text-center py-4">No one is sharing their location yet</p>
        </div>
      )}
    </motion.div>
  );
};

export default CrewLocationMap;
