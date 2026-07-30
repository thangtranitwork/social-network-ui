// Firebase Service Worker for Web Push Notifications & Background Messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const params = new URLSearchParams(self.location.search);
const apiKey = params.get('apiKey') || '';
const authDomain = params.get('authDomain') || '';
const projectId = params.get('projectId') || '';
const storageBucket = params.get('storageBucket') || '';
const messagingSenderId = params.get('messagingSenderId') || '';
const appId = params.get('appId') || '';
const measurementId = params.get('measurementId') || '';

if (apiKey && projectId) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background FCM message received:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'PocPoc Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Bạn có thông báo mới',
      icon: payload.notification?.icon || '/pocpoc.png',
      badge: '/pocpoc.png',
      data: payload.data || {},
      tag: payload.data?.tag || 'fcm-push-notification',
      requireInteraction: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close();

  const clickUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
