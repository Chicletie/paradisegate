/* paradisegate — service worker de desligamento. Aparelhos que visitaram a wiki antes deste
   repositório assumir o domínio ainda podem ter o service worker do site antigo instalado (cache
   primeiro, ver docs/fase4-site.md); este arquivo se registra por cima dele, apaga todos os
   caches guardados nesta origem e se desregistra, pra o navegador parar de interceptar pedidos
   e voltar a ir direto pra rede. */
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll(); })
      .then(function (clients) {
        clients.forEach(function (client) { client.navigate(client.url); });
      })
  );
});
