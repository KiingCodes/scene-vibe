import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type CrewMessageType = 'text' | 'replay_share' | 'location_drop' | 'venue_card';
export type CrewMessageMetadata = {
  replay_id?: string;
  video_url?: string;
  venue_id?: string;
};

export type CrewMessage = {
  id: string;
  crew_id: string;
  user_id: string;
  content: string;
  message_type: CrewMessageType;
  metadata: CrewMessageMetadata;
  created_at: string;
  profile: { username: string | null; avatar_url: string | null } | null;
};

export const useCrewMessages = (crewId: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['crew-messages', crewId];

  const query = useQuery({
    queryKey,
    enabled: !!crewId,
    queryFn: async (): Promise<CrewMessage[]> => {
      const { data: messages, error } = await supabase
        .from('crew_messages')
        .select('*')
        .eq('crew_id', crewId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const userIds = [...new Set((messages || []).map(message => message.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);
      if (profileError) throw profileError;
      const profilesByUser = new Map((profiles || []).map(profile => [profile.user_id, profile]));

      return (messages || []).reverse().map(message => ({
        ...message,
        message_type: message.message_type as CrewMessageType,
        metadata: message.metadata as CrewMessageMetadata,
        profile: profilesByUser.get(message.user_id) || null,
      }));
    },
  });

  useEffect(() => {
    if (!crewId) return;
    const channel = supabase
      .channel(`crew-messages-${crewId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crew_messages', filter: `crew_id=eq.${crewId}` },
        () => queryClient.invalidateQueries({ queryKey: ['crew-messages', crewId] }),
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [crewId, queryClient]);

  return query;
};

export const useSendCrewMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      crewId,
      content,
      messageType = 'text',
      metadata = {},
    }: {
      crewId: string;
      content: string;
      messageType?: CrewMessageType;
      metadata?: CrewMessageMetadata;
    }) => {
      if (!user) throw new Error('Sign in to send a crew message');
      const { error } = await supabase.from('crew_messages').insert({
        crew_id: crewId,
        user_id: user.id,
        content,
        message_type: messageType,
        metadata: metadata as Json,
      });
      if (error) throw error;
    },
    onSuccess: (_, { crewId }) => {
      queryClient.invalidateQueries({ queryKey: ['crew-messages', crewId] });
    },
  });
};
