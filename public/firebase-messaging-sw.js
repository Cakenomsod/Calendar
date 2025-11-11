// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCmIfvAGrk-rRCtYxCp3XmnUM61mKUtgsY",
  authDomain: "calendarproject-f570e.firebaseapp.com",
  projectId: "calendarproject-f570e",
  storageBucket: "calendarproject-f570e.firebasestorage.app",
  messagingSenderId: "872792637757",
  appId: "1:872792637757:web:bb20876a0fb1cfc1fc8554",
  measurementId: "G-NTQYQJVBVN"
});

const messaging = firebase.messaging();

// เมื่อมีข้อความเข้าใน background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message', payload);

  const notificationTitle = payload.notification?.title || '📅 การแจ้งเตือนกิจกรรม';
  const notificationOptions = {
    body: payload.notification?.body || 'คุณมีกิจกรรมใหม่',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.activityId || 'default',
    data: payload.data,
    actions: [
      { action: 'view', title: '👀 ดูกิจกรรม' },
      { action: 'dismiss', title: '❌ ปิด' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// เมื่อคลิก notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data?.url || '/index.html';
    event.waitUntil(clients.openWindow(url));
  }
});
