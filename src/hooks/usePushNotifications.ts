import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from '@/lib/pushConfig';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useCountry } from '@/contexts/CountryContext';
import { areSceneNotificationsEnabled, notifyScene } from '@/utils/notificationEngine';

export const usePushNotifications = () => {
  const notifiedPullingUp = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  const deviceId = useDeviceId();
  const { country } = useCountry();

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const showNotification = useCallback((title: string, body: string, url?: string) => {
    void notifyScene({ title, body, url });
  }, []);

  // --- REGISTER FOR BACKGROUND WEB PUSH ---
  // Runs once permission is granted; stores the browser subscription so the
  // scheduled edge function can push notifications even when the app is closed.
  const registerWebPush = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      if (Notification.permission !== 'granted') return;
      if (!areSceneNotificationsEnabled()) return;
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }
      await supabase.functions.invoke('push-subscribe', {
        body: {
          subscription: sub.toJSON(),
          device_id: deviceId,
          country,
          user_id: user?.id ?? null,
        },
      });
    } catch (e) {
      console.warn('web-push register failed', e);
    }
  }, [user, deviceId, country]);

  useEffect(() => {
    if (areSceneNotificationsEnabled() && 'Notification' in window && Notification.permission === 'granted') {
      void registerWebPush();
    }
  }, [registerWebPush]);

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
          const row = payload.new;
          const clubId = row?.club_id;
          if (!row || row.user_id === user?.id || row.is_hidden) return;

          const [{ data: club }, { data: profile }] = await Promise.all([
            clubId
              ? supabase.from('clubs').select('name').eq('id', clubId).maybeSingle()
              : Promise.resolve({ data: null }),
            row.user_id
              ? supabase.from('profiles').select('username').eq('user_id', row.user_id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);
          const channelName = typeof row.channel_id === 'string'
            ? row.channel_id === 'global'
              ? 'Community Hub'
              : row.channel_id.replace(/[-_]/g, ' ').replace(/\b\w/g, (character: string) => character.toUpperCase())
            : 'Community Hub';
          const sender = row.sender_name || profile?.username || 'Someone';
          const content = typeof row.content === 'string' ? row.content.replace(/\s+/g, ' ').trim() : '';
          showNotification(
            `SCENE Pulse: ${club?.name || channelName}`,
            `${sender}: ${content ? `${content.slice(0, 120)}${content.length > 120 ? '…' : ''}` : 'Sent a message'}`,
            clubId ? `/club/${clubId}` : '/chat'
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification, user?.id]);

  // --- CREW CHECK-IN NOTIFICATIONS ---
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('push-crew-checkins')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crew_messages' },
        async (payload) => {
          const row = payload.new;
          if (!row?.crew_id || !row?.user_id || row.user_id === user.id || row.message_type !== 'location_drop') return;

          const { data: membership, error: membershipError } = await supabase
            .from('crew_members')
            .select('crew_id')
            .eq('crew_id', row.crew_id)
            .eq('user_id', user.id)
            .maybeSingle();
          if (membershipError) {
            console.error('Could not verify crew notification membership', membershipError);
            return;
          }
          if (!membership) return;

          const [{ data: profile, error: profileError }, venueResult] = await Promise.all([
            supabase.from('profiles').select('username').eq('user_id', row.user_id).maybeSingle(),
            row.metadata?.venue_id
              ? supabase.from('clubs').select('name').eq('id', row.metadata.venue_id).maybeSingle()
              : Promise.resolve({ data: null, error: null }),
          ]);
          if (profileError) {
            console.error('Could not load crew check-in sender', profileError);
            return;
          }
          if (venueResult.error) {
            console.error('Could not load crew check-in venue', venueResult.error);
            return;
          }

          showNotification(
            'Crew Check-In 📍',
            `${profile?.username || 'A crew member'} just dropped a pin at ${venueResult.data?.name || 'a location'}.`,
            '/crews'
          );
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [showNotification, user]);

  // --- FAVORITE / SAVED CLUB NOTIFICATIONS ---
  useEffect(() => {
    const channel = supabase
      .channel('push-favorites')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'favorites' },
        async (payload) => {
          const clubId = payload.new?.club_id;
          if (!clubId) return;

          const { data: club } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', clubId)
            .maybeSingle();
          if (!club) return;

          showNotification(
            `❤️ ${club.name} saved!`,
            'You saved this spot — we\'ll keep you posted on the vibe!',
            `/club/${clubId}`
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  // --- DJ/MUSIC RATING NOTIFICATIONS ---
  useEffect(() => {
    const channel = supabase
      .channel('push-club-ratings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'club_ratings' },
        async (payload) => {
          const clubId = payload.new?.club_id;
          const djRating = payload.new?.dj_rating;
          const musicRating = payload.new?.music_rating;
          if (!clubId) return;

          const { data: club } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', clubId)
            .maybeSingle();
          if (!club) return;

          if (djRating >= 4 || musicRating >= 4) {
            showNotification(
              `🎧 ${club.name} just got fire ratings!`,
              `DJ: ${djRating}/5 | Music: ${musicRating}/5 — sounds like a great night!`,
              `/club/${clubId}`
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  // --- COMMUNITY SUGGESTION NOTIFICATIONS ---
  useEffect(() => {
    const channel = supabase
      .channel('push-pending-clubs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pending_clubs' },
        async (payload) => {
          const name = payload.new?.name;
          const area = payload.new?.area;
          if (!name) return;

          showNotification(
            `📍 New spot suggested: ${name}`,
            `Someone suggested ${name} in ${area || 'your area'} — pending review!`,
            '/admin'
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pending_clubs' },
        async (payload) => {
          const status = payload.new?.status;
          const name = payload.new?.name;
          const id = payload.new?.id;
          if (!name || !status) return;

          if (status === 'approved') {
            showNotification(
              `🎉 ${name} is now live!`,
              'A community spot just got approved — check it out!',
              `/club/${id}`
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  // --- GAMIFICATION NOTIFICATIONS ---
  useEffect(() => {
    const channel = supabase
      .channel('push-user-badges')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_badges' },
        async (payload) => {
          const badgeType = payload.new?.badge_type;
          if (!badgeType) return;

          showNotification(
            `🏅 New Badge Earned!`,
            `You just unlocked the "${badgeType}" badge — keep going!`,
            '/leaderboard'
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showNotification]);

  return { requestPermission, showNotification };
};
