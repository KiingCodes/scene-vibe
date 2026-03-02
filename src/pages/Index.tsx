import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Flame, TrendingUp, Star, Sparkles, Cake, Clock } from 'lucide-react';
import { useClubs } from '@/hooks/useClubs';
import { useAllVibes } from '@/hooks/useVibes';
import { useAllPullingUp } from '@/hooks/usePullingUp';
import ClubCard from '@/components/ClubCard';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { data: clubs, isLoading } = useClubs();
  const { data: vibeCounts } = useAllVibes();
  const { data: pullingUpCounts } = useAllPullingUp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'trending' | 'vibing'>('all');

  const filteredClubs = clubs?.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(search.toLowerCase()) ||
      club.area.toLowerCase().includes(search.toLowerCase()) ||
      (club.genre?.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    const count = vibeCounts?.[club.id] || 0;
    if (filter === 'trending') return count >= 3;
    if (filter === 'vibing') return count > 0;
    return true;
  });

  const trendingCount = clubs?.filter(c => (vibeCounts?.[c.id] || 0) >= 3).length || 0;

  // Curated sections
  const mostVibed = useMemo(() => {
    if (!clubs || !vibeCounts) return [];
    return [...clubs].sort((a, b) => (vibeCounts[b.id] || 0) - (vibeCounts[a.id] || 0)).slice(0, 6);
  }, [clubs, vibeCounts]);

  const newlyAdded = useMemo(() => {
    if (!clubs) return [];
    return [...clubs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
  }, [clubs]);

  const topRatedJhb = useMemo(() => {
    if (!clubs) return [];
    return clubs.filter(c =>
      c.area.toLowerCase().includes('johannesburg') || c.area.toLowerCase().includes('jhb') ||
      c.area.toLowerCase().includes('sandton') || c.area.toLowerCase().includes('rosebank') ||
      c.area.toLowerCase().includes('maboneng') || c.area.toLowerCase().includes('melville') ||
      c.area.toLowerCase().includes('braamfontein')
    ).slice(0, 6);
  }, [clubs]);

  const birthdayFriendly = useMemo(() => {
    if (!clubs) return [];
    return clubs.filter(c => {
      const cap = parseInt(c.capacity || '0');
      return cap >= 200 || c.description?.toLowerCase().includes('birthday') || c.description?.toLowerCase().includes('vip') || c.description?.toLowerCase().includes('private');
    }).slice(0, 6);
  }, [clubs]);

  const showCurated = !search && filter === 'all';

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 space-y-3">
          <h1 className="font-display font-bold text-4xl sm:text-5xl">
            <span className="text-primary neon-text"></span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">What's the scene in your city?</p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 space-y-3">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs, areas, genres..." className="pl-10 bg-muted/50 border-border/50" />
          </div>
          <div className="flex justify-center gap-2">
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}
              className={filter === 'all' ? 'gradient-primary text-primary-foreground' : 'border-border/50 text-muted-foreground'}>
              All ({clubs?.length || 0})
            </Button>
            <Button size="sm" variant={filter === 'vibing' ? 'default' : 'outline'} onClick={() => setFilter('vibing')}
              className={filter === 'vibing' ? 'gradient-primary text-primary-foreground' : 'border-border/50 text-muted-foreground'}>
              <Flame className="w-3.5 h-3.5 mr-1" /> Vibing
            </Button>
            <Button size="sm" variant={filter === 'trending' ? 'default' : 'outline'} onClick={() => setFilter('trending')}
              className={filter === 'trending' ? 'gradient-secondary text-secondary-foreground' : 'border-border/50 text-muted-foreground'}>
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Trending ({trendingCount})
            </Button>
          </div>
        </motion.div>

        {/* Curated Sections */}
        {showCurated && !isLoading && (
          <div className="space-y-10 mb-10">
            {mostVibed.length > 0 && (
              <CuratedSection icon={<Flame className="w-5 h-5 text-secondary" />} title="Most Visited This Weekend" clubs={mostVibed} vibeCounts={vibeCounts} pullingUpCounts={pullingUpCounts} />
            )}
            {topRatedJhb.length > 0 && (
              <CuratedSection icon={<Star className="w-5 h-5 text-primary" />} title="Top Rated in Johannesburg" clubs={topRatedJhb} vibeCounts={vibeCounts} pullingUpCounts={pullingUpCounts} />
            )}
            {newlyAdded.length > 0 && (
              <CuratedSection icon={<Sparkles className="w-5 h-5 text-accent" />} title="Newly Added" clubs={newlyAdded} vibeCounts={vibeCounts} pullingUpCounts={pullingUpCounts} />
            )}
            {birthdayFriendly.length > 0 && (
              <CuratedSection icon={<Cake className="w-5 h-5 text-secondary" />} title="Birthday Friendly Spots" clubs={birthdayFriendly} vibeCounts={vibeCounts} pullingUpCounts={pullingUpCounts} />
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        )}

        {/* All Clubs Grid (when searching/filtering) */}
        {filteredClubs && (search || filter !== 'all') && (
          <>
            <h2 className="font-display font-bold text-xl text-foreground mb-4">
              {filter === 'all' ? 'Search Results' : filter === 'trending' ? 'Trending Now' : 'Currently Vibing'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClubs.map((club, i) => (
                <ClubCard key={club.id} club={club} vibeCount={vibeCounts?.[club.id] || 0} pullingUpCount={pullingUpCounts?.[club.id] || 0} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Show all clubs below curated when no search */}
        {showCurated && !isLoading && filteredClubs && (
          <>
            <h2 className="font-display font-bold text-xl text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" /> All Clubs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClubs.map((club, i) => (
                <ClubCard key={club.id} club={club} vibeCount={vibeCounts?.[club.id] || 0} pullingUpCount={pullingUpCounts?.[club.id] || 0} index={i} />
              ))}
            </div>
          </>
        )}

        {filteredClubs?.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No clubs found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const CuratedSection = ({ icon, title, clubs, vibeCounts, pullingUpCounts }: {
  icon: React.ReactNode;
  title: string;
  clubs: any[];
  vibeCounts?: Record<string, number>;
  pullingUpCounts?: Record<string, number>;
}) => (
  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <h2 className="font-display font-bold text-xl text-foreground mb-4 flex items-center gap-2">
      {icon} {title}
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clubs.map((club, i) => (
        <ClubCard key={club.id} club={club} vibeCount={vibeCounts?.[club.id] || 0} pullingUpCount={pullingUpCounts?.[club.id] || 0} index={i} />
      ))}
    </div>
  </motion.section>
);

export default Index;
