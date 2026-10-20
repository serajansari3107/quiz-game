// Har update par sirf CACHE ka version badlo (aur app.js ka VER) — phir purane phone par bhi update aa jayega
const CACHE="quiz-v1.3";
const FILES=["./","index.html","style.css","app.js","cricket.js","wwe.js","whats-new.txt","manifest.json","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{
 e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>c.add(new Request(f,{cache:"reload"}))))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).catch(()=>caches.match("index.html"))));
});
