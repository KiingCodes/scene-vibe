import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SafetySession = {
  id: string;
  user_id: string;
  status: 'active' | 'completed' | 'alert';
  start_lat: number;
  start_lng: number;
  current_lat: number | null;
  current_lng: number | null;
  destination_name: string;
  eta_minutes: number;
  share_token: string;
  created_at: string;
  updated_at: string;
};

type PublicSafetySession = Pick<
  SafetySession,
  'id' | 'status' | 'start_lat' | 'start_lng' | 'current_lat' | 'current_lng' | 'destination_name' | 'eta_minutes' | 'created_at' | 'updated_at'
>;

export type EmergencyContact = {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
};

export const DURESS_PIN = '9999';
const PIN_KEY = 'scene_safe_pin';

export const getSafePin = () => localStorage.getItem(PIN_KEY) || '';
export const setSafePin = (pin: string) => localStorage.setItem(PIN_KEY, pin);

/* ------------------------------------------------------------------ contacts */

export const useEmergencyContacts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['emergency-contacts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as EmergencyContact[];
    },
  });
};

export const useAddEmergencyContact = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, phone_number }: { name: string; phone_number: string }) => {
      if (!user) throw new Error('Sign in required');
      const { error } = await supabase
        .from('emergency_contacts')
        .insert({ user_id: user.id, name, phone_number });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-contacts'] }),
  });
};

export const useDeleteEmergencyContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-contacts'] }),
  });
};

/* ------------------------------------------------------------------ sessions */

export const useActiveSafetySession = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['safety-session', user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('walk_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['active', 'alert'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as SafetySession | null) ?? null;
    },
  });
};

export const useStartSafetySession = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      destination_name: string;
      start_lat: number;
      start_lng: number;
      eta_minutes: number;
    }) => {
      if (!user) throw new Error('Sign in required');
      const { data, error } = await supabase
        .from('walk_sessions')
        .insert({
          user_id: user.id,
          destination_name: input.destination_name,
          eta_minutes: input.eta_minutes,
          start_lat: input.start_lat,
          start_lng: input.start_lng,
          current_lat: input.start_lat,
          current_lng: input.start_lng,
          share_token: crypto.randomUUID(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as SafetySession;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-session'] }),
  });
};

export const useEndSafetySession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: SafetySession) => {
      const { error } = await supabase
        .from('walk_sessions')
        .update({ status: 'completed' })
        .eq('id', session.id);
      if (error) throw error;
      await broadcastWalkEvent(session.share_token, 'status_update', { status: 'completed' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-session'] }),
  });
};

const broadcastWalkEvent = async (
  shareToken: string,
  event: 'position_update' | 'status_update',
  payload: Record<string, number | string>,
) => {
  const channel = supabase.channel(`walk_session_${shareToken}`);
  await new Promise<void>((resolve, reject) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const result = await channel.send({ type: 'broadcast', event, payload });
        await supabase.removeChannel(channel);
        if (result !== 'ok') reject(new Error(`Walk update broadcast failed: ${result}`));
        else resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        await supabase.removeChannel(channel);
        reject(new Error(`Unable to connect to walk channel: ${status}`));
      }
    });
  });
};

export const useSetSafetyAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: SafetySession) => {
      const { error } = await supabase
        .from('walk_sessions')
        .update({ status: 'alert' })
        .eq('id', session.id);
      if (error) throw error;
      await broadcastWalkEvent(session.share_token, 'status_update', { status: 'alert' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-session'] }),
  });
};

export const triggerLocalSafetyAlert = () => {
  if ('vibrate' in navigator) navigator.vibrate([350, 120, 350, 120, 700]);
  if (typeof AudioContext === 'undefined') return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.12, context.currentTime);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.8);
  oscillator.addEventListener('ended', () => void context.close(), { once: true });
};

/** Streams location fixes to a token-scoped public channel and persists them. */
export const useSafetyTracker = (session: SafetySession | null) => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeId = session && session.status !== 'completed' ? session.id : null;
  const lastSent = useRef(0);

  useEffect(() => {
    if (!activeId) return;
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available on this device.');
      return;
    }

    let cancelled = false;
    lastSent.current = 0;
    const channel = supabase.channel(`walk_session_${session.share_token}`, {
      config: { broadcast: { self: true } },
    });
    const channelReady = new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError(`Unable to connect to walk channel: ${status}`);
          reject(new Error(`Unable to connect to walk channel: ${status}`));
        }
      });
    });
    void channelReady.catch(() => undefined);

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        setPosition(pos);
        setError(null);
        const now = Date.now();
        if (now - lastSent.current < 5000) return;
        lastSent.current = now;

        const { latitude, longitude } = pos.coords;
        const updatedAt = new Date(now).toISOString();
        try {
          await channelReady;
        } catch {
          return;
        }
        if (cancelled) return;
        try {
          const [persist, result] = await Promise.all([
            supabase
              .from('walk_sessions')
              .update({ current_lat: latitude, current_lng: longitude, updated_at: updatedAt })
              .eq('id', activeId),
            channel.send({
              type: 'broadcast',
              event: 'position_update',
              payload: { current_lat: latitude, current_lng: longitude, updated_at: updatedAt },
            }),
          ]);
          if (persist.error) throw new Error(`Could not save location: ${persist.error.message}`);
          if (result !== 'ok') throw new Error(`Walk update broadcast failed: ${result}`);
        } catch (updateError) {
          setError((updateError as Error).message);
        }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
      supabase.removeChannel(channel);
    };
  }, [activeId, session?.share_token]);

  return { position, error };
};

/** Loads a public walk with its bearer token and listens for live broadcasts. */
export const usePublicSafetySession = (sessionId?: string) => {
  const [session, setSession] = useState<PublicSafetySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    if (!sessionId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    supabase
      .rpc('get_public_walk_session', { p_share_token: sessionId })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setNotFound(true);
          setSession(null);
        } else {
          const result = (data?.[0] as PublicSafetySession | undefined) ?? null;
          setSession(result);
          setNotFound(!result);
        }
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`walk_session_${sessionId}`)
      .on('broadcast', { event: 'position_update' }, ({ payload }) => {
        setSession((current) => current ? {
          ...current,
          current_lat: Number(payload.current_lat),
          current_lng: Number(payload.current_lng),
          updated_at: String(payload.updated_at),
        } : current);
      })
      .on('broadcast', { event: 'status_update' }, ({ payload }) => {
        setSession((current) => current ? { ...current, status: payload.status as SafetySession['status'] } : current);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, loading, notFound };
};
