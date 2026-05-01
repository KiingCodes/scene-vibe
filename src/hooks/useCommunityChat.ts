import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const KEY = ['community-messages'];

export const useCommunityMessages = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .is('club_id', null)
        .eq('is_hidden', false)
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;

      const userIds = [...new Set(msgs?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);
      const map = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return msgs?.map(m => ({ ...m, profile: map.get(m.user_id) || null })) || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('community-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const row: any = payload.new ?? payload.old;
        if (row && row.club_id === null) {
          queryClient.invalidateQueries({ queryKey: KEY });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
};

export const useSendCommunityMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      content, mediaUrl, messageType,
    }: { content: string; mediaUrl?: string; messageType?: 'text' | 'image' | 'audio' | 'video' }) => {
      if (!user) throw new Error('Sign in to chat');
      const { error } = await supabase.from('messages').insert({
        club_id: null,
        user_id: user.id,
        content,
        media_url: mediaUrl || null,
        message_type: messageType || 'text',
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
};

export const useDeleteCommunityMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('Sign in');
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
};

export const useFlagMessage = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ messageId, reason }: { messageId: string; reason?: string }) => {
      if (!user) throw new Error('Sign in to flag');
      const { error } = await supabase.from('message_flags').insert({
        message_id: messageId,
        user_id: user.id,
        reason: reason || null,
      });
      if (error) throw error;
    },
  });
};