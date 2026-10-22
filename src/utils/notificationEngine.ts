import { createElement } from 'react';
import { toast } from 'sonner';
import sceneLogo from '@/assets/logo.png';

export const SCENE_NOTIFICATION_PREFERENCE_KEY = 'scene_push_enabled';

export type SceneNotification = {
  title: string;
  body: string;
  url?: string;
};

export const areSceneNotificationsEnabled = () => {
  try {
    return window.localStorage.getItem(SCENE_NOTIFICATION_PREFERENCE_KEY) === 'true';
  } catch (error) {
    console.error('Could not read SCENE notification preference', error);
    return false;
  }
};

export const notifyScene = async ({ title, body, url = '/' }: SceneNotification) => {
  if (!areSceneNotificationsEnabled()) return;

  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    toast(title, {
      description: body,
      duration: 5000,
      icon: createElement('img', { src: sceneLogo, alt: '', className: 'h-5 w-5 rounded-md object-contain' }),
      action: {
        label: 'Open',
        onClick: () => window.location.assign(url),
      },
    });
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    return;
  }

  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options = {
    body,
    icon: sceneLogo,
    badge: sceneLogo,
    data: { url },
    vibrate: [200, 100, 200],
  } as NotificationOptions;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        window.location.assign(url);
        notification.close();
      };
    }
  } catch (error) {
    console.error('Could not display SCENE browser notification', error);
  }
};
