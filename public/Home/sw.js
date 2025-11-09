self.addEventListener("install", (e) => {
  console.log("✅ Service Worker installed");
});

self.addEventListener("activate", (e) => {
  console.log("✅ Service Worker activated");
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow("/"));
});
