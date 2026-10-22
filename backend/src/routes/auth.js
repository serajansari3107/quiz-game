const crypto = require("crypto");
const express = require("express");
const { getPool } = require("../db");
const { hashPassword, verifyPassword, dummyHash } = require("../lib/password");
const {
  ACCESS_TTL_SEC,
  signAccessToken,
  createRefreshToken,
  newRecoveryCode,
  hashRecoveryCode,
  sha256,
} = require("../lib/tokens");
const { isLimited, record } = require("../lib/rateLimit");

const router = express.Router();

const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/;
const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;

const str = (v) => (typeof v === "string" ? v : "");
const deviceOf = (b) => (DEVICE_RE.test(str(b.deviceId)) ? b.deviceId : null);

// Frontend hint jaisa: kam se kam 8 chars, 1 uppercase, 1 special; max 128 (argon2 DoS se bachne ke liye)
function passwordError(p) {
  if (p.length < 8) return "Password must have at least 8 characters";
  if (p.length > 128) return "Password is too long";
  if (!/[A-Z]/.test(p)) return "Password must have at least 1 uppercase letter";
  if (!/[^A-Za-z0-9]/.test(p)) return "Password must have at least 1 special character";
  return null;
}

const userJson = (u) => ({ id: u.id, fullName: u.full_name, username: u.username });

async function signup(req, res) {
  const body = req.body || {};
  const fullName = str(body.fullName).trim();
  const username = str(body.username).trim();
  const password = str(body.password);

  if (fullName.length < 1 || fullName.length > 60)
    return res.status(400).json({ error: "Enter your full name (max 60 characters)" });
  if (!USERNAME_RE.test(username))
    return res.status(400).json({ error: "Username must be 3-30 characters: letters, numbers, underscore" });
  const pe = passwordError(password);
  if (pe) return res.status(400).json({ error: pe });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });

  if (await isLimited(pool, "signup", req.ip, 10, 60, false))
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  await record(pool, "signup", req.ip, false);

  const passwordHash = await hashPassword(password);
  const recoveryCode = newRecoveryCode();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      "INSERT INTO users (full_name, username, password_hash) VALUES ($1, $2, $3) " +
        "RETURNING id, full_name, username",
      [fullName, username, passwordHash]
    );
    const user = ins.rows[0];
    await client.query("INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, $2)", [
      user.id,
      hashRecoveryCode(recoveryCode),
    ]);
    const refreshToken = await createRefreshToken(client, user.id, deviceOf(body));
    await client.query("COMMIT");
    return res.status(201).json({
      user: userJson(user),
      accessToken: signAccessToken(user.id),
      refreshToken,
      expiresIn: ACCESS_TTL_SEC,
      recoveryCode, // sirf ek baar dikhta hai
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (err.code === "23505") return res.status(409).json({ error: "Username already taken" });
    throw err;
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const body = req.body || {};
  const username = str(body.username).trim();
  const password = str(body.password);

  if (username.length < 1 || username.length > 30 || password.length < 1 || password.length > 128)
    return res.status(400).json({ error: "Enter username and password" });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });

  const uKey = username.toLowerCase();
  if (
    (await isLimited(pool, "login_ip", req.ip, 20, 15, true)) ||
    (await isLimited(pool, "login_user", uKey, 5, 15, true))
  )
    return res.status(429).json({ error: "Too many attempts. Try again later." });

  const r = await pool.query(
    "SELECT id, full_name, username, password_hash FROM users WHERE lower(username) = lower($1)",
    [username]
  );
  const user = r.rows[0];
  const ok = await verifyPassword(user ? user.password_hash : await dummyHash(), password);

  if (!user || !ok) {
    await record(pool, "login_ip", req.ip, false);
    await record(pool, "login_user", uKey, false);
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const client = await pool.connect();
  try {
    const refreshToken = await createRefreshToken(client, user.id, deviceOf(body));
    return res.json({
      user: userJson(user),
      accessToken: signAccessToken(user.id),
      refreshToken,
      expiresIn: ACCESS_TTL_SEC,
    });
  } finally {
    client.release();
  }
}

async function refresh(req, res) {
  const token = str((req.body || {}).refreshToken);
  if (token.length < 20 || token.length > 200) return res.status(401).json({ error: "Invalid session" });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      "SELECT id, user_id, family_id, device_id, expires_at, revoked_at " +
        "FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE",
      [sha256(token)]
    );
    const t = r.rows[0];
    if (!t) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Invalid session" });
    }
    if (t.revoked_at) {
      // Purana (already used) token dobara aaya: poori session family revoke
      await client.query(
        "UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL",
        [t.family_id]
      );
      await client.query("COMMIT");
      return res.status(401).json({ error: "Invalid session" });
    }
    if (new Date(t.expires_at) <= new Date()) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Session expired" });
    }
    const u = await client.query("SELECT id, full_name, username FROM users WHERE id = $1", [t.user_id]);
    if (!u.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Invalid session" });
    }
    await client.query("UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1", [t.id]);
    const refreshToken = await createRefreshToken(client, t.user_id, t.device_id, t.family_id);
    await client.query("COMMIT");
    return res.json({
      user: userJson(u.rows[0]),
      accessToken: signAccessToken(t.user_id),
      refreshToken,
      expiresIn: ACCESS_TTL_SEC,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Logout: is device ki poori session family revoke (idempotent)
async function logout(req, res) {
  const token = str((req.body || {}).refreshToken);
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });
  if (token.length >= 20 && token.length <= 200) {
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = now() WHERE revoked_at IS NULL AND family_id = " +
        "(SELECT family_id FROM refresh_tokens WHERE token_hash = $1)",
      [sha256(token)]
    );
  }
  return res.json({ ok: true });
}

async function recover(req, res) {
  const body = req.body || {};
  const username = str(body.username).trim();
  const code = str(body.recoveryCode);
  const newPassword = str(body.newPassword);

  if (username.length < 1 || username.length > 30 || code.length < 10 || code.length > 40)
    return res.status(400).json({ error: "Enter username and recovery code" });
  const pe = passwordError(newPassword);
  if (pe) return res.status(400).json({ error: pe });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Service unavailable" });

  const uKey = username.toLowerCase();
  if (
    (await isLimited(pool, "recover_ip", req.ip, 10, 15, true)) ||
    (await isLimited(pool, "recover_user", uKey, 5, 15, true))
  )
    return res.status(429).json({ error: "Too many attempts. Try again later." });

  const ur = await pool.query(
    "SELECT id, full_name, username FROM users WHERE lower(username) = lower($1)",
    [username]
  );
  const user = ur.rows[0];
  let rc = null;
  if (user) {
    const cr = await pool.query(
      "SELECT id, code_hash FROM recovery_codes WHERE user_id = $1 AND used_at IS NULL",
      [user.id]
    );
    rc = cr.rows[0] || null;
  }
  const given = Buffer.from(hashRecoveryCode(code), "hex");
  const stored = Buffer.from(rc ? rc.code_hash : "0".repeat(64), "hex");
  const ok = !!rc && given.length === stored.length && crypto.timingSafeEqual(given, stored);

  if (!ok) {
    await record(pool, "recover_ip", req.ip, false);
    await record(pool, "recover_user", uKey, false);
    return res.status(401).json({ error: "Invalid username or recovery code" });
  }

  const passwordHash = await hashPassword(newPassword);
  const newCode = newRecoveryCode();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const used = await client.query(
      "UPDATE recovery_codes SET used_at = now() WHERE id = $1 AND used_at IS NULL RETURNING id",
      [rc.id]
    );
    if (!used.rowCount) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Invalid username or recovery code" });
    }
    await client.query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [
      passwordHash,
      user.id,
    ]);
    await client.query("INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, $2)", [
      user.id,
      hashRecoveryCode(newCode),
    ]);
    // Purane sab sessions band
    await client.query("UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [
      user.id,
    ]);
    const refreshToken = await createRefreshToken(client, user.id, deviceOf(body));
    await client.query("COMMIT");
    return res.json({
      user: userJson(user),
      accessToken: signAccessToken(user.id),
      refreshToken,
      expiresIn: ACCESS_TTL_SEC,
      recoveryCode: newCode, // naya code, sirf ek baar dikhta hai
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Express 4 async errors ko error handler tak pahunchane ke liye
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

router.post("/signup", wrap(signup));
router.post("/login", wrap(login));
router.post("/refresh", wrap(refresh));
router.post("/logout", wrap(logout));
router.post("/recover", wrap(recover));

module.exports = router;
module.exports.handlers = { signup, login, refresh, logout, recover };
