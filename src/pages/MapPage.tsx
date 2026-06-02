import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ClubMap from '@/components/ClubMap';
import { useClubs } from '@/hooks/useClubs';
import { useExperiences } from '@/hooks/useExperiences';
import { useAllVibes } from '@/hooks/useVibes';
import { Flame, TrendingUp, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkeletonBlock } from '@/components/BrandedSkeleton';

const MapPage = () => {
  const { data: clubs, isLoading: clubsLoading } = useClubs();
  const { data: experiences } = useExperiences();
  const { data: vibeCounts } = useAllVibes();
  const [selectedClubId, setSelectedClubId] = useState<string | undefined>();
  const [showClubs, setShowClubs] = useState(true);
  const [showExps, setShowExps] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="pt-16 h-screen flex flex-col">
        {/* Filter chips */}
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
          <button
            onClick={() => setShowClubs(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
              showClubs ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border/30 text-muted-foreground'
            }`}
          >
            <Flame className="w-3 h-3" /> Clubs {clubs ? `(${clubs.length})` : ''}
          </button>
          <button
            onClick={() => setShowExps(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
              showExps ? 'bg-secondary/20 border-secondary/50 text-secondary' : 'border-border/30 text-muted-foreground'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Experiences {experiences ? `(${experiences.filter(e => e.lat != null).length})` : ''}
          </button>
          <button
            onClick={() => setShowLabels(v => !v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
              showLabels ? 'bg-accent/20 border-accent/50 text-accent' : 'border-border/30 text-muted-foreground'
            }`}
          >
            {showLabels ? 'Labels: On' : 'Labels: Off'}
          </button>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Map */}
          <div className="flex-1 p-2 pt-2">
            {clubsLoading || !clubs ? (
              <SkeletonBlock className="w-full h-full" />
            ) : (
              <ClubMap
                clubs={showClubs ? clubs : []}
                experiences={showExps ? (experiences || []) : []}
                vibeCounts={vibeCounts || {}}
                selectedClubId={selectedClubId}
                showLabels={showLabels}
              />
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
              On the map
            </h2>
            {clubsLoading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-14" />)}
              </div>
            )}
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
              {showExps && experiences?.filter(e => e.lat != null).slice(0, 30).map(exp => (
                <div key={exp.id} className="p-3 rounded-lg glass border-border/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-secondary shrink-0" />
                        {exp.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {exp.category.replace('_', ' ')} · {exp.area}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MapPage;
