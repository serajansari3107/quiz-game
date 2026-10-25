// Quiz Arena — game logic. Question banks: cricket.js, wwe.js. Release notes: whats-new.txt
let VER="",LUP="";
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
let THEME=LS("theme","dark")==="light"?"light":"dark";
const applyTheme=()=>{const l=THEME==="light",h=document.documentElement,m=document.querySelector('meta[name="theme-color"]');if(l)h.setAttribute("data-theme","light");else h.removeAttribute("data-theme");if(m)m.setAttribute("content",l?"#F5F3FF":"#0e0e11")};
const setTheme=t=>{THEME=t==="light"?"light":"dark";LW("theme",THEME);applyTheme()};
const coinFmt=n=>Number(n).toLocaleString("en-US");
const coinGet=()=>{const a=LS("auth",null),c=LS("coins",null);return a&&a.user&&c&&c.id===a.user.id&&Number.isInteger(c.b)&&c.b>=0?c.b:null};
const coinTxt=()=>coinGet()===null?"–":coinFmt(coinGet());
const coinPill=()=>LS("auth_mode","")==="account"?'<div class="hm-coin" id="cp" title="Your coins"><span class="hm-ci">🪙</span><b id="cn">'+coinTxt()+'</b></div>':"";
const coinShow=()=>{const n=$("#cn");if(n)n.textContent=coinTxt()};
const thHtml=()=>'<span class="mnu-ic">'+(THEME==="light"?"☀️":"🌙")+'</span><span class="mnu-t"><b>Switch Theme</b><small>Now: '+(THEME==="light"?"Light":"Dark")+' · Tap for '+(THEME==="light"?"Dark":"Light")+'</small></span><span class="hm-go">›</span>';
applyTheme();
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
 ov.innerHTML='<div class="panel mnu-d"><div class="ph"><h2>☰ Menu</h2><button class="x">Close</button></div><button class="mnu-i" id="m1"><span class="mnu-ic">📊</span><span class="mnu-t"><b>Stats</b><small>Summary & History</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m2"><span class="mnu-ic">⚙️</span><span class="mnu-t"><b>Settings</b><small>Sound & Vibration</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m3"><span class="mnu-ic">👤</span><span class="mnu-t"><b>My Account</b><small>Profile, Password & Logout</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m6"><span class="mnu-ic">🆕</span><span class="mnu-t"><b>What’s New</b><small>Latest updates'+(VER?' · v'+VER:'')+'</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m4"><span class="mnu-ic">ℹ️</span><span class="mnu-t"><b>About</b><small>How it works & question counts</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m5">'+thHtml()+'</button></div>';
 document.body.appendChild(ov);
 ov.querySelector(".x").onclick=()=>ov.remove();
 ov.className="ov mnu";ov.onclick=e=>{if(e.target===ov)ov.remove()};
 ov.querySelector("#m1").onclick=()=>{ov.remove();stats()};
 ov.querySelector("#m2").onclick=()=>{ov.remove();settings()};
 ov.querySelector("#m3").onclick=()=>{ov.remove();accountScr()};
 ov.querySelector("#m4").onclick=()=>{ov.remove();aboutScr()};
 ov.querySelector("#m6").onclick=()=>{ov.remove();openWN()};
 ov.querySelector("#m5").onclick=function(){setTheme(THEME==="light"?"dark":"light");this.innerHTML=thHtml()};
}
const toMenu=()=>{home();openMenu()};
function aboutScr(){
 const sec=(t,a)=>'<div class="ma-sec"><h2 class="ma-h">'+t+'</h2><ul class="ab-ul">'+a.map(x=>'<li>'+x+'</li>').join("")+'</ul></div>';
 const ks=Object.keys(BANK),tot=ks.reduce((s,k)=>s+BANK[k].q.length,0);
 const cnt='<div class="ma-sec"><h2 class="ma-h">📚 Questions Available</h2>'+ks.map(k=>'<div class="ma-row"><span>'+BANK[k].name+'</span><b>'+BANK[k].q.length+'</b></div>').join("")+'<div class="ma-row"><span>Total</span><b>'+tot+'</b></div><div class="ab-n">These numbers update automatically and grow as new questions are added.</div></div>';
 app.innerHTML='<div class="se"><div class="se-in"><div class="st-bar"><button class="hm-chip" id="sb">← Back</button><span class="sm-cat">ℹ️ About</span></div>'
 +'<div class="ab-hero"><div class="ab-logo">🎯</div><h1>Quiz Arena</h1><p>Challenge Your Mind. Prove Your Knowledge.</p>'+(VER?'<small>Version v'+VER+'</small>':'')+'<small class="ab-d">Released On : 19 Oct 2026</small>'+(LUP?'<small class="ab-d">Last Updated : '+LUP+'</small>':'')+'</div>'
 +sec("🎮 What is Quiz Arena?",["Quiz Arena is a quiz game where you test your knowledge in different categories.","Every question has 4 options and only one of them is correct.","The Grammar Quiz asks questions in Hinglish with English options, to help you learn English.","It is a PWA: you can install it on your phone like an app, and the quizzes work without internet."])
 +cnt
 +sec("▶️ How to Play",["<b>Step 1:</b> On the Home screen, choose a category.","<b>Step 2:</b> Choose a quiz size: 5, 10 or 20 questions.","<b>Step 3:</b> Tap <b>Start Quiz</b>.","<b>Step 4:</b> Read the question and tap one option before the timer ends.","<b>Step 5:</b> You instantly see if you were right, the correct answer and a short explanation.","<b>Step 6:</b> Tap <b>Next</b> to continue. At the end you see your result."])
 +sec("🏆 Quiz Sizes &amp; Marks",["<b>5 Questions:</b> 20 marks in total. Easy = 2, Medium = 4, Hard = 8 marks. Mix: 2 easy, 2 medium, 1 hard.","<b>10 Questions:</b> 50 marks in total. Easy = 2, Medium = 5, Hard = 8 marks. Mix: 3 easy, 4 medium, 3 hard.","<b>20 Questions:</b> 100 marks in total. Easy = 2, Medium = 5, Hard = 8.5 marks. Mix: 7 easy, 7 medium, 6 hard.","You get marks only for correct answers. Wrong answers do not reduce your marks."])
 +sec("⏱ Timer &amp; Lives",["You get <b>20 seconds</b> for each question. The timer turns red in the last 5 seconds.","You have <b>3 lives</b> (❤️❤️❤️) in every round.","A wrong answer or a time-up costs 1 life.","If you lose all 3 lives, the round ends with <b>Game Over</b>.","If you tap <b>Quit</b> and confirm, the round ends and its score is not saved."])
 +sec("🛟 Lifelines",["Each lifeline can be used <b>once per round</b>.","<b>🔄 Swap:</b> replaces the current question with a new one of the same difficulty.","<b>50-50:</b> removes 2 wrong options, so only 2 options remain.","<b>Skip:</b> moves to the next question. You do not earn marks, and you do not lose a life."])
 +sec("🔀 Fair Question Rotation",["Questions are shuffled in every round.","The app remembers which questions you have already seen in each category and avoids repeating them until you have seen them all."])
 +sec("📊 Stats",["Open <b>Menu → Stats</b> to see your progress. It has 3 tabs: <b>Best</b>, <b>History</b> and <b>Summary</b>.","<b>Best:</b> your highest scores.","<b>History:</b> your last 10 rounds.","<b>Summary:</b> Total Rounds Played, Questions Played, Correct Answers, Wrong Answers, Points Secured, Accuracy Rate, Perfect Rounds, Longest Perfect Streak and User Since. You can filter it by category and quiz size.","A <b>Perfect Round</b> means you answered every question of the round correctly. <b>Longest Perfect Streak</b> is the most perfect rounds in a row."])
 +sec("👤 Guest &amp; Account",["<b>Guest:</b> play without an account. Your stats are saved only on this device.","<b>Account:</b> create an account with your full name, a username and a password. Your stats are saved to your account and appear on any device where you log in.","On one device, the guest and every account keep their stats separately.","If you play without internet, your rounds are synced to your account when you are online again.","You can transfer your guest stats to your account <b>one time per device</b>. The app asks for your confirmation first.","Your old guest stats are never deleted by logging in."])
 +sec("🔐 My Account &amp; Security",["Open <b>Menu → My Account</b> after login to see your details.","<b>Change Password:</b> enter your current password and a new one. You will stay logged in on this device, and your other devices are logged out.","<b>Recovery Code:</b> a secret code that lets you reset your password if you forget it. Keep it safe.","<b>Generate New Recovery Code:</b> needs your password. The old code stops working, and the new code is shown only once, so copy it with the 📋 button.","<b>Forgot Password:</b> use your username, your recovery code and a new password.","Passwords are stored in a protected (hashed) form, never as plain text. For this reason, the app can never show your current password or your old recovery code."])
 +sec("⚙️ Settings",["Open <b>Menu → Settings</b> to turn <b>Sound</b> and <b>Vibration</b> ON or OFF."])
 +sec("🆕 Updates",["Tap <b>What’s New</b> on the Home screen to see the latest features, fixes and the app version.","After an update, a popup shows only the new changes."])
 +sec("🌐 Internet &amp; Offline",["Quizzes, stats and settings work without internet.","Internet is needed only for sign up, login, password changes and syncing your stats."])
 +sec("💡 Tips",["Save <b>Swap</b> and <b>50-50</b> for hard questions.","Read the explanation after every answer. It helps you remember, especially in the Grammar Quiz.","Watch the timer. Time-up costs a life, just like a wrong answer."])
 +'</div></div>';
 $("#sb").onclick=toMenu;
}
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
function home(){if(!BOOTED){BOOTED=1;return welcome()}stopT();
 app.innerHTML=`<div class="hm"><div class="hm-in"><div class="hm-bar"><div class="hm-brand"><span class="hm-bl">🎯</span><b>Quiz Arena</b></div><div class="hm-right">${coinPill()}<button id="mn" class="hm-chip hm-menu" aria-label="Menu">☰</button></div></div><div class="hm-hero2"><div class="hm-hl">Ready to Prove Yourself?</div><p class="hm-sub">Play smart. Build your streak. Earn your glory.</p></div><div class="hm-label">Choose a category</div><div class="hm-grid">`+
 Object.keys(BANK).map(k=>{const nm=BANK[k].name,e=nm.match(/^(\p{Extended_Pictographic}\S*)\s+(.+)$/u);return`<button class="hm-card" data-m="${k}"><span class="hm-ic">${e?e[1]:"📚"}</span><span class="hm-tx"><b>${e?e[2]:nm}</b><small>${BANK[k].q.length} questions</small></span><span class="hm-go">›</span></button>`}).join("")+`</div></div></div>`;
 app.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>selMode(b.dataset.m));
 $("#mn").onclick=openMenu;
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
 {const h=LS("hist",[]);h.unshift({m:mode,s:score,r:right,n:QN,d:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"})});LW("hist",h.slice(0,10));{const S=LS("sum",{}),sk=mode+"_"+QN,a=S[sk]||{r:0,q:0,c:0,w:0,p:0};a.r++;a.q+=right+wrong;a.c+=right;a.w+=wrong;a.p+=score;a.f=(a.f||0)+(right===QN?1:0);S[sk]=a;LW("sum",S)}upStr(mode,QN,right===QN);const bk=bestKey(mode,QN);if(score>LS(bk,0))LW(bk,score)}evAdd(mode,QN,right,wrong,score);
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
let statsTab="sum",statsWait=false;
function stats(tab){stats0(tab);statsTab=tab||"sum";statsWait=syncBusy&&LS("auth_mode","")==="account"&&!sumRounds(LS("sum",{}))&&!LS("hist",[]).length;if(statsWait){const t=$(".tabs");if(t){while(t.nextSibling)t.nextSibling.remove();const w=document.createElement("div");w.className="st-empty";w.innerHTML="<div>⏳</div><b>Syncing your account stats…</b><small>This can take up to a minute the first time.</small>";t.after(w)}}}
function stats0(tab){
 tab=tab||"sum";
 const H=LS("hist",[]);
 let body="";
 if(tab==="best"){
  body=Object.keys(BANK).map(k=>`<div class="card"><div class="ch"><b>${BANK[k].name}</b></div>${[5,10,20].map(n=>{const v=LS(bestKey(k,n),0);return`<div class="hrow${v?"":" z"}"><span>${n} Questions</span><b>${v}<em> / ${MODES[n].max}</em></b></div>`}).join("")}</div>`).join("");
 }else{
  body=tab==="sum"?sumHTML():H.length?H.map(x=>`<div class="card hrow"><span>${BANK[x.m]?BANK[x.m].name:x.m}</span><b>${x.s}/${MODES[x.n||20].max}</b><small>${x.r}/${x.n||20} Correct · ${x.d}</small></div>`).join(""):'<div class="st-empty"><div>🕘</div><b>No rounds played yet</b><small>Finish a round and it will show up here.</small></div>';
 }
 app.innerHTML=`<div class="st"><div class="st-in"><div class="st-bar"><button class="hm-chip" id="sb">← Back</button><span class="sm-cat">📊 Stats</span></div><div class="tabs"><button class="${tab==="sum"?"on":""}" id="t3">📈 Summary</button><button class="${tab==="best"?"on":""}" id="t1">🏆 Best Score</button><button class="${tab==="hist"?"on":""}" id="t2">🕘 History</button></div>`+body+`</div></div>`;
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
  const sg=x=>String(x.join("\n").split("").reduce((p,c)=>(p*31+c.charCodeAt(0))|0,0)),ak=LS("wn_ack",null);if(!ak)LW("wn_ack",sg(a));if(a.join("\n")===b.join("\n")&&(ak||sg(a))===sg(b))return;
  const va=a[0].slice(3).split("|")[0].trim(),vb=b[0].slice(3).split("|")[0].trim();
  const nw=b.filter(l=>l.startsWith("+ ")&&(va!==vb||!a.includes(l))),items=(nw.length?nw:b.filter(l=>l.startsWith("+ "))).map(l=>"<li>"+l.slice(2).replace(/</g,"&lt;")+"</li>").join("");
  const ov=document.createElement("div");ov.className="ov upd";
  ov.innerHTML='<div class="ucard"><div class="uic">🚀</div><h2>'+(va!==vb?"New version available":"New features added")+'</h2><div class="uv">'+vb+'</div><ul>'+items+'</ul><button class="btn" id="ub">Update now</button><button class="later" id="ulat">Not now</button></div>';
  document.body.appendChild(ov);
  $("#ulat").onclick=()=>ov.remove();
  $("#ub").onclick=async()=>{$("#ub").textContent="Updating…";try{await applyUpd()}catch(e){}LW("wn_ack",sg(b));location.reload()};
 }).catch(()=>{});
}
async function applyUpd(){
 if(!window.caches)return;
 const ks=await caches.keys();if(!ks.length)return;
 const c=await caches.open(ks[0]),q=f=>f+(f.includes("?")?"&":"?")+"chk="+Date.now();
 const h=await (await fetch(q("index.html"),{cache:"reload"})).text();
 const u=[...h.matchAll(/(?:src|href)="([^":#]+)"/g)].map(m=>m[1]);
 await Promise.all([...new Set(["./","index.html","whats-new.txt","manifest.json","assets/qa-icon-192.png","assets/qa-icon-512.png","assets/qa-icon-maskable-512.png","assets/qa-apple-180.png",...u])].map(f=>fetch(q(f),{cache:"reload"}).then(r=>{if(r.ok)return c.put(f,r)})));
}
// ---- Step 8 Part 6: Backend connect (signup / login / session refresh) ----
const API_URL="https://quiz-arena-api-goc7.onrender.com";
const devId=()=>{let d=LS("dev_id","");if(!d){d=(self.crypto&&crypto.randomUUID)?crypto.randomUUID():"d"+Date.now().toString(36)+Math.random().toString(36).slice(2,10);LW("dev_id",d)}return d};
async function api(path,body,tok){
 const ac=new AbortController(),t=setTimeout(()=>ac.abort(),60000);
 try{
  const r=await fetch(API_URL+path,{method:"POST",headers:tok?{"Content-Type":"application/json",Authorization:"Bearer "+tok}:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:ac.signal});
  let j={};try{j=await r.json()}catch(e){}
  return{ok:r.ok,status:r.status,data:j};
 }catch(e){return{ok:false,status:0,data:{}}}
 finally{clearTimeout(t)}
}
const authSave=d=>{LW("auth",{user:d.user,access:d.accessToken,refresh:d.refreshToken,exp:Date.now()+d.expiresIn*1000});LW("auth_mode","account");nsSwitch("u:"+d.user.id)};
const authMsg=r=>r.status===0?"Can't reach server. Check your connection and try again.":(r.data&&r.data.error)||"Something went wrong. Try again.";
let rfP=null;
const sessionRefresh=()=>rfP||(rfP=sessionRefresh0().finally(()=>{rfP=null}));
async function sessionRefresh0(){
 const a=LS("auth",null);if(!a||!a.refresh)return;
 const r=await api("/auth/refresh",{refreshToken:a.refresh});
 if(r.ok){authSave(r.data);return true}
 if(r.status===401){LW("auth","");LW("auth_mode","");nsSwitch("guest")}
 return false
}
function recoveryScr(d){
 app.innerHTML='<div class="wl"><div class="wl-in wl-form"><div class="wl-logo">🛡️</div><h1>Save Your Recovery Code</h1><p>This code is the only way to reset your password if you forget it. It is shown only once, so write it down or save it somewhere safe.</p><div class="wl-code" id="rcd"></div><button class="wl-b2" id="rcp" style="margin:0 0 16px">Copy Code</button><label class="wl-chk"><input type="checkbox" id="rck"><span>I have saved my recovery code</span></label><button class="wl-b1" id="rgo" disabled>Continue</button></div></div>';
 $("#rcd").textContent=d.recoveryCode;
 $("#rcp").onclick=()=>{try{navigator.clipboard.writeText(d.recoveryCode).then(()=>{$("#rcp").textContent="Copied ✓"},()=>{$("#rcp").textContent="Copy failed, select the code manually"})}catch(e){$("#rcp").textContent="Copy failed, select the code manually"}};
 $("#rck").onchange=e=>{$("#rgo").disabled=!e.target.checked};
 $("#rgo").onclick=()=>{authSave(d);afterAuth()};
}
// ---- Step 8 Part 7: Account stats sync, stats namespaces, profile ----
const uuid=()=>(self.crypto&&crypto.randomUUID)?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:(r&3|8)).toString(16)});
// Guest aur har account ki stats alag "namespace" mein; active wali hamesha same keys (hist/sum/pstr/best_*) par rehti hai.
function nsSwitch(to){
 const from=LS("stats_ns","guest");if(from===to)return;
 try{
  const ks=["hist","sum","pstr","outbox"];
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf("best_")===0)ks.push(k)}
  ks.forEach(k=>{const v=localStorage.getItem(k);if(v!==null)localStorage.setItem("ns:"+from+":"+k,v);localStorage.removeItem(k)});
  const pre="ns:"+to+":",mv=[];
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf(pre)===0)mv.push(k)}
  mv.forEach(k=>{localStorage.setItem(k.slice(pre.length),localStorage.getItem(k));localStorage.removeItem(k)});
 }catch(e){}
 LW("stats_ns",to);
}
let syncT=null,syncBusy=false;
function syncSoon(){if(LS("auth_mode","")!=="account")return;clearTimeout(syncT);syncT=setTimeout(syncNow,1500)}
addEventListener("online",syncSoon);
// end() se call hota hai; koi bhi error quiz ko nahi todta
const evAdd=(m,n,r,w,s)=>{try{if(LS("auth_mode","")!=="account")return;const o=LS("outbox",[]);o.push({id:uuid(),m,n,r,w,s,t:Date.now()});LW("outbox",o);syncSoon()}catch(e){}};
async function authedApi(path,body){
 let a=LS("auth",null);if(!a)return{ok:false,status:0,data:{}};
 if(a.exp-Date.now()<60000){if(!(await sessionRefresh()))return{ok:false,status:0,data:{}};a=LS("auth",null);if(!a)return{ok:false,status:0,data:{}}}
 let r=await api(path,body,a.access);
 if(r.status===401&&await sessionRefresh()){a=LS("auth",null);if(a)r=await api(path,body,a.access)}
 return r;
}
// Guest ki stats (stash mein) ka ek-baar transfer; device par ek hi baar (bl_done)
function guestBaseline(){
 if(LS("bl_done",0)||LS("bl_go","")!==LS("stats_ns","guest"))return null;
 const g=k=>{try{return JSON.parse(localStorage.getItem("ns:guest:"+k))}catch(e){return null}};
 const S=g("sum")||{},sum={},best={};
 Object.keys(S).forEach(k=>{if(/^[a-z0-9_]+_(5|10|20)$/.test(k)){const a=S[k]||{};sum[k]={r:a.r|0,q:a.q|0,c:a.c|0,w:a.w|0,p:+a.p||0,f:a.f|0}}});
 Object.keys(BANK).forEach(m=>[5,10,20].forEach(n=>{const v=+g(bestKey(m,n));if(v>0)best[m+"_"+n]=v}));
 const hist=(g("hist")||[]).slice(0,10).map(x=>({m:String(x.m),s:+x.s||0,r:x.r|0,n:x.n||20,d:String(x.d||"")}));
 const ps0=g("pstr")||{},pstr={};
 Object.keys(ps0).forEach(k=>{const b=ps0[k]&&ps0[k].b|0;if(b>0&&/^[a-z0-9][a-z0-9_]{0,39}$/.test(k))pstr[k]=b});
 return(Object.keys(sum).length||Object.keys(best).length||hist.length)?{sum,best,hist,pstr}:null;
}
function applySnap(d){
 try{
  const sum={},fmt=t=>new Date(t).toLocaleDateString("en-GB",{day:"2-digit",month:"short"});
  Object.keys(BANK).forEach(m=>[5,10,20].forEach(n=>{
   const x=(d.stats||{})[m+"_"+n];
   if(x){sum[m+"_"+n]={r:x.r,q:x.q,c:x.c,w:x.w,p:x.p,f:x.f};if(x.b>0)LW(bestKey(m,n),x.b);else localStorage.removeItem(bestKey(m,n))}
   else localStorage.removeItem(bestKey(m,n));
  }));
  LW("sum",sum);
  LW("hist",(d.hist||[]).slice(0,10).map(x=>({m:x.m,s:x.s,r:x.r,n:x.n,d:x.d||fmt(x.t)})));
  if(!LS("pstr",null))LW("pstr",bfStr());
  if(Number.isFinite(d.since)&&d.since>0&&d.since<=Date.now()){const o=LS("since",0);if(!o||d.since<o)LW("since",d.since)}
   if(d.coins&&Number.isInteger(d.coins.balance)&&d.coins.balance>=0){const a=LS("auth",null);if(a&&a.user){LW("coins",{id:a.user.id,b:d.coins.balance});coinShow()}}
  if(d.streak&&typeof d.streak==="object"){const P=LS("pstr",{}),idle=!LS("outbox",[]).length;Object.keys(d.streak).forEach(k=>{const s=d.streak[k];if(!/^[a-z0-9_]{1,40}$/.test(k)||!s||!Number.isInteger(s.b)||!Number.isInteger(s.c)||s.b<0||s.c<0)return;const o=P[k]||{c:0,b:0};o.c=idle?s.c:o.c;o.b=Math.max(o.b,s.b,o.c);P[k]=o});LW("pstr",P)}
 }catch(e){}
}
async function syncNow(){
 if(syncBusy||LS("auth_mode","")!=="account"||!navigator.onLine)return;
 syncBusy=true;const ns=LS("stats_ns","guest");
 try{
  for(let i=0;i<10;i++){
   const sent=LS("outbox",[]).slice(0,20),bl=guestBaseline();
   const r=await authedApi("/sync",{deviceId:devId(),events:sent,baseline:bl||undefined});
   if(!r.ok||LS("stats_ns","guest")!==ns)break;
   const ids=new Set(sent.map(e=>e.id)),rest=LS("outbox",[]).filter(e=>!ids.has(e.id));
   LW("outbox",rest);
   if(bl&&typeof r.data.baselineApplied==="boolean"){LW("bl_done",1);LW("bl_go","");if(!r.data.baselineApplied)alert("These guest stats could not be transferred (already transferred from this device).")}
   if(!rest.length){applySnap(r.data);break}
  }
 }catch(e){}finally{syncBusy=false;if(statsWait&&$(".st"))stats(statsTab)}
}
const sumRounds=S=>Object.keys(S||{}).reduce((t,k)=>t+((S[k]&&S[k].r)|0),0);
// Login/signup ke baad: agar user "Transfer guest stats" se aaya tha to confirm popup
function afterAuth(){home();syncNow();const t=LS("bl_intent",0);LW("bl_intent",0);if(t&&Date.now()-t<600000)xferAsk()}
function xferStart(){
 const m=$("#wnt");
 if(LS("bl_done",0))return m.textContent="This device's guest stats were already transferred once.";
 if(!sumRounds(LS("sum",{})))return m.textContent="No guest stats to transfer.";
 LW("bl_intent",Date.now());authChoice();
}
function xferAsk(){
 const a=LS("auth",null);let S={};try{S=JSON.parse(localStorage.getItem("ns:guest:sum"))||{}}catch(e){}
 const n=sumRounds(S);if(!a||!a.user||LS("bl_done",0)||!n)return;
 const pp=document.createElement("div");pp.className="wl-pop";
 pp.innerHTML='<div class="wl-card"><div class="wl-ic">📤</div><h2>Transfer Guest Stats?</h2><p id="xfp"></p><button class="wl-b1" id="xfy">Transfer</button><button class="wl-b2" id="xfn">Cancel</button></div>';
 document.body.appendChild(pp);
 $("#xfp").textContent="Transfer your guest stats ("+n+" rounds) to @"+a.user.username+"? This can be done only once from this device. Your guest stats on this device will not be deleted.";
 pp.onclick=e=>{if(e.target===pp)pp.remove()};
 $("#xfn").onclick=()=>pp.remove();
 $("#xfy").onclick=()=>{pp.remove();LW("bl_go","u:"+a.user.id);const go=()=>{if(syncBusy)setTimeout(go,800);else syncNow()};go()};
}
function accountScr(){
 const a=LS("auth",null),acc=LS("auth_mode","")==="account"&&a&&a.user;if(acc)return myAccScr(a);
 app.innerHTML='<div class="wl"><div class="wl-in wl-form"><button class="hm-chip wl-back" id="ab">← Back</button><div class="wl-logo">👤</div><h1 id="an"></h1><p id="au"></p>'+(acc?'<button class="wl-b1" id="alo">Logout</button>':'<button class="wl-b1" id="ali">Login</button><button class="wl-b2" id="acr">Create Account</button><button class="wl-b2" id="axf">Transfer guest stats to an account</button>')+'<div class="wl-note" id="wnt"></div></div></div>';
 $("#an").textContent=acc?a.user.fullName:"Guest";
 $("#au").textContent=acc?"@"+a.user.username+" · your stats sync to this account":"Your stats are saved only on this device.";
 $("#ab").onclick=home;
 if(acc)$("#alo").onclick=doLogout;else{$("#ali").onclick=loginScr;$("#acr").onclick=signupScr;$("#axf").onclick=xferStart}
}
// ---- My Account screen (logged-in user): details, change password, recovery code, logout ----
function myAccScr(a){
 const pf=(id,l,ph)=>'<div class="wl-fld"><label for="'+id+'">'+l+'</label><div class="wl-pw"><input id="'+id+'" type="password" placeholder="'+ph+'" autocomplete="off"><button type="button" class="wl-eye" data-for="'+id+'" aria-label="Show password">Show</button></div></div>';
 const eyes=root=>root.querySelectorAll(".wl-eye").forEach(b=>b.onclick=()=>{const f=$("#"+b.dataset.for),s=f.type==="password";f.type=s?"text":"password";b.textContent=s?"Hide":"Show";b.setAttribute("aria-label",s?"Hide password":"Show password")});
 app.innerHTML='<div class="wl"><div class="wl-in wl-form"><button class="hm-chip wl-back" id="ab">← Back</button><div class="wl-logo">👤</div><h1>My Account</h1><p>Manage your profile and security</p>'
 +'<div class="ma-sec"><h2 class="ma-h">Personal Details</h2><div class="ma-row"><span>Full name</span><b id="mfn"></b></div><div class="ma-row"><span>User ID</span><b id="mun"></b></div></div>'
 +'<div class="ma-sec"><h2 class="ma-h">Privacy &amp; Security</h2><div class="ma-sub">Change Password</div>'+pf("mcp","Current Password","Enter current password")+pf("mnp","New Password","Enter new password")+pf("mrp","Re-enter New Password","Re-enter new password")+'<div class="wl-hint">Password must have at least 8 characters, 1 uppercase letter and 1 special character. You will be logged out on your other devices.</div><button class="wl-b1" id="mpb">Change Password</button><div class="wl-note" id="mpm"></div></div>'
 +'<div class="ma-sec"><h2 class="ma-h">Recover Your Account</h2><p class="ma-p">Your recovery code is the only way to reset a forgotten password. For safety it cannot be shown again, but you can create a new one any time. The old code then stops working.</p><div id="mrbox"></div><div class="wl-note" id="mrm"></div></div>'
 +'<button class="wl-b1" id="alo" style="margin-top:22px">Logout</button><div class="wl-note" id="wnt"></div></div></div>';
 $("#mfn").textContent=a.user.fullName;$("#mun").textContent="@"+a.user.username;
 eyes(app);
 $("#ab").onclick=home;
 $("#alo").onclick=doLogout;
 $("#mpb").onclick=async()=>{
  const c=$("#mcp").value,n=$("#mnp").value,r2=$("#mrp").value,m=$("#mpm"),b=$("#mpb");
  if(!c){m.textContent="Enter your current password";return}
  if(n.length<8||!/[A-Z]/.test(n)||!/[^A-Za-z0-9]/.test(n)){m.textContent="New password must have at least 8 characters, 1 uppercase letter and 1 special character.";return}
  if(n!==r2){m.textContent="New passwords do not match";return}
  if(n===c){m.textContent="New password must be different from the current password";return}
  b.disabled=true;m.textContent="Changing password… (can take up to a minute if the server is waking up)";
  const r=await authedApi("/auth/change-password",{currentPassword:c,newPassword:n,deviceId:devId()});
  const ok=r.ok&&r.data.accessToken;if(ok)authSave(r.data);
  const m2=$("#mpm");if(!m2)return;
  $("#mpb").disabled=false;
  if(ok){["mcp","mnp","mrp"].forEach(i=>{$("#"+i).value=""});m2.textContent="Password changed ✓ Other devices have been logged out."}else m2.textContent=authMsg(r)
 };
 const gen=()=>{$("#mrbox").innerHTML='<button class="wl-b2" id="mrg">Generate New Recovery Code</button>';$("#mrg").onclick=ask};
 const ask=()=>{
  $("#mrbox").innerHTML=pf("mrw","Enter your password to confirm","Your password")+'<button class="wl-b1" id="mrc">Create New Code</button><button class="wl-b2" id="mrx">Cancel</button>';
  eyes($("#mrbox"));
  $("#mrx").onclick=()=>{gen();$("#mrm").textContent=""};
  $("#mrc").onclick=async()=>{
   const p=$("#mrw").value,m=$("#mrm"),b=$("#mrc");
   if(!p){m.textContent="Enter your password";return}
   b.disabled=true;m.textContent="Creating new code… (can take up to a minute if the server is waking up)";
   const r=await authedApi("/auth/recovery/regenerate",{password:p});
   const box=$("#mrbox");if(!box)return;
   if(!(r.ok&&r.data.recoveryCode)){b.disabled=false;$("#mrm").textContent=authMsg(r);return}
   box.innerHTML='<div class="ma-code"><span id="mrv"></span><button type="button" class="ma-cp" id="mrcp" aria-label="Copy recovery code">📋</button></div><div class="wl-hint">Save this code now. It will not be shown again, and your old recovery code no longer works.</div>';
   $("#mrv").textContent=r.data.recoveryCode;$("#mrm").textContent="";
   $("#mrcp").onclick=()=>{const t=$("#mrv").textContent,f=()=>{$("#mrm").textContent="Copy failed, select the code manually"};try{navigator.clipboard.writeText(t).then(()=>{$("#mrcp").textContent="✓";$("#mrm").textContent="Copied";setTimeout(()=>{const x=$("#mrcp");if(x)x.textContent="📋"},2000)},f)}catch(e){f()}}
  }
 }
 gen()
}
async function doLogout(){
 const b=$("#alo"),m=$("#wnt");b.disabled=true;m.textContent="Syncing and logging out…";
 await syncNow();
 const a=LS("auth",null);if(a&&a.refresh)await api("/auth/logout",{refreshToken:a.refresh});
 LW("auth","");LW("auth_mode","");nsSwitch("guest");authChoice();
}
// ---- Step 8 Part 1: Welcome screen (splash -> Guest / Login / Create Account) ----
let BOOTED=0;
function welcome(){
 app.innerHTML='<div class="wl"><div class="wl-in"><div class="wl-logo">🎯</div><h1>Quiz Arena</h1><p>Cricket · WWE</p></div></div>';
 setTimeout(()=>{if(LS("auth_mode","")){home();if(LS("auth_mode","")==="account"&&navigator.onLine)sessionRefresh().then(ok=>{if(ok)syncNow()})}else authChoice()},1600);
}
function authChoice(){
 app.innerHTML='<div class="wl"><div class="wl-in"><div class="wl-logo">🎯</div><h1>Quiz Arena</h1><p>Choose how you want to continue</p><div class="wl-btns"><button class="wl-b1" id="wg">Play as Guest</button><button class="wl-b2" id="wlg">Already have an account? Login</button><button class="wl-b2" id="wca">Create Account</button></div><div class="wl-note" id="wnt"></div></div></div>';
 const goG=()=>{LW("auth_mode","guest");home()};
 $("#wg").onclick=()=>{
  if(LS("guest_warn",0))return goG();
  const pp=document.createElement("div");pp.className="wl-pop";
  pp.innerHTML='<div class="wl-card"><div class="wl-ic">⚠️</div><h2>Guest Mode</h2><p>Guest stats will be saved only on this device. Creating an account will let you sync your stats across multiple devices in the future.</p><button class="wl-b1" id="wgo">Continue as Guest</button><button class="wl-b2" id="wcn">Cancel</button></div>';
  document.body.appendChild(pp);
  pp.onclick=e=>{if(e.target===pp)pp.remove()};
  $("#wcn").onclick=()=>pp.remove();
  $("#wgo").onclick=()=>{LW("guest_warn",1);pp.remove();goG()};
 };
 const soon=()=>{$("#wnt").textContent="Coming soon"};
 $("#wlg").onclick=loginScr;$("#wca").onclick=signupScr;
}
// ---- Step 8 Part 3: Login screen (UI only, no real authentication yet) ----
function loginScr(){
 app.innerHTML='<div class="wl"><div class="wl-in wl-form"><button class="hm-chip wl-back" id="lb">← Back</button><div class="wl-logo">🔐</div><h1>Login</h1><p>Welcome back to Quiz Arena</p><div class="wl-fld"><label for="lu">Username</label><input id="lu" type="text" placeholder="Enter username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></div><div class="wl-fld"><label for="lp">Password</label><div class="wl-pw"><input id="lp" type="password" placeholder="Enter password" autocomplete="current-password"><button type="button" class="wl-eye" id="le" aria-label="Show password">Show</button></div></div><button class="wl-link" id="lf">Forgot Password?</button><button class="wl-b1" id="lg">Login</button><div class="wl-note" id="wnt"></div></div></div>';
 const soon=()=>{$("#wnt").textContent="Coming soon"};
 $("#lb").onclick=authChoice;
 $("#le").onclick=()=>{const f=$("#lp"),s=f.type==="password";f.type=s?"text":"password";$("#le").textContent=s?"Hide":"Show";$("#le").setAttribute("aria-label",s?"Hide password":"Show password")};
 const doLogin=async()=>{
  const u=$("#lu").value.trim(),p=$("#lp").value,m=$("#wnt"),b=$("#lg");
  if(b.disabled)return;
  if(!u||!p)return m.textContent="Enter username and password";
  b.disabled=true;m.textContent="Please wait… (first request can take up to a minute)";
  const r=await api("/auth/login",{username:u,password:p,deviceId:devId()});
  if(r.ok&&r.data.accessToken){authSave(r.data);return afterAuth()}
  b.disabled=false;m.textContent=authMsg(r);
 };
 $("#lg").onclick=doLogin;$("#lf").onclick=forgotScr;
 setTimeout(()=>app.querySelectorAll("input").forEach(x=>x.onkeydown=e=>{if(e.key==="Enter")doLogin()}),0); // purani keydown line ke baad override
 app.querySelectorAll("input").forEach(x=>x.onkeydown=e=>{if(e.key==="Enter")soon()});
}
// ---- Step 8 Part 4: Create Account screen (UI only, nothing is created or saved yet) ----
function signupScr(){
 const pw=(id,l,ph)=>'<div class="wl-fld"><label for="'+id+'">'+l+'</label><div class="wl-pw"><input id="'+id+'" type="password" placeholder="'+ph+'" autocomplete="new-password"><button type="button" class="wl-eye" data-for="'+id+'" aria-label="Show password">Show</button></div></div>';
 app.innerHTML='<div class="wl"><div class="wl-in wl-form"><button class="hm-chip wl-back" id="cb">← Back</button><div class="wl-logo">✨</div><h1>Create Account</h1><p>Join Quiz Arena</p><div class="wl-fld"><label for="cn">Full Name</label><input id="cn" type="text" placeholder="Enter full name" autocomplete="name"></div><div class="wl-fld"><label for="cu">Username</label><input id="cu" type="text" placeholder="Choose a username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></div>'+pw("cp","Password","Create password")+pw("cc","Confirm Password","Re-enter password")+'<div class="wl-hint">Password must have at least 8 characters, 1 uppercase letter and 1 special character.</div><button class="wl-b1" id="cg">Create Account</button><div class="wl-note" id="wnt"></div></div></div>';
 const soon=()=>{$("#wnt").textContent="Coming soon"};
 $("#cb").onclick=authChoice;
 app.querySelectorAll(".wl-eye").forEach(b=>b.onclick=()=>{const f=$("#"+b.dataset.for),s=f.type==="password";f.type=s?"text":"password";b.textContent=s?"Hide":"Show";b.setAttribute("aria-label",s?"Hide password":"Show password")});
 const doSignup=async()=>{
  const n=$("#cn").value.trim(),u=$("#cu").value.trim(),p=$("#cp").value,c=$("#cc").value,m=$("#wnt"),b=$("#cg");
  if(b.disabled)return;
  if(!n||!u||!p||!c)return m.textContent="Please fill in all fields";
  if(!/^[A-Za-z0-9_]{3,30}$/.test(u))return m.textContent="Username: 3-30 letters, numbers or underscore";
  if(p.length<8||!/[A-Z]/.test(p)||!/[^A-Za-z0-9]/.test(p))return m.textContent="Password must have at least 8 characters, 1 uppercase letter and 1 special character";
  if(p!==c)return m.textContent="Passwords do not match";
  b.disabled=true;m.textContent="Please wait… (first request can take up to a minute)";
  const r=await api("/auth/signup",{fullName:n,username:u,password:p,deviceId:devId()});
  if(r.ok&&r.data.recoveryCode)return recoveryScr(r.data);
  b.disabled=false;m.textContent=authMsg(r);
 };
 $("#cg").onclick=doSignup;
 setTimeout(()=>app.querySelectorAll("input").forEach(x=>x.onkeydown=e=>{if(e.key==="Enter")doSignup()}),0); // purani keydown line ke baad override
 app.querySelectorAll("input").forEach(x=>x.onkeydown=e=>{if(e.key==="Enter")soon()});
}
// ---- Step 8 Part 5: Forgot Password screen (UI only, no recovery yet) ----
function forgotScr(){
 app.innerHTML='<div class="wl"><div class="wl-in wl-form"><button class="hm-chip wl-back" id="fb">← Back</button><div class="wl-logo">🔑</div><h1>Forgot Password</h1><p>Enter your username, recovery code and a new password</p><div class="wl-fld"><label for="fu">Username</label><input id="fu" type="text" placeholder="Enter username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></div><div class="wl-fld"><label for="frc">Recovery Code</label><input id="frc" type="text" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false"></div><div class="wl-fld"><label for="fnp">New Password</label><div class="wl-pw"><input id="fnp" type="password" placeholder="New password" autocomplete="new-password"><button type="button" class="wl-eye" data-for="fnp" aria-label="Show password">Show</button></div></div><div class="wl-fld"><label for="fnc">Confirm New Password</label><div class="wl-pw"><input id="fnc" type="password" placeholder="Re-enter new password" autocomplete="new-password"><button type="button" class="wl-eye" data-for="fnc" aria-label="Show password">Show</button></div></div><div class="wl-hint">Password must have at least 8 characters, 1 uppercase letter and 1 special character.</div><button class="wl-b1" id="fc">Reset Password</button><div class="wl-note" id="wnt"></div></div></div>';
 const soon=()=>{$("#wnt").textContent="Coming soon"};
 $("#fb").onclick=loginScr;
 const doForgot=async()=>{
  const u=$("#fu").value.trim(),c=$("#frc").value.trim(),p=$("#fnp").value,q=$("#fnc").value,m=$("#wnt"),b=$("#fc");
  if(b.disabled)return;
  if(!u||!c||!p||!q)return m.textContent="Please fill in all fields";
  if(p.length<8||!/[A-Z]/.test(p)||!/[^A-Za-z0-9]/.test(p))return m.textContent="Password must have at least 8 characters, 1 uppercase letter and 1 special character";
  if(p!==q)return m.textContent="Passwords do not match";
  b.disabled=true;m.textContent="Please wait… (first request can take up to a minute)";
  const r=await api("/auth/recover",{username:u,recoveryCode:c,newPassword:p,deviceId:devId()});
  if(r.ok&&r.data.recoveryCode)return recoveryScr(r.data);
  b.disabled=false;m.textContent=authMsg(r);
 };
 app.querySelectorAll(".wl-eye").forEach(b=>b.onclick=()=>{const f=$("#"+b.dataset.for),s=f.type==="password";f.type=s?"text":"password";b.textContent=s?"Hide":"Show";b.setAttribute("aria-label",s?"Hide password":"Show password")});
 $("#fc").onclick=doForgot;
 app.querySelectorAll("input").forEach(x=>x.onkeydown=e=>{if(e.key==="Enter")doForgot()});
}
// ---- PWA: install button + offline + update banner ----
let ip=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();ip=e;
 const b=document.createElement("button");b.className="inst";b.textContent="📲";b.title="Install App";b.setAttribute("aria-label","Install App");
 b.onclick=async()=>{b.remove();ip.prompt();await ip.userChoice;ip=null};document.body.appendChild(b)});
window.addEventListener("appinstalled",()=>{const b=document.querySelector(".inst");if(b)b.remove()});
if("serviceWorker"in navigator){
 navigator.serviceWorker.register("sw.js").then(r=>{
  r.addEventListener("updatefound",()=>{const w=r.installing;
   w.addEventListener("statechange",()=>{if(false){
    const b=document.createElement("button");b.className="inst";b.textContent="🔄 New update available — tap to update";
    b.onclick=()=>location.reload();document.body.appendChild(b)}})})}).catch(()=>{});
}
loadWN().then(t=>{const m=t.match(/^## v([\d.]+)/m);if(m){VER=m[1];const d=(t.match(/^## v.*$/m)||[""])[0].match(/\|\s*(.+?)\s*$/);if(d)LUP=d[1];checkUp2(t);const b=$("#wn");if(b)b.textContent="🆕 What’s New · v"+VER;const v=document.querySelector(".ver");if(v)v.textContent="Version "+VER}}).catch(()=>{});
home();
