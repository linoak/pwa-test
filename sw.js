const CACHE_NAME = 'todo-app-v1.3';
const urlsToCache = [
  './',
  './index-pwa.html',
  './styles.css',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// 安裝Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
});

// 啟用Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果快取中有回應，則返回快取的回應
        if (response) {
          return response;
        }

        // 否則從網路獲取
        return fetch(event.request).then(
          (response) => {
            // 檢查是否為有效的回應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 複製回應
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // 網路請求失敗時，嘗試返回預設頁面
          if (event.request.destination === 'document') {
            return caches.match('./index-pwa.html');
          }
        });
      })
  );
});

// 處理背景同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 處理推送通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '您有新的待辦事項提醒！',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看待辦事項',
        icon: './icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: '關閉',
        icon: './icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('待辦事項清單', options)
  );
});

// 處理通知點擊
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./index-pwa.html')
    );
  }
});

// 背景同步功能
function doBackgroundSync() {
  // 這裡可以添加背景同步邏輯
  console.log('Background sync completed');
}
