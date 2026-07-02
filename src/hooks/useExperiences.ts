import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCountry } from '@/contexts/CountryContext';

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
  const { country } = useCountry();
  return useQuery({
    queryKey: ['experiences', category ?? 'all', country],
    queryFn: async () => {
      let q = supabase
        .from('experiences')
        .select('*')
        .eq('status', 'approved')
        .eq('country', country)
        .order('start_date', { ascending: true, nullsFirst: false });
      if (category && category !== 'all') q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Experience[];
    },
  });
};

export const useExperiencesSyncStatus = () => {
  return useQuery({
    queryKey: ['experiences-sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('last_synced_at')
        .not('last_synced_at', 'is', null)
        .order('last_synced_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      const { count } = await supabase
        .from('experiences')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
      return {
        lastSyncedAt: data?.[0]?.last_synced_at ?? null,
        approvedCount: count ?? 0,
      };
    },
    refetchInterval: 60_000,
  });
};

export const useTriggerSync = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-google-places', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['experiences'] });
      qc.invalidateQueries({ queryKey: ['experiences-sync-status'] });
    },
  });
};

export const usePendingExperiences = () => {
  return useQuery({
    queryKey: ['pending-experiences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Experience[];
    },
  });
};

export const useModerateExperience = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const { error } = await supabase
        .from('experiences')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-experiences'] });
      qc.invalidateQueries({ queryKey: ['experiences'] });
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