const express = require("express");
const { getPool } = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MODE_RE = /^[a-z0-9_]{1,30}$/;
const MAXSCORE = { 5: 20, 10: 50, 20: 100 }; // app ke MODES[n].max jaisa

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const isHalf = (v, max) =>
  typeof v === "number" && isFinite(v) && v >= 0 && v <= max && Math.round(v * 2) === v * 2;

// Ek round event; galat ho to null (skip hota hai, request fail nahi hoti)
function cleanEvent(e) {
  if (!e || typeof e !== "object" || typeof e.n !== "number" || !MAXSCORE[e.n]) return null;
  if (!UUID_RE.test(String(e.id)) || !MODE_RE.test(String(e.m))) return null;
  if (!isInt(e.r, 0, e.n) || !isInt(e.w, 0, e.n) || e.r + e.w > e.n || !isHalf(e.s, MAXSCORE[e.n])) return null;
  const now = Date.now();
  let t = Number(e.t);
  if (!isFinite(t) || t > now || t < now - 4e10) t = now;
  return { id: e.id.toLowerCase(), m: e.m, n: e.n, r: e.r, w: e.w, s: e.s, t };
}

// Guest baseline: poora valid ho tabhi lete hain, warna null (ignore)
function cleanBaseline(b) {
  if (!b || typeof b !== "object") return null;
  const S = b.sum && typeof b.sum === "object" ? b.sum : {};
  const B = b.best && typeof b.best === "object" ? b.best : {};
  const keys = new Set(Object.keys(S).concat(Object.keys(B)));
  if (keys.size > 30) return null;
  const rows = [];
  for (const k of keys) {
    const m = /^([a-z0-9_]{1,30})_(5|10|20)$/.exec(k);
    if (!m) return null;
    const n = Number(m[2]);
    const a = S[k] || {};
    const best = B[k] === undefined ? 0 : B[k];
    const row = { mode: m[1], n, r: a.r || 0, q: a.q || 0, c: a.c || 0, w: a.w || 0, p: a.p || 0, f: a.f || 0, b: best };
    if (![row.r, row.q, row.c, row.w, row.f].every((v) => isInt(v, 0, 1e6))) return null;
    if (!isHalf(row.p, 1e8) || !isHalf(row.b, MAXSCORE[n])) return null;
    rows.push(row);
  }
  const hist = (Array.isArray(b.hist) ? b.hist : [])
    .slice(0, 10)
    .filter((x) => x && typeof x === "object" && MODE_RE.test(String(x.m)) && MAXSCORE[x.n] && isHalf(x.s, MAXSCORE[x.n]) && isInt(x.r, 0, x.n))
    .map((x) => ({ m: x.m, s: x.s, r: x.r, n: x.n, d: String(x.d || "").slice(0, 12) }));
  return { rows, hist };
}

const UPSERT_STATS =
  "INSERT INTO user_stats (user_id, mode, quiz_n, rounds, questions, correct, wrong, points, perfect, best_score) " +
  "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) " +
  "ON CONFLICT (user_id, mode, quiz_n) DO UPDATE SET " +
  "rounds = user_stats.rounds + EXCLUDED.rounds, questions = user_stats.questions + EXCLUDED.questions, " +
  "correct = user_stats.correct + EXCLUDED.correct, wrong = user_stats.wrong + EXCLUDED.wrong, " +
  "points = user_stats.points + EXCLUDED.points, perfect = user_stats.perfect + EXCLUDED.perfect, " +
  "best_score = GREATEST(user_stats.best_score, EXCLUDED.best_score), updated_at = now()";

// POST /sync : events push (idempotent) + optional guest baseline (device par ek baar) + snapshot return
async function sync(req, res) {
  const body = req.body || {};
  if (!DEVICE_RE.test(String(body.deviceId))) return res.status(400).json({ error: "Invalid device" });
  const uid = req.userId;
  const events = (Array.isArray(body.events) ? body.events.slice(0, 20) : []).map(cleanEvent).filter(Boolean);
  const hasBaseline = body.baseline !== undefined && body.baseline !== null;
  const baseline = hasBaseline ? cleanBaseline(body.baseline) : null;

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let baselineApplied;
    if (hasBaseline) {
      baselineApplied = false;
      if (baseline) {
        const ins = await client.query(
          "INSERT INTO baselines (device_id, user_id, baseline) VALUES ($1, $2, $3) " +
            "ON CONFLICT (device_id) DO NOTHING RETURNING device_id",
          [body.deviceId, uid, JSON.stringify({ rows: baseline.rows, hist: baseline.hist })]
        );
        if (ins.rowCount) {
          for (const x of baseline.rows)
            await client.query(UPSERT_STATS, [uid, x.mode, x.n, x.r, x.q, x.c, x.w, x.p, x.f, x.b]);
          baselineApplied = true;
        }
      }
    }

    for (const e of events) {
      const ins = await client.query(
        "INSERT INTO rounds (event_id, user_id, device_id, mode, quiz_n, right_cnt, wrong_cnt, score, played_at) " +
          "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_timestamp($9 / 1000.0)) " +
          "ON CONFLICT (event_id) DO NOTHING RETURNING event_id",
        [e.id, uid, body.deviceId, e.m, e.n, e.r, e.w, e.s, e.t]
      );
      if (ins.rowCount)
        await client.query(UPSERT_STATS, [uid, e.m, e.n, 1, e.r + e.w, e.r, e.w, e.s, e.r === e.n ? 1 : 0, e.s]);
    }

    const st = await client.query(
      "SELECT mode, quiz_n, rounds, questions, correct, wrong, points::float8 AS points, perfect, " +
        "best_score::float8 AS best FROM user_stats WHERE user_id = $1",
      [uid]
    );
    const stats = {};
    st.rows.forEach((x) => {
      stats[x.mode + "_" + x.quiz_n] = { r: x.rounds, q: x.questions, c: x.correct, w: x.wrong, p: x.points, f: x.perfect, b: x.best };
    });

    const rd = await client.query(
      "SELECT mode, quiz_n, right_cnt, score::float8 AS score, (extract(epoch from played_at) * 1000)::float8 AS t " +
        "FROM rounds WHERE user_id = $1 ORDER BY played_at DESC, seq DESC LIMIT 10",
      [uid]
    );
    let hist = rd.rows.map((x) => ({ m: x.mode, s: x.score, r: x.right_cnt, n: x.quiz_n, t: Math.round(x.t) }));
    if (hist.length < 10) {
      const bl = await client.query(
        "SELECT baseline -> 'hist' AS h FROM baselines WHERE user_id = $1 ORDER BY transferred_at ASC",
        [uid]
      );
      bl.rows.forEach((b) => {
        if (Array.isArray(b.h)) hist = hist.concat(b.h);
      });
      hist = hist.slice(0, 10);
    }

    await client.query("COMMIT");
    const out = { stats, hist };
    if (baselineApplied !== undefined) out.baselineApplied = baselineApplied;
    return res.json(out);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
router.post("/", requireAuth, wrap(sync));

module.exports = router;
module.exports.handlers = { sync };