import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, Filter, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllRead,
  useMarkNotificationRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES: { key: string; label: string; match: (t: string) => boolean }[] = [
  { key: 'all',        label: 'All',            match: () => true },
  { key: 'unread',     label: 'Unread',         match: () => true }, // handled separately
  { key: 'social',     label: 'Social',         match: t => ['follow','unfollow','crew_invite','crew_join','crew_vote'].includes(t) },
  { key: 'activity',   label: 'My activity',    match: t => ['vibe','pulling_up','favorite','checkin','going','interested'].includes(t) },
  { key: 'venue',      label: 'Venues',         match: t => ['trending','spot_approved','spot_rejected','experience','experience_approved','experience_rejected','promotion','promotion_approved','promotion_rejected'].includes(t) },
  { key: 'content',    label: 'Content',        match: t => ['video_like','video_comment','video_reaction','chat_message','review','rating','feedback'].includes(t) },
  { key: 'system',     label: 'System',         match: t => ['version_update','level_up','achievement','badge','warning','report'].includes(t) },
];

const NotificationsPage = () => {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const markOne = useMarkNotificationRead();
  const del = useDeleteNotification();
  const [cat, setCat] = useState('all');

  const filtered = useMemo(() => {
    const list = notifications ?? [];
    if (cat === 'unread') return list.filter(n => !n.read);
    const cfg = CATEGORIES.find(c => c.key === cat);
    if (!cfg || cat === 'all') return list;
    return list.filter(n => cfg.match(n.type));
  }, [notifications, cat]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-3 mb-5"
        >
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" /> Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Everything happening around your account — vibes, follows, check-ins & system events.
            </p>
          </div>
          {unread > 0 && (
            <Button size="sm" onClick={() => markAll.mutate()} variant="outline" className="gap-1.5">
              <Check className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </motion.div>

        {!user ? (
          <div className="glass rounded-xl p-10 text-center border border-border/40">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Sign in to see your activity feed</p>
            <p className="text-sm text-muted-foreground mt-1">Every action you take gets logged here.</p>
            <Link to="/auth"><Button className="mt-4 gradient-primary text-primary-foreground">Sign in</Button></Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    cat === c.key
                      ? 'bg-primary/15 border-primary/50 text-primary'
                      : 'border-border/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.label}
                  {c.key === 'unread' && unread > 0 && (
                    <Badge className="ml-1.5 h-4 px-1 text-[9px] bg-secondary text-secondary-foreground">{unread}</Badge>
                  )}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 glass rounded-lg animate-pulse border border-border/40" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-xl p-10 text-center border border-border/40">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications in this category yet.</p>
              </div>
            ) : (
              <div className="glass rounded-xl border border-border/40 divide-y divide-border/30 overflow-hidden">
                <AnimatePresence initial={false}>
                  {filtered.map(n => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`group px-4 py-3 flex items-start gap-3 ${n.read ? '' : 'bg-primary/5'}`}
                    >
                      <div className="flex-1 min-w-0">
                        {n.link ? (
                          <Link to={n.link} onClick={() => markOne.mutate(n.id)} className="block">
                            <p className={`text-sm ${n.read ? 'text-foreground/90' : 'font-semibold text-foreground'}`}>{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                          </Link>
                        ) : (
                          <button onClick={() => markOne.mutate(n.id)} className="block text-left w-full">
                            <p className={`text-sm ${n.read ? 'text-foreground/90' : 'font-semibold text-foreground'}`}>{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                          </button>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1.5">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-muted/40 text-[9px] uppercase tracking-wider">{n.type.replace(/_/g,' ')}</span>
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={() => del.mutate(n.id)}
                        className="opacity-60 hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;