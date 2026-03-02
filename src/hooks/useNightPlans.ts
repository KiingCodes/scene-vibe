import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useNightPlans = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['night-plans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('night_plans')
        .select('*, night_plan_items(*, clubs(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSharedPlan = (shareToken: string) => {
  return useQuery({
    queryKey: ['shared-plan', shareToken],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('night_plans')
        .select('*, night_plan_items(*, clubs(*))')
        .eq('share_token', shareToken)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!shareToken,
  });
};

export const useCreatePlan = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, clubIds }: { title: string; clubIds: string[] }) => {
      if (!user) throw new Error('Must be signed in');
      const { data: plan, error } = await supabase
        .from('night_plans')
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (error) throw error;

      if (clubIds.length > 0) {
        const items = clubIds.map((club_id, i) => ({
          plan_id: plan.id,
          club_id,
          position: i,
        }));
        const { error: itemsError } = await supabase.from('night_plan_items').insert(items);
        if (itemsError) throw itemsError;
      }
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['night-plans'] });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from('night_plans').delete().eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['night-plans'] });
    },
  });
};

export const useUpdatePlanItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, clubIds }: { planId: string; clubIds: string[] }) => {
      // Delete existing items
      const { error: delErr } = await supabase.from('night_plan_items').delete().eq('plan_id', planId);
      if (delErr) throw delErr;
      // Insert new ordered items
      if (clubIds.length > 0) {
        const items = clubIds.map((club_id, i) => ({ plan_id: planId, club_id, position: i }));
        const { error } = await supabase.from('night_plan_items').insert(items);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['night-plans'] });
    },
  });
};
