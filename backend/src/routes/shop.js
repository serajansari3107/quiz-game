const express = require("express");
const { getPool } = require("../db");
const requireAuth = require("../middleware/auth");
const { SHOP_PRICE, SHOP_ITEMS } = require("../lib/coins");

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function readState(client, uid) {
  const cb = await client.query("SELECT balance FROM user_coins WHERE user_id = $1", [uid]);
  const iq = await client.query("SELECT item, qty FROM user_items WHERE user_id = $1", [uid]);
  const items = { xl: 0, ss: 0 };
  iq.rows.forEach((r) => { if (r.item in items) items[r.item] = r.qty; });
  return { balance: cb.rows[0] ? cb.rows[0].balance : 0, items, price: SHOP_PRICE };
}

// POST /shop/state : abhi ka coins balance + items
async function state(req, res) {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });
  const client = await pool.connect();
  try {
    return res.json(await readState(client, req.userId));
  } finally {
    client.release();
  }
}

// POST /shop/buy { eventId, item } : 1 item = SHOP_PRICE coins. Price server tay karta hai.
// eventId (client uuid) = retry safe: same eventId + item dobara aaye to coins dobara nahi kat'te.
async function buy(req, res) {
  const body = req.body || {};
  const item = String(body.item);
  if (!SHOP_ITEMS.includes(item)) return res.status(400).json({ error: "Invalid item" });
  if (!UUID_RE.test(String(body.eventId))) return res.status(400).json({ error: "Invalid request" });
  const eventId = String(body.eventId).toLowerCase();
  const uid = req.userId;

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Coin row lock: rounds ka sync aur khareed ek saath chalein to balance galat na ho
    await client.query("INSERT INTO user_coins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [uid]);
    const bal = await client.query("SELECT balance FROM user_coins WHERE user_id = $1 FOR UPDATE", [uid]);
    const balance = bal.rows[0] ? bal.rows[0].balance : 0;

    const led = await client.query(
      "INSERT INTO shop_ledger (user_id, event_id, kind, item, qty, cost) VALUES ($1, $2, 'buy', $3, 1, $4) " +
        "ON CONFLICT (event_id, item) DO NOTHING RETURNING id",
      [uid, eventId, item, SHOP_PRICE]
    );
    if (!led.rowCount) {
      // Pehle hi ho chuki khareed ka retry: koi naya charge nahi
      const st = await readState(client, uid);
      await client.query("COMMIT");
      return res.json({ ...st, duplicate: true });
    }
    if (balance < SHOP_PRICE) {
      await client.query("ROLLBACK");
      return res.status(402).json({ error: "Not enough coins", balance, price: SHOP_PRICE });
    }
    await client.query("UPDATE user_coins SET balance = balance - $2, updated_at = now() WHERE user_id = $1", [uid, SHOP_PRICE]);
    await client.query(
      "INSERT INTO user_items (user_id, item, qty) VALUES ($1, $2, 1) " +
        "ON CONFLICT (user_id, item) DO UPDATE SET qty = user_items.qty + 1, updated_at = now()",
      [uid, item]
    );
    const st = await readState(client, uid);
    await client.query("COMMIT");
    return res.json(st);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
router.post("/state", requireAuth, wrap(state));
router.post("/buy", requireAuth, wrap(buy));

module.exports = router;
module.exports.handlers = { state, buy };