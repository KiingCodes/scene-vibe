import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Calendar, ExternalLink, Coffee, Palette, ShoppingBag, Music2, Wine, Code2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useExperiences } from '@/hooks/useExperiences';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'workshop', label: 'Workshops', icon: Code2 },
  { key: 'popup', label: 'Pop-ups', icon: Palette },
  { key: 'market', label: 'Markets', icon: ShoppingBag },
  { key: 'food', label: 'Food', icon: Coffee },
  { key: 'lounge', label: 'Lounges', icon: Wine },
  { key: 'street_event', label: 'Street', icon: Music2 },
];

const ExperiencesPage = () => {
  const [cat, setCat] = useState<string>('all');
  const { data: experiences, isLoading } = useExperiences(cat);

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="font-display font-bold text-2xl text-foreground mb-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Experiences
          </h1>
          <p className="text-muted-foreground text-sm">
            Beyond clubs — workshops, pop-ups, markets, food spots, lounges & street events.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const active = cat === c.key;
            return (
              <Button
                key={c.key}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => setCat(c.key)}
                className={active ? 'gradient-primary text-primary-foreground' : 'border-border/50 text-muted-foreground'}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" /> {c.label}
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-56 animate-pulse" />
            ))}
          </div>
        ) : experiences?.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center">
            <p className="text-muted-foreground text-sm">Nothing here yet — the background sync will surface real events as they appear.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiences?.map((x, i) => (
              <motion.div
                key={x.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl overflow-hidden border border-border/40 hover:border-primary/40 transition-colors"
              >
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
                  {(x.registration_url || x.website) && (
                    <a
                      href={x.registration_url || x.website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {x.registration_url ? 'Register' : 'Visit'} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ExperiencesPage;