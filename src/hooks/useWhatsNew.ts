import { useEffect } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'scene_whats_new_v3';

const FEATURES = [
  '🎥 Free video posts — record & share your night',
  '💬 Like & comment on videos',
  '🔥 Real-time trending alerts with vibration',
  '🗺️ One-tap "Pull Up" navigation',
];

export const useWhatsNew = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => {
      toast('✨ What\'s new in SCENE', {
        description: FEATURES.join('\n'),
        duration: 8000,
      });
      localStorage.setItem(STORAGE_KEY, '1');
    }, 2200);
    return () => clearTimeout(t);
  }, []);
};
