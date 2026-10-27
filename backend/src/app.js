const express = require("express");
const cors = require("./middleware/cors");
const { getPool } = require("./db");
const authRoutes = require("./routes/auth");
const syncRoutes = require("./routes/sync");
const dailyRoutes = require("./routes/daily");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // Render proxy ke peeche
app.use(cors);
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: Math.round(process.uptime()) });
});

app.get("/health/db", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ status: "error", db: "not_configured" });
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "up" });
  } catch (err) {
    console.error("health/db failed:", err.message);
    res.status(503).json({ status: "error", db: "down" });
  }
});

app.use("/auth", authRoutes);
app.use("/sync", syncRoutes);
app.use("/daily", dailyRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") {
    return res.status(400).json({ error: "Invalid request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

module.exports = app;
