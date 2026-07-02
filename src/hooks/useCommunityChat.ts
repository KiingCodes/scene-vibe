import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCountry } from '@/contexts/CountryContext';

const PAGE_SIZE = 30;

type ProfileLite = { user_id: string; username: string | null; avatar_url: string | null };
export type CommunityMessage = {
  id: string;
  user_id: string;
  club_id: string | null;
  content: string;
  media_url: string | null;
  message_type: string | null;
  created_at: string;
  is_hidden: boolean;
  profile: ProfileLite | null;
};

/**
 * Infinite-scroll feed for the global community chat.
 * - Pages load OLDER messages (cursor = earliest created_at on screen).
 * - Realtime INSERTs are appended directly to the cache (no refetch flicker).
 * - DELETEs are removed from the cache instantly.
 */
export const useCommunityMessages = () => {
  const qc = useQueryClient();
  const { country } = useCountry();
  const KEY = ['community-messages', country];

  const query = useInfiniteQuery({
    queryKey: KEY,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      let q = supabase
        .from('messages')
        .select('*')
        .is('club_id', null)
        .eq('is_hidden', false)
        .eq('country', country)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (pageParam) q = q.lt('created_at', pageParam);
      const { data: msgs, error } = await q;
      if (error) throw error;

      const userIds = [...new Set((msgs || []).map(m => m.user_id))];
      let profileMap = new Map<string, ProfileLite>();
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);
        profileMap = new Map((profiles || []).map(p => [p.user_id, p as ProfileLite]));
      }
      // Return oldest-first within the page so when we flatten we get oldest -> newest overall.
      return (msgs || [])
        .map(m => ({ ...m, profile: profileMap.get(m.user_id) || null }) as CommunityMessage)
        .reverse();
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.length || lastPage.length < PAGE_SIZE) return undefined;
      return lastPage[0].created_at; // oldest in this page = next cursor
    },
  });

  // Flat oldest -> newest list across all pages (older pages prepended in queryFn order).
  const messages = useMemo<CommunityMessage[]>(() => {
    const pages = query.data?.pages ?? [];
    // pages[0] = newest batch (oldest-first within), pages[1] = older batch, etc.
    // We want oldest -> newest overall, so reverse page order then flatten.
    return [...pages].reverse().flat();
  }, [query.data]);

  // Realtime stream — append new INSERTs and drop DELETEs without refetching.
  useEffect(() => {
    const channel = supabase
      .channel(`community-messages-stream-${country}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const row: any = payload.new;
          if (row.club_id !== null || row.is_hidden) return;
          if ((row.country ?? 'ZA') !== country) return;

          // Fetch profile for the new sender (lightweight).
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url')
            .eq('user_id', row.user_id)
            .maybeSingle();

          qc.setQueryData<any>(KEY, (old: any) => {
            if (!old) return old;
            const newMsg: CommunityMessage = { ...row, profile: profile ?? null };
            const pages = [...old.pages];
            // Append to the newest page (pages[0] in our paging direction).
            pages[0] = [...pages[0], newMsg];
            return { ...old, pages };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const id = (payload.old as any)?.id;
          if (!id) return;
          qc.setQueryData<any>(KEY, (old: any) => {
            if (!old) return old;
            return { ...old, pages: old.pages.map((p: CommunityMessage[]) => p.filter(m => m.id !== id)) };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const row: any = payload.new;
          if (row.is_hidden) {
            qc.setQueryData<any>(KEY, (old: any) => {
              if (!old) return old;
              return { ...old, pages: old.pages.map((p: CommunityMessage[]) => p.filter(m => m.id !== row.id)) };
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc, country]);

  return {
    messages,
    isLoading: query.isLoading,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};

export const useSendCommunityMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { country } = useCountry();
  return useMutation({
    mutationFn: async ({
      content, mediaUrl, messageType,
    }: { content: string; mediaUrl?: string; messageType?: 'text' | 'image' | 'audio' | 'video' }) => {
      if (!user) throw new Error('Sign in to chat');
      const { error } = await supabase.from('messages').insert({
        club_id: null,
        user_id: user.id,
        content,
        media_url: mediaUrl || null,
        message_type: messageType || 'text',
        country,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-messages', country] }),
  });
};

export const useDeleteCommunityMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { country } = useCountry();
  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) throw new Error('Sign in');
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-messages', country] }),
  });
};

export const useFlagMessage = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ messageId, reason }: { messageId: string; reason?: string }) => {
      if (!user) throw new Error('Sign in to flag');
      const { error } = await supabase.from('message_flags').insert({
        message_id: messageId,
        user_id: user.id,
        reason: reason || null,
      });
      if (error) throw error;
    },
  });
};