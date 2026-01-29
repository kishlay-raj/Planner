/* eslint-disable no-restricted-globals */

// Service Worker for Flow Planner PWA
// Version: dynamic-v2
const CACHE_NAME = 'flow-planner-dynamic-v2';

// Essential static assets to pre-cache
const STATIC_ASSETS = [
    '/index.html',
    '/manifest.json'
    // Add other static root-level assets if needed (e.g. icons)
    // We avoid hardcoding /static/js/... because filenames contain hashes in production
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static shell');
                return cache.addAll(STATIC_ASSETS);
            })
            // Force activation immediately to start controlling clients
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all clients immediately
    );
});

// Fetch event - Dynamic Caching Strategy
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // 1. Navigation Requests (HTML) -> Network First, Fallback to Cache
    // This ensures we try to get the latest app version, but fallback to offline if needed.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache with fresh version
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // Offline fallback: serve index.html
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // 2. Asset Requests (JS, CSS, Images) -> Stale-While-Revalidate
    // We try to serve from cache immediately for speed, but update the cache in the background.
    if (
        requestUrl.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|json|woff|woff2)$/) &&
        requestUrl.origin === self.location.origin
    ) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        // Only cache valid responses
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(err => {
                        // Network failed, nothing to do (we rely on cache)
                        // console.log('Network fetch failed for asset', err);
                    });

                    // Return cached response if available, otherwise wait for network
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // 3. Default -> Network Only (API calls, etc.)
    // We let the browser handle this normally.
});
