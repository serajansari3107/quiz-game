const express = require("express");
const { getPool } = require("../db");
const requireAuth = require("../middleware/auth");
const { QUESTIONS, BASE, PERFECT, dailyCoins } = require("../lib/daily");

const router = express.Router();

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

// Aaj ka IST din + agle 12:00 AM IST tak kitne second (dono DB ki clock se; device ki clock ka koi role nahi)
const NOW_SQL =
  "SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date::text AS day, " +
  "GREATEST(1, CEIL(EXTRACT(EPOCH FROM ((date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') + interval '1 day') " +
  "- (now() AT TIME ZONE 'Asia/Kolkata')))))::int AS secs";

// Aaj ki status + balance (status aur claim dono ka same shape)
async function view(db, uid, t, extra) {
  const q = await db.query(
    "SELECT right_cnt, wrong_cnt, coins FROM daily_challenge_runs WHERE user_id = $1 AND day = $2::date",
    [uid, t.day]
  );
  const b = await db.query("SELECT balance FROM user_coins WHERE user_id = $1", [uid]);
  const row = q.rows[0];
  return Object.assign(
    {
      day: t.day,
      done: !!row,
      r: row ? row.right_cnt : 0,
      w: row ? row.wrong_cnt : 0,
      coins: row ? row.coins : 0,
      base: BASE,
      perf: PERFECT,
      secs: t.secs,
      balance: b.rows[0] ? b.rows[0].balance : 0,
    },
    extra || {}
  );
}

// POST /daily/status : aaj ka din, complete hua ya nahi, reward rules (sirf padhta hai)
async function status(req, res) {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });
  const t = (await pool.query(NOW_SQL)).rows[0];
  return res.json(await view(pool, req.userId, t));
}

// POST /daily/claim : result bhejna. Ek account + ek IST din = ek hi reward (PRIMARY KEY (user_id, day)).
async function claim(req, res) {
  const b = req.body || {};
  if (!DAY_RE.test(String(b.day)) || !isInt(b.r, 0, QUESTIONS) || !isInt(b.w, 0, QUESTIONS) || b.r + b.w > QUESTIONS)
    return res.status(400).json({ error: "Invalid request" });
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });
  const uid = req.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Is user ki coin row lock: do devices ek saath claim karein to ek-ek karke chalte hain
    await client.query("INSERT INTO user_coins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [uid]);
    await client.query("SELECT balance FROM user_coins WHERE user_id = $1 FOR UPDATE", [uid]);
    const t = (await client.query(NOW_SQL)).rows[0];
    if (b.day !== t.day) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This challenge has expired. A new one is available.", day: t.day });
    }
    const c = dailyCoins(b.r);
    const ins = await client.query(
      "INSERT INTO daily_challenge_runs (user_id, day, right_cnt, wrong_cnt, coins) VALUES ($1, $2::date, $3, $4, $5) " +
        "ON CONFLICT (user_id, day) DO NOTHING RETURNING day",
      [uid, t.day, b.r, b.w, c.total]
    );
    if (ins.rowCount)
      await client.query("UPDATE user_coins SET balance = balance + $2, updated_at = now() WHERE user_id = $1", [uid, c.total]);
    const out = await view(client, uid, t, { awarded: ins.rowCount ? c.total : 0, already: !ins.rowCount });
    await client.query("COMMIT");
    return res.json(out);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
router.post("/status", requireAuth, wrap(status));
router.post("/claim", requireAuth, wrap(claim));

module.exports = router;
module.exports.handlers = { status, claim };