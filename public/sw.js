// Service Worker for FLEET PWA
self.addEventListener('install', (event) => {
  console.log('SW installed');
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through
  event.respondWith(fetch(event.request));
});
