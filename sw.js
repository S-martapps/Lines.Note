// Lines.Note — Service Worker (GitHub Pages)
const CACHE_NAME = 'lines-note-v3';
const BASE = '/Lines.Note';

const PRECACHE = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icons/icon-72.png',
  BASE + '/icons/icon-96.png',
  BASE + '/icons/icon-128.png',
  BASE + '/icons/icon-144.png',
  BASE + '/icons/icon-152.png',
  BASE + '/icons/icon-180.png',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
  BASE + '/icons/icon-512-maskable.png',
];

const CDN_ORIGINS = [
  'https://cdnjs.cloudflare.com',
  'https://www.gstatic.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) return;

  if (CDN_ORIGINS.some(o => event.request.url.startsWith(o))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request)
        .then(cached => cached || caches.match(BASE + '/')))
  );
});
