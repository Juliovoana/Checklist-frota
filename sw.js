// ============================================================
// CHECKLIST FROTA — Service Worker
// Só cuida do "shell" do app (HTML/CSS/JS/ícones) pra ele abrir
// mesmo sem internet. NUNCA intercepta chamadas pro Worker/Supabase
// (dados da frota, checklists, fotos) -- essas continuam indo
// direto pra rede, e o próprio app já sabe lidar com elas offline
// (cache em localStorage, fila de pendentes).
//
// Bump a versão do CACHE_NAME sempre que mudar a lista de CORE_ASSETS
// ou quiser forçar todo mundo a buscar o shell atualizado.
// ============================================================

const CACHE_NAME = 'frota-shell-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // POST (enviar checklist, salvar item, validar senha etc.) sempre
  // direto pra rede -- o SW nunca entra no meio disso.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    // Cross-origin: só intercepta os 2 CDNs do shell (pra funcionar
    // offline). Qualquer outra coisa (Cloudflare Worker, Supabase,
    // fotos do Drive) passa direto, sempre buscando fresco.
    if (!CORE_ASSETS.includes(req.url)) return;
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Mesma origem (o próprio app): stale-while-revalidate -- mostra
  // do cache na hora (abre instantâneo, funciona offline) e atualiza
  // em segundo plano pra próxima vez.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
