import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';
import { useAwardPoints, useEarnBadge } from '@/hooks/useGamification';

/**
 * Fetch messages for a club (last 24 hours) with profile info
 */
export const useMessages = (clubId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', clubId],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Get messages
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('club_id', clubId)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;

      // Fetch profile info
      const userIds = [...new Set(msgs?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return msgs?.map(m => ({ ...m, profile: profileMap.get(m.user_id) || null })) || [];
    },
    enabled: !!clubId,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${clubId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `club_id=eq.${clubId}` },
        () => queryClient.invalidateQueries({ queryKey: ['messages', clubId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId, queryClient]);

  return query;
};

/**
 * Send a message and award gamification points/badges
 */
export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const awardPoints = useAwardPoints();
  const earnBadge = useEarnBadge();

  return useMutation({
    mutationFn: async ({
      clubId,
      content,
      mediaUrl,
      messageType,
    }: {
      clubId: string;
      content: string;
      mediaUrl?: string;
      messageType?: string;
    }) => {
      if (!user) throw new Error('Must be signed in');

      const { error } = await supabase.from('messages').insert({
        club_id: clubId,
        user_id: user.id,
        content,
        media_url: mediaUrl || null,
        message_type: messageType || 'text',
      });

      if (error) throw error;
    },
    onSuccess: async (_, { clubId }) => {
      // Award points for sending message
      if (user) {
        await awardPoints.mutateAsync({ action: 'message' });

        // Award badge if first message
        await earnBadge.mutateAsync({ badgeType: 'social' }); // e.g., "Social Butterfly" badge
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['messages', clubId] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

/**
 * Delete a message sent by the current user
 */
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