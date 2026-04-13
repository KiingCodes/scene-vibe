import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useCrewLocations = (crewId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['crew-locations', crewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_locations')
        .select('*')
        .eq('crew_id', crewId);
      if (error) throw error;
      // Get profiles
      const userIds = data?.map(l => l.user_id) || [];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data?.map(l => ({ ...l, profile: profileMap.get(l.user_id) })) || [];
    },
    enabled: !!crewId,
    refetchInterval: 15000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`crew-locations-${crewId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_locations', filter: `crew_id=eq.${crewId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['crew-locations', crewId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [crewId, queryClient]);

  return query;
};

export const useShareLocation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ crewId, latitude, longitude }: { crewId: string; latitude: number; longitude: number }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase
        .from('crew_locations')
        .upsert(
          { crew_id: crewId, user_id: user.id, latitude, longitude, updated_at: new Date().toISOString() },
          { onConflict: 'crew_id,user_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_, { crewId }) => {
      queryClient.invalidateQueries({ queryKey: ['crew-locations', crewId] });
    },
  });
};

export const useStopSharingLocation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (crewId: string) => {
      if (!user) throw new Error('Must be signed in');
      await supabase
        .from('crew_locations')
        .delete()
        .eq('crew_id', crewId)
        .eq('user_id', user.id);
    },
    onSuccess: (_, crewId) => {
      queryClient.invalidateQueries({ queryKey: ['crew-locations', crewId] });
    },
  });
};
