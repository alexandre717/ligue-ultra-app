// Firebase Cloud Messaging Service Worker
// Gère les notifications push même quand l'app est fermée

importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js');

// Configuration Firebase (même que dans l'app)
const firebaseConfig = {
  apiKey: 'AIzaSyC4doSvu1vvEY6BuI_iW8JlAQNJlFBb7cY',
  authDomain: 'le-club-ligue-ultra.firebaseapp.com',
  projectId: 'le-club-ligue-ultra',
  storageBucket: 'le-club-ligue-ultra.firebasestorage.app',
  messagingSenderId: '25278484360',
  appId: '1:25278484360:web:40e10ca3a7a53dcd73b43d',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('Notification reçue en arrière-plan:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Ouvrir ou focus la fenêtre de l'app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
