const jwt = require("jsonwebtoken");
const config = require("../config");

// Authorization: Bearer <accessToken> check; req.userId set karta hai.
function requireAuth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (!m) return res.status(401).json({ error: "Unauthorized" });
  try {
    const p = jwt.verify(m[1], config.jwtSecret, { algorithms: ["HS256"] });
    req.userId = p.sub;
    next();
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = requireAuth;