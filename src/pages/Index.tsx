import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Flame, TrendingUp, Star, Sparkles, Cake, Coffee, Palette, ShoppingBag, Music2, Wine, Code2, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useClubs } from '@/hooks/useClubs';
import { useAllVibes } from '@/hooks/useVibes';
import { useAllPullingUp } from '@/hooks/usePullingUp';
import { useExperiences } from '@/hooks/useExperiences';
import ClubCard from '@/components/ClubCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTypewriter } from '@/hooks/useTypewriter';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const Index = () => {
  const { data: clubs, isLoading } = useClubs();
  const { data: vibeCounts } = useAllVibes();
  const { data: pullingUpCounts } = useAllPullingUp();
  const { data: experiences } = useExperiences();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'trending' | 'vibing'>('all');
  const placeholder = useTypewriter([
    'Search clubs, food, workshops, markets...',
    "Find tonight's vibe...",
    'Try "Sandton" or "Amapiano"...',
    'Pop-ups, lounges, street events...',
    'Where are we going tonight?',
  ]);

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

  const filteredExperiences = useMemo(() => {
    if (!experiences) return [];
    if (filter !== 'all') return []; // experiences don't have vibe trending
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return experiences.filter(x =>
      x.name.toLowerCase().includes(q) ||
      x.area.toLowerCase().includes(q) ||
      x.category.toLowerCase().includes(q) ||
      (x.description?.toLowerCase().includes(q))
    );
  }, [experiences, search, filter]);

  const trendingCount = clubs?.filter(c => (vibeCounts?.[c.id] || 0) >= 3).length || 0;

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

  const EXP_CATEGORIES = [
    { key: 'workshop', label: 'Workshops', icon: Code2 },
    { key: 'popup', label: 'Pop-ups', icon: Palette },
    { key: 'market', label: 'Markets', icon: ShoppingBag },
    { key: 'food', label: 'Food', icon: Coffee },
    { key: 'lounge', label: 'Lounges', icon: Wine },
    { key: 'street_event', label: 'Street', icon: Music2 },
  ];
  const expByCat = useMemo(() => {
    const map: Record<string, number> = {};
    (experiences || []).forEach(e => { map[e.category] = (map[e.category] || 0) + 1; });
    return map;
  }, [experiences]);
  const featuredExperiences = useMemo(() => (experiences || []).slice(0, 6), [experiences]);

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Auto-moving hero carousel */}
        {mostVibed.length > 0 && (
          <HeroCarousel clubs={mostVibed.length >= 3 ? mostVibed : (clubs || []).slice(0, 6)} vibeCounts={vibeCounts} />
        )}

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-6 space-y-3"
        >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={placeholder || 'Search...'}
              className="pl-10 bg-muted/50 border-border/50"
            />
          </div>
          <div className="flex justify-center gap-2">
            {[
              { key: 'all' as const, label: `All (${clubs?.length || 0})`, icon: null },
              { key: 'vibing' as const, label: 'Vibing', icon: <Flame className="w-3.5 h-3.5 mr-1" /> },
              { key: 'trending' as const, label: `Trending (${trendingCount})`, icon: <TrendingUp className="w-3.5 h-3.5 mr-1" /> },
            ].map(f => (
              <motion.div key={f.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  variant={filter === f.key ? 'default' : 'outline'}
                  onClick={() => setFilter(f.key)}
                  className={filter === f.key
                    ? (f.key === 'trending' ? 'gradient-secondary text-secondary-foreground' : 'gradient-primary text-primary-foreground')
                    : 'border-border/50 text-muted-foreground'}
                >
                  {f.icon}{f.label}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Curated Sections */}
        <AnimatePresence mode="wait">
          {showCurated && !isLoading && (
            <motion.div
              key="curated"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10 mb-10"
            >
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

              {/* Discover beyond clubs */}
              <motion.section
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Beyond the Club
                  </h2>
                  <Link to="/experiences" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    See all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                  {EXP_CATEGORIES.map(c => {
                    const Icon = c.icon;
                    const count = expByCat[c.key] || 0;
                    return (
                      <Link
                        key={c.key}
                        to="/experiences"
                        className="glass rounded-xl p-3 flex flex-col items-center gap-1.5 border border-border/40 hover:border-primary/40 transition-colors text-center"
                      >
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-[11px] font-semibold text-foreground leading-tight">{c.label}</span>
                        <span className="text-[10px] text-muted-foreground">{count}</span>
                      </Link>
                    );
                  })}
                </div>
                {featuredExperiences.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredExperiences.map((x, i) => (
                      <motion.div
                        key={x.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                        className="glass rounded-xl overflow-hidden border border-border/40 hover:border-primary/40 transition-colors"
                      >
                        <Link to="/experiences" className="block">
                          {x.image_url && (
                            <img src={x.image_url} alt={x.name} loading="lazy" className="w-full h-36 object-cover" />
                          )}
                          <div className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-display font-semibold text-foreground text-sm leading-tight">{x.name}</h3>
                              <Badge variant="secondary" className="text-[9px] uppercase shrink-0">{x.category}</Badge>
                            </div>
                            {x.description && <p className="text-xs text-muted-foreground line-clamp-2">{x.description}</p>}
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {x.area}</span>
                              {x.start_date && (
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(x.start_date), 'd MMM')}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeletons — themed for every category section */}
        {isLoading && (
          <div className="space-y-10">
            {['Most Visited This Weekend', 'Top Rated in Johannesburg', 'Newly Added', 'Beyond the Club'].map((title) => (
              <section key={title}>
                <div className="h-5 w-48 bg-muted/40 rounded animate-pulse mb-4" />
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={i}
                      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                      className="glass rounded-xl h-60 overflow-hidden border border-border/30 relative shimmer-overlay"
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
                        <Sparkles className="w-16 h-16 text-primary" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            ))}
          </div>
        )}

        {/* All Clubs Grid (when searching/filtering) */}
        <AnimatePresence mode="wait">
          {filteredClubs && (search || filter !== 'all') && (
            <motion.div key="filtered" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass rounded-2xl border border-border/40 p-4 mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {filter === 'trending' ? (
                    <TrendingUp className="w-5 h-5 text-secondary shrink-0" />
                  ) : filter === 'vibing' ? (
                    <Flame className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <Search className="w-5 h-5 text-primary shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-lg text-foreground truncate">
                      {filter === 'all' ? 'Search Results' : filter === 'trending' ? 'Trending Now' : 'Currently Vibing'}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                      {filteredClubs.length} {filteredClubs.length === 1 ? 'spot' : 'spots'}
                      {search && <> matching “{search}”</>}
                    </p>
                  </div>
                </div>
                {(search || filter !== 'all') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setSearch(''); setFilter('all'); }}
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClubs.map((club, i) => (
                  <ClubCard key={club.id} club={club} vibeCount={vibeCounts?.[club.id] || 0} pullingUpCount={pullingUpCounts?.[club.id] || 0} index={i} />
                ))}
              </div>

              {filteredExperiences.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Experiences
                    <span className="text-xs text-muted-foreground font-normal">({filteredExperiences.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExperiences.map((x, i) => (
                      <motion.div
                        key={x.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="glass rounded-xl overflow-hidden border border-border/40 hover:border-primary/40 transition-colors"
                      >
                        <Link to="/experiences" className="block">
                          {x.image_url && <img src={x.image_url} alt={x.name} loading="lazy" className="w-full h-36 object-cover" />}
                          <div className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-display font-semibold text-foreground text-sm leading-tight">{x.name}</h4>
                              <Badge variant="secondary" className="text-[9px] uppercase shrink-0">{x.category}</Badge>
                            </div>
                            {x.description && <p className="text-xs text-muted-foreground line-clamp-2">{x.description}</p>}
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {x.area}</span>
                              {x.start_date && (
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(x.start_date), 'd MMM')}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredClubs?.length === 0 && filteredExperiences.length === 0 && (search || filter !== 'all') && !isLoading && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
            <p className="text-muted-foreground text-lg">Nothing found matching “{search}”.</p>
          </motion.div>
        )}
      </main>
      <Footer />
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
  <motion.section
    initial={{ opacity: 0, y: 25 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.5 }}
  >
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
