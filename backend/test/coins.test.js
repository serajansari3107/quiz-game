const Module = require("module");
const crypto = require("crypto");
const ROOT = process.argv[2] || require("path").join(__dirname, "..", "src");

// ---------- stateful fake Postgres (sirf wahi queries jo sync.js chalata hai) ----------
const S = { rounds: new Map(), ledger: [], coins: new Map(), baselines: new Map(), statsUpserts: 0, clock: Date.parse("2026-10-27T10:00:00Z"), log: [], failUpdate: false, userCreated: 1700000000000 };
let snap = null;
const clone = () => ({ rounds: new Map(S.rounds), ledger: S.ledger.map((x) => ({ ...x })), coins: new Map(S.coins), baselines: new Map(S.baselines), statsUpserts: S.statsUpserts });
const istDay = () => new Date(S.clock + 19800000).toISOString().slice(0, 10);
const client = {
  async query(sql, p = []) {
    S.log.push(sql.replace(/\s+/g, " ").slice(0, 70));
    if (/^BEGIN/.test(sql)) { snap = clone(); return { rows: [] }; }
    if (/^COMMIT/.test(sql)) { snap = null; return { rows: [] }; }
    if (/^ROLLBACK/.test(sql)) { if (snap) Object.assign(S, snap); snap = null; return { rows: [] }; }
    if (/INSERT INTO baselines/.test(sql)) { if (S.baselines.has(p[0])) return { rowCount: 0, rows: [] }; S.baselines.set(p[0], JSON.parse(p[2])); return { rowCount: 1, rows: [{}] }; }
    if (/INSERT INTO user_stats/.test(sql)) { S.statsUpserts++; return { rowCount: 1, rows: [] }; }
    if (/INSERT INTO rounds/.test(sql)) { if (S.rounds.has(p[0])) return { rowCount: 0, rows: [] }; S.rounds.set(p[0], { uid: p[1], mode: p[3], n: p[4], r: p[5], w: p[6], s: p[7], t: p[8] }); return { rowCount: 1, rows: [{}] }; }
    if (/FROM user_stats/.test(sql)) return { rows: [] };
    if (/ORDER BY played_at DESC/.test(sql)) return { rows: [...S.rounds.values()].filter((x) => x.uid === p[0]).slice(-10).reverse().map((x) => ({ mode: x.mode, quiz_n: x.n, right_cnt: x.r, score: x.s, t: x.t })) };
    if (/baseline -> 'hist'/.test(sql)) return { rows: [] };
    if (/\(right_cnt = quiz_n\) AS p/.test(sql)) return { rows: [...S.rounds.values()].filter((x) => x.uid === p[0]).map((x) => ({ mode: x.mode, quiz_n: x.n, p: x.r === x.n })) };
    if (/baseline -> 'pstr'/.test(sql)) return { rows: [...S.baselines.values()].map((b) => ({ ps: b.pstr || null })) };
    if (/FROM users/.test(sql)) return { rows: [{ t: S.userCreated }] };
    if (/event_id::text AS id, delta FROM coin_ledger/.test(sql)) return { rows: S.ledger.filter((x) => x.uid === p[0] && p[1].includes(x.event)).map((x) => ({ id: x.event, delta: x.delta })) };
    if (/INSERT INTO user_coins/.test(sql)) { if (!S.coins.has(p[0])) S.coins.set(p[0], 0); return { rowCount: 1, rows: [] }; }
    if (/FROM user_coins WHERE user_id = \$1 FOR UPDATE/.test(sql)) return { rows: [{ balance: S.coins.get(p[0]) || 0 }] };
    if (/AT TIME ZONE 'Asia\/Kolkata'\)::date::text AS day/.test(sql)) return { rows: [{ day: istDay() }] };
    if (/SUM\(delta\).*earn_day = \$2::date/.test(sql)) return { rows: [{ n: S.ledger.filter((x) => x.uid === p[0] && x.day === p[1]).reduce((a, x) => a + x.delta, 0) }] };
    if (/SUM\(delta\).*earn_day = \(now\(\)/.test(sql)) return { rows: [{ n: S.ledger.filter((x) => x.uid === p[0] && x.day === istDay()).reduce((a, x) => a + x.delta, 0) }] };
    if (/INSERT INTO coin_ledger/.test(sql)) { if (S.ledger.some((x) => x.event === p[1])) return { rowCount: 0, rows: [] }; if (!(p[2] > 0)) throw new Error("CHECK delta>0"); S.ledger.push({ uid: p[0], event: p[1], delta: p[2], reason: p[3], day: p[4] }); return { rowCount: 1, rows: [{ id: S.ledger.length }] }; }
    if (/UPDATE user_coins/.test(sql)) { if (S.failUpdate) throw new Error("boom"); const nb = (S.coins.get(p[0]) || 0) + p[1]; if (nb < 0) throw new Error("CHECK balance>=0"); S.coins.set(p[0], nb); return { rowCount: 1, rows: [] }; }
    if (/FROM user_coins WHERE user_id = \$1$/.test(sql)) return S.coins.has(p[0]) ? { rows: [{ balance: S.coins.get(p[0]) }] } : { rows: [] };
    throw new Error("UNHANDLED SQL: " + sql.slice(0, 90));
  },
  release() {},
};
const orig = Module._load;
Module._load = function (req, parent, ...r) {
  if (req === "express") return { Router: () => ({ post() {} }) };
  if (req === "../db") return { getPool: () => ({ connect: async () => client }) };
  if (req === "../middleware/auth") return (a, b, c) => c();
  return orig.call(this, req, parent, ...r);
};
const { handlers } = require(ROOT + "/routes/sync.js");
const call = (uid, body) => new Promise(async (ok, bad) => {
  const res = { status(c) { this.c = c; return this; }, json(o) { ok({ c: this.c || 200, o }); } };
  try { await handlers.sync({ userId: uid, body: Object.assign({ deviceId: "dev12345678", events: [] }, body) }, res); } catch (e) { ok({ c: 500, err: e.message }); }
});
const EV = (n, r, mode = "cricket", id = crypto.randomUUID()) => ({ id, m: mode, n, r, w: Math.min(n - r, n), s: r * 2, t: S.clock });
let fails = 0;
const eq = (name, got, exp) => { const ok = JSON.stringify(got) === JSON.stringify(exp); if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, ok ? "" : "got " + JSON.stringify(got) + " exp " + JSON.stringify(exp)); };
const reset = () => { S.rounds.clear(); S.ledger = []; S.coins.clear(); S.baselines.clear(); S.statsUpserts = 0; S.clock = Date.parse("2026-10-27T10:00:00Z"); S.log = []; S.failUpdate = false; };
const U1 = "11111111-1111-1111-1111-111111111111", U2 = "22222222-2222-2222-2222-222222222222";

(async () => {
  // 1. formula
  reset(); let x = await call(U1, { events: [EV(10, 7)] });
  eq("1 10Q, 7 sahi -> 7 coins", [x.o.coins.balance, x.o.coins.today, x.o.coins.cap], [7, 7, 500]);
  reset(); x = await call(U1, { events: [EV(5, 5)] });
  eq("2 5Q perfect -> 5 + 5 bonus = 10", x.o.coins.balance, 10);
  reset(); x = await call(U1, { events: [EV(10, 10)] });
  eq("3 10Q perfect -> 10 + 10 = 20", x.o.coins.balance, 20);
  reset(); x = await call(U1, { events: [EV(20, 20)] });
  eq("4 20Q perfect -> 20 + 20 = 40", x.o.coins.balance, 40);
  reset(); x = await call(U1, { events: [EV(20, 19)] });
  eq("5 19/20 (perfect nahi) -> 19, bonus nahi", x.o.coins.balance, 19);
  reset(); x = await call(U1, { events: [EV(10, 0)] });
  eq("6 0 sahi -> 0 coin, ledger row nahi", [x.o.coins.balance, S.ledger.length, S.coins.size], [0, 0, 0]);
  // 2. duplicate
  reset(); const e1 = EV(10, 6);
  await call(U1, { events: [e1] }); x = await call(U1, { events: [e1] });
  eq("7 same event dobara (alag request) -> double coin nahi", [x.o.coins.balance, S.ledger.length, S.statsUpserts], [6, 1, 1]);
  reset(); x = await call(U1, { events: [e1, e1, e1] });
  eq("8 same event 3 baar ek request mein -> ek hi baar", [x.o.coins.balance, S.ledger.length], [6, 1]);
  reset(); await call(U1, { events: [e1] }); const lastBal = S.coins.get(U1);
  for (let i = 0; i < 5; i++) await call(U1, { events: [e1] });
  eq("9 5 retry -> balance wahi", S.coins.get(U1), lastBal);
  // 3. daily cap
  reset(); for (let i = 0; i < 12; i++) await call(U1, { events: [EV(20, 20)] });
  eq("10 12 perfect 20Q = 480 coins", S.coins.get(U1), 480);
  x = await call(U1, { events: [EV(20, 20)] });
  eq("11 13th round: sirf bacha hua 20 (480 -> 500)", [x.o.coins.balance, x.o.coins.today], [500, 500]);
  x = await call(U1, { events: [EV(20, 20)] });
  eq("12 cap ke baad 0 coin, par round/stats save", [x.o.coins.balance, S.rounds.size, S.statsUpserts], [500, 14, 14]);
  reset(); x = await call(U1, { events: Array.from({ length: 20 }, () => EV(20, 20)) });
  eq("13 ek hi request mein 20 perfect rounds -> cap 500 par ruk", [x.o.coins.balance, x.o.coins.today, S.rounds.size], [500, 500, 20]);
  eq("14 ledger ka total balance ke barabar", S.ledger.reduce((a, r) => a + r.delta, 0), 500);
  // 4. IST din reset
  reset(); S.clock = Date.parse("2026-10-27T18:29:00Z"); // 11:59 PM IST (27 Oct)
  for (let i = 0; i < 13; i++) await call(U1, { events: [EV(20, 20)] });
  eq("15 23:59 IST par cap 500 laga", S.coins.get(U1), 500);
  S.clock = Date.parse("2026-10-27T18:31:00Z"); // 12:01 AM IST (28 Oct)
  x = await call(U1, { events: [EV(10, 10)] });
  eq("16 12:01 AM IST: naya din, cap reset -> 20 mile; today=20", [x.o.coins.balance, x.o.coins.today], [520, 20]);
  eq("17 ledger din alag (IST)", [...new Set(S.ledger.map((r) => r.day))], ["2026-10-27", "2026-10-28"]);
  reset(); S.clock = Date.parse("2026-10-27T18:29:00Z"); await call(U1, { events: [EV(10, 10)] });
  S.clock = Date.parse("2026-10-27T18:29:30Z"); x = await call(U1, {});
  eq("18 11:59 IST snapshot: today=20 (UTC din nahi, IST din)", x.o.coins.today, 20);
  S.clock = Date.parse("2026-10-27T18:30:30Z"); x = await call(U1, {});
  eq("19 12:00 AM IST ke baad snapshot: today=0, balance 20 wahi", [x.o.coins.today, x.o.coins.balance], [0, 20]);
  // 5. alag accounts
  reset(); await call(U1, { events: [EV(10, 10)] }); x = await call(U2, { events: [EV(5, 5)] });
  eq("20 do accounts ka balance alag", [S.coins.get(U1), S.coins.get(U2), x.o.coins.balance], [20, 10, 10]);
  reset(); for (let i = 0; i < 13; i++) await call(U1, { events: [EV(20, 20)] }); x = await call(U2, { events: [EV(10, 10)] });
  eq("21 ek account ka cap doosre par asar nahi", x.o.coins.balance, 20);
  // 6. guest / baseline / koi event nahi
  reset(); x = await call(U1, { baseline: { sum: { cricket_5: { r: 5, q: 25, c: 20, w: 5, p: 80, f: 2 } }, best: { cricket_5: 18 }, hist: [], pstr: { cricket_5: 2 } } });
  eq("22 guest baseline transfer -> koi coin nahi", [x.o.coins, x.o.baselineApplied, S.ledger.length], [{ balance: 0, today: 0, cap: 500, credits: {} }, true, 0]);
  reset(); x = await call(U1, {});
  eq("23 kuch na bheje (sirf snapshot) -> coins 0, lock/ledger nahi", [x.o.coins.balance, S.log.some((q) => /FOR UPDATE/.test(q))], [0, false]);
  // 7. atomic transaction
  reset(); S.failUpdate = true; x = await call(U1, { events: [EV(10, 10)] });
  eq("24 coin UPDATE fail -> pura sync fail (500)", x.c, 500);
  eq("25 rollback: round/ledger/stats/balance kuch save nahi", [S.rounds.size, S.ledger.length, S.coins.size, S.statsUpserts], [0, 0, 0, 0]);
  S.failUpdate = false; const same = EV(10, 10); x = await call(U1, { events: [same] });
  eq("26 retry ke baad (same event) ek baar credit", [x.c, x.o.coins.balance, S.ledger.length], [200, 20, 1]);
  // 8. lock order
  reset(); await call(U1, { events: [EV(10, 5), EV(10, 6)] });
  const iLock = S.log.findIndex((q) => /FOR UPDATE/.test(q)), iSum = S.log.findIndex((q) => /SUM\(delta\)/.test(q)), iLed = S.log.findIndex((q) => /INSERT INTO coin_ledger/.test(q));
  eq("27 pehle row lock, phir daily total, phir ledger insert", iLock > -1 && iLock < iSum && iSum < iLed, true);
  eq("28 lock/day/sum request mein ek hi baar (2 events)", [S.log.filter((q) => /FOR UPDATE/.test(q)).length, S.log.filter((q) => /AT TIME ZONE 'Asia\/Kolkata'\)::date::text/.test(q)).length], [1, 1]);
  // 9. purane features
  reset(); x = await call(U1, { events: [EV(5, 5), EV(5, 2)] });
  eq("29 response mein purane fields + coins", Object.keys(x.o).sort(), ["coins", "hist", "since", "stats", "streak"]);
  eq("29b coins mein balance/today/cap/credits", Object.keys(x.o.coins).sort(), ["balance", "cap", "credits", "today"]);
  eq("30 streak abhi bhi sahi (P X -> c0,b1)", x.o.streak.cricket_5, { c: 0, b: 1 });
  eq("31 since abhi bhi aata hai", x.o.since, S.userCreated);
  eq("32 stats upsert har naye round par 1 baar", S.statsUpserts, 2);
  x = await call(U1, { deviceId: "bad" });
  eq("33 galat deviceId -> 400 pehle jaisa", x.c, 400);
  reset(); x = await call(U1, { events: [{ id: "not-uuid", m: "cricket", n: 10, r: 5, w: 5, s: 10, t: 1 }, { ...EV(10, 11) }, { ...EV(7, 3) }] });
  eq("34 galat events skip (coin nahi), request fail nahi", [x.c, x.o.coins.balance, S.ledger.length], [200, 0, 0]);
  // 10. exact credits (result screen ke liye)
  reset(); const c1 = EV(10, 7), c2 = EV(5, 5), c3 = EV(10, 0);
  x = await call(U1, { events: [c1, c2, c3] });
  eq("35 credits: 7, 10 (perfect 5Q), 0 (zero sahi)", [x.o.coins.credits[c1.id], x.o.coins.credits[c2.id], x.o.coins.credits[c3.id]], [7, 10, 0]);
  eq("36 balance = credits ka total", x.o.coins.balance, 17);
  x = await call(U1, { events: [c1] });
  eq("37 same event retry -> wahi credit 7 (double nahi), balance wahi", [x.o.coins.credits[c1.id], x.o.coins.balance], [7, 17]);
  x = await call(U1, {});
  eq("38 koi event nahi -> credits {}", x.o.coins.credits, {});
  reset(); for (let i = 0; i < 12; i++) await call(U1, { events: [EV(20, 20)] });
  const cp = EV(20, 20), cz = EV(20, 20);
  x = await call(U1, { events: [cp, cz] });
  eq("39 cap par partial 20, phir 0", [x.o.coins.credits[cp.id], x.o.coins.credits[cz.id], x.o.coins.balance], [20, 0, 500]);
  x = await call(U1, { events: [cz] });
  eq("40 cap wala 0-credit retry -> 0 hi, balance 500", [x.o.coins.credits[cz.id], x.o.coins.balance], [0, 500]);
  reset(); const own = EV(10, 8); await call(U1, { events: [own] });
  x = await call(U2, { events: [{ ...own }] });
  eq("41 dusre user ka event_id: us user ko credit/coin nahi", [x.o.coins.credits[own.id], x.o.coins.balance], [0, 0]);
  reset(); const lst = Array.from({ length: 20 }, () => EV(5, 5));
  x = await call(U1, { events: lst });
  eq("42 20 events ek request mein: sabka credit, total cap 500 ke andar", [Object.keys(x.o.coins.credits).length, Object.values(x.o.coins.credits).reduce((a, b) => a + b, 0) === x.o.coins.balance, x.o.coins.balance], [20, true, 200]);
  console.log(fails ? "FAILED " + fails : "ALL PASS");
  process.exit(fails ? 1 : 0);
})();
