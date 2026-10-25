// CACHE sirf cache folder ka naam hai, ise badalne ki zaroorat nahi. App version whats-new.txt ke sabse upar wale block se aata hai.
const CACHE="quiz-v1.3";
const CORE=["./","index.html","css/style.css","js/app.js","js/questions/cricket-questions.js","js/questions/wwe-questions.js","whats-new.txt","manifest.json","assets/qa-icon-192.png","assets/qa-icon-512.png","assets/qa-icon-maskable-512.png","assets/qa-apple-180.png"];
self.addEventListener("install",e=>{
 e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  try{
   let r=await c.match("index.html");
   if(!r){await c.add(new Request("index.html",{cache:"reload"}));r=await c.match("index.html")}
   const t=await r.text(),u=[...t.matchAll(/(?:src|href)="([^":#]+)"/g)].map(m=>m[1]);
   for(const f of new Set([...CORE,...u])){
    if(!(await c.match(f,{ignoreSearch:true})))await c.add(new Request(f,{cache:"reload"})).catch(()=>{});
   }
  }catch(err){}
  self.skipWaiting();
 })());
});
self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=="GET"||u.searchParams.has("chk")||u.origin!==location.origin)return;
 e.respondWith((async()=>{
  const c=await caches.open(CACHE);
  let r=await c.match(e.request,{ignoreSearch:true});
  if(!r&&e.request.mode==="navigate")r=await c.match("index.html");
  if(r){
   if(r.redirected)r=new Response(await r.blob(),{status:200,headers:{"Content-Type":"text/html"}});
   return r;
  }
  try{const n=await fetch(e.request);if(n.ok)c.put(e.request,n.clone());return n}
  catch(err){return new Response("Offline",{status:503})}
 })());
});