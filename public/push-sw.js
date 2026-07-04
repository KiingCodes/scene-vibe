// SCENE push notification handlers — imported by the generated Workbox service worker.
// Handles background push delivery (app closed / user signed out) and click routing.

self.addEventListener('push', (event) => {
  let payload = { title: 'SCENE', body: "Something's happening tonight.", url: '/', tag: 'scene' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    tag: payload.tag || 'scene',
    renotify: true,
    vibrate: [80, 40, 80],
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) {
        try { await client.navigate(url); } catch (_) {}
        return client.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});