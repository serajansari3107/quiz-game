# Quiz Arena

Ek offline-first quiz game (PWA). Topics: **Cricket** aur **WWE**.
Phone/desktop par install ho sakta hai, bina internet ke bhi chalta hai.
Account banao to stats kisi bhi device par sync hoti hain.

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
- **Backend** (API): Node.js + Express. Render par chalta hai. Login, signup aur stats sync yahi sambhalta hai.
- **Database:** Neon PostgreSQL. Users, rounds aur stats yahin save hote hain.
- **Guest mode:** bina login ke khel sakte ho. Stats sirf us device par rehti hain.

---

## Folder structure

```
quiz-game/
├── index.html            App ka main page
├── manifest.json         PWA settings (naam, icon, colors)
├── sw.js                 Service Worker (offline chalne ke liye)
├── whats-new.txt         Update popup mein dikhne wali "What's New" list
├── css/
│   └── style.css         Poora design
├── js/
│   ├── app.js            App ka poora logic (screens, quiz, stats, login, sync)
│   └── questions/
│       ├── cricket-questions.js   Cricket ke sawal
│       └── wwe-questions.js       WWE ke sawal
├── assets/               Icons (192 / 512)
└── backend/              Server (Render par deploy hota hai)
    ├── package.json
    ├── .env.example      Kaun-kaun se settings chahiye (asli values nahi)
    ├── db/schema.sql     Database ke tables
    └── src/
        ├── server.js, app.js, config.js, db.js
        ├── routes/
        │   ├── auth.js   Signup, login, logout, password, recovery code
        │   └── sync.js   Stats sync (rounds, best, history, streak)
        ├── middleware/   auth.js (login check), cors.js
        └── lib/          password.js, tokens.js, rateLimit.js
```

---

## Kaun si file kab badalni hai

| Kaam | File |
|---|---|
| Naye sawal jodna | `js/questions/cricket-questions.js` ya `wwe-questions.js` |
| Design / colors / layout | `css/style.css` |
| Game ya screens ka behaviour | `js/app.js` |
| What's New popup ki lines | `whats-new.txt` |
| Login / password ka logic | `backend/src/routes/auth.js` |
| Stats sync ka logic | `backend/src/routes/sync.js` |
| Database ka structure | `backend/db/schema.sql` |

---

## Features

- Cricket aur WWE quiz (5 / 10 / 20 questions ke modes)
- Score, accuracy, timer, history (last 10), best scores, perfect streak
- Guest mode, Login, Signup, Forgot Password (recovery code se)
- My Account: naam/username, password change, naya recovery code, logout
- Guest stats ko account mein ek baar transfer karna
- Har account ki stats alag, guest ki alag
- Offline chalta hai aur install ho sakta hai (PWA)

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
| `POST /sync` | Rounds bhejna aur stats wapas lena (login chahiye) |
| `GET /health`, `GET /health/db` | Server aur database chal rahe hain ya nahi |

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

---

## Update kaise live karte hain

1. File mein change karo aur save karo.
2. Terminal mein:
```
git add .
git commit -m "kya badla"
git push
```
3. `git status` se check karo ki `.env` file list mein na ho.
4. **Frontend:** push ke baad GitHub Pages khud update ho jata hai.
5. **Backend:** Render redeploy karta hai (Render dashboard mein "Live" dikhna chahiye).

---

## Dhyan rakhne wali baatein

- `.env` file ya asli passwords/secrets kabhi commit mat karo.
- Purani stats (guest ya account) ko delete ya overwrite mat karo.
- Naye sawal jodne se pehle duplicate aur galat answer check karo.
- Render ka free server kuch der baad so jata hai, to pehli request mein thoda wait lag sakta hai.
