import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, MapPin, TrendingUp, ChevronLeft, ChevronRight, Navigation, Heart } from 'lucide-react';
import heroBg from '@/assets/nightlife-hero.jpg';
import type { Club } from '@/hooks/useClubs';

interface HeroCarouselProps {
  clubs: Club[];
  vibeCounts?: Record<string, number>;
}

const HeroCarousel = ({ clubs, vibeCounts = {} }: HeroCarouselProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const total = clubs.length;

  // Autoplay: advance every 3.2s for a more relaxed, premium pace
  useEffect(() => {
    if (paused || total < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), 3200);
    return () => window.clearInterval(id);
  }, [paused, total]);

  // Resume autoplay 5s after user interaction
  useEffect(() => {
    if (!paused) return;
    const id = window.setTimeout(() => setPaused(false), 5000);
    return () => window.clearTimeout(id);
  }, [paused, index]);

  const go = (dir: -1 | 1) => {
    setPaused(true);
    setIndex((i) => (i + dir + total) % total);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
    touchStartX.current = null;
  };

  if (total === 0) return null;

  // Compute relative offset for each card (-2..-1, 0, 1..2) wrap-aware
  const getOffset = (i: number) => {
    let d = i - index;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl mb-10"
      style={{ minHeight: '520px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured clubs"
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(28px) brightness(0.45) saturate(1.2)',
          transform: 'scale(1.15)',
        }}
        aria-hidden
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/70" aria-hidden />
      {/* Color glows */}
      <div
        className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-40 blur-[100px]"
        style={{ background: 'hsl(270 90% 55%)' }}
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full opacity-40 blur-[110px]"
        style={{ background: 'hsl(210 100% 55%)' }}
        aria-hidden
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full opacity-25 blur-[80px]"
        style={{ background: 'hsl(330 100% 60%)' }}
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

      {/* Carousel stage */}
      <div className="relative z-10 h-[380px] flex items-center justify-center" style={{ perspective: '1200px' }}>
        {clubs.map((club, i) => {
          const offset = getOffset(i);
          const abs = Math.abs(offset);
          if (abs > 2) return null;

          const isCenter = offset === 0;
          const x = offset * 180; // horizontal spread
          const scale = isCenter ? 1 : abs === 1 ? 0.88 : 0.74;
          const opacity = isCenter ? 1 : abs === 1 ? 0.6 : 0.25;
          const rotateY = offset * -8;
          const z = -abs * 40;
          const vibeCount = vibeCounts[club.id] || 0;
          const isTrending = vibeCount >= 3;

          return (
            <motion.div
              key={club.id}
              animate={{
                x,
                scale,
                opacity,
                rotateY,
                z,
              }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute w-[260px] sm:w-[280px]"
              style={{ transformStyle: 'preserve-3d', zIndex: 10 - abs }}
            >
              <Link
                to={`/club/${club.id}`}
                onClick={(e) => {
                  if (!isCenter) {
                    e.preventDefault();
                    setPaused(true);
                    setIndex(i);
                  }
                }}
                className="block"
              >
                <div
                  className={`glass rounded-2xl overflow-hidden border ${
                    isCenter ? 'border-primary/60 neon-border' : 'border-border/40'
                  } transition-all`}
                >
                  <div className="relative h-[220px] overflow-hidden">
                    <img
                      src={club.image_url || '/placeholder.svg'}
                      alt={club.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    {isTrending && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full gradient-secondary text-secondary-foreground text-[10px] font-bold">
                        <TrendingUp className="w-3 h-3" /> TRENDING
                      </div>
                    )}
                    {vibeCount > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur-md border border-primary/40 text-xs font-bold text-primary">
                        <Flame className="w-3 h-3" /> {vibeCount}
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-display font-bold text-lg text-foreground truncate">
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 text-primary/70" />
                      <span className="truncate">{club.area}</span>
                      {club.genre && (
                        <>
                          <span className="text-border">•</span>
                          <span className="truncate">{club.genre}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Indicators */}
      <div className="relative z-10 flex justify-center gap-1.5 pb-6 pt-2">
        {clubs.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setPaused(true);
              setIndex(i);
            }}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-8 bg-primary neon-border' : 'w-1.5 bg-foreground/30 hover:bg-foreground/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
