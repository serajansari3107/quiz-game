const app = require("./app");
const config = require("./config");
const { closePool } = require("./db");

if (config.jwtSecret.length < 32) {
  console.error("JWT_SECRET missing hai ya 32 characters se chhota hai");
  process.exit(1);
}

const server = app.listen(config.port, () => {
  console.log("quiz-arena-api listening on port " + config.port + " (" + config.nodeEnv + ")");
});

function shutdown() {
  server.close(async () => {
    await closePool().catch(() => {});
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
