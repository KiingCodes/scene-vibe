import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useFavorites = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('club_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return new Set(data.map(f => f.club_id));
    },
    enabled: !!user,
  });
};

export const useFavoriteClubs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorite-clubs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('club_id, clubs(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data?.map(f => f.clubs).filter(Boolean) || [];
    },
    enabled: !!user,
  });
};

export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, isFav }: { clubId: string; isFav: boolean }) => {
      if (!user) throw new Error('Must be signed in');
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('club_id', clubId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: user.id, club_id: clubId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-clubs'] });
    },
  });
};
