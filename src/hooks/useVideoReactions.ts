import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const REACTION_EMOJIS = ['🔥', '❤️', '😂', '😍', '🤯', '👀'];

export const useVideoReactions = (videoId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['video-reactions', videoId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('video_reactions')
        .select('emoji, user_id')
        .eq('video_id', videoId);
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      (data || []).forEach((r) => {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (user && r.user_id === user.id) mine.add(r.emoji);
      });
      return { counts, mine };
    },
    enabled: !!videoId,
  });
};

export const useToggleReaction = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ videoId, emoji, on }: { videoId: string; emoji: string; on: boolean }) => {
      if (!user) throw new Error('Sign in to react');
      if (on) {
        await supabase.from('video_reactions').delete()
          .eq('video_id', videoId).eq('user_id', user.id).eq('emoji', emoji);
      } else {
        await supabase.from('video_reactions').insert({ video_id: videoId, user_id: user.id, emoji });
      }
    },
    onSuccess: (_, { videoId }) => {
      qc.invalidateQueries({ queryKey: ['video-reactions', videoId] });
    },
  });
};