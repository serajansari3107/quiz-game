const { sha256 } = require("./tokens");

// bucket + key (ip/username) ke attempts ginta hai, login_attempts table se.
async function isLimited(pool, bucket, key, max, windowMin, failuresOnly) {
  const r = await pool.query(
    "SELECT count(*)::int AS n FROM login_attempts " +
      "WHERE bucket = $1 AND key_hash = $2 AND attempted_at > now() - ($3 * interval '1 minute')" +
      (failuresOnly ? " AND success = false" : ""),
    [bucket, sha256(key), windowMin]
  );
  return r.rows[0].n >= max;
}

async function record(pool, bucket, key, success) {
  await pool.query("INSERT INTO login_attempts (bucket, key_hash, success) VALUES ($1, $2, $3)", [
    bucket,
    sha256(key),
    !!success,
  ]);
  if (Math.random() < 0.02) {
    await pool
      .query("DELETE FROM login_attempts WHERE attempted_at < now() - interval '1 day'")
      .catch(() => {});
  }
}

module.exports = { isLimited, record };
