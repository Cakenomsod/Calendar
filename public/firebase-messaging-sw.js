// Service Worker สำหรับ Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// ตั้งค่า Firebase (ใช้ค่าเดียวกับ firebase.js)
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

// จัดการ notification เมื่ออยู่ background
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [Service Worker] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'การแจ้งเตือนกิจกรรม';
  const notificationOptions = {
    body: payload.notification?.body || 'คุณมีกิจกรรมใหม่',
    icon: '/icon-192x192.png', // เปลี่ยนเป็น path icon ของคุณ
    badge: '/badge-72x72.png',
    tag: payload.data?.activityId || 'default',
    requireInteraction: true,
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: '👀 ดูรายละเอียด' },
      { action: 'dismiss', title: '❌ ปิด' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// จัดการเมื่อคลิก notification
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [Service Worker] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view') {
    // เปิดหน้า calendar ที่วันที่กิจกรรม
    const activityDate = event.notification.data?.date;
    const url = activityDate 
      ? `/index.html?date=${activityDate}` 
      : '/index.html';
    
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});