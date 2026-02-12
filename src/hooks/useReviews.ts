import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDeviceId } from './useDeviceId';
import { useEffect } from 'react';

export type FeedbackVibe = 'lit' | 'good' | 'mid' | 'dead';

export const FEEDBACK_OPTIONS: { value: FeedbackVibe; emoji: string; label: string; rating: number }[] = [
  { value: 'lit', emoji: '🔥', label: 'Lit', rating: 5 },
  { value: 'good', emoji: '☺️', label: 'Good', rating: 4 },
  { value: 'mid', emoji: '😐', label: 'Mid', rating: 3 },
  { value: 'dead', emoji: '😴', label: 'Dead', rating: 1 },
];

export const ratingToFeedback = (rating: number): typeof FEEDBACK_OPTIONS[number] => {
  return FEEDBACK_OPTIONS.find(f => f.rating === rating) || FEEDBACK_OPTIONS[2];
};

export const useReviews = (clubId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reviews', clubId],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: revs, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('club_id', clubId)
        .gte('created_at', twentyFourHoursAgo)
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

  useEffect(() => {
    const channel = supabase
      .channel(`reviews-${clubId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: `club_id=eq.${clubId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['reviews', clubId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clubId, queryClient]);

  return query;
};

export const useFeedbackSummary = (clubId: string) => {
  return useQuery({
    queryKey: ['feedback-summary', clubId],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('club_id', clubId)
        .gte('created_at', twentyFourHoursAgo);
      if (error) throw error;

      const counts: Record<string, number> = { lit: 0, good: 0, mid: 0, dead: 0 };
      data?.forEach(r => {
        const fb = ratingToFeedback(r.rating);
        counts[fb.value] = (counts[fb.value] || 0) + 1;
      });
      return { counts, total: data?.length || 0 };
    },
    enabled: !!clubId,
  });
};

export const useHasGivenFeedback = (clubId: string) => {
  const deviceId = useDeviceId();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['has-feedback', clubId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo)
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!clubId && !!user,
  });
};

export const useSubmitReview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, rating, content }: { clubId: string; rating: number; content?: string }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase.from('reviews').insert({
        club_id: clubId,
        user_id: user.id,
        rating,
        content: content || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', clubId] });
      queryClient.invalidateQueries({ queryKey: ['feedback-summary', clubId] });
      queryClient.invalidateQueries({ queryKey: ['has-feedback', clubId] });
    },
  });
};
