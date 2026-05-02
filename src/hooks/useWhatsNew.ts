import { useEffect } from 'react';
import { toast } from 'sonner';
import { APP_VERSION, VERSION_HISTORY } from '@/lib/version';
import { useAuth } from './useAuth';
import { pushLocalNotification } from './useNotifications';

const STORAGE_KEY = 'scene_whats_new_seen_version';

export const useWhatsNew = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen === APP_VERSION) return;

    const latest = VERSION_HISTORY[0];
    const t = setTimeout(() => {
      toast(`✨ SCENE v${APP_VERSION} is here`, {
        description: latest?.highlights.slice(0, 3).join(' · '),
        duration: 8000,
      });
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      // Persist a notification for signed-in users (so it appears in the bell).
      if (user && latest) {
        pushLocalNotification(user.id, {
          type: 'version_update',
          title: `SCENE v${APP_VERSION} is live`,
          body: latest.highlights.slice(0, 2).join(' · '),
          link: '/',
          meta: { version: APP_VERSION },
        }).catch(() => {});
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [user]);
};
