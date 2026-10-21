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
if(!LS("since",0))LW("since",Date.now());
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
 ov.innerHTML='<div class="panel mnu-d"><div class="ph"><h2>☰ Menu</h2><button class="x">Close</button></div><button class="mnu-i" id="m1"><span class="mnu-ic">📊</span><span class="mnu-t"><b>Stats</b><small>Summary & History</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m2"><span class="mnu-ic">⚙️</span><span class="mnu-t"><b>Settings</b><small>Sound & Vibration</small></span><span class="hm-go">›</span></button></div>';
 document.body.appendChild(ov);
 ov.querySelector(".x").onclick=()=>ov.remove();
 ov.className="ov mnu";ov.onclick=e=>{if(e.target===ov)ov.remove()};
 ov.querySelector("#m1").onclick=()=>{ov.remove();stats()};
 ov.querySelector("#m2").onclick=()=>{ov.remove();settings()};
}
const toMenu=()=>{home();openMenu()};
function settings(){const home=toMenu;
 const row=(k,ic,t)=>`<div class="se-r"><span class="se-ic">${ic}</span><span class="se-t">${t}</span><button class="se-tg${SET[k]?" on":""}" data-k="${k}">${SET[k]?"ON":"OFF"}</button></div>`;
 app.innerHTML=`<div class="se"><div class="se-in"><div class="st-bar"><button class="hm-chip" id="sb">← Back</button><span class="sm-cat">⚙️ Settings</span></div><div class="se-list">`+row("snd","🔊","Sound")+row("vib","📳","Vibration")+`</div></div></div>`;
 $("#sb").onclick=home;
 app.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;SET[k]=SET[k]?0:1;saveSet();unlockA();if(k==="snd"&&SET.snd)SFX.ok();if(k==="vib")vib(60);b.textContent=SET[k]?"ON":"OFF";b.classList.toggle("on",!!SET[k])});
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
  app.innerHTML=`<div class="sm"><div class="sm-in"><div class="sm-bar"><button class="hm-chip" id="sb">← Home</button><span class="sm-cat">${BANK[m].name}</span></div><div class="sm-hd"><h1>Select Mode</h1><p>Choose how many questions you want to play</p></div><div class="sm-opts">${[5,10,20].map(n=>`<button class="sm-opt${n===QN?" on":""}" data-n="${n}"><span class="sm-n">${n}</span><span class="sm-t"><b>${n} Questions</b><small>${MODES[n].max} marks</small></span><span class="sm-ck"></span></button>`).join("")}</div><p class="sm-info">${modeInfo()}</p><button class="sm-go" id="pl">▶ Start Quiz</button></div></div>`;
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
 app.innerHTML=`<div class="qz"><div class="qz-in"><div class="qz-top"><button id="qt" class="hm-chip">✕ Quit</button><div class="qz-st"><span class="qz-pill">Marks ${score}</span><span class="qz-pill">${"❤️".repeat(MAXW-wrong)}</span></div></div>
 <div class="bar"><i style="width:${i/qs.length*100}%"></i></div>
 <div class="qz-prog"><span>Question ${i+1}/${qs.length}</span><span class="badge">${LB[d[4]]} · ${MK[d[4]]} mark${MK[d[4]]>1?"s":""}</span></div>
 <div class="qz-card"><small class="qz-cat">${BANK[mode].name}</small><div class="q">${d[0]}</div></div>`+`<div class="ll"><span class="tmt" id="tmt">⏱ ${TIME}s</span><button id="lc" ${ll.c?"":"disabled"} style="padding:7px 10px">🔄</button><button id="l5" ${ll.f?"":"disabled"}>50-50</button><button id="ls" ${ll.s?"":"disabled"}>Skip</button></div>`+
 opts.map(o=>`<button class="opt">${o}</button>`).join("")+
 `<div class="info hide" id="info"></div><button class="qz-nx hide" id="nx">Next →</button></div></div>`;
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
 {const h=LS("hist",[]);h.unshift({m:mode,s:score,r:right,n:QN,d:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"})});LW("hist",h.slice(0,10));{const S=LS("sum",{}),sk=mode+"_"+QN,a=S[sk]||{r:0,q:0,c:0,w:0,p:0};a.r++;a.q+=right+wrong;a.c+=right;a.w+=wrong;a.p+=score;a.f=(a.f||0)+(right===QN?1:0);S[sk]=a;LW("sum",S)}upStr(mode,QN,right===QN);const bk=bestKey(mode,QN);if(score>LS(bk,0))LW(bk,score)}
 app.innerHTML=`<div class="rs"><div class="rs-in"><h1>${wrong>=MAXW?"Game Over 💀":"Round khatam!"}</h1><div class="rs-hero"><div class="rs-score">${score}<small>/${MAX}</small></div><div class="rs-bar"><i style="width:${Math.min(100,p)}%"></i></div><div class="rs-pc">${p}% marks</div></div><div class="rs-grid"><div class="rs-c"><small>Accuracy</small><b>${right+wrong?Math.round(right/(right+wrong)*100):0}%</b></div><div class="rs-c"><small>Points</small><b>${score}</b></div><div class="rs-c ok"><small>Correct</small><b>${right}/${QN}</b></div><div class="rs-c bad"><small>Wrong</small><b>${wrong}</b></div></div>
 <div class="rs-msg">${p<=20?"Don't give up, keep practicing! 💪":p<50?"Not bad, you can do better! 🙂":p<=70?"Good job, nice effort! 👍":p<=90?"Great work, almost there! 🔥":p<100?"Excellent! So close to perfect! 🏆":"PERFECT 100! You are a legend! 👑"}</div><br>
 <button class="rs-b1" id="again">New Round (New questions)</button><button class="rs-b2" id="hm">Home</button></div></div>`;
 $("#again").onclick=()=>start(mode);$("#hm").onclick=home;
}

function openRT(){
 const ov=document.createElement("div");ov.className="ov rtm";
 ov.innerHTML='<div class="rtm-box"><div class="rtm-h"><h2>🏅 Rating Criteria</h2><button class="hm-chip" id="rtx">Close</button></div><div class="rtm-w"><table class="rtm-t"><thead><tr><th>Rating</th><th>Min Accuracy</th><th>Min Rounds</th></tr></thead><tbody>'+RATINGS.map(t=>"<tr><td>"+t[0]+"</td><td>"+t[1]+"%</td><td>"+t[2]+"</td></tr>").join("")+'</tbody></table></div><p class="rtm-n">You need both the minimum accuracy and the minimum rounds to earn a rating.</p></div>';
 document.body.appendChild(ov);
 const cl=()=>ov.remove();
 ov.querySelector("#rtx").onclick=cl;
 ov.onclick=e=>{if(e.target===ov)cl()};
}
let sumQ="all",sumN="all";
const bfStr=()=>{const H=LS("hist",[]).slice().reverse(),P={};["all"].concat(Object.keys(BANK)).forEach(q=>["all","5","10","20"].forEach(n=>{let c=0,b=0;H.forEach(x=>{const xn=x.n||20;if((q==="all"||x.m===q)&&(n==="all"||String(xn)===n)){if(x.r===xn){c++;if(c>b)b=c}else c=0}});P[q+"_"+n]={c,b}}));return P};
const upStr=(m,n,p)=>{let P=LS("pstr",null);if(!P){LW("pstr",bfStr());return}[["all","all"],[m,"all"],["all",""+n],[m,""+n]].forEach(k=>{const e=k.join("_"),o=P[e]||{c:0,b:0};o.c=p?o.c+1:0;if(o.c>o.b)o.b=o.c;P[e]=o});LW("pstr",P)};
const RATINGS=[["👑 Quiz Legend",95,200],["🏆 Master",85,100],["🎖️ Expert",75,50],["⭐ Advanced",60,30],["⚔️ Challenger",40,20],["🌱 Rookie",0,10]];
const getRating=(ac,r)=>{const a=RATINGS.find(t=>ac>=t[1]&&r>=t[2]),n=RATINGS.find(t=>ac>=t[1]);return[a?a[0]:"🔒 Unranked",a===n?"":(n[2]-r)+" more rounds needed for "+n[0].replace(/^\S+\s/,"")]};
const rateRow=(ac,r)=>{const g=getRating(ac,r);return `<div class="card hrow st-rate" id="rtc"><span>Quiz Arena Rating ⓘ</span><b>${g[0]}</b>${g[1]?`<small>${g[1]}</small>`:""}</div>`};
function sumHTML(){
 const S=LS("sum",{}),t={r:0,q:0,c:0,w:0,p:0,f:0};
 Object.keys(S).forEach(k=>{const j=k.lastIndexOf("_"),m=k.slice(0,j),n=k.slice(j+1);if((sumQ==="all"||sumQ===m)&&(sumN==="all"||sumN===n))for(const f in t)t[f]+=S[k][f]||0});
 const rd=x=>Math.round(x*10)/10,acc=t.q?rd(t.c/t.q*100):0,st="flex:1;padding:12px 14px;border-radius:14px;border:1px solid #2a2a33;background:#17171c;color:#f2f2f7;font-size:15px;font-weight:600;font-family:inherit";
 const row=(a,b)=>`<div class="st-c"><small>${a}</small><b class="${parseFloat(b)===0?"z":""}">${b}</b></div>`;
 const sel=(id,v,o,w)=>`<select id="${id}" style="${st};flex:${w}">${o.map(x=>`<option value="${x[0]}"${x[0]===v?" selected":""}>${x[1]}</option>`).join("")}</select>`;
 return '<div style="display:flex;gap:8px;margin-bottom:14px">'+sel("sq",sumQ,[["all","All time"]].concat(Object.keys(BANK).map(k=>[k,BANK[k].name])),1.6)+sel("sn",sumN,[["all","All"],["5","5"],["10","10"],["20","20"]],1)+'</div><div class="st-grid">'+row("Total Rounds Played",t.r)+row("Questions Played",t.q)+row("Correct Answers",t.c)+row("Wrong Answers",t.w)+row("Points Secured",rd(t.p))+row("Accuracy Rate",acc+"%")+row("Perfect Rounds",t.f)+row("Longest Perfect Streak",Math.max(((LS("pstr",null)||bfStr())[sumQ+"_"+sumN]||{}).b||0,t.f>0?1:0))+row("User Since",(()=>{const v=LS("since",0);return v?new Date(v).toLocaleDateString("en-US",{month:"long",year:"numeric"}):"—"})())+'</div>'+rateRow(t.q?t.c/t.q*100:0,t.r);
}
function stats(tab){
 tab=tab||"sum";
 const H=LS("hist",[]);
 let body="";
 if(tab==="best"){
  body=Object.keys(BANK).map(k=>`<div class="card"><div class="ch"><b>${BANK[k].name}</b></div>${[5,10,20].map(n=>{const v=LS(bestKey(k,n),0);return`<div class="hrow${v?"":" z"}"><span>${n} Questions</span><b>${v}<em> / ${MODES[n].max}</em></b></div>`}).join("")}</div>`).join("");
 }else{
  body=tab==="sum"?sumHTML():H.length?H.map(x=>`<div class="card hrow"><span>${BANK[x.m]?BANK[x.m].name:x.m}</span><b>${x.s}/${MODES[x.n||20].max}</b><small>${x.r}/${x.n||20} Correct · ${x.d}</small></div>`).join(""):'<div class="st-empty"><div>🕘</div><b>No rounds played yet</b><small>Finish a round and it will show up here.</small></div>';
 }
 app.innerHTML=`<div class="st"><div class="st-in"><div class="st-bar"><button class="hm-chip" id="sb">← Back</button><span class="sm-cat">📊 Stats</span></div><div class="tabs"><button class="${tab==="sum"?"on":""}" id="t3">📈 Summary</button><button class="${tab==="best"?"on":""}" id="t1">🏆 Best Score</button><button class="${tab==="hist"?"on":""}" id="t2">🕘 History (last 10)</button></div>`+body+`</div></div>`;
 $("#sb").onclick=toMenu;$("#t1").onclick=()=>stats("best");$("#t2").onclick=()=>stats("hist");$("#t3").onclick=()=>stats("sum");if(tab==="sum"){$("#sq").onchange=e=>{sumQ=e.target.value;stats("sum")};$("#sn").onchange=e=>{sumN=e.target.value;stats("sum")};$("#rtc").onclick=openRT}
}
// ---- What's New screen: reads whats-new.txt (newest version first) ----
const loadWN=()=>fetch("whats-new.txt").then(r=>{if(!r.ok)throw 0;return r.text()}).catch(()=>new Promise((ok,no)=>{const s=document.createElement("script");s.src="whats-new.txt";s.onload=()=>window.WN_TXT?ok(window.WN_TXT):no();s.onerror=no;document.head.appendChild(s)}));
function openWN(){
 const ov=document.createElement("div");ov.className="ov";
 ov.innerHTML='<div class="panel wnp"><div class="ph"><h2>🆕 What’s New</h2><button class="x">Close</button></div><div id="wl">Loading…</div></div>';
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
 await Promise.all([...new Set(["./","index.html","whats-new.txt","manifest.json","assets/icon-192.png","assets/icon-512.png",...u])].map(f=>fetch(q(f),{cache:"reload"}).then(r=>{if(r.ok)return c.put(f,r)})));
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
