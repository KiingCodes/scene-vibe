import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Calendar, ExternalLink, Coffee, Palette, ShoppingBag, Music2, Wine, Code2, Plus, Navigation, RefreshCw, AlertCircle, CheckCircle2, Clock, Search, X, Bookmark, BookmarkPlus, DoorOpen, DoorClosed, CheckCircle, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useExperiences, useExperiencesSyncStatus, useTriggerSync } from '@/hooks/useExperiences';
import { useAllExperienceAttendance, useToggleAttendance, type AttendanceType } from '@/hooks/useExperienceAttendance';
import { useDeviceId } from '@/hooks/useDeviceId';
import { LogoSkeleton } from '@/components/BrandedSkeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import wallpaper from '@/assets/experiences-wallpaper.jpg';
import logoUrl from '@/assets/scene-logo.jpg';
import { getOpenStatus } from '@/lib/openHours';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'workshop', label: 'Workshops', icon: Code2 },
  { key: 'popup', label: 'Pop-ups', icon: Palette },
  { key: 'market', label: 'Markets', icon: ShoppingBag },
  { key: 'food', label: 'Food', icon: Coffee },
  { key: 'lounge', label: 'Lounges', icon: Wine },
  { key: 'street_event', label: 'Street', icon: Music2 },
];

const SAVED_KEY = 'scene_saved_searches';

const haversine = (a: number, b: number, c: number, d: number) => {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(c - a);
  const dLng = toRad(d - b);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const Highlight = ({ text, q }: { text: string; q: string }) => {
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
  return (
    <>{parts.map((p, i) => p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{p}</mark>
      : <span key={i}>{p}</span>)}</>
  );
};

const SkeletonCard = () => (
  <div className="relative glass rounded-xl h-56 overflow-hidden border border-border/40 shimmer-overlay">
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
      <img src={logoUrl} alt="" className="w-24 h-24 object-contain" />
    </div>
  </div>
);

const AttendanceBar = ({ experienceId, counts }: { experienceId: string; counts: { checkin: number; going: number; interested: number } }) => {
  const deviceId = useDeviceId();
  const toggle = useToggleAttendance(experienceId);
  // Mine state derived from query cache via per-experience hook would re-render too often;
  // instead, use simple per-button optimistic mirror via localStorage device markers.
  const [mine, setMine] = useState<Set<AttendanceType>>(new Set());

  const key = `att:${deviceId}:${experienceId}`;
  useEffect(() => {
    if (!deviceId) return;
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, number>;
      const now = Date.now();
      const live = new Set<AttendanceType>();
      (['checkin', 'going', 'interested'] as AttendanceType[]).forEach(t => {
        const ts = raw[t];
        if (ts && now - ts < 30 * 60 * 1000) live.add(t);
      });
      setMine(live);
    } catch { /* noop */ }
  }, [deviceId, key]);

  const onClick = async (type: AttendanceType) => {
    const active = mine.has(type);
    try {
      await toggle.mutateAsync({ type, active });
      const next = new Set(mine);
      const stored = (() => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } })();
      if (active) {
        next.delete(type);
        delete stored[type];
        toast.success(`Removed ${type === 'checkin' ? 'check-in' : type}`);
      } else {
        next.add(type);
        stored[type] = Date.now();
        toast.success(type === 'checkin' ? '✅ Checked in' : type === 'going' ? '🙋 Going' : '⭐ Interested');
      }
      localStorage.setItem(key, JSON.stringify(stored));
      setMine(next);
    } catch (e: any) {
      toast.error(e?.message || 'Could not update — try again');
    }
  };

  const Btn = ({ type, icon, label, count }: { type: AttendanceType; icon: React.ReactNode; label: string; count: number }) => {
    const active = mine.has(type);
    return (
      <button
        onClick={() => onClick(type)}
        disabled={toggle.isPending}
        className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-md border transition-all ${
          active
            ? 'bg-primary/15 border-primary/50 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.4)]'
            : 'bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/30'
        }`}
        title={`${label} (live · 30m)`}
      >
        {icon}
        <span>{label}</span>
        <span className={`px-1 rounded ${active ? 'bg-primary/25 text-primary' : 'bg-background/40'}`}>{count}</span>
      </button>
    );
  };

  return (
    <div className="pt-2 mt-1 border-t border-border/40 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Btn type="checkin" icon={<CheckCircle className="w-3 h-3" />} label="Check-in" count={counts.checkin} />
        <Btn type="going" icon={<Users className="w-3 h-3" />} label="Going" count={counts.going} />
        <Btn type="interested" icon={<Star className="w-3 h-3" />} label="Interested" count={counts.interested} />
      </div>
      <p className="text-[9px] text-muted-foreground/70 text-center">Live counts · auto-clear after 30 min · one tap per device</p>
    </div>
  );
};

const ExperiencesPage = () => {
  const [cat, setCat] = useState<string>('all');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch, 250);
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
  });
  const { data: experiences, isLoading, isError, error, refetch } = useExperiences(cat);
  const { data: syncStatus } = useExperiencesSyncStatus();
  const triggerSync = useTriggerSync();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { data: attendanceMap } = useAllExperienceAttendance();

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, { timeout: 4000 }
    );
  }, []);

  // Auto-sync silently if data is stale (>6h) or never synced. Removes need for manual button.
  useEffect(() => {
    if (!syncStatus) return;
    const last = syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt).getTime() : 0;
    const stale = Date.now() - last > 6 * 60 * 60 * 1000;
    if (stale && !triggerSync.isPending) {
      triggerSync.mutateAsync().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus?.lastSyncedAt]);

  const persistSaved = (next: string[]) => {
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };
  const saveCurrent = () => {
    const q = search.trim();
    if (!q) return;
    if (saved.includes(q)) return;
    persistSaved([q, ...saved].slice(0, 6));
    toast.success('Search saved');
  };
  const removeSaved = (s: string) => persistSaved(saved.filter(x => x !== s));

  const results = useMemo(() => {
    if (!experiences) return [];
    const q = search.trim().toLowerCase();
    let list = experiences.filter(x => {
      if (!q) return true;
      return (
        x.name.toLowerCase().includes(q) ||
        x.area.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q) ||
        (x.description?.toLowerCase().includes(q) ?? false)
      );
    });
    if (coords) {
      list = [...list].sort((a, b) => {
        const da = a.lat != null && a.lng != null ? haversine(coords.lat, coords.lng, a.lat, a.lng) : Infinity;
        const db = b.lat != null && b.lng != null ? haversine(coords.lat, coords.lng, b.lat, b.lng) : Infinity;
        return da - db;
      });
    }
    return list;
  }, [experiences, search, coords]);

  const distLabel = (lat: number | null, lng: number | null) => {
    if (!coords || lat == null || lng == null) return null;
    const km = haversine(coords.lat, coords.lng, lat, lng);
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  return (
    <div className="min-h-screen relative">
      {/* Wallpaper */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${wallpaper})` }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-background/82 backdrop-blur-[2px]" aria-hidden />

      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground mb-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> Experiences
            </h1>
            <p className="text-muted-foreground text-sm">
              Beyond clubs — workshops, pop-ups, markets, food, lounges & street events.
              {coords && <span className="ml-1 inline-flex items-center gap-1 text-primary/80"><Navigation className="w-3 h-3" /> sorted by distance</span>}
            </p>
          </div>
          <Link to="/experiences/submit">
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
              <Plus className="w-4 h-4" /> Submit
            </Button>
          </Link>
        </motion.div>

        {/* Unified search */}
        <div className="glass rounded-xl p-3 mb-3 border border-border/40 space-y-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={rawSearch}
              onChange={e => setRawSearch(e.target.value)}
              placeholder="Search name, area, vibe…"
              className="border-0 bg-transparent focus-visible:ring-0 h-8 px-0"
            />
            {rawSearch && (
              <button onClick={() => setRawSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
            <Button
              size="sm" variant="ghost"
              onClick={saveCurrent}
              disabled={!search.trim() || saved.includes(search.trim())}
              className="h-8 px-2 gap-1 text-xs"
            >
              <BookmarkPlus className="w-3.5 h-3.5" /> Save
            </Button>
          </div>
          {saved.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
              <span className="text-[10px] uppercase text-muted-foreground tracking-wider self-center mr-1">Saved</span>
              {saved.map(s => (
                <span key={s} className="inline-flex items-center gap-1 bg-primary/10 hover:bg-primary/20 transition-colors text-foreground text-xs rounded-full pl-2.5 pr-1 py-0.5">
                  <button onClick={() => setRawSearch(s)} className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-primary" /> {s}
                  </button>
                  <button onClick={() => removeSaved(s)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sync status (auto, no manual button) */}
        <div className="rounded-xl px-3 py-1.5 mb-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          {triggerSync.isPending ? (
            <><RefreshCw className="w-3 h-3 animate-spin text-primary" /> Refreshing in background…</>
          ) : syncStatus?.lastSyncedAt ? (
            <><CheckCircle2 className="w-3 h-3 text-primary" /> Auto-synced {formatDistanceToNow(new Date(syncStatus.lastSyncedAt), { addSuffix: true })} · {syncStatus.approvedCount} spots</>
          ) : (
            <><Clock className="w-3 h-3" /> Preparing fresh data…</>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const active = cat === c.key;
            return (
              <Button
                key={c.key} size="sm"
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
          <>
            <LogoSkeleton className="mb-4" label="Pulling fresh experiences…" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : isError ? (
          <div className="glass rounded-xl p-10 text-center space-y-4 border border-destructive/30">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <div>
              <p className="font-display font-semibold text-foreground">Couldn't load experiences</p>
              <p className="text-muted-foreground text-sm mt-1">
                {(error as any)?.message || 'Network error. Check your connection and try again.'}
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline" className="gap-1.5">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center space-y-4">
            <Sparkles className="w-8 h-8 text-primary mx-auto" />
            <div>
              <p className="font-display font-semibold text-foreground">
                {search ? 'No matches' : cat === 'all' ? 'Nothing here yet' : `No ${cat.replace('_', ' ')} spots yet`}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {search
                  ? 'Try a different search or clear filters.'
                  : 'The background sync pulls real spots every 6 hours. Trigger one now or add your own.'}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Link to="/experiences/submit">
                <Button className="gradient-primary text-primary-foreground gap-1">
                  <Plus className="w-4 h-4" /> Add an experience
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((x, i) => {
              const d = distLabel(x.lat, x.lng);
              const open = getOpenStatus(x.opening_hours);
              const att = attendanceMap?.[x.id] ?? { checkin: 0, going: 0, interested: 0 };
              return (
                <motion.div
                  key={x.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="glass rounded-xl overflow-hidden border border-border/40 hover:border-primary/40 transition-colors"
                >
                  <div className="relative w-full h-36 overflow-hidden bg-muted/30">
                    <img
                      src={x.image_url || logoUrl}
                      alt={x.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = logoUrl; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-semibold text-foreground text-sm leading-tight">
                        <Highlight text={x.name} q={search} />
                      </h3>
                      <Badge variant="secondary" className="text-[9px] uppercase shrink-0">{x.category}</Badge>
                    </div>
                    {open && (
                      <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${open.isOpen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-destructive/15 text-destructive'}`}>
                        {open.isOpen ? <DoorOpen className="w-3 h-3" /> : <DoorClosed className="w-3 h-3" />}
                        {open.label}
                      </div>
                    )}
                    {x.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <Highlight text={x.description} q={search} />
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> <Highlight text={x.area} q={search} /></span>
                      {d && <span className="text-primary/80">· {d} away</span>}
                      {x.start_date && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(x.start_date), 'd MMM')}</span>
                      )}
                    </div>
                    {(x.registration_url || x.website) && (
                      <a href={x.registration_url || x.website || '#'} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        {x.registration_url ? 'Register' : 'Visit'} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <AttendanceBar experienceId={x.id} counts={att} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ExperiencesPage;
