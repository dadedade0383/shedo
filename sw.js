// 根据 SW 自身位置推算部署根路径（兼容 GitHub Pages 子目录 /shedo/）
const BASE = new URL('.', self.location.href).pathname.replace(/\/$/,'');

const CACHE = 'shedo-v12';
const FILES = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/styles.css',
  BASE + '/js/app.js',
  BASE + '/manifest.webmanifest',
  BASE + '/assets/dog-photo.jpg',
  BASE + '/assets/icon-192x192.png',
  BASE + '/assets/icon-512x512.png'
];

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

  // 素材JSON: Network First
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

  // 核心文件 (HTML/JS/CSS): Network First
  const path = url.pathname;
  if(path === BASE + '/' || path === BASE + '/index.html' ||
     path.endsWith('/styles.css') || path.endsWith('/app.js')){
    e.respondWith(
      fetch(e.request).then(response=>{
        const clone = response.clone();
        caches.open(CACHE).then(c=>c.put(e.request, clone));
        return response;
      }).catch(()=>caches.match(e.request).then(r=>r||new Response('离线', {status:503})))
    );
    return;
  }

  // 其他资源: Cache First
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});