import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNightReplays = () => {
  return useQuery({
    queryKey: ['night-replays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('night_replays')
        .select('*')
        .order('replay_date', { ascending: false })
        .limit(14);
      if (error) throw error;
      return data || [];
    },
  });
};

export const useLatestReplay = () => {
  return useQuery({
    queryKey: ['latest-replay'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('night_replays')
        .select('*')
        .order('replay_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};
