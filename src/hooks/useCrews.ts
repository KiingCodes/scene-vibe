import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useCrews = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-crews', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: memberships } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id);
      const crewIds = memberships?.map(m => m.crew_id) || [];
      if (crewIds.length === 0) return [];
      const { data, error } = await supabase
        .from('crews')
        .select('*')
        .in('id', crewIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCrewMembers = (crewId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['crew-members', crewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .eq('crew_id', crewId);
      if (error) throw error;
      const userIds = data?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data?.map(m => ({ ...m, profile: profileMap.get(m.user_id) })) || [];
    },
    enabled: !!crewId,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`crew-members-${crewId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_members', filter: `crew_id=eq.${crewId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['crew-members', crewId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [crewId, queryClient]);

  return query;
};

export const useCrewVotes = (crewId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['crew-votes', crewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_votes')
        .select('*')
        .eq('crew_id', crewId);
      if (error) throw error;
      // Get club names
      const clubIds = [...new Set(data?.map(v => v.club_id) || [])];
      if (clubIds.length === 0) return { votes: data || [], clubs: {} as Record<string, string> };
      const { data: clubs } = await supabase
        .from('clubs')
        .select('id, name')
        .in('id', clubIds);
      const clubMap: Record<string, string> = {};
      clubs?.forEach(c => { clubMap[c.id] = c.name; });
      return { votes: data || [], clubs: clubMap };
    },
    enabled: !!crewId,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`crew-votes-${crewId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_votes', filter: `crew_id=eq.${crewId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['crew-votes', crewId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [crewId, queryClient]);

  return query;
};

export const useCreateCrew = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error('Must be signed in');
      const { data, error } = await supabase
        .from('crews')
        .insert({ name, description, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      // Auto-join as leader
      await supabase.from('crew_members').insert({ crew_id: data.id, user_id: user.id, role: 'leader' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-crews'] });
    },
  });
};

export const useJoinCrew = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error('Must be signed in');
      const { data: crew, error: findErr } = await supabase
        .from('crews')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle();
      if (findErr || !crew) throw new Error('Invalid invite code');
      const { error } = await supabase
        .from('crew_members')
        .insert({ crew_id: crew.id, user_id: user.id });
      if (error) throw error;
      return crew;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-crews'] });
    },
  });
};

export const useLeaveCrew = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (crewId: string) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('crew_id', crewId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-crews'] });
    },
  });
};

export const useVoteClub = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ crewId, clubId }: { crewId: string; clubId: string }) => {
      if (!user) throw new Error('Must be signed in');
      // Upsert vote
      const { data: existing } = await supabase
        .from('crew_votes')
        .select('id')
        .eq('crew_id', crewId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) {
        await supabase.from('crew_votes').update({ club_id: clubId }).eq('id', existing.id);
      } else {
        await supabase.from('crew_votes').insert({ crew_id: crewId, club_id: clubId, user_id: user.id });
      }
    },
    onSuccess: (_, { crewId }) => {
      queryClient.invalidateQueries({ queryKey: ['crew-votes', crewId] });
    },
  });
};
