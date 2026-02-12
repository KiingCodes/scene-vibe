import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const getServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch {
    console.warn('SW not available');
    return null;
  }
};

export const usePushNotifications = () => {
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null);
  const notifiedTrending = useRef<Set<string>>(new Set());
  const notifiedPullingUp = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const showNotification = useCallback(async (title: string, body: string, url?: string) => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    if (swRegistration.current) {
      swRegistration.current.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url: url || '/' },
        vibrate: [100, 50, 100],
      } as NotificationOptions);
    } else {
      new Notification(title, { body, icon: '/pwa-192x192.png' });
    }
  }, [requestPermission]);

  useEffect(() => {
    getServiceWorkerRegistration().then(reg => {
      swRegistration.current = reg;
    });

    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => { requestPermission(); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [requestPermission]);

  // --- VIBE NOTIFICATIONS ---
  useEffect(() => {
    const channel = supabase
      .channel('push-vibes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vibes' },
        async (payload) => {
          const clubId = payload.new?.club_id;
          if (!clubId) return;

          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          const { count } = await supabase
            .from('vibes')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', clubId)
            .gte('created_at', thirtyMinutesAgo);

          const { data: club } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', clubId)
            .maybeSingle();
          if (!club) return;

          const vibeCount = count ?? 0;

          // 1. First vibe — club waking up
          if (vibeCount === 1) {
            showNotification(
              `👀 ${club.name} is waking up`,
              'Someone just sent a vibe — be the first to check it out!',
              `/club/${clubId}`
            );
          }

          // 2. Second vibe — energy building
          if (vibeCount === 2) {
            showNotification(
              `⚡ ${club.name} is picking up`,
              'Multiple vibes incoming — the energy is building!',
              `/club/${clubId}`
            );
          }

          // 3. Trending threshold (3+ vibes)
          if (vibeCount >= 3 && !notifiedTrending.current.has(clubId)) {
            notifiedTrending.current.add(clubId);
            showNotification(
              `🔥 ${club.name} is TRENDING!`,
              'The party is heating up — do not miss out!',
              `/club/${clubId}`
            );
          }

          // 4. On fire (5+ vibes)
          if (vibeCount === 5) {
            showNotification(
              `🚀 ${club.name} is ON FIRE!`,
              `${vibeCount} vibes and counting — this is THE spot tonight!`,
              `/club/${clubId}`
            );
          }

          // 5. Legendary night (10+ vibes)
          if (vibeCount === 10) {
            showNotification(
              `🏆 ${club.name} — LEGENDARY NIGHT`,
              `${vibeCount} vibes! This one's going down in history!`,
              `/club/${clubId}`
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  // --- PULLING UP NOTIFICATIONS ---
  useEffect(() => {
    const channel = supabase
      .channel('push-pulling-up')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pulling_up' },
        async (payload) => {
          const clubId = payload.new?.club_id;
          const eta = payload.new?.eta_minutes;
          if (!clubId) return;

          const { data: club } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', clubId)
            .maybeSingle();
          if (!club) return;

          const { count } = await supabase
            .from('pulling_up')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', clubId)
            .gte('expires_at', new Date().toISOString());

          const pullCount = count ?? 0;

          // 6. Someone pulling up
          if (pullCount === 1) {
            showNotification(
              `🚗 Someone's pulling up to ${club.name}`,
              `Arriving in ~${eta} min — the night is starting!`,
              `/club/${clubId}`
            );
          }

          // 7. Squad forming (3+ pulling up)
          if (pullCount >= 3 && !notifiedPullingUp.current.has(clubId)) {
            notifiedPullingUp.current.add(clubId);
            showNotification(
              `👥 Squad alert at ${club.name}!`,
              `${pullCount} people pulling up — the crew is assembling!`,
              `/club/${clubId}`
            );
          }

          // 8. Big crowd incoming (5+ pulling up)
          if (pullCount === 5) {
            showNotification(
              `🎉 ${club.name} is about to go OFF`,
              `${pullCount} people on their way — get there before it's packed!`,
              `/club/${clubId}`
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  // --- REVIEW NOTIFICATIONS ---
  useEffect(() => {
    const channel = supabase
      .channel('push-reviews')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        async (payload) => {
          const clubId = payload.new?.club_id;
          const rating = payload.new?.rating;
          if (!clubId) return;

          const { data: club } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', clubId)
            .maybeSingle();
          if (!club) return;

          // 9. New review with high rating
          if (rating >= 4) {
            showNotification(
              `⭐ ${club.name} just got a ${rating}-star review!`,
              'People are loving this spot — check out what they said!',
              `/club/${clubId}`
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  // --- CHAT NOTIFICATIONS ---
  useEffect(() => {
    const channel = supabase
      .channel('push-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const clubId = payload.new?.club_id;
          if (!clubId) return;

          const { data: club } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', clubId)
            .maybeSingle();
          if (!club) return;

          // 10. New chat message
          showNotification(
            `💬 New message in ${club.name} chat`,
            'Join the conversation about the vibe!',
            `/club/${clubId}`
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  return { requestPermission, showNotification };
};
