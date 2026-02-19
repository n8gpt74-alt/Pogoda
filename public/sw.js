// Modern Service Worker with Workbox-like caching strategies
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `weather-dashboard-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const withBase = (path = '/') => `${BASE_PATH}${path}`;
const OFFLINE_URL = withBase('/offline.html');

// Статические ресурсы для немедленного кэширования
const STATIC_ASSETS = [
  withBase('/'),
  withBase('/index.html'),
  withBase('/manifest.json'),
  OFFLINE_URL,
];

// Настройки кэширования
const CACHE_LIMITS = {
  dynamic: 50,
  images: 30,
  api: 20,
};

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping waiting');
        return self.skipWaiting();
      })
  );
});

// Активация и очистка старых кэшей
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('weather-dashboard-') || 
                     name.startsWith('static-') || 
                     name.startsWith('dynamic-') ||
                     name.startsWith('images-') ||
                     name.startsWith('api-');
            })
            .filter((name) => {
              return !name.includes(CACHE_VERSION);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete, claiming clients');
        return self.clients.claim();
      })
  );
});

// Стратегии кэширования
const strategies = {
  // Cache First для статических ресурсов
  cacheFirst: async (request, cacheName = STATIC_CACHE) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  },

  // Network First для API
  networkFirst: async (request, cacheName = API_CACHE) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
      // Возвращаем fallback при отсутствии кэша
      return caches.match(OFFLINE_URL);
    }
  },

  // Stale While Revalidate для изображений
  staleWhileRevalidate: async (request, cacheName = IMAGE_CACHE) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => cached);

    return cached || fetchPromise;
  },
};

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем не-GET запросы
  if (request.method !== 'GET') return;

  // Пропускаем chrome-extension и другие не-http запросы
  if (!url.protocol.startsWith('http')) return;

  // API запросы к OpenWeatherMap
  if (url.hostname.includes('openweathermap.org')) {
    event.respondWith(strategies.networkFirst(request, API_CACHE, 10 * 60 * 1000));
    return;
  }

  // Изображения
  if (request.destination === 'image') {
    event.respondWith(strategies.staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Статические ресурсы (CSS, JS, шрифты)
  if (request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(strategies.cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML страницы
  if (request.mode === 'navigate') {
    event.respondWith(
      strategies.networkFirst(request, STATIC_CACHE)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Остальные запросы - Network First с fallback
  event.respondWith(
    strategies.networkFirst(request, DYNAMIC_CACHE)
      .catch(() => caches.match(request))
  );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-weather') {
    event.waitUntil(syncWeatherData());
  }
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
});

async function syncWeatherData() {
  console.log('[SW] Syncing weather data...');
  // Логика синхронизации при восстановлении соединения
}

async function syncAlerts() {
  console.log('[SW] Syncing weather alerts...');
  // Проверка погодных предупреждений
}

// Push уведомления
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Обновление погоды',
    icon: withBase('/icons/icon.svg'),
    badge: withBase('/icons/icon.svg'),
    vibrate: [100, 50, 100],
    tag: data.tag || 'weather-update',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'dismiss', title: 'Закрыть' }
    ],
    data: {
      url: data.url || withBase('/'),
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Метеостанция', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Если уже есть открытое окно - фокусируем его
        for (let client of windowClients) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Иначе открываем новое
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }
});

// Периодическая фоновая синхронизация (Periodic Background Sync)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-weather') {
    event.waitUntil(checkWeatherAlerts());
  }
});

async function checkWeatherAlerts() {
  // Проверка погодных предупреждений в фоне
  const apiKey = await getStoredApiKey();
  if (!apiKey) return;

  try {
    // Логика проверки предупреждений
    console.log('[SW] Checking weather alerts...');
  } catch (error) {
    console.error('[SW] Alert check failed:', error);
  }
}

async function getStoredApiKey() {
  // Получение API ключа из IndexedDB или localStorage
  return null;
}

// Логирование для отладки
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.message, event.filename, event.lineno);
});

console.log('[SW] Service Worker loaded');
