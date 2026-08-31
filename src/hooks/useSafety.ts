import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ARRIVAL_RADIUS_M, STALE_PING_MS, distanceMeters } from '@/lib/geo';

export type SafetySession = {
  id: string;
  user_id: string;
  status: 'active' | 'completed' | 'escalated';
  current_lat: number | null;
  current_lng: number | null;
  destination_lat: number;
  destination_lng: number;
  destination_label: string | null;
  battery_level: number | null;
  eta_minutes: number;
  last_ping_at: string;
  expires_at: string;
  duress_flagged: boolean;
  escalated_at: string | null;
  created_at: string;
};

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
        .from('safety_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['active', 'escalated'])
        .gt('expires_at', new Date().toISOString())
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
      destination_lat: number;
      destination_lng: number;
      destination_label?: string;
      eta_minutes: number;
      current_lat?: number | null;
      current_lng?: number | null;
    }) => {
      if (!user) throw new Error('Sign in required');
      const { data, error } = await supabase
        .from('safety_sessions')
        .insert({
          user_id: user.id,
          destination_lat: input.destination_lat,
          destination_lng: input.destination_lng,
          destination_label: input.destination_label ?? null,
          eta_minutes: input.eta_minutes,
          current_lat: input.current_lat ?? null,
          current_lng: input.current_lng ?? null,
          expires_at: new Date(Date.now() + (input.eta_minutes + 120) * 60 * 1000).toISOString(),
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('safety_sessions')
        .update({ status: 'completed' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-session'] }),
  });
};

/** Fires the emergency SMS escalation edge function. */
export const triggerSafetyEscalation = async (
  sessionId: string,
  reason: 'duress' | 'stale' | 'manual',
) => {
  try {
    await supabase.functions.invoke('safety-alert', {
      body: { sessionId, reason, origin: window.location.origin },
    });
  } catch {
    // Never let escalation failure break the UI.
  }
};

/* ------------------------------------------------------------------ tracking */

async function readBattery(): Promise<number | null> {
  try {
    // deno-lint-ignore no-explicit-any
    const nav = navigator as any;
    if (typeof nav.getBattery !== 'function') return null;
    const b = await nav.getBattery();
    return Math.round(b.level * 100);
  } catch {
    return null;
  }
}

/**
 * Streams high-accuracy position + battery to Supabase every 10 seconds while a
 * session is active, auto-completes within 50m of the destination and escalates
 * if position updates stop for more than 3 minutes.
 */
export const useSafetyTracker = (session: SafetySession | null) => {
  const qc = useQueryClient();
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastSent = useRef(0);
  const lastFix = useRef(Date.now());
  const escalated = useRef(false);
  const activeId = session?.status === 'active' ? session.id : null;

  useEffect(() => {
    escalated.current = false;
    lastFix.current = Date.now();
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !('geolocation' in navigator)) return;
    const dest = { lat: session!.destination_lat, lng: session!.destination_lng };

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        setPosition(pos);
        setError(null);
        lastFix.current = Date.now();

        const now = Date.now();
        const { latitude, longitude } = pos.coords;
        const arrived = distanceMeters(latitude, longitude, dest.lat, dest.lng) <= ARRIVAL_RADIUS_M;
        if (now - lastSent.current < 10000 && !arrived) return;
        lastSent.current = now;

        const battery = await readBattery();
        await supabase
          .from('safety_sessions')
          .update({
            current_lat: latitude,
            current_lng: longitude,
            battery_level: battery,
            last_ping_at: new Date().toISOString(),
            ...(arrived ? { status: 'completed' as const } : {}),
          })
          .eq('id', activeId);

        if (arrived) qc.invalidateQueries({ queryKey: ['safety-session'] });
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    const watchdog = window.setInterval(() => {
      if (escalated.current) return;
      if (Date.now() - lastFix.current > STALE_PING_MS) {
        escalated.current = true;
        triggerSafetyEscalation(activeId, 'stale');
        qc.invalidateQueries({ queryKey: ['safety-session'] });
      }
    }, 30000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(watchdog);
    };
  }, [activeId, session?.destination_lat, session?.destination_lng, qc]);

  return { position, error };
};

/** Realtime subscription used by the public /track/:id page. */
export const usePublicSafetySession = (sessionId?: string) => {
  const [session, setSession] = useState<SafetySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from('safety_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    setSession((data as SafetySession | null) ?? null);
    setNotFound(!data);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`safety-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'safety_sessions', filter: `id=eq.${sessionId}` },
        (payload) => setSession(payload.new as SafetySession),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, loading, notFound, reload: load };
};
