import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceId } from './useDeviceId';
import { useAuth } from './useAuth';

export type AttendanceType = 'checkin' | 'going' | 'interested';

/** 30-minute decay matches vibes — keeps numbers real-time and trustworthy. */
const WINDOW_MS = 30 * 60 * 1000;

type Row = {
  id: string;
  experience_id: string;
  device_id: string;
  user_id: string | null;
  type: AttendanceType;
  created_at: string;
};

export const useExperienceAttendance = (experienceId: string) => {
  const qc = useQueryClient();
  const deviceId = useDeviceId();

  const query = useQuery({
    queryKey: ['exp-attendance', experienceId],
    queryFn: async () => {
      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const { data, error } = await (supabase as any)
        .from('experience_attendances')
        .select('id, experience_id, device_id, user_id, type, created_at')
        .eq('experience_id', experienceId)
        .gte('created_at', since);
      if (error) throw error;
      return (data || []) as Row[];
    },
    enabled: !!experienceId,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!experienceId) return;
    const ch = supabase
      .channel(`exp-att-${experienceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'experience_attendances', filter: `experience_id=eq.${experienceId}` }, () => {
        qc.invalidateQueries({ queryKey: ['exp-attendance', experienceId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [experienceId, qc]);

  const rows = query.data ?? [];
  const counts = {
    checkin: rows.filter(r => r.type === 'checkin').length,
    going: rows.filter(r => r.type === 'going').length,
    interested: rows.filter(r => r.type === 'interested').length,
  };
  const mine = new Set(rows.filter(r => r.device_id === deviceId).map(r => r.type));

  return { ...query, counts, mine };
};

export const useAllExperienceAttendance = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['exp-attendance-all'],
    queryFn: async () => {
      const since = new Date(Date.now() - WINDOW_MS).toISOString();
      const { data, error } = await (supabase as any)
        .from('experience_attendances')
        .select('experience_id, type, created_at')
        .gte('created_at', since);
      if (error) throw error;
      const map: Record<string, { checkin: number; going: number; interested: number }> = {};
      (data || []).forEach((r: any) => {
        const m = (map[r.experience_id] ||= { checkin: 0, going: 0, interested: 0 });
        if (r.type === 'checkin') m.checkin++;
        else if (r.type === 'going') m.going++;
        else if (r.type === 'interested') m.interested++;
      });
      return map;
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const ch = supabase
      .channel('exp-att-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'experience_attendances' }, () => {
        qc.invalidateQueries({ queryKey: ['exp-attendance-all'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return query;
};

export const useToggleAttendance = (experienceId: string) => {
  const qc = useQueryClient();
  const deviceId = useDeviceId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ type, active }: { type: AttendanceType; active: boolean }) => {
      if (!deviceId) throw new Error('Device not identified');
      if (active) {
        // Remove current user's marker of this type (within the 30m window)
        const since = new Date(Date.now() - WINDOW_MS).toISOString();
        const q = (supabase as any)
          .from('experience_attendances')
          .delete()
          .eq('experience_id', experienceId)
          .eq('type', type)
          .gte('created_at', since);
        const { error } = user ? await q.eq('user_id', user.id) : await q.eq('device_id', deviceId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('experience_attendances')
          .insert({
            experience_id: experienceId,
            device_id: deviceId,
            user_id: user?.id ?? null,
            type,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exp-attendance', experienceId] });
      qc.invalidateQueries({ queryKey: ['exp-attendance-all'] });
    },
  });
};