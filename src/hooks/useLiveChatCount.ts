import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

/**
 * Live community-chat participant count: unique users who posted in the last
 * 15 minutes. Powers the pulsing counter on the bottom "Chat" tab.
 */
export const useLiveChatCount = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['live-chat-count'],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('messages')
        .select('user_id')
        .is('club_id', null)
        .gte('created_at', cutoff);
      if (error) throw error;
      return new Set((data ?? []).map((m: any) => m.user_id)).size;
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const ch = supabase
      .channel('live-chat-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        qc.invalidateQueries({ queryKey: ['live-chat-count'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return query.data ?? 0;
};