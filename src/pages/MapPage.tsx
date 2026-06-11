import { useState } from 'react';
import Navbar from '@/components/Navbar';
import ClubMap from '@/components/ClubMap';
import { useClubs } from '@/hooks/useClubs';
import { useExperiences } from '@/hooks/useExperiences';
import { useAllVibes } from '@/hooks/useVibes';
import { Flame, Sparkles } from 'lucide-react';
import { SkeletonBlock, LogoSkeleton } from '@/components/BrandedSkeleton';

const MapPage = () => {
  const { data: clubs, isLoading: clubsLoading } = useClubs();
  const { data: experiences } = useExperiences();
  const { data: vibeCounts } = useAllVibes();
  const [selectedClubId] = useState<string | undefined>();
  const [showClubs, setShowClubs] = useState(true);
  const [showExps, setShowExps] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  return (
    <div className="h-screen gradient-dark overflow-hidden">
      <Navbar />
      <main className="pt-16 h-full relative">
        {/* Floating filter chips overlay */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 px-2 py-1.5 rounded-full glass border border-border/40 backdrop-blur-xl shadow-lg max-w-[95vw] overflow-x-auto">
          <button
            onClick={() => setShowClubs(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
              showClubs ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border/30 text-muted-foreground'
            }`}
          >
            <Flame className="w-3 h-3" /> Clubs {clubs ? `(${clubs.length})` : ''}
          </button>
          <button
            onClick={() => setShowExps(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
              showExps ? 'bg-secondary/20 border-secondary/50 text-secondary' : 'border-border/30 text-muted-foreground'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Experiences {experiences ? `(${experiences.filter(e => e.lat != null).length})` : ''}
          </button>
          <button
            onClick={() => setShowLabels(v => !v)}
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
              showLabels ? 'bg-accent/20 border-accent/50 text-accent' : 'border-border/30 text-muted-foreground'
            }`}
          >
            {showLabels ? 'All labels' : 'Trending labels'}
          </button>
        </div>
        {/* Full-screen map */}
        <div className="h-full w-full">
          {clubsLoading || !clubs ? (
            <div className="w-full h-full relative">
              <SkeletonBlock className="w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <LogoSkeleton label="Loading the map…" className="bg-background/60" />
              </div>
            </div>
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
      </main>
    </div>
  );
};

export default MapPage;
