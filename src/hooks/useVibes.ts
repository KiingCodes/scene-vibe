import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceId } from './useDeviceId';
import { useAuth } from './useAuth';
import { useEffect } from 'react';
import { useAwardPoints } from '@/hooks/useGamification';

export const useVibeCount = (clubId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['vibes', clubId],
    queryFn: async () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('vibes')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .gte('created_at', thirtyMinutesAgo);

      if (error) throw error;

      return count ?? 0;
    },
    enabled: !!clubId,
  });

  useEffect(() => {
    if (!clubId) return;

    const channel = supabase
      .channel(`vibes-${clubId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vibes',
          filter: `club_id=eq.${clubId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['vibes', clubId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId, queryClient]);

  return query;
};

export const useAllVibes = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['all-vibes'],
    queryFn: async () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('vibes')
        .select('club_id')
        .gte('created_at', thirtyMinutesAgo);

      if (error) throw error;

      const counts: Record<string, number> = {};

      data?.forEach((v) => {
        counts[v.club_id] = (counts[v.club_id] || 0) + 1;
      });

      return counts;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('all-vibes-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vibes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-vibes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};


// Global cooldown: device can only vibe once every 30 minutes
export const useHasVibed = (clubId: string) => {
  const deviceId = useDeviceId();

  return useQuery({
    queryKey: ['has-vibed-global', deviceId],
    queryFn: async () => {
      if (!deviceId) return false;

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('vibes')
        .select('id')
        .eq('device_id', deviceId)
        .gte('created_at', thirtyMinutesAgo)
        .limit(1);

      if (error) throw error;

      return (data?.length ?? 0) > 0;
    },
    enabled: !!deviceId && !!clubId,
  });
};


export const useVibe = () => {
  const queryClient = useQueryClient();
  const deviceId = useDeviceId();
  const { user } = useAuth();
  const awardPoints = useAwardPoints();

  return useMutation({
    mutationFn: async (clubId: string) => {
      if (!deviceId) throw new Error('Device not identified');

      const { error } = await supabase.from('vibes').insert({
        club_id: clubId,
        device_id: deviceId,
        user_id: user?.id ?? null,
      });

      if (error) throw error;
    },

    onSuccess: async (_, clubId) => {
      // Award points only for logged-in users
      if (user) {
        awardPoints.mutate({ action: 'vibe' });
      }

      queryClient.invalidateQueries({ queryKey: ['vibes', clubId] });
      queryClient.invalidateQueries({ queryKey: ['has-vibed-global'] });
      queryClient.invalidateQueries({ queryKey: ['all-vibes'] });

      if (user) {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['user-points'] });
      }
    },
  });
};
