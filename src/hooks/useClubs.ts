import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Club = Tables<'pending_clubs'>; // <-- note table name change

// Fetch all approved clubs
export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_clubs')          // fetch from pending_clubs
        .select('*')
        .eq('status', 'approved')       // only approved
        .order('name');
      if (error) throw error;
      return data as Club[];
    },
  });
};

// Fetch a single approved club by ID
export const useClub = (id: string) => {
  return useQuery({
    queryKey: ['club', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_clubs')          // fetch from pending_clubs
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')       // only approved
        .single();
      if (error) throw error;
      return data as Club;
    },
    enabled: !!id,
  });
};
