import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAwardPoints } from './useGamification';

/** Counts of followers/following for a given user */
export const useFollowCounts = (userId?: string) => {
  return useQuery({
    queryKey: ['follow-counts', userId],
    queryFn: async () => {
      if (!userId) return { followers: 0, following: 0 };
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);
      return { followers: followers || 0, following: following || 0 };
    },
    enabled: !!userId,
  });
};

/** Is the current user following `targetId`? */
export const useIsFollowing = (targetId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-following', user?.id, targetId],
    queryFn: async () => {
      if (!user || !targetId || user.id === targetId) return false;
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!targetId,
  });
};

export const useToggleFollow = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const awardPoints = useAwardPoints();
  return useMutation({
    mutationFn: async ({ targetId, isFollowing }: { targetId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Sign in to follow');
      if (user.id === targetId) throw new Error("Can't follow yourself");
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: targetId });
        if (error) throw error;
      }
      return !isFollowing;
    },
    onSuccess: (wasAdded, { targetId }) => {
      qc.invalidateQueries({ queryKey: ['is-following', user?.id, targetId] });
      qc.invalidateQueries({ queryKey: ['follow-counts', targetId] });
      qc.invalidateQueries({ queryKey: ['follow-counts', user?.id] });
      if (wasAdded) awardPoints.mutate({ action: 'follow' });
    },
  });
};