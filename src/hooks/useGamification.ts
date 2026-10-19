import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const BADGE_DEFINITIONS = [
  { type: 'first_vibe', name: 'SCENE First Vibe', emoji: '🔥', description: 'Send your first vibe', points: 10 },
  { type: 'vibe_master', name: 'SCENE Vibe Master', emoji: '⚡', description: 'Send 10 vibes', points: 50 },
  { type: 'reviewer', name: 'SCENE Critic', emoji: '🎤', description: 'Leave your first review', points: 15 },
  { type: 'dj_rater', name: 'SCENE DJ Scout', emoji: '🎧', description: 'Rate a DJ for the first time', points: 15 },
  { type: 'explorer', name: 'SCENE Explorer', emoji: '🗺️', description: 'Visit 5 different clubs', points: 30 },
  { type: 'spot_suggester', name: 'SCENE Trendsetter', emoji: '💡', description: 'Suggest a new spot', points: 25 },
  { type: 'regular', name: 'SCENE Regular', emoji: '👑', description: 'Active for 7 days', points: 50 },
  { type: 'social', name: 'SCENE Social Butterfly', emoji: '🦋', description: 'Chat in 3 different clubs', points: 20 },
  { type: 'night_owl', name: 'SCENE Night Owl', emoji: '🦉', description: 'Active after midnight', points: 10 },
  { type: 'top_10', name: 'SCENE Top 10', emoji: '🏆', description: 'Reach the leaderboard top 10', points: 100 },
];

export const POINT_VALUES = {
  vibe: 5,
  review: 10,
  rating: 8,
  message: 2,
  suggestion: 20,
  pulling_up: 5,
  favorite: 3,
  video_post: 15,
  video_like: 1,
  comment: 2,
  join_crew: 8,
  create_crew: 15,
  follow: 1,
  night_replay: 10,
  daily_login: 5,
  after_midnight: 5,
};

export const getLevelFromPoints = (points: number) => {
  if (points >= 1000) return { level: 10, title: 'Legend', next: Infinity };
  if (points >= 750) return { level: 9, title: 'Icon', next: 1000 };
  if (points >= 500) return { level: 8, title: 'VIP', next: 750 };
  if (points >= 350) return { level: 7, title: 'Influencer', next: 500 };
  if (points >= 250) return { level: 6, title: 'Regular', next: 350 };
  if (points >= 150) return { level: 5, title: 'Explorer', next: 250 };
  if (points >= 80) return { level: 4, title: 'Socialite', next: 150 };
  if (points >= 40) return { level: 3, title: 'Party-goer', next: 80 };
  if (points >= 15) return { level: 2, title: 'Newcomer', next: 40 };
  return { level: 1, title: 'Fresh Face', next: 15 };
};

export const useUserPoints = (userId?: string) => {
  const { user } = useAuth();
  const uid = userId || user?.id;
  return useQuery({
    queryKey: ['user-points', uid],
    queryFn: async () => {
      if (!uid) return null;
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!uid,
  });
};

export const useUserBadges = (userId?: string) => {
  const { user } = useAuth();
  const uid = userId || user?.id;
  return useQuery({
    queryKey: ['user-badges', uid],
    queryFn: async () => {
      if (!uid) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', uid)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!uid,
  });
};

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .order('points', { ascending: false })
        .limit(50);
      if (error) throw error;

      const userIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data?.map(d => ({
        ...d,
        profile: profileMap.get(d.user_id),
      })) || [];
    },
  });
};

export const useAwardPoints = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, userId }: { action: keyof typeof POINT_VALUES; userId?: string }) => {
      const awardUserId = userId || user?.id;
      if (!awardUserId) return;

      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const afterMidnightKey = `scene-after-midnight:${awardUserId}`;
      const earnsAfterMidnightBonus = action !== 'after_midnight'
        && now.getHours() < 5
        && localStorage.getItem(afterMidnightKey) !== localDate;
      const pts = POINT_VALUES[action] + (earnsAfterMidnightBonus ? POINT_VALUES.after_midnight : 0);

      const { data: existing, error: selectError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', awardUserId)
        .maybeSingle();
      if (selectError) throw selectError;

      if (existing) {
        const newPoints = existing.points + pts;
        const newLevel = getLevelFromPoints(newPoints).level;
        const { error } = await supabase
          .from('user_points')
          .update({ points: newPoints, level: newLevel, updated_at: new Date().toISOString() })
          .eq('user_id', awardUserId);
        if (error) throw error;
      } else {
        const newLevel = getLevelFromPoints(pts).level;
        const { error } = await supabase
          .from('user_points')
          .insert({ user_id: awardUserId, points: pts, level: newLevel });
        if (error) throw error;
      }

      if (earnsAfterMidnightBonus) localStorage.setItem(afterMidnightKey, localDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: (error) => {
      toast.error(`Could not award points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });
};

export const useEarnBadge = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ badgeType }: { badgeType: string }) => {
      if (!user) return;
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: user.id, badge_type: badgeType });
      // Ignore duplicate errors
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    },
  });
};
