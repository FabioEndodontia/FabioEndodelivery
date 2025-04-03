// Nome do cache
const CACHE_NAME = 'fsf-endodontia-v1';

// Arquivos para cache inicial
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalação do service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Estratégia de cache: Cache First, then Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retornar a resposta do cache
        if (response) {
          return response;
        }

        // O clone é necessário porque o request só pode ser consumido uma vez
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Verificar se temos uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // O clone é necessário porque o response só pode ser consumido uma vez
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Não armazenar em cache chamadas de API
                if (!event.request.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

// Ativação do service worker e limpeza de caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Sincronizar dados quando a conexão for restabelecida
self.addEventListener('sync', event => {
  if (event.tag === 'sync-procedures') {
    event.waitUntil(syncProcedures());
  }
});

// Função para sincronizar procedimentos salvos offline
async function syncProcedures() {
  try {
    // Obtém os procedimentos pendentes do IndexedDB
    const pendingProcedures = await getPendingProcedures();
    
    // Envia cada procedimento pendente para o servidor
    for (const procedure of pendingProcedures) {
      await fetch('/api/procedures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(procedure)
      });
      
      // Remove o procedimento da lista de pendentes após sincronização
      await removePendingProcedure(procedure.id);
    }
    
    // Notifica o cliente que a sincronização foi concluída
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETED',
          message: `${pendingProcedures.length} procedimentos sincronizados com sucesso.`
        });
      });
    });
    
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

// Funções simuladas para lidar com o IndexedDB
async function getPendingProcedures() {
  // Implementação real usaria IndexedDB
  return [];
}

async function removePendingProcedure(id) {
  // Implementação real usaria IndexedDB
  console.log(`Procedimento ${id} removido da lista de pendentes`);
}