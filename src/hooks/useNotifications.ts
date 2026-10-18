import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { APP_VERSION } from '@/lib/version';

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  meta: Json;
  read: boolean;
  created_at: string;
  app_version?: string | null;
  groupedIds?: string[];
};

const deduplicateNotifications = (notifications: Notification[]) => {
  const groups = new Map<string, Notification[]>();
  const getVersion = (notification: Notification) => {
    const meta = notification.meta;
    const metaVersion =
      meta && typeof meta === 'object' && !Array.isArray(meta) ? meta.version : undefined;
    return (
      notification.app_version ??
      (typeof metaVersion === 'string' ? metaVersion : undefined) ??
      notification.title.match(/\bv?(\d+\.\d+\.\d+)\b/i)?.[1]
    );
  };

  for (const notification of notifications) {
    if (notification.type !== 'version_update') continue;
    const version = getVersion(notification);
    const identity = version || notification.title.trim().toLowerCase();
    const key = `${notification.type}:${identity}`;
    groups.set(key, [...(groups.get(key) ?? []), notification]);
  }

  const emitted = new Set<string>();
  const result: Notification[] = [];

  for (const notification of notifications) {
    if (notification.type !== 'version_update') {
      result.push(notification);
      continue;
    }

    const version = getVersion(notification);
    const identity = version || notification.title.trim().toLowerCase();
    const key = `${notification.type}:${identity}`;
    if (emitted.has(key)) continue;
    emitted.add(key);

    const duplicates = groups.get(key) ?? [notification];
    result.push({
      ...notification,
      read: duplicates.every((duplicate) => duplicate.read),
      groupedIds: duplicates.map((duplicate) => duplicate.id),
    });
  }

  return result;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return deduplicateNotifications((data || []) as Notification[]);
    },
    enabled: !!user,
  });

  // Realtime stream for THIS user's notifications.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          // Always surface a toast — user asked for every activity to be visible.
          // Suppress only chat_message while sitting on the chat page to avoid double render.
          const onChat = typeof window !== 'undefined' && window.location.pathname.startsWith('/chat');
          if (!(n.type === 'chat_message' && onChat)) {
            toast(n.title, { description: n.body ?? undefined });
          }
          qc.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return query;
};

export const useUnreadCount = () => {
  const { data } = useNotifications();
  return data?.filter(n => !n.read).length ?? 0;
};

export const useMarkNotificationRead = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const notificationIds = Array.isArray(ids) ? ids : [ids];
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
};

export const useMarkAllRead = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
};

export const useDeleteNotification = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const notificationIds = Array.isArray(ids) ? ids : [ids];
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
};

/** Manually push a notification (used for client-driven events like version upgrade). */
export const pushLocalNotification = async (
  userId: string,
  n: { type: string; title: string; body?: string; link?: string; meta?: Json }
) => {
  await supabase.from('notifications').insert({
    user_id: userId,
    type: n.type,
    title: n.title,
    body: n.body ?? null,
    link: n.link ?? null,
    meta: n.meta ?? {},
    app_version: APP_VERSION,
  });
};