import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useReviews = (clubId: string) => {
  return useQuery({
    queryKey: ['reviews', clubId],
    queryFn: async () => {
      const { data: revs, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const userIds = [...new Set(revs?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const data = revs?.map(r => ({ ...r, profiles: profileMap.get(r.user_id) || null }));
      return data;
    },
    enabled: !!clubId,
  });
};

export const useSubmitReview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, rating, content }: { clubId: string; rating: number; content: string }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase.from('reviews').insert({
        club_id: clubId,
        user_id: user.id,
        rating,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', clubId] });
    },
  });
};
