// ==========================================================
// sw.js - Dia 5 e Dia 6: cache para funcionamento offline
// Estratégia: network first (rede primeiro, cache como alternativa).
// ==========================================================

const CACHE_NAME = "cafe-mobile-v2";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/dados.js",
  "./js/app.js",
  "./js/camera.js",
  "./js/pwa.js",
  "./manifest.json",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./icons/icon-maskable-512.svg"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(ARQUIVOS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys()
      .then(function (nomes) {
        return Promise.all(
          nomes
            .filter(function (nome) {
              return nome !== CACHE_NAME;
            })
            .map(function (nome) {
              return caches.delete(nome);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") return;

  const url = new URL(evento.request.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    fetch(evento.request)
      .then(function (resposta) {
        if (resposta && resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(evento.request, copia);
          });
        }
        return resposta;
      })
      .catch(async function () {
        const salva = await caches.match(evento.request);
        if (salva) return salva;

        if (evento.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return new Response("Conteúdo indisponível offline.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
  );
});
