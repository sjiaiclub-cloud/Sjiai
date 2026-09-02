// Minimal service worker: exists only so the browser considers this an installable PWA
// (Add to Home Screen). Deliberately does no caching or offline logic beyond a pass-through
// fetch handler, since this prototype has no assets worth caching aggressively yet.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
