import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Club = Tables<'clubs'>;

export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clubs').select('*').order('name');
      if (error) throw error;
      return data as Club[];
    },
  });
};

export const useClub = (id: string) => {
  return useQuery({
    queryKey: ['club', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clubs').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Club;
    },
    enabled: !!id,
  });
};
