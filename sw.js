const CACHE = 'shedo-v10';
const FILES = ['/','/index.html','/styles.css','/js/app.js','/manifest.webmanifest','/assets/dog-photo.jpg','/assets/icon-192x192.png','/assets/icon-512x512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const url = new URL(e.request.url);

  // 素材JSON: Network First（确保每天更新）
  if(url.pathname.includes('/data/daily-brief-')){
    e.respondWith(
      fetch(e.request).then(response=>{
        const clone = response.clone();
        caches.open(CACHE).then(c=>c.put(e.request, clone));
        return response;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }

  // 核心文件 (HTML/JS/CSS): Network First —— 每次刷新先取最新版，保证更新生效
  if(url.pathname==='/' || url.pathname==='/index.html' ||
     url.pathname.endsWith('/styles.css') || url.pathname.endsWith('/app.js')){
    e.respondWith(
      fetch(e.request).then(response=>{
        const clone = response.clone();
        caches.open(CACHE).then(c=>c.put(e.request, clone));
        return response;
      }).catch(()=>caches.match(e.request).then(r=>r||new Response('离线', {status:503})))
    );
    return;
  }

  // 其他资源 (图片等): Cache First
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});
