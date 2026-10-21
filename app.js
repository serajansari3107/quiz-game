// Quiz Arena — game logic. Question banks: cricket.js, wwe.js. Release notes: whats-new.txt
let VER="";
const BANK=window.QUIZ_DATA;
Object.keys(BANK).forEach(k=>{const s=new Set();BANK[k].q=BANK[k].q.filter(x=>{const n=x[0].toLowerCase().replace(/[^a-z0-9]/g,"");if(s.has(n))return false;s.add(n);return true})});
const MODES={5:{n:{e:2,m:2,h:1},mk:{e:2,m:4,h:8},max:20},10:{n:{e:3,m:4,h:3},mk:{e:2,m:5,h:8},max:50},20:{n:{e:7,m:7,h:6},mk:{e:2,m:5,h:8.5},max:100}};
let QN=20,MK=MODES[20].mk,NN=MODES[20].n,MAX=100;
const LB={e:"Easy",m:"Medium",h:"Hard"};
const setQN=n=>{QN=MODES[n]?n:20;MK=MODES[QN].mk;NN=MODES[QN].n;MAX=MODES[QN].max};
const modeInfo=()=>`${QN} questions · ${NN.e} Easy (${MK.e}) · ${NN.m} Medium (${MK.m}) · ${NN.h} Hard (${MK.h}) = ${MAX} marks`;
const bestKey=(k,n)=>"best_"+k+(n===20?"":"_"+n);
const $=s=>document.querySelector(s),app=$("#app");
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let qs,i,score,right,mode,locked,tm,tl,ll,skipped,wrong;
const TIME=20,MAXW=3;
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const LW=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const stopT=()=>{clearInterval(tm)};
const SET=Object.assign({snd:1,vib:1},LS("settings",{}));
const saveSet=()=>LW("settings",SET);
setQN(LS("qn",20));
let AC=null;
const unlockA=()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume()}catch(e){}};
const vib=p=>{if(SET.vib&&navigator.vibrate)try{navigator.vibrate(p)}catch(e){}};
function beep(f,d,t,v,w){if(!SET.snd)return;setTimeout(()=>{try{unlockA();const o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=t||"sine";o.frequency.value=f;g.gain.setValueAtTime(v||.15,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(AC.destination);o.start(n);o.stop(n+d)}catch(e){}},w||0)}
const SFX={
 ok(){beep(660,.12);beep(880,.2,"sine",.15,110);vib(40)},
 bad(){beep(200,.35,"sawtooth",.1);vib(250)},
 tick(){beep(1000,.05,"square",.05)},
 win(){[523,659,784,1047].forEach((f,j)=>beep(f,.2,"sine",.15,j*140))},
 over(){[400,330,260,180].forEach((f,j)=>beep(f,.25,"sawtooth",.1,j*200));vib([200,100,200])}
};
function openMenu(){
 const ov=document.createElement("div");ov.className="ov";
 ov.innerHTML='<div class="panel"><div class="ph"><h2>☰ Menu</h2><button class="x">Close</button></div><button class="btn" id="m1">📊 Stats (Best Score & History)</button><button class="btn" id="m2">⚙️ Settings</button></div>';
 document.body.appendChild(ov);
 ov.querySelector(".x").onclick=()=>ov.remove();
 ov.querySelector("#m1").onclick=()=>{ov.remove();stats()};
 ov.querySelector("#m2").onclick=()=>{ov.remove();settings()};
}
function settings(){
 const row=(k,ic,t)=>`<div class="card hrow"><span>${ic} ${t}</span><button class="btn" data-k="${k}" style="width:auto;margin:0 0 0 auto;padding:8px 20px;font-size:15px;opacity:${SET[k]?1:.55}">${SET[k]?"ON":"OFF"}</button></div>`;
 app.innerHTML=`<div class="top"><button class="x" id="sb">← Home</button><span>⚙️ Settings</span><span></span></div>`+row("snd","🔊","Sound")+row("vib","📳","Vibration");
 $("#sb").onclick=home;
 app.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;SET[k]=SET[k]?0:1;saveSet();unlockA();if(k==="snd"&&SET.snd)SFX.ok();if(k==="vib")vib(60);b.textContent=SET[k]?"ON":"OFF";b.style.opacity=SET[k]?1:.55});
}
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
 app.innerHTML=`<div class="hm"><div class="hm-in"><div class="hm-bar"><button id="mn" class="hm-chip">☰ Menu</button><button id="wn" class="hm-chip">🆕 What’s New${VER?" · v"+VER:""}</button></div><div class="hm-hero"><div class="hm-logo">🎯</div><h1>Quiz Arena</h1><p>Challenge Your Mind. Prove Your Knowledge.</p></div><div class="hm-label">Choose a category</div><div class="hm-grid">`+
 Object.keys(BANK).map(k=>{const nm=BANK[k].name,e=nm.match(/^(\p{Extended_Pictographic}\S*)\s+(.+)$/u);return`<button class="hm-card" data-m="${k}"><span class="hm-ic">${e?e[1]:"📚"}</span><span class="hm-tx"><b>${e?e[2]:nm}</b><small>${BANK[k].q.length} questions</small></span><span class="hm-go">›</span></button>`}).join("")+`</div></div></div>`;
 app.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>selMode(b.dataset.m));
 $("#wn").onclick=openWN;$("#mn").onclick=openMenu;
 app.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>{setQN(+b.dataset.n);LW("qn",QN);home()});
 $(".hm-in").insertAdjacentHTML("beforeend",`<div class="ver">${VER?"Version "+VER:""}</div>`);
}
function selMode(m){
 const draw=()=>{
  app.innerHTML=`<div class="top"><button class="x" id="sb">← Home</button><span>${BANK[m].name}</span><span></span></div><h1 style="margin-top:20px">Select Mode</h1><div class="tabs">${[5,10,20].map(n=>`<button data-n="${n}" class="${n===QN?"on":""}">${n} Questions</button>`).join("")}</div><div class="sub" style="margin-bottom:20px">${modeInfo()}</div><button class="btn" id="pl">▶ Play</button>`;
  $("#sb").onclick=home;
  $("#pl").onclick=()=>start(m);
  app.querySelectorAll("[data-n]").forEach(b=>b.onclick=()=>{setQN(+b.dataset.n);LW("qn",QN);draw()});
 };
 draw();
}
function start(m){unlockA();mode=m;qs=build(m);i=0;score=0;right=0;skipped=0;wrong=0;ll={f:1,s:1,c:1};show()}
function show(){
 const d=qs[i];locked=false;stopT();tl=TIME;
 const opts=shuf([d[1],...d[2]]);
 app.innerHTML=`<div class="top"><span>${BANK[mode].name}</span><span>Marks ${score} · ${"❤️".repeat(MAXW-wrong)}${"🖤".repeat(wrong)}</span><button id="qt" style="background:#7a1f33;color:#fff;border:0;border-radius:8px;padding:5px 12px">Quit</button></div>
 <div class="bar"><i style="width:${i/qs.length*100}%"></i></div>
 <div class="top"><span>Question ${i+1}/${qs.length}</span><span class="badge">${LB[d[4]]} · ${MK[d[4]]} mark${MK[d[4]]>1?"s":""}</span></div>
 <div class="q">${d[0]}</div>`+`<div class="ll"><span class="tmt" id="tmt">⏱ ${TIME}s</span><button id="lc" ${ll.c?"":"disabled"} style="padding:7px 10px">🔄</button><button id="l5" ${ll.f?"":"disabled"}>50-50</button><button id="ls" ${ll.s?"":"disabled"}>Skip</button></div>`+
 opts.map(o=>`<button class="opt">${o}</button>`).join("")+
 `<div class="info hide" id="info"></div><button class="btn hide" id="nx" style="font-size:17px;padding:15px">Next →</button>`;
 $("#qt").onclick=()=>{if(confirm("Want to quit? Scores will not be saved."))home()};
 app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>pick(b,d));
 tm=setInterval(()=>{tl--;const t=$("#tmt");if(t){t.textContent="⏱ "+tl+"s";if(tl<=5){t.classList.add("low");if(tl>0)SFX.tick()}}if(tl<=0){stopT();timeUp(d)}},1000);
 $("#lc").onclick=()=>{if(locked||!ll.c)return;const used=gs(mode),cand=BANK[mode].q.filter(x=>x[4]===d[4]&&!qs.includes(x));let p=cand.filter(x=>!used.includes(x[0]));if(!p.length)p=cand;if(!p.length)return;ll.c=0;const n=p[Math.floor(Math.random()*p.length)];qs[i]=n;ss(mode,used.concat(n[0]));show()};
 $("#l5").onclick=()=>{if(locked||!ll.f)return;ll.f=0;$("#l5").disabled=true;shuf([...app.querySelectorAll(".opt")].filter(o=>o.textContent!==d[1])).slice(0,2).forEach(o=>{o.style.display="none"})};
 $("#ls").onclick=()=>{if(locked||!ll.s)return;ll.s=0;skipped++;stopT();i++;i<qs.length?show():end()};
}
function timeUp(d){if(!locked){wrong++;SFX.bad()}
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
 if(ok){score+=MK[d[4]];right++}else wrong++;ok?SFX.ok():SFX.bad();
 app.querySelectorAll(".opt").forEach(o=>{if(o.textContent===d[1])o.classList.add("ok");else if(o===b)o.classList.add("bad")});
 const inf=$("#info");inf.classList.remove("hide");
 inf.innerHTML=(ok?"✅ Correct! +"+MK[d[4]]+" marks":"❌ Incorrect. Correct answer: <b>"+d[1]+"</b>")+"<br>"+d[3];
 const nx=$("#nx");nx.classList.remove("hide");
 nx.textContent=i+1<qs.length?"Next →":"See Result";
 nx.onclick=()=>{i++;(wrong>=MAXW||i>=qs.length)?end():show()};
 nx.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function end(){stopT();wrong>=MAXW?SFX.over():SFX.win();
 const p=Math.round(score/MAX*100);
 {const h=LS("hist",[]);h.unshift({m:mode,s:score,r:right,n:QN,d:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"})});LW("hist",h.slice(0,10));{const S=LS("sum",{}),sk=mode+"_"+QN,a=S[sk]||{r:0,q:0,c:0,w:0,p:0};a.r++;a.q+=right+wrong;a.c+=right;a.w+=wrong;a.p+=score;a.f=(a.f||0)+(right===QN?1:0);S[sk]=a;LW("sum",S)}const bk=bestKey(mode,QN);if(score>LS(bk,0))LW(bk,score)}
 app.innerHTML=`<h1>${wrong>=MAXW?"Game Over 💀":"Round Over!"}</h1><div class="big">${score}/${MAX}</div>
 <div class="c">${right}/${QN} Correct · ${p}% marks<br><br>${p<=20?"Don't give up, keep practicing! 💪":p<50?"Not bad, you can do better! 🙂":p<=70?"Good job, nice effort! 👍":p<=90?"Great work, almost there! 🔥":p<100?"Excellent! So close to perfect! 🏆":"PERFECT 100! You are a legend! 👑"}</div><br>
 <button class="btn" id="again">New Round (New questions)</button><button class="btn" id="hm">Home</button>`;
 $("#again").onclick=()=>start(mode);$("#hm").onclick=home;
}

let sumQ="all",sumN="all";
const RATINGS=[["👑 Quiz Legend",95,200],["🏆 Master",85,100],["🎖️ Expert",75,50],["⭐ Advanced",60,30],["⚔️ Challenger",40,20],["🌱 Rookie",0,10]];
const getRating=(ac,r)=>{const a=RATINGS.find(t=>ac>=t[1]&&r>=t[2]),n=RATINGS.find(t=>ac>=t[1]);return[a?a[0]:"🔒 Unranked",a===n?"":(n[2]-r)+" more rounds needed for "+n[0].replace(/^\S+\s/,"")]};
const rateRow=(ac,r)=>{const g=getRating(ac,r);return `<div class="card hrow"><span>Quiz Arena Rating</span><b>${g[0]}</b>${g[1]?`<small>${g[1]}</small>`:""}</div>`};
function sumHTML(){
 const S=LS("sum",{}),t={r:0,q:0,c:0,w:0,p:0,f:0};
 Object.keys(S).forEach(k=>{const j=k.lastIndexOf("_"),m=k.slice(0,j),n=k.slice(j+1);if((sumQ==="all"||sumQ===m)&&(sumN==="all"||sumN===n))for(const f in t)t[f]+=S[k][f]||0});
 const rd=x=>Math.round(x*10)/10,acc=t.q?rd(t.c/t.q*100):0,st="flex:1;padding:11px;border-radius:12px;border:1px solid #3a5bb8;background:#10265f;color:#fff;font-size:15px";
 const row=(a,b)=>`<div class="card hrow"><span>${a}</span><b>${b}</b></div>`;
 const sel=(id,v,o,w)=>`<select id="${id}" style="${st};flex:${w}">${o.map(x=>`<option value="${x[0]}"${x[0]===v?" selected":""}>${x[1]}</option>`).join("")}</select>`;
 return '<div style="display:flex;gap:8px;margin-bottom:14px">'+sel("sq",sumQ,[["all","All time"]].concat(Object.keys(BANK).map(k=>[k,BANK[k].name])),1.6)+sel("sn",sumN,[["all","All"],["5","5"],["10","10"],["20","20"]],1)+'</div>'+row("Total Rounds Played",t.r)+row("Questions Played",t.q)+row("Correct Answers",t.c)+row("Wrong Answers",t.w)+row("Points Secured",rd(t.p))+row("Accuracy Rate",acc+"%")+row("Perfect Rounds",t.f)+rateRow(t.q?t.c/t.q*100:0,t.r);
}
function stats(tab){
 tab=tab||"best";
 const H=LS("hist",[]);
 let body="";
 if(tab==="best"){
  body=Object.keys(BANK).map(k=>`<div class="card"><div class="ch"><b>${BANK[k].name}</b></div>${[5,10,20].map(n=>`<div class="hrow"><span>${n} Questions</span><b>${LS(bestKey(k,n),0)} / ${MODES[n].max}</b></div>`).join("")}</div>`).join("");
 }else{
  body=tab==="sum"?sumHTML():H.length?H.map(x=>`<div class="card hrow"><span>${BANK[x.m]?BANK[x.m].name:x.m}</span><b>${x.s}/${MODES[x.n||20].max}</b><small>${x.r}/${x.n||20} Correct · ${x.d}</small></div>`).join(""):'<div class="c" style="color:#8fa8e0;margin-top:30px">Now Round has been played</div>';
 }
 app.innerHTML=`<div class="top"><button class="x" id="sb">← Home</button><span>📊 Stats</span><span></span></div><div class="tabs"><button class="${tab==="best"?"on":""}" id="t1">🏆 Best Score</button><button class="${tab==="hist"?"on":""}" id="t2">🕘 History (last 10)</button><button class="${tab==="sum"?"on":""}" id="t3">📈 Summary</button></div>`+body;
 $("#sb").onclick=home;$("#t1").onclick=()=>stats("best");$("#t2").onclick=()=>stats("hist");$("#t3").onclick=()=>stats("sum");if(tab==="sum"){$("#sq").onchange=e=>{sumQ=e.target.value;stats("sum")};$("#sn").onchange=e=>{sumN=e.target.value;stats("sum")}}
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
