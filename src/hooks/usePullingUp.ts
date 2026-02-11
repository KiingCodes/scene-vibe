import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceId } from './useDeviceId';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const usePullingUpCount = (clubId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pulling-up', clubId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('pulling_up')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .gte('expires_at', new Date().toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!clubId,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`pulling-up-${clubId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pulling_up', filter: `club_id=eq.${clubId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['pulling-up', clubId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clubId, queryClient]);

  return query;
};

export const useAllPullingUp = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['all-pulling-up'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pulling_up')
        .select('club_id')
        .gte('expires_at', new Date().toISOString());
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(v => { counts[v.club_id] = (counts[v.club_id] || 0) + 1; });
      return counts;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('all-pulling-up-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pulling_up' }, () => {
        queryClient.invalidateQueries({ queryKey: ['all-pulling-up'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
};

export const useHasPulledUp = (clubId: string) => {
  const deviceId = useDeviceId();

  return useQuery({
    queryKey: ['has-pulled-up', clubId, deviceId],
    queryFn: async () => {
      if (!deviceId) return false;
      const { data, error } = await supabase
        .from('pulling_up')
        .select('id')
        .eq('club_id', clubId)
        .eq('device_id', deviceId)
        .gte('expires_at', new Date().toISOString())
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!clubId && !!deviceId,
  });
};

export const usePullUp = () => {
  const queryClient = useQueryClient();
  const deviceId = useDeviceId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ clubId, etaMinutes }: { clubId: string; etaMinutes: number }) => {
      const expiresAt = new Date(Date.now() + etaMinutes * 60 * 1000).toISOString();
      const { error } = await supabase.from('pulling_up').insert({
        club_id: clubId,
        device_id: deviceId,
        user_id: user?.id,
        eta_minutes: etaMinutes,
        expires_at: expiresAt,
      });
      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ['pulling-up', clubId] });
      queryClient.invalidateQueries({ queryKey: ['has-pulled-up', clubId] });
      queryClient.invalidateQueries({ queryKey: ['all-pulling-up'] });
    },
  });
};
