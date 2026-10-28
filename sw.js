// CACHE sirf cache folder ka naam hai, ise badalne ki zaroorat nahi. App version whats-new.txt ke sabse upar wale block se aata hai.
const CACHE="quiz-v1.4";
const CORE=["./","index.html","css/style.css","js/app.js","js/questions/cricket-questions.js","js/questions/wwe-questions.js","whats-new.txt","manifest.json","assets/qa-icon-192.png","assets/qa-icon-512.png","assets/qa-icon-maskable-512.png","assets/qa-apple-180.png"];
async function qaFill(c){
 let r=await c.match("index.html");
 if(!r){await c.add(new Request("index.html",{cache:"reload"}));r=await c.match("index.html")}
 const t=await r.text(),u=[...t.matchAll(/(?:src|href)="([^":#]+)"/g)].map(m=>m[1]);
 let bad=0;
 for(const f of new Set([...CORE,...u])){
  if(await c.match(f,{ignoreSearch:true}))continue;
  try{await c.add(new Request(f,{cache:"reload"}))}catch(err){bad++}
 }
 return bad;
}
// Install tabhi poora maana jaata hai jab saari files cache mein hon. Adhoora ho to install fail hota hai aur purana SW/cache chalta rehta hai.
self.addEventListener("install",e=>{
 e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  if(await qaFill(c))throw new Error("precache-incomplete");
  self.skipWaiting();
 })());
});
// Sirf Quiz Arena ke purane "quiz-" caches hatate hain (CACHE aur update ka "quiz-stage" chhodkar). Activate tabhi chalta hai jab naya install poora ho chuka ho.
self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("quiz-")&&k!==CACHE&&k!=="quiz-stage").map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// App online khulne par cache mein koi file gum ho to chupchap dobara bhar deta hai (self-heal).
self.addEventListener("message",e=>{
 if(e.data&&e.data.type==="qa-heal")e.waitUntil(caches.open(CACHE).then(qaFill).catch(()=>{}));
});
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=="GET"||u.searchParams.has("chk")||u.origin!==location.origin)return;
 e.respondWith((async()=>{
  const c=await caches.open(CACHE);
  let r=await c.match(e.request,{ignoreSearch:true});
  if(!r&&e.request.mode==="navigate")r=await c.match("index.html");
  if(r){
   if(e.request.mode==="navigate"){const w=await c.match("whats-new.txt");let h=0;if(w){const x=await w.text();for(let i=0;i<x.length;i++)h=(h*31+x.charCodeAt(i))|0}const t=await r.text();return new Response(t.replace(/((?:src|href)=")((?:js|css)\/[^"?]+)(")/g,"$1$2?v="+(h>>>0).toString(36)+"$3"),{status:200,headers:{"Content-Type":"text/html; charset=utf-8"}})}
   if(r.redirected)r=new Response(await r.blob(),{status:200,headers:{"Content-Type":"text/html"}});
   return r;
  }
  try{const n=await fetch(e.request);if(n.ok)c.put(e.request,n.clone());return n}
  catch(err){if(e.request.mode==="navigate")return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#0e0e11;color:#f2f2f7;text-align:center;padding:40px 20px"><h2>Quiz Arena</h2><p>App files are not saved on this device yet. Open the app once with internet to finish setup.</p>',{status:503,headers:{"Content-Type":"text/html; charset=utf-8"}});return new Response("Offline",{status:503})}
 })());
});
// Background Sync: internet aate hi browser ye event deta hai. Sync app ke window mein hi chalta hai (login token aur outbox wahin hain);
// window na mile to fail karte hain taaki browser baad mein dobara try kare. App kholne par automatic sync waise bhi chalta hai.
self.addEventListener("sync",e=>{
 if(e.tag!=="qa-sync")return;
 e.waitUntil((async()=>{
  const cs=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  if(!cs.length)throw new Error("no-window");
  const ok=await new Promise(res=>{
   const t=setTimeout(()=>{self.removeEventListener("message",h);res(false)},25000);
   function h(m){if(m.data&&m.data.type==="qa-sync-done"){clearTimeout(t);self.removeEventListener("message",h);res(!!m.data.ok)}}
   self.addEventListener("message",h);
   cs.forEach(c=>c.postMessage({type:"qa-sync"}));
  });
  if(!ok)throw new Error("sync-incomplete");
 })());
});