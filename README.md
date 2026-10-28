# Quiz Arena

Ek offline-first quiz game (PWA). Topics: **Cricket**, **WWE** aur **Grammar** (Hinglish sawal, English options).
Phone/desktop par install ho sakta hai, bina internet ke bhi chalta hai.
Account banao to stats aur coins kisi bhi device par sync hote hain.

- **Live app:** https://serajansari3107.github.io/quiz-game/
- **Backend (API):** https://quiz-arena-api-goc7.onrender.com

---

## Ye project kaise kaam karta hai (simple)

```
Phone / Browser  ->  GitHub Pages (frontend, static files)
        |
        +-- internet ho to -->  Render (Node.js API)  -->  Neon (PostgreSQL database)
```

- **Frontend** (app): sirf HTML/CSS/JS. GitHub Pages par free host hota hai.
- **Backend** (API): Node.js + Express. Render par chalta hai. Login, signup, stats sync aur coins yahi sambhalta hai.
- **Database:** Neon PostgreSQL. Users, rounds, stats aur coins yahin save hote hain.
- **Guest mode:** bina login ke khel sakte ho. Stats sirf us device par rehti hain. Guest ko **coins nahi** milte.

---

## Folder structure

```
quiz-game/
├── index.html            App ka main page (aur startup splash)
├── manifest.json         PWA settings (naam "Quiz Arena", icons, colors)
├── sw.js                 Service Worker (offline chalne ke liye)
├── whats-new.txt         "What's New" list + app version (About mein bhi dikhta hai)
├── css/
│   ├── style.css         Dark theme ka poora design (default)
│   └── light.css         Light theme (Soft Lavender), sirf tab lagti hai jab theme Light ho
├── js/
│   ├── app.js            App ka poora logic (screens, quiz, stats, login, sync, coins, theme)
│   └── questions/
│       ├── cricket-questions.js   Cricket ke sawal
│       ├── wwe-questions.js       WWE ke sawal
│       └── grammar-questions.js   Grammar ke sawal
├── assets/               PWA icons: qa-icon-192/512, qa-icon-maskable-512, qa-apple-180
└── backend/              Server (Render par deploy hota hai)
    ├── package.json
    ├── .env.example      Kaun-kaun se settings chahiye (asli values nahi)
    ├── db/schema.sql     Database ke tables
    ├── test/
    │   └── coins.test.js Coins ke tests (mock database, asli DB nahi chahiye)
    └── src/
        ├── server.js, app.js, config.js, db.js
        ├── routes/
        │   ├── auth.js   Signup, login, logout, password, recovery code
        │   ├── sync.js   Stats + coins sync (rounds, best, history, streak, coins)
        │   └── daily.js  Daily Challenge status + reward claim
        ├── middleware/   auth.js (login check), cors.js
        └── lib/          password.js, tokens.js, rateLimit.js, coins.js (coin rules), daily.js (Daily Challenge rules)
```

---

## Kaun si file kab badalni hai

| Kaam | File |
|---|---|
| Naye sawal jodna | `js/questions/cricket-questions.js`, `wwe-questions.js` ya `grammar-questions.js` |
| Dark design / colors / layout | `css/style.css` |
| Light theme ke colors | `css/light.css` |
| Game ya screens ka behaviour | `js/app.js` |
| About screen ka text | `js/app.js` (function `aboutScr`) |
| What's New popup + version + "Last Updated" date | `whats-new.txt` |
| App ka naam / icon | `manifest.json` aur `assets/` |
| Login / password ka logic | `backend/src/routes/auth.js` |
| Stats / coins sync ka logic | `backend/src/routes/sync.js` |
| Coins ke rules (kitne coins, daily cap) | `backend/src/lib/coins.js` |
| Daily Challenge ke rules / logic (reward, claim) | `backend/src/lib/daily.js`, `backend/src/routes/daily.js` |
| Database ka structure | `backend/db/schema.sql` (aur Neon mein SQL chalani padti hai) |

---

## Features

- Cricket, WWE aur Grammar quiz (5 / 10 / 20 questions ke modes)
- Score, accuracy, timer, 3 lives, lifelines (Swap, 50-50, Skip), history (last 10), best scores, perfect streak
- **Home screen:** top bar mein logo + coin balance + Menu, "Ready to Prove Yourself?" hero, 2-column category cards
- **Menu:** Stats, Settings, My Account, What's New, About, Switch Theme
- **Themes:** Dark (default) aur Light (Soft Lavender). Choice device par save hoti hai
- **Coins:** account walon ko milte hain (neeche detail)
- **Daily Challenge:** roz 10 mixed sawal, IST raat 12:00 baje naya. Account ko din mein ek baar reward (neeche detail)
- **Points & Ranks:** 6 ranks, teeno conditions zaroori (accuracy + rounds + points). Result screen par 3 progress meters (neeche detail)
- Guest mode, Login, Signup, Forgot Password (recovery code se)
- My Account: naam/username, password change, naya recovery code, logout
- Guest stats ko account mein ek baar transfer karna
- Har account ki stats alag, guest ki alag
- Offline chalta hai aur install ho sakta hai (PWA)
- **About** screen: app ki poori jankari + har category ke sawalon ki ginti (apne aap update hoti hai)

---

## Coins

- Har sahi jawab = **1 coin**. Perfect round (saare sawal sahi) par bonus: 5Q = **5**, 10Q = **10**, 20Q = **20**.
- **Daily cap 500 coins** per account. Din **IST raat 12:00 baje** badalta hai. Cap ke paas round bada ho to sirf bacha hua hissa milta hai.
- Sirf logged-in account. Guest ko nahi (result screen par sirf hint "Login to earn coins").
- **Server hi balance rakhta hai** (`user_coins` + `coin_ledger` tables). Client kabhi coins ya balance nahi bhejta, sirf round ka event.
- Round, stats aur coins **ek hi transaction** mein save hote hain. Duplicate round sync karne par double coins nahi milte (`rounds.event_id` aur `coin_ledger.event_id` UNIQUE).
- `/sync` ke jawab mein `coins: { balance, today, cap, credits }` aata hai. `credits` mein har round ka exact credit hota hai.
- **Offline:** result par turant estimate (`+N`) dikhta hai aur coins udte hain. Round outbox mein save rehta hai, Home pill par chhota dot dikhta hai. Net aate hi auto-sync hota hai aur server ka balance final hota hai. Cap ki wajah se farak aaye to card par "Adjusted" likha aata hai.
- Local `coins` aur `cpend` keys sirf dikhane ke liye hain. Inhe edit karne se server ka balance nahi badalta.

---

## Points aur Ranks

- **Points** = round ke marks (`sum[...].p` / server `user_stats.points`). Formula purana hi hai. Daily Challenge aur coins points mein nahi judte.
- Rank table (`RATINGS` in `js/app.js`): Rookie 0% / 10 rounds / 100 pts, Challenger 40% / 20 / 300, Advanced 60% / 30 / 600, Expert 75% / 50 / 1,200, Master 85% / 100 / 2,500, Quiz Legend 95% / 200 / 5,000. **Teeno conditions zaroori**, sirf points se rank unlock nahi hota.
- Accuracy = sahi / (sahi + galat) (purani definition), rounds = khele hue rounds. Stats Summary ki rating bhi isi table se aati hai (filters follow karti hai).
- Result screen par 3 meters: **Points Progress** (all-time points / agla points milestone), **All-Time Rank** (saari categories), **Quiz Rank** (sirf usi category ke teeno sizes ka total). Bar = points, rounds aur accuracy ki progress ka average, 100% sirf jab teeno poore.
- Koi naya data store ya backend change nahi. Account mein sync ke baad server ke totals aate hi meters refresh ho jate hain.

---

## Daily Challenge

- Home par premium purple card. Roz **10 sawal** (saari categories mix: 3 Easy + 4 Medium + 3 Hard = 50 marks), 20 sec timer, lifelines (Swap / 50-50 / Skip). **Lives nahi**, saare 10 sawal khelte hain.
- Sawal **din (IST) se tay** hote hain, har device par same. Pool fixed order mein shuffle hota hai aur roz agla hissa liya jata hai (abhi Easy ~50, Medium ~53, Hard ~61 din tak repeat nahi; sawal badhne par aur zyada).
- Reward (sirf account): **+10** complete karne par, **+10 bonus** 10/10 par = max **20 coins/din**. Ye coins **extra** hain, 500 daily cap mein nahi gine jaate.
- **Ek account + ek IST din = ek reward**: `daily_challenge_runs` ka `PRIMARY KEY (user_id, day)`. Din aur status server (DB clock, Asia/Kolkata) se aate hain, device clock kuch decide nahi karta. Claim par user ki `user_coins` row lock hoti hai, to do devices ek saath claim karein tab bhi ek hi reward.
- Client sirf `r` (sahi) aur `w` (galat) bhejta hai, coins server nikalta hai. Limit: sawal client mein hain, isliye server jawab verify nahi kar sakta (purane coin rounds jaisa hi trust). Worst case 20 coins/din.
- Daily Challenge Stats / History / Best mein nahi judta.
- **Guest:** sirf device par khel sakta hai (local key `dcg`), coin nahi, sync nahi.
- **Offline / API fail:** account ko start karne ke liye net chahiye. Reward save na ho to result device par (`dcpend`) rehta hai, result par "Not saved" + "Try again", Home card par "Claim". Fake coins kabhi nahi dikhte. Din badal gaya ho to server 409 deta hai ("Not counted").
- Local keys `dcs`, `dcpend`, `dcg` sirf dikhane / retry ke liye hain. Inhe edit karne se coins nahi milte.

---

## Backend ke API endpoints

| Endpoint | Kaam |
|---|---|
| `POST /auth/signup` | Naya account |
| `POST /auth/login` | Login |
| `POST /auth/refresh` | Session naya karna |
| `POST /auth/logout` | Logout |
| `POST /auth/recover` | Recovery code se password reset |
| `POST /auth/change-password` | Password badalna (login chahiye) |
| `POST /auth/recovery/regenerate` | Naya recovery code (login chahiye) |
| `POST /sync` | Rounds bhejna aur stats, streak, since, coins wapas lena (login chahiye) |
| `POST /daily/status` | Aaj ka Daily Challenge status + reward rules (login chahiye) |
| `POST /daily/claim` | Challenge ka result bhejna; ek din mein ek hi reward (login chahiye) |
| `GET /health`, `GET /health/db` | Server aur database chal rahe hain ya nahi |

---

## Database tables (Neon)

`users`, `refresh_tokens`, `recovery_codes`, `rounds`, `baselines`, `user_stats`, `login_attempts`, `user_coins`, `coin_ledger`, `daily_challenge_runs`.
Naya table ya column ho to pehle `backend/db/schema.sql` mein jodo, aur wahi SQL Neon ke SQL Editor mein chalao. Kabhi purana data delete ya reset mat karo.

---

## Backend settings (Render ke Environment Variables)

`.env.example` dekho. Asli values **kabhi GitHub par mat daalo.**

| Naam | Matlab |
|---|---|
| `DATABASE_URL` | Neon database ka connection string |
| `JWT_SECRET` | Random secret, kam se kam 32 characters |
| `ALLOWED_ORIGINS` | Kaun si site API use kar sakti hai (frontend ka link) |
| `NODE_ENV` | `production` (live par) |

---

## Apne computer par chalana

**Frontend:** VS Code mein "Live Server" se `index.html` kholo, ya folder mein ye chalao:
```
python -m http.server 8000
```
Phir browser mein `http://localhost:8000` kholo.

**Backend** (zarurat ho tabhi, Node 18+ chahiye):
```
cd backend
npm install
```
`backend/.env` file banao (`.env.example` copy karke, values bharo), phir:
```
npm start
```

**Tests** (backend folder mein, database ki zarurat nahi):
```
node test/coins.test.js
```
Aakhir mein `ALL PASS` aana chahiye.

---

## Update kaise live karte hain

1. File mein change karo aur save karo.
2. **Agar database ka koi change hai**, pehle Neon mein SQL chalao (code se pehle).
3. **Backend ka change hai**, to pehle backend push karke Render par deploy "Live" hone do, phir frontend.
4. Terminal mein:
```
git add .
git commit -m "kya badla"
git push
```
5. `git status` se check karo ki `.env` file list mein na ho.
6. **Frontend:** push ke baad GitHub Pages khud update ho jata hai.
7. **Backend:** Render redeploy karta hai (Render dashboard mein "Live" dikhna chahiye).
8. Har release mein `whats-new.txt` mein nayi lines jodo (nahi to update popup aur `?v=` stamp nahi badlenge). Sabse upar wala header `## v1.9 | 24 Oct 2026` (version, `|`, date) is format mein rakho, kyunki About ki "Last Updated" tarikh wahin se aati hai.

---

## Dhyan rakhne wali baatein

- `.env` file ya asli passwords/secrets kabhi commit mat karo.
- Purani stats (guest ya account) ko delete ya overwrite mat karo.
- `sw.js` mein `CACHE` ka naam (`quiz-v1.3`) mat badlo. App ka "Update now" isi par chalta hai.
- **Update flow (important):** "Update now" (`applyUpd` in `js/app.js`) sirf us cache mein likhta hai jisme is app ka `index.html` hai, sab files pehle fetch karta hai (ek bhi fail ho to kuch nahi likhta, button "Try again" ho jata hai), likhne ke baad check karta hai ki naya `whats-new.txt` sach mein cache mein aa gaya, tabhi reload karta hai.
- `sw.js` page kholte waqt `index.html` ke `js/` aur `css/` links par `?v=<stamp>` jodta hai. Stamp `whats-new.txt` se banta hai. Isse reload par Chrome purani script apni memory cache se nahi uthata. **Isliye har release mein `whats-new.txt` zaroor badlo** (popup bhi usi se aata hai).
- Agar phone par update atak jaye to app ko poori tarah band karke (recent apps se hata kar) 10-15 second baad dobara kholo.
- Naye sawal jodne se pehle duplicate aur galat answer check karo.
- Render ka free server kuch der baad so sakta hai, to pehli request mein thoda wait lag sakta hai.
- **Rule:** har change ke saath **About** (`aboutScr` in `js/app.js`) aur **README.md** bhi update karo, phir git commands chalao.
