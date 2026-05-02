import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type Experience = {
  id: string;
  name: string;
  category: 'workshop' | 'popup' | 'market' | 'food' | 'lounge' | 'street_event' | string;
  description: string | null;
  area: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  recurrence: string | null;
  price_info: string | null;
  registration_url: string | null;
  opening_hours: string | null;
  website: string | null;
  instagram: string | null;
  status: string;
  created_at: string;
};

export const useExperiences = (category?: string) => {
  return useQuery({
    queryKey: ['experiences', category ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('experiences')
        .select('*')
        .eq('status', 'approved')
        .order('start_date', { ascending: true, nullsFirst: false });
      if (category && category !== 'all') q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Experience[];
    },
  });
};

export const useCreateExperience = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Experience>) => {
      if (!user) throw new Error('Sign in to submit');
      const { error } = await supabase.from('experiences').insert({
        ...input,
        name: input.name!,
        area: input.area!,
        category: input.category || 'workshop',
        is_community_added: true,
        status: 'pending',
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['experiences'] }),
  });
};