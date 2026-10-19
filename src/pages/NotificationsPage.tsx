import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Check, Radar, Sparkles, Trash2, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllRead,
  useMarkNotificationRead,
  useDeleteNotification,
  type Notification,
} from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { LogoSkeleton } from '@/components/BrandedSkeleton';

const SOCIAL_TYPES = [
  'follow', 'unfollow', 'crew_invite', 'crew_join', 'crew_vote',
  'video_like', 'video_comment', 'video_reaction', 'chat_message',
  'review', 'rating', 'feedback',
];
const ACTIVITY_TYPES = ['vibe', 'pulling_up', 'favorite', 'checkin', 'going', 'interested'];
const VENUE_TYPES = [
  'trending', 'spot_approved', 'spot_rejected', 'promotion', 'promotion_approved',
  'promotion_rejected', 'night_replay', 'replay', 'replay_approved', 'replay_rejected',
];
const SYSTEM_TYPES = ['version_update', 'level_up', 'achievement', 'badge', 'warning', 'report'];
const isVenueNotification = (type: string) =>
  VENUE_TYPES.includes(type) || type.startsWith('venue_') || type.includes('replay');

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'social', label: 'Social' },
  { key: 'activity', label: 'My activity' },
  { key: 'venue', label: 'Venues' },
];

const getNotificationGroup = (type: string) => {
  if (SYSTEM_TYPES.includes(type)) {
    return { label: '⚡ System', className: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300' };
  }
  if (isVenueNotification(type)) {
    return { label: '🔥 Venues', className: 'border-orange-500/40 bg-orange-500/20 text-orange-300' };
  }
  return { label: '🥂 Social', className: 'border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-300' };
};

const getNotificationIds = (notification: Notification) =>
  notification.groupedIds?.length ? notification.groupedIds : [notification.id];

const NotificationsPage = () => {
  const { user } = useAuth();
  const {
    data: notifications,
    isLoading,
    isError,
  } = useNotifications();
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();
  const markOne = useMarkNotificationRead();
  const del = useDeleteNotification();
  const [cat, setCat] = useState('all');

  const filtered = useMemo(() => {
    const list = notifications ?? [];
    if (cat === 'unread') return list.filter((notification) => !notification.read);
    if (cat === 'social') return list.filter((notification) => SOCIAL_TYPES.includes(notification.type));
    if (cat === 'activity') return list.filter((notification) => ACTIVITY_TYPES.includes(notification.type));
    if (cat === 'venue') return list.filter((notification) => isVenueNotification(notification.type));
    return list;
  }, [notifications, cat]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 pb-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start justify-between gap-3"
        >
          <div>
            <h1 className="flex items-center gap-2 bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-2xl font-black text-transparent">
              <Bell aria-hidden="true" className="h-6 w-6 shrink-0 text-cyan-400" /> Activity HUD
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Your squad alerts, venue updates, and weekend highlights.
            </p>
          </div>
          {user && unread > 0 && (
            <Button
              size="sm"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {markAll.isPending ? 'Marking...' : 'Mark all read'}
            </Button>
          )}
        </motion.div>

        {!user ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-10 text-center shadow-lg backdrop-blur-xl">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-cyan-400" />
            <p className="font-semibold text-white">Sign in to see your activity feed</p>
            <p className="mt-1 text-sm text-slate-400">Every action you take gets logged here.</p>
            <Link to="/auth">
              <Button className="mt-4 gradient-primary text-primary-foreground">Sign in</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setCat(category.key)}
                  aria-pressed={cat === category.key}
                  className={`shrink-0 rounded-xl border px-4 py-1.5 text-xs font-semibold transition-all ${
                    cat === category.key
                      ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {category.label}
                  {category.key === 'unread' && unread > 0 && (
                    <span className="ml-1.5 rounded-full bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] text-fuchsia-300">
                      {unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isLoading ? (
              <LogoSkeleton label="Loading notifications…" />
            ) : isError ? (
              <div role="alert" className="rounded-2xl border border-rose-400/20 bg-slate-950/80 p-8 text-center text-sm text-slate-300">
                Unable to load notifications. Please try again.
              </div>
            ) : filtered.length === 0 && (notifications?.length ?? 0) === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 px-6 py-12 text-center shadow-lg shadow-cyan-950/20 backdrop-blur-xl">
                <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border border-cyan-400/15" />
                  <span className="absolute inset-3 rounded-full border border-cyan-400/25" />
                  <span className="absolute inset-6 rounded-full border border-fuchsia-400/30" />
                  <Radar className="h-9 w-9 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
                  <span className="absolute right-5 top-5 h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.8)]" />
                </div>
                <h2 className="mb-2 text-lg font-bold text-white">You&apos;re all caught up!</h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
                  Check back later for squad alerts, venue updates, and weekend highlights.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 text-center text-sm text-slate-400">
                No notifications in this category yet.
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {filtered.map((notification) => {
                    const group = getNotificationGroup(notification.type);
                    const notificationIds = getNotificationIds(notification);
                    return (
                      <motion.article
                        key={notification.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`relative flex items-start gap-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-lg backdrop-blur-xl transition-all hover:border-white/20 ${
                          notification.read
                            ? ''
                            : 'border-l-4 border-l-[#D946EF] bg-slate-900/90 shadow-fuchsia-950/20'
                        }`}
                      >
                        <Zap className="mt-1 h-4 w-4 shrink-0 text-cyan-400/70" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {notification.link ? (
                              <Link
                                to={notification.link}
                                onClick={() => markOne.mutate(notificationIds)}
                                className={`min-w-0 flex-1 text-sm ${
                                  notification.read ? 'text-slate-200' : 'font-semibold text-white'
                                }`}
                              >
                                {notification.title}
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markOne.mutate(notificationIds)}
                                className={`min-w-0 flex-1 text-left text-sm ${
                                  notification.read ? 'text-slate-200' : 'font-semibold text-white'
                                }`}
                              >
                                {notification.title}
                              </button>
                            )}
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${group.className}`}>
                              {group.label}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {notification.body && (
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{notification.body}</p>
                          )}
                          {notification.app_version && (
                            <span className="mt-2 inline-block rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] text-cyan-300">
                              v{notification.app_version}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => del.mutate(notificationIds)}
                          disabled={del.isPending}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-rose-400 disabled:opacity-50"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.article>
                    );
                  })}
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
