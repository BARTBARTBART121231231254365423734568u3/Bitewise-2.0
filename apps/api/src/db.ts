import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  boolean,
  date,
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { DEFAULT_MEALS } from "@bitewise/domain";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const passwordResets = pgTable("password_resets", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  kcalGoal: doublePrecision("kcal_goal"),
  proteinGoal: doublePrecision("protein_goal"),
  carbsGoal: doublePrecision("carbs_goal"),
  fatGoal: doublePrecision("fat_goal"),
  waterGoalMl: doublePrecision("water_goal_ml"),
  weightGoalKg: doublePrecision("weight_goal_kg"),
  meals: jsonb("meals").$type<{ id: string; label: string; sort: number }[]>().notNull().default(DEFAULT_MEALS),
  onboarded: boolean("onboarded").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  brand: text("brand"),
  barcode: text("barcode"),
  per100gKcal: doublePrecision("per100g_kcal").notNull(),
  per100gProtein: doublePrecision("per100g_protein"),
  per100gCarbs: doublePrecision("per100g_carbs"),
  per100gFat: doublePrecision("per100g_fat"),
  portions: jsonb("portions").$type<{ label: string; grams: number | null; ml?: number | null }[]>().notNull().default([]),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  lastPortionLabel: text("last_portion_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  items: jsonb("items").$type<{ productId: string; grams: number }[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const diaryEntries = pgTable("diary_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  meal: text("meal").notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  recipeId: uuid("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  grams: doublePrecision("grams").notNull(),
  snapKcal: doublePrecision("snap_kcal").notNull(),
  snapProtein: doublePrecision("snap_protein"),
  snapCarbs: doublePrecision("snap_carbs"),
  snapFat: doublePrecision("snap_fat"),
  status: text("status").notNull().default("gegeten"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const waterEntries = pgTable("water_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  ml: doublePrecision("ml").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weightEntries = pgTable("weight_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  kg: doublePrecision("kg").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dayNotes = pgTable("day_notes", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  note: text("note").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export function databaseUrl(): string {
  return (
    process.env.DATABASE_URL ?? "postgres://bitewise:bitewise@localhost:5432/bitewise2"
  );
}

// Railway's *private* Postgres endpoint presents a self-signed certificate.
// Only that exact private DNS suffix may bypass chain verification. postgres.js
// treats sslmode=require as *unverified* TLS, so force verify-full on every
// non-local public endpoint, even when the URL requests a weaker sslmode.
export function postgresTlsOptions(url: string) {
  const host = new URL(url).hostname.toLowerCase();
  if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.railway\.internal$/.test(host))
    return { ssl: { rejectUnauthorized: false } };
  if ((host === "localhost" || host === "127.0.0.1" || host === "[::1]") && !new URL(url).searchParams.has("sslmode")) return {};
  return { ssl: "verify-full" as const };
}

export function createDb(url = databaseUrl()) {
  const client = postgres(url, { max: 10, ...postgresTlsOptions(url) });
  return { db: drizzle(client), client };
}

export type Db = ReturnType<typeof createDb>["db"];
