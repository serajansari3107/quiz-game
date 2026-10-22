const argon2 = require("argon2");

// Render free tier ke liye halka argon2id (OWASP minimum ke upar)
const OPTS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

function hashPassword(password) {
  return argon2.hash(password, OPTS);
}

function verifyPassword(hash, password) {
  return argon2.verify(hash, password).catch(() => false);
}

// Unknown username par bhi verify chalta hai, taaki response time se username ka pata na chale.
let dummy = null;
function dummyHash() {
  if (!dummy) dummy = hashPassword("dummy-password-for-timing");
  return dummy;
}

module.exports = { hashPassword, verifyPassword, dummyHash };
