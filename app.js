// Quiz Arena — game logic. Question banks: cricket.js, wwe.js. Release notes: whats-new.txt
let VER="";
const BANK=window.QUIZ_DATA;
const MK={e:2,m:5,h:8.5},NN={e:7,m:7,h:6},LB={e:"Easy",m:"Medium",h:"Hard"},MAX=100;
const $=s=>document.querySelector(s),app=$("#app");
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let qs,i,score,right,mode,locked,tm,tl,ll,skipped,wrong;
const TIME=20,MAXW=3;
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const LW=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const stopT=()=>{clearInterval(tm)};
const gs=k=>{try{return JSON.parse(localStorage.getItem("seen_"+k))||[]}catch(e){return[]}};
const ss=(k,a)=>{try{localStorage.setItem("seen_"+k,JSON.stringify(a))}catch(e){}};
function build(m){
 let seen=gs(m),out=[];
 for(const t of "emh"){
  const all=BANK[m].q.filter(x=>x[4]==t),n=NN[t];
  let p=shuf(all.filter(x=>!seen.includes(x[0]))).slice(0,n);
  if(p.length<n){p=p.concat(shuf(all.filter(x=>!p.includes(x))).slice(0,n-p.length));seen=seen.filter(id=>!all.some(x=>x[0]==id))}
  out=out.concat(p);
 }
 ss(m,seen.concat(out.map(x=>x[0])));
 return shuf(out);
}
function home(){stopT();
 app.innerHTML=`<button id="wn" class="wn">🆕 What’s New${VER?" · v"+VER:""}</button><h1>🎯 Quiz Arena</h1><div class="sub">Each round: 20 questions · 7 Easy (2) · 7 Medium (5) · 6 Hard (8.5) = 100 marks</div>`+
 Object.keys(BANK).map(k=>`<button class="btn" data-m="${k}">${BANK[k].name}<div style="font-size:13px;font-weight:400;color:#9fb8f0;margin-top:4px">${BANK[k].q.length} questions in bank</div></button>`).join("")+`<button class="btn" id="st" style="font-size:17px;padding:16px">📊 Stats (Best Score & History)</button>`;
 app.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>start(b.dataset.m));
 $("#wn").onclick=openWN;$("#st").onclick=()=>stats();
 app.insertAdjacentHTML("beforeend",`<div class="ver">${VER?"Version "+VER:""}</div>`);
}
function start(m){mode=m;qs=build(m);i=0;score=0;right=0;skipped=0;wrong=0;ll={f:1,s:1};show()}
function show(){
 const d=qs[i];locked=false;stopT();tl=TIME;
 const opts=shuf([d[1],...d[2]]);
 app.innerHTML=`<div class="top"><span>${BANK[mode].name}</span><span>Marks ${score} · ${"❤️".repeat(MAXW-wrong)}${"🖤".repeat(wrong)}</span><button id="qt" style="background:#7a1f33;color:#fff;border:0;border-radius:8px;padding:5px 12px">Quit</button></div>
 <div class="bar"><i style="width:${i/qs.length*100}%"></i></div>
 <div class="top"><span>Question ${i+1}/${qs.length}</span><span class="badge">${LB[d[4]]} · ${MK[d[4]]} mark${MK[d[4]]>1?"s":""}</span></div>
 <div class="q">${d[0]}</div>`+`<div class="ll"><span class="tmt" id="tmt">⏱ ${TIME}s</span><button id="l5" ${ll.f?"":"disabled"}>50-50</button><button id="ls" ${ll.s?"":"disabled"}>Skip</button></div>`+
 opts.map(o=>`<button class="opt">${o}</button>`).join("")+
 `<div class="info hide" id="info"></div><button class="btn hide" id="nx" style="font-size:17px;padding:15px">Next →</button>`;
 $("#qt").onclick=()=>{if(confirm("Want to quit? Scores will not be saved."))home()};
 app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>pick(b,d));
 tm=setInterval(()=>{tl--;const t=$("#tmt");if(t){t.textContent="⏱ "+tl+"s";if(tl<=5)t.classList.add("low")}if(tl<=0){stopT();timeUp(d)}},1000);
 $("#l5").onclick=()=>{if(locked||!ll.f)return;ll.f=0;$("#l5").disabled=true;shuf([...app.querySelectorAll(".opt")].filter(o=>o.textContent!==d[1])).slice(0,2).forEach(o=>{o.style.display="none"})};
 $("#ls").onclick=()=>{if(locked||!ll.s)return;ll.s=0;skipped++;stopT();i++;i<qs.length?show():end()};
}
function timeUp(d){if(!locked)wrong++;
 if(locked)return;locked=true;
 app.querySelectorAll(".opt").forEach(o=>{if(o.textContent===d[1])o.classList.add("ok")});
 const inf=$("#info");inf.classList.remove("hide");
 inf.innerHTML="⏰ Time up! Correct answer: <b>"+d[1]+"</b><br>"+d[3];
 const nx=$("#nx");nx.classList.remove("hide");
 nx.textContent=i+1<qs.length?"Next →":"Result dekho";
 nx.onclick=()=>{i++;(wrong>=MAXW||i>=qs.length)?end():show()};
}
function pick(b,d){stopT();
 if(locked)return;locked=true;
 const ok=b.textContent===d[1];
 if(ok){score+=MK[d[4]];right++}else wrong++;
 app.querySelectorAll(".opt").forEach(o=>{if(o.textContent===d[1])o.classList.add("ok");else if(o===b)o.classList.add("bad")});
 const inf=$("#info");inf.classList.remove("hide");
 inf.innerHTML=(ok?"✅ Correct! +"+MK[d[4]]+" marks":"❌ Incorrect. Correct answer: <b>"+d[1]+"</b>")+"<br>"+d[3];
 const nx=$("#nx");nx.classList.remove("hide");
 nx.textContent=i+1<qs.length?"Next →":"See Result";
 nx.onclick=()=>{i++;(wrong>=MAXW||i>=qs.length)?end():show()};
 nx.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function end(){stopT();
 const p=Math.round(score/MAX*100);
 {const h=LS("hist",[]);h.unshift({m:mode,s:score,r:right,d:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"})});LW("hist",h.slice(0,10));const bk="best_"+mode;if(score>LS(bk,0))LW(bk,score)}
 app.innerHTML=`<h1>${wrong>=MAXW?"Game Over 💀":"Round khatam!"}</h1><div class="big">${score}/${MAX}</div>
 <div class="c">${right}/20 sahi · ${p}% marks<br><br>${p<=20?"Don't give up, keep practicing! 💪":p<50?"Not bad, you can do better! 🙂":p<=70?"Good job, nice effort! 👍":p<=90?"Great work, almost there! 🔥":p<100?"Excellent! So close to perfect! 🏆":"PERFECT 100! You are a legend! 👑"}</div><br>
 <button class="btn" id="again">New Round (New questions)</button><button class="btn" id="hm">Home</button>`;
 $("#again").onclick=()=>start(mode);$("#hm").onclick=home;
}

function stats(tab){
 tab=tab||"best";
 const H=LS("hist",[]);
 let body="";
 if(tab==="best"){
  body=Object.keys(BANK).map(k=>`<div class="card"><div class="ch"><b>${BANK[k].name}</b></div><div class="big" style="font-size:40px;margin:6px 0">${LS("best_"+k,0)}<small style="font-size:16px"> / ${MAX}</small></div></div>`).join("");
 }else{
  body=H.length?H.map(x=>`<div class="card hrow"><span>${BANK[x.m]?BANK[x.m].name:x.m}</span><b>${x.s}/${MAX}</b><small>${x.r}/20 sahi · ${x.d}</small></div>`).join(""):'<div class="c" style="color:#8fa8e0;margin-top:30px">Now Round has been played</div>';
 }
 app.innerHTML=`<div class="top"><button class="x" id="sb">← Home</button><span>📊 Stats</span><span></span></div><div class="tabs"><button class="${tab==="best"?"on":""}" id="t1">🏆 Best Score</button><button class="${tab==="hist"?"on":""}" id="t2">🕘 History (last 10)</button></div>`+body;
 $("#sb").onclick=home;$("#t1").onclick=()=>stats("best");$("#t2").onclick=()=>stats("hist");
}
// ---- What's New screen: reads whats-new.txt (newest version first) ----
const loadWN=()=>fetch("whats-new.txt").then(r=>{if(!r.ok)throw 0;return r.text()}).catch(()=>new Promise((ok,no)=>{const s=document.createElement("script");s.src="whats-new.txt";s.onload=()=>window.WN_TXT?ok(window.WN_TXT):no();s.onerror=no;document.head.appendChild(s)}));
function openWN(){
 const ov=document.createElement("div");ov.className="ov";
 ov.innerHTML='<div class="panel"><div class="ph"><h2>🆕 What’s New</h2><button class="x">Close</button></div><div id="wl">Loading…</div></div>';
 document.body.appendChild(ov);
 ov.querySelector(".x").onclick=()=>ov.remove();
 const box=ov.querySelector("#wl");
 loadWN().then(t=>{
  box.innerHTML="";let card=null,ul=null,first=true;
  t.split(/\r?\n/).forEach(l=>{
   if(l.startsWith("## ")){
    const [v,d]=l.slice(3).split("|").map(x=>x.trim());
    card=document.createElement("div");card.className="card"+(first?" new":"");
    const h=document.createElement("div");h.className="ch";
    const b=document.createElement("b");b.textContent=v;h.appendChild(b);
    if(first){const g=document.createElement("span");g.className="tag";g.textContent="LATEST";h.appendChild(g)}
    const sm=document.createElement("small");sm.textContent=d||"";h.appendChild(sm);
    card.append(h);box.appendChild(card);ul=null;first=false;
   }else if(/^(New|Improved|Fixed):\s*$/.test(l)&&card){const n=l.replace(":","").trim(),k=n.toLowerCase();const sc=document.createElement("div");sc.className="sec s-"+k;sc.textContent=n;ul=document.createElement("ul");ul.className="u-"+k;card.append(sc,ul);
   }else if(l.startsWith("+ ")&&ul){const li=document.createElement("li");li.textContent=l.slice(2);ul.appendChild(li)}
  });
 }).catch(()=>{box.innerHTML='<iframe src="whats-new.txt"></iframe>'});
}
function checkUpd(t){
 const L=t.split(/\r?\n/),s=L.findIndex(l=>l.startsWith("## ")),e=L.findIndex((l,j)=>j>s&&l.startsWith("## "));
 if(s<0)return;
 const blk=L.slice(s,e<0?L.length:e),ver=blk[0].slice(3).split("|")[0].trim();
 const h=String(blk.join("\n").split("").reduce((a,c)=>(a*31+c.charCodeAt(0))|0,0));
 const old=LS("wn_sig",null);
 if(!old){LW("wn_sig",{v:ver,h});return}
 if(old.v===ver&&old.h===h)return;
 const items=blk.filter(l=>l.startsWith("+ ")).slice(0,5).map(l=>"<li>"+l.slice(2).replace(/</g,"&lt;")+"</li>").join("");
 const ov=document.createElement("div");ov.className="ov upd";
 ov.innerHTML='<div class="ucard"><div class="uic">🚀</div><h2>'+(old.v!==ver?"New version available":"New features added")+'</h2><div class="uv">'+ver+'</div><ul>'+items+'</ul><button class="btn" id="ub">Update now</button><button class="later" id="ulat">Later</button></div>';
 document.body.appendChild(ov);
 $("#ub").onclick=()=>{LW("wn_sig",{v:ver,h});location.reload()};
 $("#ulat").onclick=()=>ov.remove();
}
const topB=t=>{const L=t.split(/\r?\n/),s=L.findIndex(l=>l.startsWith("## ")),e=L.findIndex((l,j)=>j>s&&l.startsWith("## "));return s<0?null:L.slice(s,e<0?L.length:e)};
function checkUp2(inst){
 if(!navigator.onLine)return;
 fetch("whats-new.txt?chk="+Date.now(),{cache:"no-store"}).then(r=>{if(!r.ok)throw 0;return r.text()}).then(rt=>{
  const a=topB(inst),b=topB(rt);if(!a||!b)return;
  if(a.join("\n")===b.join("\n"))return;
  const va=a[0].slice(3).split("|")[0].trim(),vb=b[0].slice(3).split("|")[0].trim();
  const items=b.filter(l=>l.startsWith("+ ")).slice(0,5).map(l=>"<li>"+l.slice(2).replace(/</g,"&lt;")+"</li>").join("");
  const ov=document.createElement("div");ov.className="ov upd";
  ov.innerHTML='<div class="ucard"><div class="uic">🚀</div><h2>'+(va!==vb?"New version available":"New features added")+'</h2><div class="uv">'+vb+'</div><ul>'+items+'</ul><button class="btn" id="ub">Update now</button><button class="later" id="ulat">Not now</button></div>';
  document.body.appendChild(ov);
  $("#ulat").onclick=()=>ov.remove();
  $("#ub").onclick=async()=>{$("#ub").textContent="Updating…";try{await applyUpd()}catch(e){}location.reload()};
 }).catch(()=>{});
}
async function applyUpd(){
 if(!window.caches)return;
 const ks=await caches.keys();if(!ks.length)return;
 const c=await caches.open(ks[0]),q=f=>f+(f.includes("?")?"&":"?")+"chk="+Date.now();
 const h=await (await fetch(q("index.html"),{cache:"reload"})).text();
 const u=[...h.matchAll(/(?:src|href)="([^":#]+)"/g)].map(m=>m[1]);
 await Promise.all([...new Set(["./","index.html","whats-new.txt","manifest.json","icon-192.png","icon-512.png",...u])].map(f=>fetch(q(f),{cache:"reload"}).then(r=>{if(r.ok)return c.put(f,r)})));
}
// ---- PWA: install button + offline + update banner ----
let ip=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();ip=e;
 const b=document.createElement("button");b.className="inst";b.textContent="📲 Install App";
 b.onclick=async()=>{b.remove();ip.prompt();await ip.userChoice;ip=null};document.body.appendChild(b)});
window.addEventListener("appinstalled",()=>{const b=document.querySelector(".inst");if(b)b.remove()});
if("serviceWorker"in navigator){
 navigator.serviceWorker.register("sw.js").then(r=>{
  r.addEventListener("updatefound",()=>{const w=r.installing;
   w.addEventListener("statechange",()=>{if(false){
    const b=document.createElement("button");b.className="inst";b.textContent="🔄 New update available — tap to update";
    b.onclick=()=>location.reload();document.body.appendChild(b)}})})}).catch(()=>{});
}
loadWN().then(t=>{const m=t.match(/^## v([\d.]+)/m);if(m){VER=m[1];checkUp2(t);const b=$("#wn");if(b)b.textContent="🆕 What’s New · v"+VER;const v=document.querySelector(".ver");if(v)v.textContent="Version "+VER}}).catch(()=>{});
home();
