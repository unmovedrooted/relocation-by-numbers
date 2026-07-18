const CACHE_VERSION = "relocation-pwa-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/logo.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  // Do not call skipWaiting: the new worker must not replace calculator code
  // while an existing tab and calculation are still active.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("relocation-pwa-") && key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // POST bodies include email and financial inputs. They, API responses,
  // authenticated requests, and cross-origin resources must never be cached.
  if (
    request.method !== "GET" ||
    request.headers.has("authorization") ||
    request.mode !== "navigate"
  ) {
    return;
  }

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/fire-calculator/share")
  ) {
    return;
  }

  // Documents are always network-first and are never written to Cache Storage.
  // This keeps tax, mortgage, relocation, and FIRE formulas deployment-current.
  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_VERSION);
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }),
  );
});
