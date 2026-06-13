import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, MapPin, TrendingUp } from 'lucide-react';
import heroBg from '@/assets/nightlife-hero.jpg';
import logoFallback from '@/assets/scene-logo.jpg';
import type { Club } from '@/hooks/useClubs';

interface HeroCarouselProps {
  clubs: Club[];
  vibeCounts?: Record<string, number>;
}

const HeroCarousel = ({ clubs, vibeCounts = {} }: HeroCarouselProps) => {
  const total = clubs.length;
  // Duplicate the track so the loop is seamless
  const track = useMemo(() => [...clubs, ...clubs], [clubs]);
  // ~6 seconds per card feels premium and readable
  const duration = Math.max(20, total * 6);

  if (total === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl mb-10 border border-border/30"
      style={{ minHeight: '480px' }}
      aria-roledescription="carousel"
      aria-label="Featured clubs"
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${clubs[0]?.image_url || heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.35) saturate(1.4)',
          transform: 'scale(1.2)',
        }}
        aria-hidden
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/75" aria-hidden />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, hsl(var(--background) / 0.7) 100%)' }}
        aria-hidden
      />
      {/* Color glows */}
      <div
        className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-50 blur-[110px] animate-pulse"
        style={{ background: 'hsl(270 90% 55%)' }}
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full opacity-50 blur-[120px] animate-pulse"
        style={{ background: 'hsl(210 100% 55%)' }}
        aria-hidden
      />

      {/* Heading */}
      <div className="relative z-10 pt-8 pb-4 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/40 backdrop-blur-md border border-border/40 mb-3"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-foreground/90 tracking-wider">TONIGHT'S SCENE</span>
        </motion.div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground neon-text">
          Where the night lives
        </h1>
        <p className="text-muted-foreground text-sm mt-2">Featured clubs trending right now</p>
      </div>

      {/* Marquee track — truly continuous, never pauses */}
      <div className="relative z-10 pb-8 pt-2 overflow-hidden">
        <motion.div
          className="flex gap-5 w-max will-change-transform"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration, ease: 'linear', repeat: Infinity }}
        >
          {track.map((club, i) => {
            const vibeCount = vibeCounts[club.id] || 0;
            const isTrending = vibeCount >= 3;
            return (
              <Link
                key={`${club.id}-${i}`}
                to={`/club/${club.id}`}
                className="relative w-[260px] sm:w-[300px] shrink-0 glass rounded-2xl overflow-hidden border border-border/40 hover:border-primary/60 transition-colors shadow-[0_18px_50px_-15px_hsl(var(--primary)/0.35)]"
              >
                <div className="relative h-[300px] overflow-hidden">
                  <img
                    src={club.image_url || logoFallback}
                    alt={club.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = logoFallback; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  {isTrending && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full gradient-secondary text-secondary-foreground text-[10px] font-bold shadow-lg">
                      <TrendingUp className="w-3 h-3" /> TRENDING
                    </div>
                  )}
                  {vibeCount > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md border border-primary/40 text-xs font-bold text-primary shadow-lg">
                      <Flame className="w-3 h-3" /> {vibeCount}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display font-bold text-xl text-foreground drop-shadow-lg truncate">
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-foreground/80 mt-0.5">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="truncate">{club.area}</span>
                      {club.genre && (
                        <>
                          <span className="text-foreground/40">•</span>
                          <span className="truncate">{club.genre}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroCarousel;
