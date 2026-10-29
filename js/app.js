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
const TIME=20;let MAXW=3;
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
const coinTxt=()=>coinTot()===null?"–":coinFmt(coinTot());
const coinPill=()=>LS("auth_mode","")==="account"?'<div class="hm-coin'+(coinPendSum()>0?' pend':'')+'" id="cp" title="Your coins"><span class="hm-ci">🪙</span><b id="cn">'+coinTxt()+'</b></div>':"";
const coinShow=()=>{if(coinFlying)return;const n=$("#cn");if(n)n.textContent=coinTxt();const p=$("#cp");if(p)p.classList.toggle("pend",coinPendSum()>0)};
let coinWait=null,coinRes=null,coinFlying=0;
const coinEst=(n,r)=>r+(r===n?({5:5,10:10,20:20}[n]||0):0);
const coinPendGet=()=>{const a=LS("auth",null),p=LS("cpend",null);return a&&a.user&&p&&p.id===a.user.id&&p.m&&typeof p.m==="object"?p.m:{}};
const coinPendSum=()=>{const m=coinPendGet();return LS("outbox",[]).reduce((s,e)=>s+(Number.isInteger(m[e.id])&&m[e.id]>0?m[e.id]:0),0)};
const coinPendAdd=(id,n)=>{const a=LS("auth",null);if(!a||!a.user||!id||!(n>0))return;const o=new Set(LS("outbox",[]).map(e=>e.id)),m=coinPendGet(),k={};for(const x in m)if(o.has(x))k[x]=m[x];k[id]=n;LW("cpend",{id:a.user.id,m:k})};
const coinTot=()=>{const b=coinGet();return b===null?null:b+coinPendSum()};
const coinReduced=()=>window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const coinNote=t=>{const e=$("#rce");if(e&&coinWait)e.textContent=t};
const coinCard=(id,est)=>{coinRes=null;coinWait=null;if(LS("auth_mode","")!=="account")return'<div class="rs-coin rs-coin-g"><span class="rc-i">🪙</span><span>Login to earn coins</span></div>';if(!id)return"";const card=(t,n,cl)=>'<div class="rs-coin'+cl+'" id="rc"><span class="rc-i">🪙</span><div class="rc-t"><small>Coins earned</small><b id="rcn">'+t+'</b><em id="rce">'+n+'</em></div></div>';if(!(est>0)){coinRes={n:0};return card("No coins","No correct answers this round","")}coinRes={n:est};coinWait={id,est};setTimeout(()=>{if(coinWait&&coinWait.id===id)coinNote("Still syncing…")},10000);setTimeout(()=>{const e=$("#rcn");if(e&&coinWait&&coinWait.id===id)coinCount(e,est)},0);return card("+0",navigator.onLine?"Syncing…":"Will sync when online"," sync")};
const coinCount=(el,n)=>{delete el.dataset.fin;if(coinReduced()){el.textContent="+"+n;return}const t0=performance.now(),d=Math.min(900,300+n*25),f=t=>{if(el.dataset.fin)return;const k=Math.min(1,(t-t0)/d);el.textContent="+"+Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f);else el.textContent="+"+n};requestAnimationFrame(f)};
const coinConfirm=(v,c,rej)=>{if(!coinWait)return;const est=coinWait.est;coinWait=null;const e=$("#rcn"),b=$("#rc"),m=$("#rce");if(!e||!b||!m)return;b.classList.remove("sync");e.dataset.fin=1;coinRes={n:v};e.textContent=v>0?"+"+v:"No coins";const lim=c.today>=c.cap,L="("+c.cap+" coins)";m.textContent=rej?"Round not counted for coins":v===est?(lim?"Daily limit reached "+L:""):(v===0&&lim?"Daily limit reached "+L:lim?"Adjusted to your daily limit "+L:"Adjusted by server")};
const coinCredits=d=>{try{if(!d||!d.coins)return;const c=d.coins,a=LS("auth",null);if(Number.isInteger(c.balance)&&c.balance>=0&&a&&a.user)LW("coins",{id:a.user.id,b:c.balance});if(coinWait&&c.credits){const v=c.credits[coinWait.id];if(Number.isInteger(v)&&v>=0)coinConfirm(v,c);else if(!LS("outbox",[]).some(e=>e.id===coinWait.id))coinConfirm(0,c,1)}coinShow()}catch(e){}};
const coinFlyStart=()=>{try{if(!coinRes||!coinRes.n||coinReduced())return null;const i=$("#rc .rc-i");if(!i)return null;const r=i.getBoundingClientRect();return{n:coinRes.n,x:r.left+r.width/2,y:r.top+r.height/2}}catch(e){return null}};
const coinFlyRun=f=>{try{if(!f)return;const bal=coinTot(),cn=$("#cn"),cp=$("#cp"),ci=$("#cp .hm-ci");if(bal===null||!cn||!cp||!ci)return;cp.style.animation="none";coinFlying=1;let cur=Math.max(0,bal-f.n);cn.textContent=coinFmt(cur);const t=ci.getBoundingClientRect(),tx=t.left+t.width/2,ty=t.top+t.height/2,K=Math.min(f.n,12),base=Math.floor(f.n/K),extra=f.n%K;let done=0;
 for(let j=0;j<K;j++){const el=document.createElement("span");el.className="coin-fly";el.textContent="🪙";el.style.opacity=0;document.body.appendChild(el);const sx=f.x-11+(Math.random()-.5)*24,sy=f.y-11+(Math.random()-.5)*10,mx=(sx+tx-11)/2+(Math.random()-.5)*70,my=Math.min(sy,ty)-40-Math.random()*40;
  const a=el.animate([{transform:`translate(${sx}px,${sy}px) scale(1)`,opacity:1},{transform:`translate(${mx}px,${my}px) scale(1.2)`,opacity:1,offset:.5},{transform:`translate(${tx-11}px,${ty-11}px) scale(.55)`,opacity:.95}],{duration:820,delay:j*90,easing:"cubic-bezier(.45,.05,.35,1)",fill:"forwards"});
  a.onfinish=()=>{el.remove();cur+=base+(j<extra?1:0);const n=$("#cn");if(n)n.textContent=coinFmt(cur);const p=$("#cp");if(p){p.classList.remove("pop");void p.offsetWidth;p.classList.add("pop")}if(++done===K)setTimeout(()=>{coinFlying=0;coinShow();const p2=$("#cp");if(p2)p2.classList.remove("pop")},380)};
  a.oncancel=()=>el.remove()}}catch(e){coinFlying=0;coinShow()}};
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
 ov.innerHTML='<div class="panel mnu-d"><div class="ph"><h2>☰ Menu</h2><button class="x">Close</button></div><button class="mnu-i" id="m1"><span class="mnu-ic">📊</span><span class="mnu-t"><b>Stats</b><small>Summary & History</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m2"><span class="mnu-ic">⚙️</span><span class="mnu-t"><b>Settings</b><small>Sound & Vibration</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m3"><span class="mnu-ic">👤</span><span class="mnu-t"><b>My Account</b><small>Profile, Password & Logout</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m7"><span class="mnu-ic">🏆</span><span class="mnu-t"><b>Achievements</b><small>Trophies & Milestones</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m6"><span class="mnu-ic">🆕</span><span class="mnu-t"><b>What’s New</b><small>Latest updates'+(VER?' · v'+VER:'')+'</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m4"><span class="mnu-ic">ℹ️</span><span class="mnu-t"><b>About</b><small>How it works & question counts</small></span><span class="hm-go">›</span></button><button class="mnu-i" id="m5">'+thHtml()+'</button></div>';
 document.body.appendChild(ov);
 ov.querySelector(".x").onclick=()=>ov.remove();
 ov.className="ov mnu";ov.onclick=e=>{if(e.target===ov)ov.remove()};
 ov.querySelector("#m1").onclick=()=>{ov.remove();stats()};
 ov.querySelector("#m2").onclick=()=>{ov.remove();settings()};
 ov.querySelector("#m3").onclick=()=>{ov.remove();accountScr()};
 ov.querySelector("#m4").onclick=()=>{ov.remove();aboutScr()};
 ov.querySelector("#m6").onclick=()=>{ov.remove();openWN()};
 ov.querySelector("#m7").onclick=()=>{ov.remove();achScr()};
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
 +sec("🪙 Coins",["Coins are a reward you earn by playing. Only <b>logged-in accounts</b> earn coins. Guests do not.","Every correct answer gives <b>1 coin</b>.","A <b>perfect round</b> (every question correct) gives a bonus: <b>5</b> coins in a 5-question quiz, <b>10</b> in a 10-question quiz and <b>20</b> in a 20-question quiz.","You can earn up to <b>500 coins per day</b>. The limit resets at <b>12:00 AM India time (IST)</b>. If a round would cross the limit, you get only the coins that are left for the day.","Your balance (🪙) is shown on the Home screen next to the Menu button. It is saved safely on the server, so it is the same on every device where you log in.","On the result screen you see the coins you earned. Tap <b>Home</b> and the coins fly to your balance.","Offline? You still see your coins right away and your balance shows a small dot. The coins are confirmed automatically when you are back online. In rare cases, for example when the daily limit is reached, the final number can be a little different and the app tells you.","The real balance lives on the server, so it cannot be changed from your phone."])
 +sec("🔄 Auto Sync",[
"If you are logged in, your rounds, points, coins, history and a saved Daily Challenge reward are synced to the server automatically, as soon as the internet is available. You do not need to do anything.",
"Sync also runs when you reopen the app, and if it fails it retries by itself with growing gaps (5 seconds up to 5 minutes).",
"The green <b>Sync</b> icon on the Home screen shows the status: <b>Synced</b> (the server confirmed everything), <b>Syncing</b>, <b>Pending</b> (waiting for internet, with the number of items waiting) or <b>Failed</b> (it will retry). Tap it to see when the server last confirmed your data and to sync right away.",
"On supported browsers (for example Chrome on Android) the installed app also uses Background Sync, so a sync can start as soon as the internet returns even if the app is in the background.",
"Background sync is not guaranteed. If you force-stop the app or your phone restricts background work, the sync waits and runs automatically the next time you open the app. Nothing is lost, and the server never counts the same round twice.",
"Guests have nothing to sync, so the icon is shown only for logged-in accounts."
])+sec("🏅 Points &amp; Ranks",[
"<b>Points</b> are the marks you score in normal quiz rounds. They are added up for all your rounds. Daily Challenge rounds and coins do not count toward points or ranks.",
"There are 6 ranks: Rookie, Challenger, Advanced, Expert, Master and Quiz Legend. To unlock a rank you need <b>all three</b>: the minimum accuracy, the minimum number of rounds and the minimum points.",
"<b>Rookie:</b> 0% accuracy, 10 rounds, 100 points. <b>Challenger:</b> 40%, 20 rounds, 300 points. <b>Advanced:</b> 60%, 30 rounds, 600 points. <b>Expert:</b> 75%, 50 rounds, 1,200 points. <b>Master:</b> 85%, 100 rounds, 2,500 points. <b>Quiz Legend:</b> 95%, 200 rounds, 5,000 points.",
"After every round, the result screen shows 3 progress cards: <b>Points Progress</b> (your total points and the next points milestone), <b>All-Time Rank</b> (your overall progress to the next rank) and a <b>Quiz Rank</b> for the category you just played (only that category’s points, accuracy and rounds).",
"The rank progress bar is the average of your points, rounds and accuracy progress. It reaches 100% only when all three conditions are complete.",
"Your rank in <b>Menu → Stats → Summary</b> uses the same rules and follows the category and quiz size filters you choose there."
])+sec("📅 Daily Challenge",[
"Every day there is one <b>Daily Challenge</b> with 10 questions mixed from all categories: 3 Easy, 4 Medium and 3 Hard (50 marks in total).",
"The 10 questions are chosen by the date, so they are the same on all your devices. A new challenge starts every day at <b>12:00 AM India time (IST)</b>.",
"You can use Swap, 50-50 and Skip once each, and every question has the usual 20-second timer. There are no lives, so all 10 questions are played.",
"<b>Reward (accounts only):</b> <b>+10 coins</b> for completing the challenge and <b>+10 bonus coins</b> for a perfect 10/10 score. That is up to <b>20 coins</b> a day.",
"You can get the reward only <b>once per day</b>. These coins are extra and do not count toward the 500 daily round limit.",
"The reward is checked and saved on the server using India time, so changing the clock on your phone does not help.",
"Accounts need internet to start the challenge and to save the reward. If saving fails, your result stays on this device and the Home card shows <b>Claim</b> so you can try again (before the next daily reset).",
"Guests can play it for fun, but guests do not earn coins. Daily Challenge rounds are not added to Stats, Best Score or History."
])+sec("👤 Guest &amp; Account",["<b>Guest:</b> play without an account. Your stats are saved only on this device.","<b>Account:</b> create an account with your full name, a username and a password. Your stats are saved to your account and appear on any device where you log in.","On one device, the guest and every account keep their stats separately.","If you play without internet, your rounds are synced to your account when you are online again.","You can transfer your guest stats to your account <b>one time per device</b>. The app asks for your confirmation first.","Your old guest stats are never deleted by logging in.","Only logged-in accounts earn coins (see the Coins section). A guest sees a small hint to log in on the result screen."])
 +sec("🔐 My Account &amp; Security",["Open <b>Menu → My Account</b> after login to see your details.","<b>Change Password:</b> enter your current password and a new one. You will stay logged in on this device, and your other devices are logged out.","<b>Recovery Code:</b> a secret code that lets you reset your password if you forget it. Keep it safe.","<b>Generate New Recovery Code:</b> needs your password. The old code stops working, and the new code is shown only once, so copy it with the 📋 button.","<b>Forgot Password:</b> use your username, your recovery code and a new password.","Passwords are stored in a protected (hashed) form, never as plain text. For this reason, the app can never show your current password or your old recovery code."])
 +sec("⚙️ Settings",["Open <b>Menu → Settings</b> to turn <b>Sound</b> and <b>Vibration</b> ON or OFF.","Open <b>Menu → Switch Theme</b> to change between the <b>Dark Theme</b> and the <b>Light Theme</b> (Soft Lavender). Your choice is saved on your device."])
 +sec("🏆 Achievements",["Open <b>Menu → Achievements</b> to see all 20 trophies. Unlocked ones are shown first, and locked ones show how close you are.","Achievements unlock from your rounds: rounds played, correct answers, perfect rounds, accuracy, points, quiz categories, Daily Challenge, daily streaks and your rank.","When you unlock something, a celebration appears after the round. If you also reach a new rank, the rank-up comes next, and then your result.","You can close a celebration with <b>Continue</b>, <b>Skip all</b> or the Esc key. Each trophy unlocks only once.","Achievements work offline. For existing players, trophies you already earned are unlocked from your saved stats without a celebration.","Streaks, Comeback Player and Daily Challenge Completed count from the day you start using this update, and they are saved on this device."])
 +sec("🆕 Updates",["Open <b>Menu → What’s New</b> to see the latest features, fixes and the app version.","After an update, a popup shows only the new changes. If <b>Update now</b> cannot finish (for example because of a weak internet connection), the button changes to <b>Try again</b> and your data stays safe."])
 +sec("🌐 Internet &amp; Offline",["Quizzes, stats and settings work without internet.","After the first successful online open, the app is saved on your device. Later you can open it and play Cricket, WWE and Grammar quizzes without internet, even after closing and reopening the app. Your offline rounds stay safely on the device until they sync.","Internet is needed to install the app the first time and to get app updates. An update is downloaded fully first, and the old working version stays untouched until the new one is ready.","Internet is needed only for sign up, login, password changes, syncing your stats and coins, and the Daily Challenge for accounts."])
 +sec("💡 Tips",["Save <b>Swap</b> and <b>50-50</b> for hard questions.","Read the explanation after every answer. It helps you remember, especially in the Grammar Quiz.","Watch the timer. Time-up costs a life, just like a wrong answer.","Play perfect rounds for bonus coins, but remember the daily limit of 500."])
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
function home(){if(!BOOTED){BOOTED=1;return welcome()}stopT();dcLeave();
 app.innerHTML=`<div class="hm"><div class="hm-in"><div class="hm-bar"><div class="hm-brand"><span class="hm-bl">🎯</span><b>Quiz Arena</b></div><div class="hm-right">${syBtn()}${coinPill()}<button id="mn" class="hm-chip hm-menu" aria-label="Menu">☰</button></div></div><div class="hm-hero2"><div class="hm-hl">Ready to Prove Yourself?</div><p class="hm-sub">Play smart. Build your streak. Earn your glory.</p></div>${dcCard()}<div class="hm-label">Choose a category</div><div class="hm-grid">`+
 Object.keys(BANK).map(k=>{const nm=BANK[k].name,e=nm.match(/^(\p{Extended_Pictographic}\S*)\s+(.+)$/u);return`<button class="hm-card" data-m="${k}"><span class="hm-ic">${e?e[1]:"📚"}</span><span class="hm-tx"><b>${e?e[2]:nm}</b><small>${BANK[k].q.length} questions</small></span><span class="hm-go">›</span></button>`}).join("")+`</div></div></div>`;
 app.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>selMode(b.dataset.m));
 $("#mn").onclick=openMenu;dcWire();syWire();
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
 const d=qs[i];if(DC&&DC.cat.get(d))mode=DC.cat.get(d);locked=false;stopT();tl=TIME;
 const opts=shuf([d[1],...d[2]]);
 app.innerHTML=`<div class="qz"><div class="qz-in"><div class="qz-top"><button id="qt" class="hm-chip">✕ Quit</button><div class="qz-st"><span class="qz-pill">Marks ${score}</span><span class="qz-pill">${"❤️".repeat(DC?0:MAXW-wrong)}${DC?"📅 Daily":""}</span></div></div>
 <div class="bar"><i style="width:${i/qs.length*100}%"></i></div>
 <div class="qz-prog"><span>Question ${i+1}/${qs.length}</span><span class="badge">${LB[d[4]]} · ${MK[d[4]]} mark${MK[d[4]]>1?"s":""}</span></div>
 <div class="qz-card"><small class="qz-cat">${BANK[mode].name}</small><div class="q">${d[0]}</div></div>`+`<div class="ll"><span class="tmt" id="tmt">⏱ ${TIME}s</span><button id="lc" ${ll.c?"":"disabled"} style="padding:7px 10px">🔄</button><button id="l5" ${ll.f?"":"disabled"}>50-50</button><button id="ls" ${ll.s?"":"disabled"}>Skip</button></div>`+
 opts.map(o=>`<button class="opt">${o}</button>`).join("")+
 `<div class="info hide" id="info"></div><button class="qz-nx hide" id="nx">Next →</button></div></div>`;
 $("#qt").onclick=()=>{if(confirm("Want to quit? Scores will not be saved."))home()};
 app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>pick(b,d));
 tm=setInterval(()=>{tl--;const t=$("#tmt");if(t){t.textContent="⏱ "+tl+"s";if(tl<=5){t.classList.add("low");if(tl>0)SFX.tick()}}if(tl<=0){stopT();timeUp(d)}},1000);
 $("#lc").onclick=()=>{if(locked||!ll.c)return;const used=gs(mode),cand=BANK[mode].q.filter(x=>x[4]===d[4]&&!qs.includes(x));let p=cand.filter(x=>!used.includes(x[0]));if(!p.length)p=cand;if(!p.length)return;ll.c=0;const n=p[Math.floor(Math.random()*p.length)];qs[i]=n;if(DC)DC.cat.set(n,mode);else ss(mode,used.concat(n[0]));show()};
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
function end(){stopT();if(DC)return dcEnd();wrong>=MAXW?SFX.over():SFX.win();const aPre=achPre();
 const p=Math.round(score/MAX*100);
 {const h=LS("hist",[]);h.unshift({m:mode,s:score,r:right,n:QN,d:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"})});LW("hist",h.slice(0,10));{const S=LS("sum",{}),sk=mode+"_"+QN,a=S[sk]||{r:0,q:0,c:0,w:0,p:0};a.r++;a.q+=right+wrong;a.c+=right;a.w+=wrong;a.p+=score;a.f=(a.f||0)+(right===QN?1:0);S[sk]=a;LW("sum",S)}upStr(mode,QN,right===QN);const bk=bestKey(mode,QN);if(score>LS(bk,0))LW(bk,score)}const eid=evAdd(mode,QN,right,wrong,score),est=coinEst(QN,right);if(eid){coinPendAdd(eid,est);syncNow()}
 app.innerHTML=`<div class="rs"><div class="rs-in"><h1>${wrong>=MAXW?"Game Over 💀":"Round khatam!"}</h1><div class="rs-hero"><div class="rs-score">${score}<small>/${MAX}</small></div><div class="rs-bar"><i style="width:${Math.min(100,p)}%"></i></div><div class="rs-pc">${p}% marks</div></div><div class="rs-grid"><div class="rs-c"><small>Accuracy</small><b>${right+wrong?Math.round(right/(right+wrong)*100):0}%</b></div><div class="rs-c"><small>Points</small><b>${score}</b></div><div class="rs-c ok"><small>Correct</small><b>${right}/${QN}</b></div><div class="rs-c bad"><small>Wrong</small><b>${wrong}</b></div></div>
 ${coinCard(eid,est)}<div class="rs-msg">${p<=20?"Don't give up, keep practicing! 💪":p<50?"Not bad, you can do better! 🙂":p<=70?"Good job, nice effort! 👍":p<=90?"Great work, almost there! 🔥":p<100?"Excellent! So close to perfect! 🏆":"PERFECT 100! You are a legend! 👑"}</div><br>
 ${prgHTML(mode)}<button class="rs-b1" id="again">New Round (New questions)</button><button class="rs-b2" id="hm">Home</button></div></div>`;
 $("#again").onclick=()=>start(mode);prgAnim();achShowRound(aPre);$("#hm").onclick=()=>{const f=coinFlyStart();home();coinFlyRun(f)};
}

function openRT(){
 const ov=document.createElement("div");ov.className="ov rtm";
 ov.innerHTML='<div class="rtm-box"><div class="rtm-h"><h2>🏅 Rating Criteria</h2><button class="hm-chip" id="rtx">Close</button></div><div class="rtm-w"><table class="rtm-t"><thead><tr><th>Rating</th><th>Min Accuracy</th><th>Min Rounds</th><th>Min Points</th></tr></thead><tbody>'+RATINGS.map(t=>"<tr><td>"+t[0]+"</td><td>"+t[1]+"%</td><td>"+t[2]+"</td><td>"+coinFmt(t[3])+"</td></tr>").join("")+'</tbody></table></div><p class="rtm-n">You need all three (minimum accuracy, minimum rounds and minimum points) to earn a rating.</p></div>';
 document.body.appendChild(ov);
 const cl=()=>ov.remove();
 ov.querySelector("#rtx").onclick=cl;
 ov.onclick=e=>{if(e.target===ov)cl()};
}
// ---- Step 4A: Points + rank progress meters (result screen) ----
// Points = marks ("sum" ke p). Rank = RATINGS (accuracy + rounds + points, teeno zaroori). Category = sum keys "<mode>_<n>" ka total.
let prgMode=null,prgLast="";
const rkOk=(t,ac,r,p)=>ac>=t[1]&&r>=t[2]&&p>=t[3];
const rkFmt=x=>coinFmt(Math.round(x*10)/10);
const rkName=t=>t[0].replace(/^\S+\s/,"");
function rkStat(m){
 const S=LS("sum",{}),t={r:0,q:0,c:0,p:0};
 Object.keys(S).forEach(k=>{if(m&&k.slice(0,k.lastIndexOf("_"))!==m)return;const a=S[k]||{};t.r+=a.r|0;t.q+=a.q|0;t.c+=a.c|0;t.p+=+a.p||0});
 t.ac=t.q?t.c/t.q*100:0;return t;
}
function rkCard(ic,ti,sub,bd,mid,pct,ft){
 return '<div class="pg-c"><div class="pg-h"><span class="pg-i">'+ic+'</span><div class="pg-t"><b>'+ti+'</b><small>'+sub+'</small></div><span class="pg-bd">'+bd+'</span></div>'+mid+'<div class="pg-bar"><i data-w="'+pct+'" style="width:0"></i></div>'+ft+'</div>';
}
function rkRank(ic,ti,sub,st){
 const R=RATINGS,ci=R.findIndex(x=>rkOk(x,st.ac,st.r,st.p)),cur=ci<0?"Unranked":rkName(R[ci]);
 if(ci===0)return rkCard(ic,ti,sub+" · "+cur,"👑 Max Rank",'<div class="pg-n"><b>100%</b></div>',100,'<div class="pg-x">Maximum Rank Reached</div>');
 const n=R[ci<0?R.length-1:ci-1],ok=[st.p>=n[3],st.r>=n[2],st.ac>=n[1]],
  f=[Math.min(1,st.p/n[3]),Math.min(1,st.r/n[2]),n[1]?Math.min(1,st.ac/n[1]):1],
  pct=Math.min(99,Math.floor(f.reduce((s,x)=>s+x,0)/3*100)),
  rq=(g,t)=>'<span'+(g?' class="ok"':'')+'>'+(g?"✓ ":"")+t+'</span>';
 return rkCard(ic,ti,sub+" · "+cur,"Next: "+n[0],'<div class="pg-n"><b>'+pct+'%</b><span>to '+rkName(n)+'</span></div>',pct,
  '<div class="pg-rq">'+rq(ok[0],"Points "+rkFmt(st.p)+" / "+rkFmt(n[3]))+rq(ok[1],"Rounds "+st.r+" / "+n[2])+rq(ok[2],"Accuracy "+(Math.round(st.ac*10)/10)+"% / "+n[1]+"%")+'</div><div class="pg-x">Unlocks only when all three are complete.</div>');
}
function prgInner(m){
 const all=rkStat(),cat=rkStat(m),mi=RATINGS.slice().reverse().find(x=>x[3]>all.p),nm=BANK[m]?BANK[m].name:m,e=nm.match(/^(\p{Extended_Pictographic}\S*)\s+(.+)$/u);
 const p1=mi?rkCard("🎯","Points Progress","All-time points","Next: "+mi[0],'<div class="pg-n"><b>'+rkFmt(all.p)+'</b><span>/ '+rkFmt(mi[3])+'</span></div>',Math.min(99,Math.floor(all.p/mi[3]*100)),'<div class="pg-x">'+rkFmt(mi[3]-all.p)+' points to '+rkName(mi)+'</div>')
  :rkCard("🎯","Points Progress","All-time points","✓ Complete",'<div class="pg-n"><b>'+rkFmt(all.p)+'</b><span>points</span></div>',100,'<div class="pg-x">All points milestones reached</div>');
 return p1+rkRank("🏆","All-Time Rank","All quizzes",all)+rkRank(e?e[1]:"📚",(e?e[2]:nm)+" Rank","This quiz only",cat);
}
function prgHTML(m){prgMode=m;prgLast=prgInner(m);return'<div class="pg-w" id="prg">'+prgLast+'</div>'}
function prgAnim(){setTimeout(()=>document.querySelectorAll("#prg .pg-bar i").forEach(i=>{i.style.width=i.dataset.w+"%"}),80)}
function prgRefresh(){try{const e=$("#prg");if(!e||!prgMode)return;const h=prgInner(prgMode);if(h===prgLast)return;prgLast=h;e.innerHTML=h;prgAnim()}catch(x){}}
// ---- Step 4B: Achievements & Trophies ----
// Zyada tar achievements stats ("sum", best score) se nikalte hain: purane users ke liye bhi sahi calculate hote hain aur sync ke baad dobara sahi ho jaate hain.
// Streak, Comeback aur Daily Challenge ka purana record kahin save nahi tha, isliye wo sirf aaj ke baad ke khel se ban-te hain (fake progress nahi).
const achFmt=n=>coinFmt(Math.round(n*10)/10);
const achP=(v,t,u)=>[Math.min(1,v/t),achFmt(Math.min(v,t))+" / "+achFmt(t)+(u?" "+u:"")];
const achR1=x=>Math.round(x*10)/10;
const achAcc=(X,qm,am)=>[(Math.min(1,X.all.q/qm)+Math.min(1,X.all.ac/am))/2,"Accuracy "+achR1(X.all.ac)+"% / "+am+"% · "+Math.min(X.all.q,qm)+" / "+qm+" questions"];
const achCat=m=>X=>{const s=X.cats[m]||{r:0,ac:0};return[(Math.min(1,s.r/10)+Math.min(1,s.ac/75))/2,Math.min(s.r,10)+" / 10 rounds · accuracy "+achR1(s.ac)+"% / 75%"]};
function achVictory(){try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||k.indexOf("best_")!==0)continue;const m=k.match(/^best_(.+?)(?:_(5|10|20))?$/);if(!m)continue;const n=+(m[2]||20),mx=MODES[n]&&MODES[n].max,v=+JSON.parse(localStorage.getItem(k));if(mx&&v>=mx*.6)return true}}catch(e){}return false}
const ACH=[
 {id:"win",ic:"🥇",t:"First Victory",d:"Score 60% or more marks in a round.",fl:1,g:X=>[X.win?1:0,"Score 60%+ in any round"]},
 {id:"perf1",ic:"💯",t:"First Perfect Round",d:"Answer every question correctly in one round.",fl:1,g:X=>[X.f>=1?1:0,"Get every answer right in a round"]},
 {id:"r10",ic:"🎯",t:"10 Rounds Completed",d:"Complete 10 rounds in any quiz.",g:X=>achP(X.all.r,10,"rounds")},
 {id:"r25",ic:"🔥",t:"25 Rounds Completed",d:"Complete 25 rounds in any quiz.",g:X=>achP(X.all.r,25,"rounds")},
 {id:"r50",ic:"🏅",t:"50 Rounds Completed",d:"Complete 50 rounds in any quiz.",g:X=>achP(X.all.r,50,"rounds")},
 {id:"c100",ic:"✅",t:"100 Correct Answers",d:"Give 100 correct answers in total.",g:X=>achP(X.all.c,100,"correct")},
 {id:"c500",ic:"🧠",t:"500 Correct Answers",d:"Give 500 correct answers in total.",g:X=>achP(X.all.c,500,"correct")},
 {id:"perf5",ic:"⭐",t:"5 Perfect Rounds",d:"Finish 5 rounds with every answer correct.",g:X=>achP(X.f,5,"perfect")},
 {id:"acc90",ic:"🎖️",t:"90% Accuracy",d:"Keep 90% accuracy or more over at least 100 questions.",g:X=>achAcc(X,100,90)},
 {id:"acc95",ic:"🏹",t:"95% Accuracy",d:"Keep 95% accuracy or more over at least 200 questions.",g:X=>achAcc(X,200,95)},
 {id:"cric",ic:"🏏",t:"Cricket Specialist",d:"Play 10 Cricket rounds with 75% accuracy or more.",g:achCat("cricket")},
 {id:"wwe",ic:"🤼",t:"WWE Specialist",d:"Play 10 WWE rounds with 75% accuracy or more.",g:achCat("wwe")},
 {id:"gram",ic:"📝",t:"Grammar Master",d:"Play 10 Grammar rounds with 75% accuracy or more.",g:achCat("grammar")},
 {id:"allr",ic:"🌟",t:"All-Rounder",d:"Play at least 3 rounds in every quiz category.",g:X=>{const k=Object.keys(X.cats);return[k.length?k.reduce((s,m)=>s+Math.min(1,X.cats[m].r/3),0)/k.length:0,"Rounds per quiz: "+k.map(m=>Math.min(X.cats[m].r,3)+"/3").join(" · ")]}},
 {id:"daily",ic:"📅",t:"Daily Challenge Completed",d:"Complete one Daily Challenge.",fl:1,g:X=>[X.A.dc?1:0,"Finish today's Daily Challenge"]},
 {id:"back",ic:"🔁",t:"Comeback Player",d:"Play a round after being away for 7 days or more.",fl:1,g:X=>[X.A.cb?1:0,"Come back after 7+ days away"]},
 {id:"s7",ic:"🔥",t:"7-Day Streak",d:"Play on 7 days in a row.",g:X=>achP((X.A.sk&&X.A.sk.b)|0,7,"days")},
 {id:"s30",ic:"🌋",t:"30-Day Streak",d:"Play on 30 days in a row.",g:X=>achP((X.A.sk&&X.A.sk.b)|0,30,"days")},
 {id:"p1k",ic:"💎",t:"1,000 Lifetime Points",d:"Earn 1,000 points in total.",g:X=>achP(X.all.p,1000,"points")},
 {id:"leg",ic:"👑",t:"Quiz Legend",d:"Reach the Quiz Legend rank.",g:X=>{const L=RATINGS[0],p=(Math.min(1,X.all.p/L[3])+Math.min(1,X.all.r/L[2])+Math.min(1,X.all.ac/L[1]))/3;return[p,Math.floor(p*100)+"% of the way to Quiz Legend"]}}
];
const achGet=()=>{const A=LS("ach",null);return A&&typeof A==="object"&&!Array.isArray(A)?A:{}};
function achCtx(A){const S=LS("sum",{}),all=rkStat(),cats={};Object.keys(BANK).forEach(m=>{cats[m]=rkStat(m)});return{A,all,cats,win:achVictory(),f:Object.keys(S).reduce((t,k)=>t+((S[k]&&S[k].f)|0),0)}}
// Naye unlock hue achievements ki list deta hai. Har id sirf ek baar likhi jaati hai (silent=1: purane stats se, celebration ke bina).
function achCheck(silent){const A=achGet();A.u=A.u&&typeof A.u==="object"?A.u:{};const X=achCtx(A),nw=[];ACH.forEach(a=>{if(A.u[a.id])return;if(a.g(X)[0]>=1){A.u[a.id]=silent?1:Date.now();nw.push(a)}});if(nw.length)LW("ach",A);return nw}
const achCatch=()=>{try{achCheck(1)}catch(e){}};
const achDay=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
// Round / Daily Challenge ke baad: day streak aur comeback (7+ din ka gap) record karta hai.
function achEvt(A){const now=Date.now(),td=new Date(),t=achDay(td),k=A.sk&&typeof A.sk==="object"?A.sk:{l:"",c:0,b:0};
 if(A.lp&&now>A.lp&&now-A.lp>=7*864e5)A.cb=1;
 if(!k.l||t>k.l){const y=new Date(td);y.setDate(y.getDate()-1);k.c=(k.l&&achDay(y)===k.l)?(k.c|0)+1:1;k.l=t}
 k.b=Math.max(k.b|0,k.c|0);A.sk=k;A.lp=Math.max(A.lp||0,now)}
const rkIdx=st=>RATINGS.findIndex(x=>rkOk(x,st.ac,st.r,st.p));
const rkUp=(o,n)=>n>=0&&(o<0||n<o);
function achPre(){achCatch();try{return{a:rkIdx(rkStat()),c:rkIdx(rkStat(mode)),m:mode}}catch(e){return null}}
function achShowRound(pre){try{
 const A=achGet();achEvt(A);LW("ach",A);
 const it=achCheck().map(a=>({k:"a",a}));
 if(pre){const sp=(i,sc)=>{const r=RATINGS[i],m=r[0].match(/^(\S+)\s+(.+)$/);it.push({k:"r",ic:m?m[1]:"🏆",name:m?m[2]:r[0],scope:sc})};
  const na=rkIdx(rkStat()),nc=rkIdx(rkStat(pre.m)),nm=BANK[pre.m]?BANK[pre.m].name.replace(/^\S+\s/,""):pre.m;
  if(rkUp(pre.a,na))sp(na,"All-Time Rank");if(rkUp(pre.c,nc))sp(nc,nm+" Rank")}
 achCelebrate(it)}catch(e){}}
function achDC(){try{const A=achGet();A.dc=1;achEvt(A);LW("ach",A);achCelebrate(achCheck().map(a=>({k:"a",a})))}catch(e){}}
function prgReplay(){document.querySelectorAll("#prg .pg-bar i").forEach(i=>{i.style.transition="none";i.style.width="0";void i.offsetWidth;i.style.transition=""});prgAnim()}
// Celebration: pehle achievements, phir rank-up; ek-ek karke. Tap se "Next"/"Continue", "Skip all" ya Esc se band. Animation sirf ek-do baar chalti hai.
function achCelebrate(items){
 if(!items||!items.length)return;
 const ov=document.createElement("div");ov.className="ach-cel";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");
 let i=0;const kd=e=>{if(e.key==="Escape")fin()};
 const fin=()=>{document.removeEventListener("keydown",kd);ov.remove();try{prgReplay()}catch(e){}};
 const paint=()=>{
  const it=items[i],rk=it.k==="r",last=i===items.length-1;
  const cf=["#8b5cf6","#ec4899","#fbbf24","#4d9bff","#34d399"].map((c,j)=>[0,1,2].map(q=>'<s style="left:'+(4+(j*3+q)*6.4)+'%;animation-delay:'+((j+q)%5*.12)+'s;background:'+c+'"></s>').join("")).join("");
  ov.innerHTML='<div class="ach-conf" aria-hidden="true">'+cf+'</div><div class="ach-cd'+(rk?" rk":"")+'"><div class="ach-kick">'+(rk?"RANK UP":"ACHIEVEMENT UNLOCKED")+'</div><div class="ach-bg"><span class="ach-ring"></span><span class="ach-em"></span></div><h2 class="ach-ct"></h2><p class="ach-cs"></p>'+(items.length>1?'<div class="ach-cn">'+(i+1)+' of '+items.length+'</div>':'')+'<button class="ach-go" id="acn" type="button">'+(last?"Continue":"Next")+'</button>'+(last?'':'<button class="ach-sk" id="acs" type="button">Skip all</button>')+'</div>';
  ov.querySelector(".ach-em").textContent=rk?it.ic:it.a.ic;
  ov.querySelector(".ach-ct").textContent=rk?it.name:it.a.t;
  ov.querySelector(".ach-cs").textContent=rk?"You reached "+it.name+" in "+it.scope+".":it.a.d;
  ov.querySelector("#acn").onclick=()=>{if(last)fin();else{i++;paint()}};
  const s=ov.querySelector("#acs");if(s)s.onclick=fin;
  try{SFX.ok();vib(rk?[40,30,40]:40)}catch(e){}
  ov.querySelector("#acn").focus();
 };
 document.body.appendChild(ov);document.addEventListener("keydown",kd);paint();
}
function achScr(){
 achCatch();const A=achGet(),U=A.u||{},X=achCtx(A),on=[],off=[];
 ACH.forEach(a=>(U[a.id]?on:off).push(a));
 const dt=t=>t>1e6?new Date(t).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"";
 const card=(a,u)=>{const g=a.g(X),p=Math.floor(Math.min(1,g[0])*100);return'<div class="ac-c'+(u?" on":"")+'"><span class="ac-ic">'+(u?a.ic:"🔒")+'</span><div class="ac-t"><b>'+a.t+'</b><p>'+a.d+'</p>'+(u?'<div class="ac-st">✓ Unlocked'+(dt(U[a.id])?" · "+dt(U[a.id]):"")+'</div>':(a.fl?'<div class="ac-st">'+g[1]+'</div>':'<div class="pg-bar"><i style="width:'+p+'%"></i></div><div class="ac-st">'+g[1]+'</div>'))+'</div></div>'};
 const pc=Math.round(on.length/ACH.length*100);
 app.innerHTML='<div class="se"><div class="se-in ac-in"><div class="st-bar"><button class="hm-chip" id="sb">← Back</button><span class="sm-cat">🏆 Achievements</span></div><div class="ac-sum"><b>'+on.length+' / '+ACH.length+'</b><span>unlocked</span><div class="pg-bar"><i style="width:'+pc+'%"></i></div></div>'
  +(on.length?'<h3 class="ac-h">Unlocked ('+on.length+')</h3><div class="ac-l">'+on.map(a=>card(a,1)).join("")+'</div>':'')
  +(off.length?'<h3 class="ac-h">Locked ('+off.length+')</h3><div class="ac-l">'+off.map(a=>card(a,0)).join("")+'</div>':'')+'</div></div>';
 $("#sb").onclick=toMenu;
}
setTimeout(achCatch,2500);
let sumQ="all",sumN="all";
const bfStr=()=>{const H=LS("hist",[]).slice().reverse(),P={};["all"].concat(Object.keys(BANK)).forEach(q=>["all","5","10","20"].forEach(n=>{let c=0,b=0;H.forEach(x=>{const xn=x.n||20;if((q==="all"||x.m===q)&&(n==="all"||String(xn)===n)){if(x.r===xn){c++;if(c>b)b=c}else c=0}});P[q+"_"+n]={c,b}}));return P};
const upStr=(m,n,p)=>{let P=LS("pstr",null);if(!P){LW("pstr",bfStr());return}[["all","all"],[m,"all"],["all",""+n],[m,""+n]].forEach(k=>{const e=k.join("_"),o=P[e]||{c:0,b:0};o.c=p?o.c+1:0;if(o.c>o.b)o.b=o.c;P[e]=o});LW("pstr",P)};
const RATINGS=[["👑 Quiz Legend",95,200,5000],["🏆 Master",85,100,2500],["🎖️ Expert",75,50,1200],["⭐ Advanced",60,30,600],["⚔️ Challenger",40,20,300],["🌱 Rookie",0,10,100]]; // [name, min accuracy %, min rounds, min points]
const getRating=(ac,r,p)=>{p=p||0;const a=RATINGS.find(t=>rkOk(t,ac,r,p)),n=RATINGS.find(t=>ac>=t[1]);if(a===n)return[a?a[0]:"🔒 Unranked",""];const need=[];if(r<n[2])need.push((n[2]-r)+" more rounds");if(p<n[3])need.push(rkFmt(n[3]-p)+" more points");return[a?a[0]:"🔒 Unranked",need.join(" and ")+" needed for "+rkName(n)]};
const rateRow=(ac,r,p)=>{const g=getRating(ac,r,p);return `<div class="card hrow st-rate" id="rtc"><span>Quiz Arena Rating ⓘ</span><b>${g[0]}</b>${g[1]?`<small>${g[1]}</small>`:""}</div>`};
function sumHTML(){
 const S=LS("sum",{}),t={r:0,q:0,c:0,w:0,p:0,f:0};
 Object.keys(S).forEach(k=>{const j=k.lastIndexOf("_"),m=k.slice(0,j),n=k.slice(j+1);if((sumQ==="all"||sumQ===m)&&(sumN==="all"||sumN===n))for(const f in t)t[f]+=S[k][f]||0});
 const rd=x=>Math.round(x*10)/10,acc=t.q?rd(t.c/t.q*100):0,st="flex:1;padding:12px 14px;border-radius:14px;border:1px solid #2a2a33;background:#17171c;color:#f2f2f7;font-size:15px;font-weight:600;font-family:inherit";
 const row=(a,b)=>`<div class="st-c"><small>${a}</small><b class="${parseFloat(b)===0?"z":""}">${b}</b></div>`;
 const sel=(id,v,o,w)=>`<select id="${id}" style="${st};flex:${w}">${o.map(x=>`<option value="${x[0]}"${x[0]===v?" selected":""}>${x[1]}</option>`).join("")}</select>`;
 return '<div style="display:flex;gap:8px;margin-bottom:14px">'+sel("sq",sumQ,[["all","All time"]].concat(Object.keys(BANK).map(k=>[k,BANK[k].name])),1.6)+sel("sn",sumN,[["all","All"],["5","5"],["10","10"],["20","20"]],1)+'</div><div class="st-grid">'+row("Total Rounds Played",t.r)+row("Questions Played",t.q)+row("Correct Answers",t.c)+row("Wrong Answers",t.w)+row("Points Secured",rd(t.p))+row("Accuracy Rate",acc+"%")+row("Perfect Rounds",t.f)+row("Longest Perfect Streak",Math.max(((LS("pstr",null)||bfStr())[sumQ+"_"+sumN]||{}).b||0,t.f>0?1:0))+row("User Since",(()=>{const v=LS("since",0);return v?new Date(v).toLocaleDateString("en-US",{month:"long",year:"numeric"}):"—"})())+'</div>'+rateRow(t.q?t.c/t.q*100:0,t.r,t.p);
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
  $("#ub").onclick=async()=>{const bt=$("#ub");bt.textContent="Updating…";let ok=false;try{ok=await applyUpd(b.join("\n"))}catch(e){}if(!ok){bt.textContent="Try again";return}LW("wn_ack",sg(b));location.reload()};
 }).catch(()=>{});
}
async function applyUpd(want){
 if(!window.caches)return true;
 const cs=[];for(const k of await caches.keys()){if(k==="quiz-stage")continue;const x=await caches.open(k);if(await x.match("index.html"))cs.push(x)}
 if(!cs.length)return true;
 const q=f=>f+(f.includes("?")?"&":"?")+"chk="+Date.now();
 const h=await (await fetch(q("index.html"),{cache:"reload"})).text();
 const u=[...h.matchAll(/(?:src|href)="([^":#]+)"/g)].map(m=>m[1]);
 let mi=[];try{mi=((await (await fetch(q("manifest.json"),{cache:"reload"})).json()).icons||[]).map(i=>i.src)}catch(e){}
 const fs=[...new Set(["./","index.html","whats-new.txt","manifest.json",...mi,...u])];
 const rs=await Promise.all(fs.map(f=>fetch(q(f),{cache:"reload"})));
 if(rs.some(r=>!r.ok))return false; // ek bhi file na aaye to chalta hua cache bilkul nahi chhedte
 try{
  await caches.delete("quiz-stage");const st=await caches.open("quiz-stage");
  for(let i=0;i<fs.length;i++)await st.put(fs[i],rs[i].clone()); // pehle naya set alag "quiz-stage" mein taiyar
  const w=await st.match("whats-new.txt"),tb=w?topB(await w.text()):null;
  if(!tb||tb.join("\n")!==want)return false;
  for(const c of cs)for(const f of fs)await c.put(f,await st.match(f)); // taiyar hone ke baad hi chalte cache mein
  return true;
 }finally{await caches.delete("quiz-stage").catch(()=>{})}
}
async function applyUpdOld(){
 if(!window.caches)return;
 const ks=await caches.keys();if(!ks.length)return;
 const c=await caches.open(ks[0]),q=f=>f+(f.includes("?")?"&":"?")+"chk="+Date.now();
 const h=await (await fetch(q("index.html"),{cache:"reload"})).text();
 const u=[...h.matchAll(/(?:src|href)="([^":#]+)"/g)].map(m=>m[1]);
 await Promise.all([...new Set(["./","index.html","whats-new.txt","manifest.json","assets/qa-icon-192.png","assets/qa-icon-512.png","assets/qa-icon-maskable-512.png","assets/qa-apple-180.png",...u])].map(f=>fetch(q(f),{cache:"reload"}).then(r=>{if(r.ok)return c.put(f,r)})));
}
// ---- Step 3: Daily Challenge ----
// Account: din, status aur reward server (IST) se aate hain; device ki clock kuch decide nahi karti.
// Guest: sirf is device par, koi coin nahi, koi sync nahi.
const DC_BASE=10,DC_PERF=10; // sirf guest ko dikhane ke liye; account ke liye server ka number final hai
let DC=null,dcSt=null,dcBusy=0,dcErr="",dcTm=null,dcView=0,dcRs=null;
const dcRng=a=>()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const dcGDay=()=>new Date(Date.now()+19800000).toISOString().slice(0,10);
const dcGSecs=()=>Math.max(1,Math.ceil((864e5-(Date.now()+19800000)%864e5)/1000));
const dcFmtDay=d=>{try{return new Date(d+"T00:00:00Z").toLocaleDateString("en-GB",{day:"2-digit",month:"short",timeZone:"UTC"})}catch(e){return d}};
const dcLeft=s=>{const m=Math.max(1,Math.ceil(s/60));return Math.floor(m/60)+"h "+(m%60)+"m"};
const dcAcc=()=>{const a=LS("auth",null);return LS("auth_mode","")==="account"&&a&&a.user?a.user.id:null};
const dcRemain=s=>s.secs-(s.t0!==undefined?(performance.now()-s.t0)/1000:Math.max(0,(Date.now()-s.at)/1000));
const dcGet=()=>{const u=dcAcc();if(!u)return null;const s=dcSt&&dcSt.u===u?dcSt:LS("dcs",null);return s&&s.u===u&&typeof s.day==="string"&&dcRemain(s)>0?s:null};
const dcPend=()=>{const u=dcAcc(),p=LS("dcpend",null);return u&&p&&p.u===u&&typeof p.day==="string"?p:null};
const dcFresh=()=>{const s=dcSt;return !!s&&s.u===dcAcc()&&s.t0!==undefined&&dcRemain(s)>0&&(s.done||performance.now()-s.t0<120000)};
const dcSave=(u,d)=>{dcSt={u,day:d.day,done:!!d.done,r:d.r|0,w:d.w|0,coins:d.coins|0,base:d.base|0,perf:d.perf|0,secs:d.secs|0,at:Date.now(),t0:performance.now()};const c=Object.assign({},dcSt);delete c.t0;LW("dcs",c)};
const dcGuest=()=>{const g=LS("dcg",null);return g&&g.day===dcGDay()?g:null};
// Din ke 10 sawal: har device par same (din se tay), 3 Easy + 4 Medium + 3 Hard, saari categories mix.
// Pool fixed order mein shuffle hota hai aur har din agla hissa liya jata hai, isliye din-ba-din repeat nahi hote.
function dcPick(day){
 const p=day.split("-").map(Number),dn=Math.floor(Date.UTC(p[0],p[1]-1,p[2])/864e5);let out=[];
 for(const t of "emh"){
  const n=MODES[10].n[t],pool=[];
  Object.keys(BANK).sort().forEach(k=>BANK[k].q.forEach(x=>{if(x[4]===t)pool.push({k,q:x})}));
  pool.sort((a,b)=>a.q[0]<b.q[0]?-1:a.q[0]>b.q[0]?1:0);
  const rnd=dcRng(t.charCodeAt(0)*7919);
  for(let j=pool.length-1;j>0;j--){const k=Math.floor(rnd()*(j+1));[pool[j],pool[k]]=[pool[k],pool[j]]}
  const st=pool.length?(dn*n)%pool.length:0;
  for(let j=0;j<n&&j<pool.length;j++)out.push(pool[(st+j)%pool.length]);
 }
 const r2=dcRng(dn);
 for(let j=out.length-1;j>0;j--){const k=Math.floor(r2()*(j+1));[out[j],out[k]]=[out[k],out[j]]}
 return out;
}
function dcStart(day){
 unlockA();const all=dcPick(day);if(!all.length)return;
 DC={day,cat:new Map(all.map(x=>[x.q,x.k])),pQN:QN,pW:MAXW};
 setQN(10);MAXW=99; // 10 sawal ke marks; Daily Challenge mein lives nahi, saare 10 sawal khelte hain
 qs=all.map(x=>x.q);i=0;score=0;right=0;skipped=0;wrong=0;ll={f:1,s:1,c:1};dcView=0;show();
}
function dcLeave(){dcView=0;if(!DC)return;setQN(DC.pQN);MAXW=DC.pW;DC=null}
function dcEnd(){
 const day=DC.day,o={day,r:right,w:wrong,sc:score,mx:MODES[10].max},u=dcAcc();
 dcLeave();SFX.win();
 if(u)LW("dcpend",{u,day,r:o.r,w:o.w});else LW("dcg",{day,r:o.r,w:o.w,s:o.sc});
 dcRs={o,u,ph:u?"saving":"guest",aw:0};
 dcResScr();
 if(u)dcSubmit();
 achDC();
}
let dcCl=null;
const dcClaim=()=>dcCl||(dcCl=dcClaim0().finally(()=>{dcCl=null})); // ek waqt par ek hi claim (sync aur result screen dono bula sakte hain)
async function dcClaim0(){
 const a=LS("auth",null),p=LS("dcpend",null);
 if(!a||!a.user||!p||p.u!==a.user.id)return null;
 const r=await authedApi("/daily/claim",{day:p.day,r:p.r,w:p.w,deviceId:devId()});
 if(r.ok&&r.data&&typeof r.data.day==="string"){
  LW("dcpend","");dcSave(a.user.id,r.data);
  if(Number.isInteger(r.data.balance)&&r.data.balance>=0)LW("coins",{id:a.user.id,b:r.data.balance});
  coinShow();syncSoon();
 }else if(r.status===409||r.status===400)LW("dcpend","");
 return r;
}
async function dcSubmit(){
 dcRs.ph="saving";dcRewardPaint();
 const r=await dcClaim();
 if(!dcRs||!$("#dcrw"))return;
 if(r&&r.ok&&r.data&&r.data.day){dcRs.ph=r.data.already?"already":"ok";dcRs.aw=r.data.awarded|0;dcRs.base=r.data.base|0;dcRs.perf=r.data.perf|0}
 else dcRs.ph=r&&r.status===409?"expired":"fail";
 dcRewardPaint();
}
function dcRewardPaint(){
 const b=$("#dcrw");if(!b||!dcRs)return;
 const ph=dcRs.ph,card=(id,cl,t,m)=>'<div class="rs-coin'+cl+'"'+(id?' id="rc"':'')+'><span class="rc-i">🪙</span><div class="rc-t"><small>Daily reward</small><b>'+t+'</b><em>'+m+'</em></div></div>';
 coinRes=null;coinWait=null;
 if(ph==="guest")b.innerHTML='<div class="rs-coin rs-coin-g"><span class="rc-i">🪙</span><span>Login to earn coins</span></div>';
 else if(ph==="saving")b.innerHTML=card(0," sync","Saving…","Saving your reward to your account");
 else if(ph==="ok"){coinRes={n:dcRs.aw};b.innerHTML=card(1,"","+"+dcRs.aw,dcRs.aw>=(dcRs.base||0)+(dcRs.perf||0)&&dcRs.perf?"Completed +"+dcRs.base+" · Perfect bonus +"+dcRs.perf:"Challenge completed +"+dcRs.aw)}
 else if(ph==="already")b.innerHTML=card(0,"","Claimed","Today’s reward was already saved for your account");
 else if(ph==="expired")b.innerHTML=card(0,"","Not counted","The daily reset happened before your result was saved");
 else b.innerHTML=card(0,"","Not saved","Couldn’t reach the server. Your result is kept on this device.")+'<button class="rs-b2" id="dcrt">Try again</button>';
 const t=$("#dcrt");if(t)t.onclick=dcSubmit;
}
function dcResScr(){
 const o=dcRs.o,p=Math.round(o.sc/o.mx*100),s=dcGet(),secs=s?dcRemain(s):dcGSecs();
 app.innerHTML='<div class="rs"><div class="rs-in"><h1>'+(o.r===10?"Perfect Challenge! 👑":"Challenge Complete 📅")+'</h1><div class="rs-hero"><div class="rs-score">'+o.sc+'<small>/'+o.mx+'</small></div><div class="rs-bar"><i style="width:'+Math.min(100,p)+'%"></i></div><div class="rs-pc">'+p+'% marks</div></div><div class="rs-grid"><div class="rs-c"><small>Accuracy</small><b>'+(o.r+o.w?Math.round(o.r/(o.r+o.w)*100):0)+'%</b></div><div class="rs-c"><small>Points</small><b>'+o.sc+'</b></div><div class="rs-c ok"><small>Correct</small><b>'+o.r+'/10</b></div><div class="rs-c bad"><small>Wrong</small><b>'+o.w+'</b></div></div><div id="dcrw"></div><div class="rs-msg">'+(o.r===10?"PERFECT! You nailed today’s challenge! 👑":o.r>=7?"Great run! Come back tomorrow for a new one 🔥":o.r>=4?"Good effort! A new challenge arrives tomorrow 👍":"Keep practicing, a new challenge arrives tomorrow 💪")+'</div><p class="dc-note">⏳ Next challenge in '+dcLeft(secs)+' (12:00 AM IST)</p><button class="rs-b1" id="dch">Home</button></div></div>';
 dcRewardPaint();
 $("#dch").onclick=()=>{const f=coinFlyStart();home();coinFlyRun(f)};
}
async function dcFetch(){
 const u=dcAcc();if(!u||dcBusy)return;
 dcBusy=1;dcErr="";dcPaint();dcDraw();
 let r={ok:false,status:0,data:{}},got=0;
 try{
  if(dcPend()){const c=await dcClaim();if(c&&c.ok&&c.data&&typeof c.data.day==="string"){got=1;r=c}}
  if(!got)r=await authedApi("/daily/status",{});
 }catch(e){}
 dcBusy=0;
 if(dcAcc()!==u)return;
 if(!got&&r.ok&&r.data&&typeof r.data.day==="string")dcSave(u,r.data);
 else if(!got)dcErr=authMsg(r);
 dcPaint();dcDraw();
}
const dcCard=()=>'<button class="dc-card" id="dcc" type="button"><span class="dc-ic">📅</span><span class="dc-tx"><b>Daily Challenge</b><small id="dcsb"></small><span class="dc-rw" id="dcrr"></span></span><span class="dc-ft"><span id="dct"></span><span class="dc-bd" id="dcbd"></span></span></button>';
function dcPaint(){
 const c=$("#dcc");if(!c)return;
 const u=dcAcc(),s=u?dcGet():null,pd=u?dcPend():null,g=u?null:dcGuest();
 let day=dcGDay(),secs=dcGSecs(),rw,bd,cl="dc-card";
 if(s){day=s.day;secs=dcRemain(s)}
 if(u){
  if(s&&s.done){rw="🪙 +"+s.coins+" earned · "+s.r+"/10 correct";bd="✓ Done";cl+=" done"}
  else if(pd){rw="⚠️ Reward not saved yet · tap to claim";bd="Claim";cl+=" warn"}
  else if(s){rw="🪙 +"+s.base+" · +"+s.perf+" perfect bonus";bd="Play ›"}
  else if(dcBusy){rw="Checking today’s challenge…";bd="…";cl+=" load";secs=0}
  else if(dcErr){rw="⚠️ Couldn’t load · tap to retry";bd="Retry";cl+=" warn";secs=0}
  else{rw="Tap to load today’s challenge";bd="Play ›";secs=0}
 }else if(g){rw=g.r+"/10 correct · Login to earn coins";bd="✓ Done";cl+=" done"}
 else{rw="Play free · Login to earn coins";bd="Play ›"}
 c.className=cl;
 $("#dcsb").textContent="Today · "+dcFmtDay(day);
 $("#dcrr").textContent=rw;$("#dcbd").textContent=bd;
 $("#dct").textContent=secs>0?"⏳ Resets in "+dcLeft(secs)+" · 12 AM IST":"New challenge daily · 12 AM IST";
}
function dcWire(){
 const c=$("#dcc");if(!c)return;
 c.onclick=dcScr;dcPaint();clearInterval(dcTm);
 dcTm=setInterval(()=>{if(!$("#dcc")){clearInterval(dcTm);return}dcPaint();if(dcAcc()&&!dcBusy&&!dcGet()&&!dcErr&&navigator.onLine)dcFetch()},30000);
 if(dcAcc()&&navigator.onLine&&!dcBusy&&(!dcFresh()||dcPend()))dcFetch();
}
function dcScr(){dcView=1;if(!dcBusy)dcErr="";dcDraw();if(dcAcc()&&!dcBusy&&(!dcFresh()||dcPend()))dcFetch()}
function dcDraw(){
 if(!dcView)return;
 const u=dcAcc(),s=u?dcGet():null,pd=u?dcPend():null,g=u?null:dcGuest();
 const day=s?s.day:dcGDay(),secs=s?dcRemain(s):dcGSecs();
 const row=(a,b)=>'<div class="ma-row"><span>'+a+'</span><b>'+b+'</b></div>',sec=(h,x)=>'<div class="ma-sec"><h2 class="ma-h">'+h+'</h2>'+x+'</div>';
 let body="",btn="",dis=0,act=null,msg="";
 if((u&&s&&s.done)||g){
  const r=u?s.r:g.r;
  body=sec("✅ Completed Today",row("Correct",r+"/10")+(u?row("Coins earned","🪙 +"+s.coins):row("Coins","Guests don’t earn coins"))+row("Next challenge in",dcLeft(secs)))+'<p class="dc-note">A new challenge starts every day at 12:00 AM IST.</p>';
 }else if(u&&pd){
  body=sec("⚠️ Reward Not Saved Yet","<p class=\"ma-p\">You finished today’s challenge, but your reward could not be saved. Your result is kept on this device. Tap the button to try again.</p>");
  btn=dcBusy?"Saving…":"Claim Reward";dis=dcBusy;act=()=>dcFetch();msg=dcErr;
 }else if(u&&!(s&&dcFresh())){
  body=sec(dcBusy?"⏳ Loading":"📡 Can’t Load","<p class=\"ma-p\">"+(dcBusy?"Checking today’s challenge… The first request can take up to a minute if the server is waking up.":!navigator.onLine?"You’re offline. Connect to the internet to start today’s challenge, so your reward can be saved.":"Today’s challenge could not be loaded. Please try again.")+"</p>");
  btn=dcBusy?"Loading…":"Try Again";dis=dcBusy;act=()=>dcFetch();if(!dcBusy)msg=dcErr;
 }else{
  const b=u?s.base:DC_BASE,p=u?s.perf:DC_PERF;
  body=sec("🎯 Today’s Challenge",row("Questions","10")+row("Categories","All mixed")+row("Mix","3 Easy · 4 Medium · 3 Hard")+row("Marks","50")+row("Timer","20 seconds each")+row("Lifelines","Swap · 50-50 · Skip")+row("Lives","None, all 10 are played"))
  +(u?sec("🪙 Rewards",row("Complete the challenge","+"+b)+row("Perfect score (10/10) bonus","+"+p)+row("Maximum today","+"+(b+p))+row("Resets in",dcLeft(secs)))+'<p class="dc-note">You can earn this reward once per day. These coins are extra and do not count toward the 500 daily round limit. A new challenge starts at 12:00 AM IST.</p>'
  :'<p class="dc-note dc-g">🪙 Guests don’t earn coins. Login to earn up to '+(b+p)+' coins from every Daily Challenge.</p>');
  btn="▶ Start Challenge";act=()=>dcStart(u?s.day:dcGDay());
 }
 app.innerHTML='<div class="sm"><div class="sm-in"><div class="sm-bar"><button class="hm-chip" id="sb">← Home</button><span class="sm-cat">📅 Daily Challenge</span></div><div class="sm-hd"><h1>Daily Challenge</h1><p>'+dcFmtDay(day)+' · 10 questions</p></div>'+body+(btn?'<button class="sm-go" id="dcgo"'+(dis?' disabled':'')+'>'+btn+'</button>':'')+'<p class="sm-info" id="dcmsg"></p></div></div>';
 $("#dcmsg").textContent=msg;
 $("#sb").onclick=home;
 if(btn)$("#dcgo").onclick=act;
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
  const ks=["hist","sum","pstr","outbox","ach"];
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
// ---- Step 5: Auto-sync (online / app reopen / retry / Background Sync) + Sync status icon ----
// Server har event ko uske id se ek hi baar lagata hai (rounds + coin_ledger), isliye dobara bhejna duplicate nahi banata.
let syErr="",syN=0,syTm=null;
const SY_T={synced:["Synced","All your data is saved on the server."],syncing:["Syncing…","Sending your data to the server."],pending:["Pending","Waiting to sync with the server."],failed:["Sync failed","Could not sync. It will retry automatically."]};
const SY_SVG='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12a9 9 0 0 1 15.5-6.2"/><path d="M18.5 2v4h-4"/><path d="M5.5 22v-4h4"/></svg>';
const syAcc=()=>{const a=LS("auth",null);return LS("auth_mode","")==="account"&&a&&a.user?a.user.id:null};
function syInfo(){
 const u=syAcc();if(!u)return null;
 const ob=LS("outbox",[]).length,dp=dcPend()?1:0,pend=ob+dp,c=LS("syncst",null),conf=c&&c.u===u?c.t:0,on=navigator.onLine;
 const st=syncBusy?"syncing":pend>0?(syErr&&on?"failed":"pending"):syErr&&on?"failed":conf?"synced":"pending";
 return{st,ob,dp,pend,conf,on};
}
const syAgo=t=>{if(!t)return"Not yet";const m=Math.floor((Date.now()-t)/6e4);return m<1?"Just now":m<60?m+" min ago":m<1440?Math.floor(m/60)+" h ago":new Date(t).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})};
const syBtn=()=>syAcc()?'<button id="sy" type="button" class="hm-chip hm-sync sy-pending" aria-label="Sync status"><span class="sy-ic">'+SY_SVG+'</span><i class="sy-n"></i></button>':"";
function syPaint(){
 const i=syInfo(),b=$("#sy");
 if(b&&i){b.className="hm-chip hm-sync sy-"+i.st;const n=b.querySelector(".sy-n");if(n)n.textContent=i.pend>0&&i.st!=="syncing"?(i.pend>9?"9+":String(i.pend)):"";const t="Sync: "+SY_T[i.st][0]+(i.pend>0?" ("+i.pend+" waiting)":"");b.title=t;b.setAttribute("aria-label",t)}
 syPanel(i);
}
function syPanel(i){
 const b=$("#syb");if(!b)return;
 if(!i)i=syInfo();
 if(!i){b.textContent="Sync is only for logged-in accounts.";return}
 const T=SY_T[i.st],row=(a,v)=>'<div class="ma-row"><span>'+a+'</span><b>'+v+'</b></div>',w=[];
 if(i.ob)w.push(i.ob+(i.ob>1?" rounds":" round"));if(i.dp)w.push("Daily Challenge reward");
 const k=[i.st,i.ob,i.dp,i.conf?syAgo(i.conf):"",i.on,syErr].join("|");
 if(b.dataset.k===k)return;b.dataset.k=k;
 b.innerHTML='<div class="sy-hd sy-'+i.st+'"><span class="sy-ic">'+SY_SVG+'</span><div><b>'+T[0]+'</b><small>'+T[1]+'</small></div></div><div class="ma-sec">'+row("Server confirmed",syAgo(i.conf))+row("Waiting to sync",w.length?w.join(" + "):"Nothing")+row("Connection",i.on?"Online":"Offline")+'</div><p class="sy-er" id="syer"></p><button class="sm-go" id="syg"'+(i.st==="syncing"||!i.on?' disabled':'')+'>'+(i.st==="syncing"?"Syncing…":i.on?"Sync Now":"Waiting for internet")+'</button>';
 $("#syer").textContent=i.st==="failed"?syErr:"";
 $("#syg").onclick=()=>syncNow();
}
function syOpen(){
 if($("#sypn"))return;
 const ov=document.createElement("div");ov.className="ov rtm";ov.id="sypn";
 ov.innerHTML='<div class="rtm-box"><div class="rtm-h"><h2>🔄 Sync Status</h2><button class="hm-chip" id="syx">Close</button></div><div id="syb"></div></div>';
 document.body.appendChild(ov);
 const cl=()=>ov.remove();$("#syx").onclick=cl;ov.onclick=e=>{if(e.target===ov)cl()};
 syPanel();if(navigator.onLine)syncNow(); // panel khulte hi server se confirm karwate hain
}
function syWire(){const b=$("#sy");if(!b)return;b.onclick=syOpen;syPaint()}
// Background Sync API (jahan supported): internet aate hi SW app ko jagata hai. Na mile to online / resume / retry kaam karte hain.
let syRegT=0;
// Sirf offline + pending par register (online hone par SW jagata hai). Fail hone par dobara register nahi karte, warna sync-event ka loop ban sakta hai.
function syReg(){try{if(Date.now()-syRegT<3e4)return;syRegT=Date.now();if("serviceWorker"in navigator&&"SyncManager"in window)navigator.serviceWorker.ready.then(r=>r.sync&&r.sync.register("qa-sync")).catch(()=>{})}catch(e){}}
function syOk(){const u=syAcc();if(u)LW("syncst",{u,t:Date.now()});syErr="";syN=0;clearTimeout(syTm)}
function syDone(){
 syPaint();clearTimeout(syTm);
 if(!syAcc())return;
 if(syErr)syTm=setTimeout(syncNow,[5,15,30,60,120,300][Math.min(syN++,5)]*1000);
 else if(syPend()>0&&!navigator.onLine)syReg();
}
const syPend=()=>LS("outbox",[]).length+(dcPend()?1:0);
// Pending Daily Challenge reward bhi sync ke saath (server ek din = ek reward, to dobara bhejna safe hai)
async function syDaily(){
 if(!dcPend())return;
 const c=await dcClaim();if(!c)return;
 if(c.ok){dcPaint();dcDraw()}else if(c.status!==409&&c.status!==400)syErr=authMsg(c)||"Daily Challenge reward not saved";
}
function syResume(){if(!syAcc())return;syPaint();if(!navigator.onLine||syncBusy)return;const i=syInfo();if(i&&(i.pend>0||i.st!=="synced"||Date.now()-i.conf>3e5))syncSoon()}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")syResume()});
addEventListener("pageshow",e=>{if(e.persisted)syResume()});
addEventListener("offline",syPaint);
addEventListener("online",syPaint);
setInterval(syPaint,5000);
async function syBg(){
 let ok=true;
 try{await syncNow();for(let k=0;k<100&&syncBusy;k++)await new Promise(r=>setTimeout(r,300));const i=syInfo();ok=!i||(i.pend===0&&!syErr)}catch(e){ok=false}
 try{const c=navigator.serviceWorker.controller;if(c)c.postMessage({type:"qa-sync-done",ok})}catch(e){}
}
if("serviceWorker"in navigator)navigator.serviceWorker.addEventListener("message",e=>{if(e.data&&e.data.type==="qa-sync")syBg()});
// end() se call hota hai; koi bhi error quiz ko nahi todta
const evAdd=(m,n,r,w,s)=>{try{if(LS("auth_mode","")!=="account")return;const o=LS("outbox",[]);const id=uuid();o.push({id,m,n,r,w,s,t:Date.now()});LW("outbox",o);syncSoon();syPaint();if(!navigator.onLine)syReg();return id}catch(e){}};
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
 syncBusy=true;syErr="";syPaint();const ns=LS("stats_ns","guest");
 try{
  for(let i=0;i<10;i++){
   const sent=LS("outbox",[]).slice(0,20),bl=guestBaseline();
   const r=await authedApi("/sync",{deviceId:devId(),events:sent,baseline:bl||undefined});
   if(!r.ok||LS("stats_ns","guest")!==ns){if(!r.ok)syErr=authMsg(r);break}
   const ids=new Set(sent.map(e=>e.id)),rest=LS("outbox",[]).filter(e=>!ids.has(e.id));
   LW("outbox",rest);coinCredits(r.data);
   if(bl&&typeof r.data.baselineApplied==="boolean"){LW("bl_done",1);LW("bl_go","");if(!r.data.baselineApplied)alert("These guest stats could not be transferred (already transferred from this device).")}
   if(!rest.length){applySnap(r.data);achCatch();prgRefresh();syOk();break}
  }
 if(!syErr)await syDaily();}catch(e){syErr=syErr||"Sync failed"}finally{syncBusy=false;syDone();if(statsWait&&$(".st"))stats(statsTab)}
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
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
 if(navigator.onLine)navigator.serviceWorker.ready.then(x=>x.active&&x.active.postMessage({type:"qa-heal"})).catch(()=>{});
  r.addEventListener("updatefound",()=>{const w=r.installing;
   w.addEventListener("statechange",()=>{if(false){
    const b=document.createElement("button");b.className="inst";b.textContent="🔄 New update available — tap to update";
    b.onclick=()=>location.reload();document.body.appendChild(b)}})})}).catch(()=>{});
}
loadWN().then(t=>{const m=t.match(/^## v([\d.]+)/m);if(m){VER=m[1];const d=(t.match(/^## v.*$/m)||[""])[0].match(/\|\s*(.+?)\s*$/);if(d)LUP=d[1];checkUp2(t);const b=$("#wn");if(b)b.textContent="🆕 What’s New · v"+VER;const v=document.querySelector(".ver");if(v)v.textContent="Version "+VER}}).catch(()=>{});
home();
