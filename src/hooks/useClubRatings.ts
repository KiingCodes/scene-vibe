import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useClubRatings = (clubId: string) => {
  return useQuery({
    queryKey: ['club-ratings', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_ratings')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clubId,
  });
};

export const useClubRatingSummary = (clubId: string) => {
  return useQuery({
    queryKey: ['club-rating-summary', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_ratings')
        .select('dj_rating, music_rating')
        .eq('club_id', clubId);
      if (error) throw error;
      if (!data || data.length === 0) return { avgDj: 0, avgMusic: 0, total: 0 };
      const avgDj = data.reduce((s, r) => s + r.dj_rating, 0) / data.length;
      const avgMusic = data.reduce((s, r) => s + r.music_rating, 0) / data.length;
      return { avgDj: Math.round(avgDj * 10) / 10, avgMusic: Math.round(avgMusic * 10) / 10, total: data.length };
    },
    enabled: !!clubId,
  });
};

export const useHasRatedToday = (clubId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['has-rated-today', clubId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('club_ratings')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!clubId && !!user,
  });
};

export const useSubmitClubRating = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, djRating, musicRating }: { clubId: string; djRating: number; musicRating: number }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase.from('club_ratings').insert({
        club_id: clubId,
        user_id: user.id,
        dj_rating: djRating,
        music_rating: musicRating,
      });
      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ['club-ratings', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-rating-summary', clubId] });
      queryClient.invalidateQueries({ queryKey: ['has-rated-today', clubId] });
    },
  });
};
