/* Service Worker der Reservierungs-App: zeigt Push-Benachrichtigungen an. */
'use strict';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (event) {
  // Die Push-Nachricht ist leer. Den Text holt sich das Gerät vom eigenen Server.
  var fallback = { title: 'Reservierungen', body: 'Es gibt Neuigkeiten. Tippen zum Öffnen.', url: '/reservierungen/verwaltung/', tag: 'mh-generic' };
  event.waitUntil(
    self.registration.pushManager.getSubscription()
      .then(function (sub) {
        if (!sub) return { items: [fallback] };
        return fetch('push.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }), cache: 'no-store' })
          .then(function (r) { return r.json(); });
      })
      .catch(function () { return { items: [fallback] }; })
      .then(function (data) {
        var items = (data && data.items && data.items.length) ? data.items : [fallback];
        return Promise.all(items.map(function (n) {
          return self.registration.showNotification(n.title, {
            body: n.body, tag: n.tag, renotify: true,
            icon: '/icon-192.png', badge: '/icon-192.png',
            data: { url: n.url || '/reservierungen/verwaltung/' }
          });
        }));
      })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/reservierungen/verwaltung/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf('/reservierungen/verwaltung/') >= 0 && 'focus' in list[i]) {
          if ('navigate' in list[i]) list[i].navigate(url);
          return list[i].focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
