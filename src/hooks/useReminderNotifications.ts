import { useEffect } from 'react';
import { areSceneNotificationsEnabled, notifyScene } from '@/utils/notificationEngine';

/**
 * Sends a friendly local reminder notification to users who:
 *  - have installed SCENE (PWA in standalone display mode), and
 *  - have granted notification permission.
 *
 * Because true background/server push requires a Web Push backend
 * (VAPID + push subscription + cron) which we don't yet have, this hook
 * fires a local notification on app open if at least 24h have passed
 * since the last reminder. This nudges installed users back into the app
 * each visit and lays the foundation for future server-side push.
 *
 * NOTE: Reminders are gated to installed users only (display-mode:
 * standalone), so non-installed/web-only users never get them.
 */
const KEY = 'scene_last_reminder_at';
const MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

const REMINDERS = [
  { title: '🌃 The scene awaits', body: "See who's vibing tonight — pick your spot." },
  { title: '🔥 Trending now', body: 'New vibes have dropped since you were last here.' },
  { title: '🎧 Friday energy', body: "Plan your night — the city's waking up." },
  { title: '✨ Don\'t miss out', body: 'Pop-ups, parties & food spots refreshed for you.' },
];

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

export const useReminderNotifications = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!areSceneNotificationsEnabled()) return;
    if (!isStandalone()) return;

    let last = 0;
    try { last = parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch { /* ignore */ }
    if (Date.now() - last < MIN_INTERVAL_MS) return;

    const pick = REMINDERS[Math.floor(Math.random() * REMINDERS.length)];

    // Delay slightly so it doesn't compete with splash/whatsnew
    const t = setTimeout(async () => {
      try {
        await notifyScene({ title: pick.title, body: pick.body, url: '/' });
        try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ }
      } catch (error) {
        console.error('Could not display SCENE reminder notification', error);
      }
    }, 8000);

    return () => clearTimeout(t);
  }, []);
};