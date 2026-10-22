const DEFAULT_ORIGIN = "https://serajansari3107.github.io";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGIN)
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  allowedOrigins,
};
