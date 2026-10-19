import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { replayUploadPath, validateReplayFile } from '@/lib/nightReplay';
import { useAwardPoints } from './useGamification';

const replaySelect = '*, venue:clubs!night_replays_venue_id_fkey(name, image_url)';

async function playbackUrl(videoUrl: string | null) {
  if (!videoUrl) throw new Error('Missing replay video');
  const path = videoUrl.split('/night_replays/')[1];
  if (!path) return videoUrl;
  const { data, error } = await supabase.storage.from('night_replays').createSignedUrl(path, 900);
  if (error) throw error;
  return data.signedUrl;
}

export const useNightReplays = (clubId?: string) => {
  const client = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel(`replay-feed-${clubId || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'night_replays' }, () => {
        client.invalidateQueries({ queryKey: ['night-replays'] });
        client.invalidateQueries({ queryKey: ['pending-night-replays'] });
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [client, clubId]);
  return useQuery({
    queryKey: ['night-replays', clubId || 'all'],
    refetchInterval: 60_000,
    queryFn: async () => {
      let query = supabase.from('night_replays').select(replaySelect)
        .eq('status', 'approved').gt('expires_at', new Date().toISOString())
        .not('video_url', 'is', null).order('created_at', { ascending: false }).limit(50);
      if (clubId) query = query.eq('venue_id', clubId);
      const { data, error } = await query;
      if (error) throw error;
      return Promise.all((data || []).map(async replay => ({ ...replay, video_url: await playbackUrl(replay.video_url) })));
    },
  });
};

export const useLatestReplay = () => {
  const query = useNightReplays();
  return { ...query, data: query.data?.[0] ?? null };
};

export const useSubmitNightReplay = () => {
  const { user } = useAuth();
  const client = useQueryClient();
  const awardPoints = useAwardPoints();
  return useMutation({
    mutationFn: async ({ file, clubId, caption }: { file: File; clubId: string; caption?: string }) => {
      if (!user) throw new Error('Sign in to submit a highlight');
      const contentType = validateReplayFile(file);
      const path = replayUploadPath(user.id);
      const bucket = supabase.storage.from('night_replays');
      const { error: uploadError } = await bucket.upload(path, file, { contentType });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = bucket.getPublicUrl(path);
      const { data, error } = await supabase.from('night_replays').insert({
        user_id: user.id, venue_id: clubId, video_url: publicUrl, caption: caption?.trim() || null, status: 'pending',
      }).select('id, status').single();
      if (error) {
        await bucket.remove([path]);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['night-replays'] });
      client.invalidateQueries({ queryKey: ['pending-night-replays'] });
      awardPoints.mutate({ action: 'night_replay' });
    },
  });
};

export const usePendingNightReplays = (clubId: string) => useQuery({
  queryKey: ['pending-night-replays', clubId],
  enabled: !!clubId,
  refetchInterval: 15_000,
  queryFn: async () => {
    const { data, error } = await supabase.from('night_replays').select(replaySelect)
      .eq('venue_id', clubId).eq('status', 'pending').gt('expires_at', new Date().toISOString())
      .not('video_url', 'is', null).order('created_at');
    if (error) throw error;
    return Promise.all((data || []).map(async replay => ({ ...replay, video_url: await playbackUrl(replay.video_url) })));
  },
});

export const useReviewNightReplay = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ videoId, status }: { videoId: string; status: 'approved' | 'rejected'; clubId: string }) => {
      const { data, error } = await supabase.from('night_replays').update({ status }).eq('id', videoId)
        .eq('status', 'pending').select('id').single();
      if (error) throw error;
      if (!data) throw new Error('Replay could not be reviewed');
      return data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['night-replays'] });
      client.invalidateQueries({ queryKey: ['pending-night-replays'] });
    },
  });
};
