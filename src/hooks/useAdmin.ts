import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useIsAdmin = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin');
      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });
};

export const usePendingClubs = () => {
  return useQuery({
    queryKey: ['pending-clubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_clubs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useApproveClub = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clubId: string) => {
      const { error } = await supabase
        .from('pending_clubs')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
        .eq('id', clubId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
};

export const useRejectClub = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clubId: string) => {
      const { error } = await supabase
        .from('pending_clubs')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
        .eq('id', clubId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-clubs'] });
    },
  });
};
