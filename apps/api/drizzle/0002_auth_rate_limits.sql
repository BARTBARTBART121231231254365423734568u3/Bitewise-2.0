-- Atomic, shared counters for auth abuse control; no raw IP/email/token is stored.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_expires_idx ON auth_rate_limits(expires_at);
