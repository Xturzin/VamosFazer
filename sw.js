// Service Worker — Vamos Fazer?
// Estratégia: stale-while-revalidate para assets locais
// Supabase API calls passam sempre pela rede (sem cache)

const CACHE_NOME = 'vamos-fazer-v2';

const ASSETS_LOCAIS = [
   './',
   './index.html',
   './css/style.css',
   './js/script.js',
   './js/auth.js',
   './js/sync.js',
   './icon.svg',
   './manifest.json'
];

// Domínios que NUNCA devem ser cacheados
const DOMINIOS_REDE = [
   'supabase.co',
   'googleapis.com',
   'gstatic.com',
   'jsdelivr.net'
];

function devePassarPelaRede(url) {
   return DOMINIOS_REDE.some(function(dominio) {
      return url.includes(dominio);
   });
}

self.addEventListener('install', function(ev) {
   ev.waitUntil(
      caches.open(CACHE_NOME)
         .then(function(cache) {
            return cache.addAll(ASSETS_LOCAIS);
         })
         .then(function() {
            return self.skipWaiting();
         })
         .catch(function(err) {
            console.warn('SW: erro no install, continuando sem cache completo', err);
            return self.skipWaiting();
         })
   );
});

self.addEventListener('activate', function(ev) {
   ev.waitUntil(
      caches.keys()
         .then(function(keys) {
            return Promise.all(
               keys
                  .filter(function(k) { return k !== CACHE_NOME; })
                  .map(function(k) { return caches.delete(k); })
            );
         })
         .then(function() {
            return self.clients.claim();
         })
   );
});

self.addEventListener('fetch', function(ev) {
   if (ev.request.method !== 'GET') return;

   var url = ev.request.url;

   // Supabase e externos: sempre pela rede, sem cache
   if (devePassarPelaRede(url)) {
      ev.respondWith(
         fetch(ev.request).catch(function() {
            return new Response(JSON.stringify({ error: 'offline' }), {
               status: 503,
               headers: { 'Content-Type': 'application/json' }
            });
         })
      );
      return;
   }

   // Assets locais: stale-while-revalidate
   ev.respondWith(
      caches.open(CACHE_NOME).then(function(cache) {
         return cache.match(ev.request).then(function(cached) {
            var networkFetch = fetch(ev.request)
               .then(function(response) {
                  if (response && response.ok) {
                     cache.put(ev.request, response.clone());
                  }
                  return response;
               })
               .catch(function() { return null; });

            return cached || networkFetch;
         });
      })
   );
});
