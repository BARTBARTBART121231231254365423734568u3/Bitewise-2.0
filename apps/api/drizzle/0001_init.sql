-- BITEWISE 2.0 Fase 1 — 0001_init
-- Drizzle-gegenereerd vereist; dit bestand is de versioned bron (drizzle-kit pull formaat).
-- Toegepast via apps/api/src/migrate.ts (node-postgres driver) of drizzle-kit migrate.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

-- Wachtwoordherstel: alleen een opgeslagen token-hash; mailpad is een stub-interface (A4).
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  kcal_goal DOUBLE PRECISION,
  protein_goal DOUBLE PRECISION,
  carbs_goal DOUBLE PRECISION,
  fat_goal DOUBLE PRECISION,
  water_goal_ml DOUBLE PRECISION,
  weight_goal_kg DOUBLE PRECISION,
  meals JSONB NOT NULL DEFAULT '[{"id":"ontbijt","label":"Ontbijt","sort":0},{"id":"lunch","label":"Lunch","sort":1},{"id":"diner","label":"Diner","sort":2},{"id":"snack","label":"Snack","sort":3}]'::jsonb,
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  per100g_kcal DOUBLE PRECISION NOT NULL,
  per100g_protein DOUBLE PRECISION,
  per100g_carbs DOUBLE PRECISION,
  per100g_fat DOUBLE PRECISION,
  portions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_used_at TIMESTAMPTZ,
  last_portion_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_user_idx ON products(user_id);
CREATE INDEX IF NOT EXISTS products_user_name_idx ON products(user_id, name);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recipes_user_idx ON recipes(user_id);

-- Dagboek: voedings-snapshot is immutable (F7/copy-garantie).
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  grams DOUBLE PRECISION NOT NULL CHECK (grams > 0),
  snap_kcal DOUBLE PRECISION NOT NULL,
  snap_protein DOUBLE PRECISION,
  snap_carbs DOUBLE PRECISION,
  snap_fat DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'gegeten' CHECK (status IN ('gegeten','gepland')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diary_user_date_idx ON diary_entries(user_id, date);

CREATE TABLE IF NOT EXISTS water_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  ml DOUBLE PRECISION NOT NULL CHECK (ml > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS water_user_date_idx ON water_entries(user_id, date);

CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  kg DOUBLE PRECISION NOT NULL CHECK (kg > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS day_notes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);
