const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config");

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_DAYS = 30;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, 0/O/1/I nahi

const sha256 = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");

function signAccessToken(userId) {
  return jwt.sign({}, config.jwtSecret, {
    algorithm: "HS256",
    subject: userId,
    expiresIn: ACCESS_TTL_SEC,
  });
}

// Refresh token DB mein sirf hash ke roop mein jata hai.
async function createRefreshToken(client, userId, deviceId, familyId) {
  const token = crypto.randomBytes(32).toString("base64url");
  await client.query(
    "INSERT INTO refresh_tokens (user_id, family_id, token_hash, device_id, expires_at) " +
      "VALUES ($1, $2, $3, $4, now() + ($5 * interval '1 day'))",
    [userId, familyId || crypto.randomUUID(), sha256(token), deviceId || null, REFRESH_TTL_DAYS]
  );
  return token;
}

// 24 chars x 5 bits = 120 bit; format XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
function newRecoveryCode() {
  const b = crypto.randomBytes(24);
  let s = "";
  for (let i = 0; i < 24; i++) s += CODE_ALPHABET[b[i] % 32];
  return s.match(/.{4}/g).join("-");
}

const hashRecoveryCode = (code) => sha256(String(code).replace(/-/g, "").toUpperCase());

module.exports = {
  ACCESS_TTL_SEC,
  sha256,
  signAccessToken,
  createRefreshToken,
  newRecoveryCode,
  hashRecoveryCode,
};
