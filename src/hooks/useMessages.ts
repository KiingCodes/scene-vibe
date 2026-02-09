import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useMessages = (clubId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', clubId],
    queryFn: async () => {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      
      // Fetch profiles for user_ids
      const userIds = [...new Set(msgs?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const data = msgs?.map(m => ({ ...m, profiles: profileMap.get(m.user_id) || null }));
      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${clubId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `club_id=eq.${clubId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', clubId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clubId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, content }: { clubId: string; content: string }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase.from('messages').insert({
        club_id: clubId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', clubId] });
    },
  });
};

export const useDeleteMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, clubId }: { messageId: string; clubId: string }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);
      if (error) throw error;
      return clubId;
    },
    onSuccess: (clubId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', clubId] });
    },
  });
};
