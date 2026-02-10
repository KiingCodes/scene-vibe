import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch {
    console.warn('SW registration failed');
    return null;
  }
};

export const usePushNotifications = () => {
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null);
  const notifiedTrending = useRef<Set<string>>(new Set());

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
        icon: '/favicon.ico',
        data: { url: url || '/' },
      } as NotificationOptions);
    } else {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, [requestPermission]);

  useEffect(() => {
    registerServiceWorker().then(reg => {
      swRegistration.current = reg;
    });

    // Ask for permission on first load
    if ('Notification' in window && Notification.permission === 'default') {
      // Delay permission request slightly for better UX
      const timer = setTimeout(() => {
        requestPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [requestPermission]);

  // Listen for trending events via realtime
  useEffect(() => {
    const channel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vibes' },
        async (payload) => {
          const clubId = payload.new?.club_id;
          if (!clubId) return;

          const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
          const { count } = await supabase
            .from('vibes')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', clubId)
            .gte('created_at', twentyMinutesAgo);

          if (count && count >= 3 && !notifiedTrending.current.has(clubId)) {
            notifiedTrending.current.add(clubId);
            const { data: club } = await supabase
              .from('clubs')
              .select('name')
              .eq('id', clubId)
              .maybeSingle();

            if (club) {
              showNotification(
                `🔥 ${club.name} is TRENDING!`,
                'The party is heating up — check it out!',
                `/club/${clubId}`
              );
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  return { requestPermission, showNotification };
};
