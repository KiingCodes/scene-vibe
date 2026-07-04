import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback } from 'react';
import { APP_VERSION } from '@/lib/version';

/**
 * Audit-log style helper: writes a row to `notifications` for the current user
 * to document every meaningful action they take (vibed, favorited, checked in,
 * pulled up, chatted, etc.). Signed-out users are a no-op.
 */
export const useActivityLog = () => {
  const { user } = useAuth();
  return useCallback(
    async (entry: { type: string; title: string; body?: string; link?: string; meta?: any }) => {
      if (!user) return;
      try {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: entry.type,
          title: entry.title,
          body: entry.body ?? null,
          link: entry.link ?? null,
          meta: entry.meta ?? {},
          app_version: APP_VERSION,
        });
      } catch {
        // Silent — activity logging must never break the UX.
      }
    },
    [user]
  );
};