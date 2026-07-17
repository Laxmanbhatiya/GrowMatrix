// No-op service worker stub.
// This file exists to prevent 404 errors when browsers or extensions
// automatically probe for /sw.js. No caching or offline logic is active.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
