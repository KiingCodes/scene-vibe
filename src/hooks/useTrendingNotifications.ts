import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const useTrendingNotifications = () => {
  const queryClient = useQueryClient();
  const notifiedClubs = useRef<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase
      .channel('trending-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vibes' },
        async (payload) => {
          const clubId = payload.new?.club_id;
          if (!clubId) return;

          // Check if this club just hit trending (3 vibes)
          const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
          const { count } = await supabase
            .from('vibes')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', clubId)
            .gte('created_at', twentyMinutesAgo);

          // If club just hit 3 vibes and we haven't notified yet
          if (count === 3 && !notifiedClubs.current.has(clubId)) {
            notifiedClubs.current.add(clubId);
            
            // Fetch club name
            const { data: club } = await supabase
              .from('clubs')
              .select('name')
              .eq('id', clubId)
              .single();

            if (club) {
              toast.success(`🔥 ${club.name} is now TRENDING!`, {
                description: 'The party is heating up!',
                duration: 5000,
              });
            }
          }

          // Also show a subtle notification for any vibe
          if (count && count > 0 && count < 3) {
            const { data: club } = await supabase
              .from('clubs')
              .select('name')
              .eq('id', clubId)
              .single();

            if (club) {
              toast(`🔥 Someone just vibed ${club.name}`, {
                description: `${count} vibe${count > 1 ? 's' : ''} in the last 24h`,
                duration: 3000,
              });
            }
          }

          // Invalidate queries to update UI
          queryClient.invalidateQueries({ queryKey: ['all-vibes'] });
          queryClient.invalidateQueries({ queryKey: ['vibes', clubId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
