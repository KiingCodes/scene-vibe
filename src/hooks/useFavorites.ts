import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Fetches a set of club IDs that the current user has favorited.
 */
export const useFavorites = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data, error } = await supabase
        .from('favorites')
        .select('club_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return new Set(data.map(f => f.club_id));
    },
    enabled: !!user,
  });
};

/**
 * Fetches the full favorite clubs for the current user with club details.
 */
export const useFavoriteClubs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favorite-clubs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('club_id, clubs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(f => f.clubs).filter(Boolean) || [];
    },
    enabled: !!user,
  });
};

/**
 * Toggle a club as favorite or remove it.
 */
export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, isFav }: { clubId: string; isFav: boolean }) => {
      if (!user) throw new Error('Must be signed in');

      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('club_id', clubId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, club_id: clubId });

        if (error) throw error;
      }
    },

    onSuccess: () => {
      // Invalidate queries so UI updates immediately
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
        queryClient.invalidateQueries({ queryKey: ['favorite-clubs', user.id] });
      }
    },
  });
};