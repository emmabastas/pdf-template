/// <reference lib="webworker" />
const self_ = (self as unknown) as ServiceWorkerGlobalScope

self_.addEventListener('install', () => {
  self_.skipWaiting(); // Activate worker immediately
});

self_.addEventListener('activate', () => {
  self_.clients.claim(); // Take control of all pages
});

self_.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'GET' && url.pathname === '/initial-source.typ') {
    const mockResponse = `Hello world`;

    event.respondWith(
      new Response(mockResponse, {
        headers: { 'Content-Type': 'text/plain' }
      })
    );
  }
})
