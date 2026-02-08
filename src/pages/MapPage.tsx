import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ClubMap from '@/components/ClubMap';
import { useClubs } from '@/hooks/useClubs';
import { useAllVibes } from '@/hooks/useVibes';
import { Button } from '@/components/ui/button';
import { Flame, TrendingUp, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const MapPage = () => {
  const { data: clubs } = useClubs();
  const { data: vibeCounts } = useAllVibes();
  const [selectedClubId, setSelectedClubId] = useState<string | undefined>();

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="pt-16 h-screen flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Map */}
          <div className="flex-1 p-2 pt-2">
            {clubs && (
              <ClubMap clubs={clubs} vibeCounts={vibeCounts || {}} selectedClubId={selectedClubId} />
            )}
          </div>

          {/* Club list sidebar */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full lg:w-80 p-3 overflow-y-auto max-h-[40vh] lg:max-h-none border-t lg:border-t-0 lg:border-l border-border/30"
          >
            <h2 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Clubs near you
            </h2>
            <div className="space-y-2">
              {clubs?.map(club => {
                const count = vibeCounts?.[club.id] || 0;
                const isTrending = count >= 3;
                return (
                  <button
                    key={club.id}
                    onClick={() => setSelectedClubId(club.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all glass hover:border-primary/30 ${
                      selectedClubId === club.id ? 'border-primary/50 neon-border' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{club.name}</p>
                        <p className="text-xs text-muted-foreground">{club.area}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {isTrending && <TrendingUp className="w-3 h-3 text-secondary" />}
                        {count > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-primary">
                            <Flame className="w-3 h-3" />{count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MapPage;
