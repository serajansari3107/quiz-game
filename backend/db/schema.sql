-- Quiz Arena schema (Neon PostgreSQL). Re-runnable: IF NOT EXISTS use hua hai.
BEGIN;

-- 1) users
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text        NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 60),
  username      text        NOT NULL CHECK (char_length(username) BETWEEN 3 AND 30),
  password_hash text        NOT NULL,              -- argon2id hash
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- Username case-insensitive unique
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_uq ON users (lower(username));

-- 2) refresh_tokens (rotating; sirf hash store hota hai)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   uuid        NOT NULL,               -- ek login session ki chain (reuse detect karne ke liye)
  token_hash  text        NOT NULL UNIQUE,
  device_id   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  replaced_by uuid REFERENCES refresh_tokens(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx   ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expiry_idx ON refresh_tokens (expires_at);

-- 3) recovery_codes (one-time; sirf hash)
CREATE TABLE IF NOT EXISTS recovery_codes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash  text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at    timestamptz
);
-- Ek user ka sirf ek active (unused) code
CREATE UNIQUE INDEX IF NOT EXISTS recovery_codes_one_active_uq
  ON recovery_codes (user_id) WHERE used_at IS NULL;

-- 4) rounds (har finished round ka event; event_id client uuid = idempotent push)
CREATE TABLE IF NOT EXISTS rounds (
  event_id   uuid PRIMARY KEY,
  seq        bigint GENERATED ALWAYS AS IDENTITY UNIQUE,   -- pull cursor
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id  text        NOT NULL,
  mode       text        NOT NULL CHECK (char_length(mode) BETWEEN 1 AND 30),  -- cricket / wwe
  quiz_n     smallint    NOT NULL CHECK (quiz_n IN (5, 10, 20)),
  right_cnt  smallint    NOT NULL CHECK (right_cnt >= 0),
  wrong_cnt  smallint    NOT NULL CHECK (wrong_cnt >= 0),
  score      numeric(6,1) NOT NULL CHECK (score >= 0),
  played_at  timestamptz NOT NULL,                -- client ka time
  created_at timestamptz NOT NULL DEFAULT now(),  -- server receive time
  CHECK (right_cnt + wrong_cnt <= quiz_n)
);
CREATE INDEX IF NOT EXISTS rounds_user_seq_idx ON rounds (user_id, seq);

-- 5) baselines (guest data ka ek-baar transfer; ek device se sirf ek baar)
CREATE TABLE IF NOT EXISTS baselines (
  device_id      text PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baseline       jsonb       NOT NULL,            -- guest stats snapshot (sum/best)
  transferred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS baselines_user_idx ON baselines (user_id);

-- 6) user_stats (per user, per mode, per quiz size; local "sum" jaisa: r,q,c,w,p,f)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode       text        NOT NULL,
  quiz_n     smallint    NOT NULL CHECK (quiz_n IN (5, 10, 20)),
  rounds     integer     NOT NULL DEFAULT 0 CHECK (rounds >= 0),   -- r
  questions  integer     NOT NULL DEFAULT 0 CHECK (questions >= 0),-- q
  correct    integer     NOT NULL DEFAULT 0 CHECK (correct >= 0),  -- c
  wrong      integer     NOT NULL DEFAULT 0 CHECK (wrong >= 0),    -- w
  points     numeric(12,1) NOT NULL DEFAULT 0 CHECK (points >= 0), -- p
  perfect    integer     NOT NULL DEFAULT 0 CHECK (perfect >= 0),  -- f
  best_score numeric(6,1) NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mode, quiz_n)
);

-- 7) login_attempts (rate limit counters DB mein)
CREATE TABLE IF NOT EXISTS login_attempts (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket       text        NOT NULL,              -- e.g. 'login', 'signup', 'recover'
  key_hash     text        NOT NULL,              -- hash(ip) ya hash(username); raw nahi
  success      boolean     NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_lookup_idx
  ON login_attempts (bucket, key_hash, attempted_at DESC);

-- 8) user_coins (server-side coin balance; client kabhi balance nahi bhejta)
CREATE TABLE IF NOT EXISTS user_coins (
  user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance    integer     NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9) coin_ledger (har round se max ek credit; event_id UNIQUE = duplicate protection)
CREATE TABLE IF NOT EXISTS coin_ledger (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   uuid        NOT NULL UNIQUE,
  delta      integer     NOT NULL CHECK (delta > 0),
  reason     text        NOT NULL,
  earn_day   date        NOT NULL,                 -- IST din (daily cap yahin se count hota hai)
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_ledger_user_day_idx ON coin_ledger (user_id, earn_day);

-- 10) daily_challenge_runs (Daily Challenge: ek account + ek IST din = ek hi row = ek hi reward)
CREATE TABLE IF NOT EXISTS daily_challenge_runs (
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day          date        NOT NULL,                 -- IST din
  right_cnt    integer     NOT NULL CHECK (right_cnt BETWEEN 0 AND 10),
  wrong_cnt    integer     NOT NULL CHECK (wrong_cnt BETWEEN 0 AND 10),
  coins        integer     NOT NULL CHECK (coins >= 0),
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day),
  CHECK (right_cnt + wrong_cnt <= 10)
);

COMMIT;
