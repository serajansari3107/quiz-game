const config = require("./config");

let pool = null;

// Pool pehli zaroorat par banta hai; DATABASE_URL na ho to null.
function getPool() {
  if (!config.databaseUrl) return null;
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Neon free cold start ke liye
    });
    pool.on("error", (err) => console.error("pg pool error:", err.message));
  }
  return pool;
}

async function closePool() {
  if (pool) {
    const p = pool;
    pool = null;
    await p.end();
  }
}

module.exports = { getPool, closePool };
