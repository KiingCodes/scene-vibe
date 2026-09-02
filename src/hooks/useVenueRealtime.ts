import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Tables whose changes should refresh the public venue directory / map. */
const WATCH: { table: string; keys: string[] }[] = [
  { table: 'clubs', keys: ['clubs', 'club'] },
  { table: 'pending_clubs', keys: ['clubs', 'pending-clubs'] },
  { table: 'venue_claims', keys: ['clubs', 'venue-claims'] },
];

/**
 * Streams venue approvals into every feed/map view so a club approved in the
 * Command Center shows up instantly without a page refresh.
 */
export const useVenueRealtime = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel('venue-realtime');

    WATCH.forEach(({ table, keys }) => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        () => keys.forEach((key) => qc.invalidateQueries({ queryKey: [key] })),
      );
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
};
