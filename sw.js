const CACHE_NAME = 'inventory-app-cache-v2';
const CORE_ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시로 대체 (오프라인 지원)
// 화면(HTML) 요청은 브라우저 자체의 HTTP 캐시도 건너뛰도록 cache:'no-store'로 요청해서,
// 새로 배포한 내용이 몇 분씩 예전 화면으로 보이는 문제를 막습니다.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isPage = event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    event.request.url.endsWith('.html');

  const fetchPromise = isPage
    ? fetch(event.request, { cache: 'no-store' })
    : fetch(event.request);

  event.respondWith(
    fetchPromise
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
