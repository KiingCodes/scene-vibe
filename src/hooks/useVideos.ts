import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDeviceId } from './useDeviceId';

export const useVideos = (clubId?: string) => {
  return useQuery({
    queryKey: ['videos', clubId || 'all'],
    queryFn: async () => {
      let q = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (clubId) q = q.eq('club_id', clubId);
      const { data, error } = await q;
      if (error) throw error;
      const userIds = [...new Set(data?.map(v => v.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data?.map(v => ({ ...v, profile: profileMap.get(v.user_id) })) || [];
    },
  });
};

export const useUploadVideo = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, clubId, caption }: { file: File; clubId?: string; caption?: string }) => {
      if (!user) throw new Error('Must be signed in');
      const ext = file.name.split('.').pop() || 'mp4';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path);
      const { error } = await supabase.from('videos').insert({
        user_id: user.id,
        club_id: clubId || null,
        video_url: publicUrl,
        caption: caption || null,
        is_premium: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

export const useDeleteVideo = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!user) throw new Error('Must be signed in');
      await supabase.from('videos').delete().eq('id', videoId).eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

export const useRecordVideoView = () => {
  const deviceId = useDeviceId();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!deviceId) return;
      await supabase.from('video_views').upsert(
        { video_id: videoId, device_id: deviceId },
        { onConflict: 'video_id,device_id', ignoreDuplicates: true }
      );
    },
  });
};

// --- Likes ---
export const useVideoLikes = (videoId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['video-likes', videoId, user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('video_likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);
      let userLiked = false;
      if (user) {
        const { data } = await supabase
          .from('video_likes')
          .select('id')
          .eq('video_id', videoId)
          .eq('user_id', user.id)
          .maybeSingle();
        userLiked = !!data;
      }
      return { count: count || 0, userLiked };
    },
    enabled: !!videoId,
  });
};

export const useToggleLike = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, liked }: { videoId: string; liked: boolean }) => {
      if (!user) throw new Error('Must be signed in');
      if (liked) {
        await supabase.from('video_likes').delete().eq('video_id', videoId).eq('user_id', user.id);
      } else {
        await supabase.from('video_likes').insert({ video_id: videoId, user_id: user.id });
      }
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['video-likes', videoId] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

// --- Comments ---
export const useVideoComments = (videoId: string) => {
  return useQuery({
    queryKey: ['video-comments', videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data?.map(c => ({ ...c, profile: profileMap.get(c.user_id) })) || [];
    },
    enabled: !!videoId,
  });
};

export const usePostComment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase.from('video_comments').insert({
        video_id: videoId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, { videoId }) => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
    },
  });
};

export const useDeleteComment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, videoId }: { commentId: string; videoId: string }) => {
      if (!user) throw new Error('Must be signed in');
      await supabase.from('video_comments').delete().eq('id', commentId).eq('user_id', user.id);
      return videoId;
    },
    onSuccess: (videoId) => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', videoId] });
    },
  });
};
