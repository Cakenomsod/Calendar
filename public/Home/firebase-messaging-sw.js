// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging.js");

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

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message:", payload);
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body });
});
