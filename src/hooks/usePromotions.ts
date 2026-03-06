import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useEvents = (clubId?: string) => {
  return useQuery({
    queryKey: ['events', clubId],
    queryFn: async () => {
      let q = supabase.from('events').select('*').order('event_date', { ascending: true });
      if (clubId) q = q.eq('club_id', clubId);
      const { data, error } = await q;
      if (error) throw error;
      // Get promoter profiles
      const promoterIds = [...new Set(data?.map(e => e.promoter_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', promoterIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data?.map(e => ({ ...e, promoter: profileMap.get(e.promoter_id) })) || [];
    },
  });
};

export const useCreateEvent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: { club_id: string; title: string; description?: string; event_date: string; image_url?: string }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase.from('events').insert({ ...event, promoter_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useMyPromotions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-promotions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const usePendingPromotions = () => {
  return useQuery({
    queryKey: ['pending-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Get user profiles
      const userIds = [...new Set(data?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data?.map(p => ({ ...p, profile: profileMap.get(p.user_id) })) || [];
    },
  });
};

export const useRequestPromotion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promo: { type: string; target_id: string; bank_reference: string; amount_cents: number }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase.from('promotions').insert({ ...promo, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-promotions'] });
    },
  });
};

export const useApprovePromotion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      if (!user) throw new Error('Must be signed in');
      const { data: promo } = await supabase.from('promotions').select('*').eq('id', id).single();
      if (!promo) throw new Error('Not found');
      
      await supabase.from('promotions').update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_note: note,
      }).eq('id', id);

      // If club_boost, mark the event as boosted
      if (promo.type === 'club_boost') {
        await supabase.from('events').update({ is_boosted: true }).eq('id', promo.target_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useRejectPromotion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      if (!user) throw new Error('Must be signed in');
      await supabase.from('promotions').update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_note: note,
      }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-promotions'] });
    },
  });
};
