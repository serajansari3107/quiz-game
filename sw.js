// CACHE sirf cache folder ka naam hai, ise badalne ki zaroorat nahi. App version whats-new.txt ke sabse upar wale block se aata hai.
const CACHE="quiz-v1.3";
const FILES=["./","index.html","style.css","app.js","cricket.js","wwe.js","whats-new.txt","manifest.json","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{
 e.waitUntil(caches.open(CACHE).then(async c=>{const t=await (await fetch("index.html",{cache:"reload"})).text();const u=[...t.matchAll(/(?:src|href)="([^":#]+)"/g)].map(m=>m[1]);await Promise.all([...new Set(["./","index.html","whats-new.txt","icon-192.png","icon-512.png",...u])].map(f=>c.add(new Request(f,{cache:"reload"}))))}).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 e.respondWith(fetch(e.request,{cache:"no-cache"}).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(ch=>ch.put(e.request,c))}return res}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("index.html"))));
