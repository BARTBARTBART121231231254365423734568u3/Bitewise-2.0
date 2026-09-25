import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import argon2 from "argon2";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
} from "drizzle-orm";
import {
  DEFAULT_MEALS,
  EMPTY_MACROS,
  addMacros,
  authLoginSchema,
  authRegisterSchema,
  diaryStatusSchema,
  goalsSchema,
  insightConclusion,
  mealMomentSchema,
  onboardingSchema,
  portionSchema,
  productInputSchema,
  recipeInputSchema,
  recipeTotals,
  scaleMacros,
  type Macros,
  type Portion,
} from "@bitewise/domain";
import {
  createDb,
  databaseUrl,
  dayNotes,
  diaryEntries,
  passwordResets,
  products,
  profiles,
  recipes,
  sessions,
  users,
  waterEntries,
  weightEntries,
  type Db,
} from "./db.js";
import { getMailer } from "./mail.js";

const here = dirname(fileURLToPath(import.meta.url));
// WEB_DIST mag relatief zijn (t.o.v. cwd) of absoluut; fastify-static eist absoluut.
const webDist = process.env.WEB_DIST ? resolve(process.env.WEB_DIST) : join(here, "..", "web", "dist");

const SESSION_COOKIE = "bw_sid";
const CSRF_COOKIE = "bw_csrf";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const err = (error: string, details?: unknown) => ({ error, details });
const today = () => new Date().toISOString().slice(0, 10);

function zod400(e: z.ZodError) {
  return { status: 400 as const, body: err("validatie", e.flatten()) };
}

type Authed = { sessionId: string; userId: string; email: string };

async function authed(request: FastifyRequest, db: Db): Promise<Authed | null> {
  const cookies = (request.cookies ?? {}) as Record<string, string | undefined>;
  const sid = cookies[SESSION_COOKIE];
  if (!sid || !UUID_RE.test(sid)) return null;
  const rows = await db
    .select({ sid: sessions.id, userId: users.id, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sid), isNull(sessions.revokedAt)))
    .limit(1);
  const r = rows[0];
  return r ? { sessionId: r.sid, userId: r.userId, email: r.email } : null;
}

function needAuth(db: Db) {
  return async (request: FastifyRequest) => {
    const a = await authed(request, db);
    if (!a) throw { statusCode: 401, body: err("niet ingelogd") };
    return a;
  };
}

function csrfToken(): string {
  return randomBytes(32).toString("base64url");
}

function csrfOk(request: FastifyRequest): boolean {
  const cookies = ((request.cookies ?? {}) as Record<string, string | undefined>);
  const header = request.headers["x-csrf-token"];
  const c = cookies[CSRF_COOKIE];
  if (typeof header !== "string" || !c) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(c);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sessionCookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 3600,
    secure: process.env.COOKIE_SECURE === "1",
  };
}

type ProductRow = typeof products.$inferSelect;

function productMacros(p: ProductRow): Macros {
  return {
    kcal: p.per100gKcal,
    protein: p.per100gProtein,
    carbs: p.per100gCarbs,
    fat: p.per100gFat,
  };
}

function entryJson(e: typeof diaryEntries.$inferSelect) {
  return {
    id: e.id,
    date: e.date,
    meal: e.meal,
    productId: e.productId,
    recipeId: e.recipeId,
    productName: e.productName,
    grams: e.grams,
    macros: { kcal: e.snapKcal, protein: e.snapProtein, carbs: e.snapCarbs, fat: e.snapFat } as Macros,
    status: e.status,
    note: e.note,
    updatedAt: (e.updatedAt as Date).toISOString(),
    createdAt: (e.createdAt as Date).toISOString(),
  };
}

function recipeSnap(totals: Macros, totalWeight: number, grams: number): Macros {
  const f = grams / totalWeight;
  const s = (v: number | null) => (v === null ? null : Math.round(v * f * 10) / 10);
  return { kcal: Math.round(totals.kcal * f * 10) / 10, protein: s(totals.protein), carbs: s(totals.carbs), fat: s(totals.fat) };
}

export function buildApp(opts: { dbUrl?: string } = {}): FastifyInstance {
  const { db, client } = createDb(opts.dbUrl ?? databaseUrl());
  const app = Fastify({ logger: false });
  const requireAuth = needAuth(db);

  void app.register(cookie);
  void app.register(rateLimit, { max: 1000, timeWindow: "1 minute" });

  app.addHook("onClose", async () => {
    await client.end();
  });

  // CSRF (double-submit cookie): alle muterende /api-calls verplichten X-CSRF-Token.
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api")) return;
    if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return;
    if (!csrfOk(request)) {
      return reply.status(403).send(err("csrf vereist: haal eerst /api/auth/csrf op"));
    }
  });

  const authRate = { config: { rateLimit: { max: 100, timeWindow: "1 minute" } } };

  app.get("/health", async () => ({ ok: true, service: "bitewise-2.0-api" }));

  // ---- CSRF-token ----
  app.get("/api/auth/csrf", async (_, reply) => {
    const token = csrfToken();
    void reply.setCookie(CSRF_COOKIE, token, {
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 3600,
      secure: process.env.COOKIE_SECURE === "1",
    });
    return { token };
  });

  app.get("/api/auth/status", async (request) => {
    const a = await authed(request, db);
    if (!a) return { authenticated: false, phase: "fase-1" };
    const prof = await db.select().from(profiles).where(eq(profiles.userId, a.userId)).limit(1);
    return { authenticated: true, onboarded: prof[0]?.onboarded ?? false, phase: "fase-1" };
  });

  // ---- Account (A0–A4) ----
  app.post("/api/auth/register", authRate, async (request, reply) => {
    const parsed = authRegisterSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const email = parsed.data.email.trim();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) return reply.status(409).send(err("adres bestaat al"));
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    const [user] = await db.insert(users).values({ email, passwordHash }).returning({ id: users.id });
    if (!user) return reply.status(500).send(err("registratie mislukt"));
    await db.insert(profiles).values({ userId: user.id, meals: DEFAULT_MEALS });
    const [sess] = await db.insert(sessions).values({ userId: user.id }).returning({ id: sessions.id });
    if (!sess) return reply.status(500).send(err("sessie mislukt"));
    void reply.setCookie(SESSION_COOKIE, sess.id, sessionCookieOpts());
    return reply.status(201).send({ id: user.id, email, onboarded: false });
  });

  app.post("/api/auth/login", authRate, async (request, reply) => {
    const parsed = authLoginSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const email = parsed.data.email.trim();
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    const ok = user ? await argon2.verify(user.passwordHash, parsed.data.password) : false;
    if (!user || !ok) return reply.status(401).send(err("onjuiste combinatie"));
    const [sess] = await db.insert(sessions).values({ userId: user.id }).returning({ id: sessions.id });
    if (!sess) return reply.status(500).send(err("sessie mislukt"));
    void reply.setCookie(SESSION_COOKIE, sess.id, sessionCookieOpts());
    const prof = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    return { id: user.id, email: user.email, onboarded: prof[0]?.onboarded ?? false };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    const a = await authed(request, db);
    if (a) await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, a.sessionId));
    void reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/api/auth/me", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const prof = await db.select().from(profiles).where(eq(profiles.userId, a.userId)).limit(1);
    const p = prof[0];
    return {
      id: a.userId,
      email: a.email,
      onboarded: p?.onboarded ?? false,
      meals: p?.meals ?? DEFAULT_MEALS,
      goals: {
        kcal: p?.kcalGoal ?? null,
        protein: p?.proteinGoal ?? null,
        carbs: p?.carbsGoal ?? null,
        fat: p?.fatGoal ?? null,
        waterMl: p?.waterGoalMl ?? null,
        weightKg: p?.weightGoalKg ?? null,
      },
    };
  });

  app.get("/api/auth/sessions", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, a.userId), isNull(sessions.revokedAt)))
      .orderBy(desc(sessions.createdAt));
    return {
      sessions: rows.map((s) => ({
        id: s.id,
        current: s.id === a.sessionId,
        createdAt: (s.createdAt as Date).toISOString(),
      })),
    };
  });

  app.delete("/api/auth/sessions/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const id = (request.params as Record<string, string>).id;
    if (!UUID_RE.test(id)) return reply.status(400).send(err("ongeldige id"));
    const rows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, a.userId), isNull(sessions.revokedAt)))
      .limit(1);
    if (!rows[0]) return reply.status(404).send(err("niet gevonden"));
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, id));
    if (id === a.sessionId) void reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.post("/api/auth/logout-all", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, a.userId), isNull(sessions.revokedAt)));
    const [sess] = await db.insert(sessions).values({ userId: a.userId }).returning({ id: sessions.id });
    if (!sess) return reply.status(500).send(err("sessie mislukt"));
    void reply.setCookie(SESSION_COOKIE, sess.id, sessionCookieOpts());
    return { ok: true };
  });

  // Wachtwoordherstel (A4): altijd neutraal antwoord, nooit user-enumeratie.
  app.post("/api/auth/password/request", authRate, async (request, reply) => {
    const parsed = z.object({ email: z.string().email().max(254) }).safeParse(request.body);
    const neutral = {
      ok: true,
      message: "Als dit adres bij ons bekend is, staat er een herstellink klaar. Let op: de mailfunctie is in Fase 1 een stub — er wordt niets verzonden.",
    };
    if (!parsed.success) return neutral;
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email.trim()))
      .limit(1);
    const user = rows[0];
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await db.insert(passwordResets).values({
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600_000),
      });
      await getMailer().sendReset({
        to: parsed.data.email.trim(),
        subject: "BiteWise: wachtwoord herstellen (stub — niet verzonden)",
        body: `Hersteltoken (alleen lokaal bruikbaar): ${token}`,
      });
    }
    return neutral;
  });

  app.post("/api/auth/password/confirm", authRate, async (request, reply) => {
    const parsed = z
      .object({ token: z.string().min(10).max(200), password: z.string().min(12).max(200) })
      .safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const rows = await db.select().from(passwordResets).where(eq(passwordResets.tokenHash, tokenHash)).limit(1);
    const rec = rows[0];
    if (!rec || rec.usedAt || rec.expiresAt.getTime() < Date.now()) {
      return reply.status(400).send(err("ongeldige of verlopen link"));
    }
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
    await db.update(users).set({ passwordHash }).where(eq(users.id, rec.userId));
    await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.tokenHash, tokenHash));
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, rec.userId));
    return { ok: true };
  });

  // ---- Profiel / onboarding / doelen (A0, G0/G1, S4) ----
  app.get("/api/profile", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const rows = await db.select().from(profiles).where(eq(profiles.userId, a.userId)).limit(1);
    const p = rows[0];
    return {
      onboarded: p?.onboarded ?? false,
      meals: p?.meals ?? DEFAULT_MEALS,
      goals: {
        kcal: p?.kcalGoal ?? null,
        protein: p?.proteinGoal ?? null,
        carbs: p?.carbsGoal ?? null,
        fat: p?.fatGoal ?? null,
        waterMl: p?.waterGoalMl ?? null,
        weightKg: p?.weightGoalKg ?? null,
      },
    };
  });

  app.put("/api/profile", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = z
      .object({ goals: goalsSchema.optional(), meals: z.array(mealMomentSchema).min(1).max(12).optional() })
      .safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const patch: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };
    if (parsed.data.goals) {
      const g = parsed.data.goals;
      patch.kcalGoal = g.kcal;
      patch.proteinGoal = g.protein;
      patch.carbsGoal = g.carbs;
      patch.fatGoal = g.fat;
      patch.waterGoalMl = g.waterMl;
      patch.weightGoalKg = g.weightKg;
    }
    if (parsed.data.meals) patch.meals = parsed.data.meals;
    await db.insert(profiles).values({ userId: a.userId, ...patch }).onConflictDoUpdate({
      target: profiles.userId,
      set: patch,
    });
    return { ok: true };
  });

  app.post("/api/onboarding", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = onboardingSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const o = parsed.data;
    await db
      .insert(profiles)
      .values({
        userId: a.userId,
        kcalGoal: o.kcal,
        proteinGoal: o.protein,
        carbsGoal: o.carbs,
        fatGoal: o.fat,
        meals: o.meals,
        onboarded: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          kcalGoal: o.kcal,
          proteinGoal: o.protein,
          carbsGoal: o.carbs,
          fatGoal: o.fat,
          meals: o.meals,
          onboarded: true,
          updatedAt: new Date(),
        },
      });
    return { ok: true, onboarded: true };
  });

  app.get("/api/goals", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const rows = await db.select().from(profiles).where(eq(profiles.userId, a.userId)).limit(1);
    const p = rows[0];
    return {
      kcal: p?.kcalGoal ?? null,
      protein: p?.proteinGoal ?? null,
      carbs: p?.carbsGoal ?? null,
      fat: p?.fatGoal ?? null,
      waterMl: p?.waterGoalMl ?? null,
      weightKg: p?.weightGoalKg ?? null,
    };
  });

  app.put("/api/goals", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = goalsSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const g = parsed.data;
    await db
      .insert(profiles)
      .values({
        userId: a.userId,
        kcalGoal: g.kcal,
        proteinGoal: g.protein,
        carbsGoal: g.carbs,
        fatGoal: g.fat,
        waterGoalMl: g.waterMl,
        weightGoalKg: g.weightKg,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          kcalGoal: g.kcal,
          proteinGoal: g.protein,
          carbsGoal: g.carbs,
          fatGoal: g.fat,
          waterGoalMl: g.waterMl,
          weightGoalKg: g.weightKg,
          updatedAt: new Date(),
        },
      });
    return { ok: true };
  });

  // Eigen data verwijderen (ID 63).
  app.delete("/api/account", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = z.object({ password: z.string().min(1).max(200) }).safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const rows = await db.select().from(users).where(eq(users.id, a.userId)).limit(1);
    const user = rows[0];
    if (!user || !(await argon2.verify(user.passwordHash, parsed.data.password))) {
      return reply.status(401).send(err("wachtwoord onjuist"));
    }
    await db.delete(users).where(eq(users.id, a.userId));
    void reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { deleted: true };
  });

  // ---- Producten (F0–F6) ----
  app.get("/api/products", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const q = ((request.query as Record<string, string>).q ?? "").trim();
    const sort = (request.query as Record<string, string>).sort ?? "recent";
    const base = and(
      eq(products.userId, a.userId),
      q ? ilike(products.name, `%${q.replace(/[%_\\]/g, "")}%`) : undefined,
    );
    const rows = await db
      .select()
      .from(products)
      .where(base)
      .orderBy(sort === "name" ? products.name : desc(products.lastUsedAt))
      .limit(200);
    return {
      products: rows.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        barcode: p.barcode,
        per100g: productMacros(p),
        portions: p.portions,
        lastPortionLabel: p.lastPortionLabel,
        lastUsedAt: p.lastUsedAt ? (p.lastUsedAt as Date).toISOString() : null,
        updatedAt: (p.updatedAt as Date).toISOString(),
      })),
    };
  });

  app.post("/api/products", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = productInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const d = parsed.data;
    const [row] = await db
      .insert(products)
      .values({
        userId: a.userId,
        name: d.name.trim(),
        brand: d.brand?.trim() || null,
        barcode: d.barcode?.trim() || null,
        per100gKcal: d.per100g.kcal,
        per100gProtein: d.per100g.protein,
        per100gCarbs: d.per100g.carbs,
        per100gFat: d.per100g.fat,
        portions: d.portions,
      })
      .returning();
    return reply.status(201).send({ id: row?.id });
  });

  async function ownProduct(db: Db, userId: string, id: string) {
    if (!UUID_RE.test(id)) return null;
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .limit(1);
    return rows[0] ?? null;
  }

  app.get("/api/products/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const p = await ownProduct(db, a.userId, (request.params as Record<string, string>).id);
    if (!p) return reply.status(404).send(err("niet gevonden"));
    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      barcode: p.barcode,
      per100g: productMacros(p),
      portions: p.portions,
      lastPortionLabel: p.lastPortionLabel,
      updatedAt: (p.updatedAt as Date).toISOString(),
    };
  });

  app.put("/api/products/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const p = await ownProduct(db, a.userId, (request.params as Record<string, string>).id);
    if (!p) return reply.status(404).send(err("niet gevonden"));
    // Handmatige partiële validatie (naam/per100g/porties/optimistic concurrency).
    const body = request.body as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    if (name !== undefined && (name.length < 1 || name.length > 160)) {
      return reply.status(400).send(err("validatie", { name: "1–160 tekens" }));
    }
    if (typeof body.updatedAt === "string" && body.updatedAt !== (p.updatedAt as Date).toISOString()) {
      return reply.status(409).send({ error: "conflict", server: { updatedAt: (p.updatedAt as Date).toISOString() } });
    }
    let per100g: Macros | undefined;
    if (body.per100g !== undefined) {
      const mp = z
        .object({
          kcal: z.number().nonnegative(),
          protein: z.number().nonnegative().nullable(),
          carbs: z.number().nonnegative().nullable(),
          fat: z.number().nonnegative().nullable(),
        })
        .safeParse(body.per100g);
      if (!mp.success) return reply.status(400).send(zod400(mp.error).body);
      per100g = mp.data;
    }
    let portions: Portion[] | undefined;
    if (body.portions !== undefined) {
      const p2 = z.array(portionSchema).safeParse(body.portions);
      if (!p2.success) return reply.status(400).send(zod400(p2.error).body);
      portions = p2.data;
    }
    await db
      .update(products)
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(body.brand !== undefined ? { brand: (body.brand as string | null) || null } : {}),
        ...(body.barcode !== undefined ? { barcode: (body.barcode as string | null) || null } : {}),
        ...(per100g ? { per100gKcal: per100g.kcal, per100gProtein: per100g.protein, per100gCarbs: per100g.carbs, per100gFat: per100g.fat } : {}),
        ...(portions ? { portions } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, p.id));
    return { ok: true };
  });

  app.delete("/api/products/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const p = await ownProduct(db, a.userId, (request.params as Record<string, string>).id);
    if (!p) return reply.status(404).send(err("niet gevonden"));
    // Dagboek-snapshots blijven bewaard (product_id → NULL, snapshot immutable).
    await db.delete(products).where(eq(products.id, p.id));
    return reply.status(204).send();
  });

  // ---- Recepten (F7) ----
  async function productMap(db: Db, userId: string, ids: string[]): Promise<Map<string, ProductRow> | null> {
    if (ids.some((id) => !UUID_RE.test(id))) return null;
    const map = new Map<string, ProductRow>();
    for (const id of new Set(ids)) {
      const p = await ownProduct(db, userId, id);
      if (!p) return null;
      map.set(id, p);
    }
    return map;
  }

  async function computeRecipe(db: Db, userId: string, items: { productId: string; grams: number }[]) {
    const map = await productMap(db, userId, items.map((i) => i.productId));
    if (!map) return null;
    const parts = items.map((i) => ({ per100g: productMacros(map.get(i.productId)!), grams: i.grams }));
    const totals = recipeTotals(parts);
    const totalWeight = items.reduce((s, i) => s + i.grams, 0);
    return { totals, totalWeight };
  }

  app.get("/api/recipes", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const rows = await db.select().from(recipes).where(eq(recipes.userId, a.userId)).orderBy(desc(recipes.updatedAt)).limit(200);
    const out: unknown[] = [];
    for (const r of rows) {
      const items = (r.items ?? []) as { productId: string; grams: number }[];
      const c = await computeRecipe(db, a.userId, items);
      out.push({ id: r.id, name: r.name, items, totals: c?.totals ?? null, updatedAt: (r.updatedAt as Date).toISOString() });
    }
    return { recipes: out };
  });

  app.post("/api/recipes", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = recipeInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const c = await computeRecipe(db, a.userId, parsed.data.items);
    if (!c) return reply.status(400).send(err("onbekend of vreemd product in recept"));
    const [row] = await db
      .insert(recipes)
      .values({ userId: a.userId, name: parsed.data.name.trim(), items: parsed.data.items })
      .returning({ id: recipes.id });
    return reply.status(201).send({ id: row?.id, totals: c.totals });
  });

  app.get("/api/recipes/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const id = (request.params as Record<string, string>).id;
    if (!UUID_RE.test(id)) return reply.status(404).send(err("niet gevonden"));
    const rows = await db.select().from(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, a.userId))).limit(1);
    const r = rows[0];
    if (!r) return reply.status(404).send(err("niet gevonden"));
    const items = (r.items ?? []) as { productId: string; grams: number }[];
    const c = await computeRecipe(db, a.userId, items);
    return { id: r.id, name: r.name, items, totals: c?.totals ?? null, updatedAt: (r.updatedAt as Date).toISOString() };
  });

  app.put("/api/recipes/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const id = (request.params as Record<string, string>).id;
    if (!UUID_RE.test(id)) return reply.status(404).send(err("niet gevonden"));
    const rows = await db.select().from(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, a.userId))).limit(1);
    const r = rows[0];
    if (!r) return reply.status(404).send(err("niet gevonden"));
    const parsed = z
      .object({ name: z.string().min(1).max(160).optional(), items: recipeInputSchema.shape.items.optional(), updatedAt: z.string().optional() })
      .safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    if (parsed.data.updatedAt && parsed.data.updatedAt !== (r.updatedAt as Date).toISOString()) {
      return reply.status(409).send({ error: "conflict", server: { updatedAt: (r.updatedAt as Date).toISOString() } });
    }
    const items = parsed.data.items ?? ((r.items ?? []) as { productId: string; grams: number }[]);
    const c = await computeRecipe(db, a.userId, items);
    if (!c) return reply.status(400).send(err("onbekend of vreemd product in recept"));
    await db
      .update(recipes)
      .set({
        ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
        items,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id));
    return { ok: true, totals: c.totals };
  });

  app.delete("/api/recipes/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const id = (request.params as Record<string, string>).id;
    if (!UUID_RE.test(id)) return reply.status(404).send(err("niet gevonden"));
    const rows = await db.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, a.userId))).limit(1);
    if (!rows[0]) return reply.status(404).send(err("niet gevonden"));
    await db.delete(recipes).where(eq(recipes.id, id));
    return reply.status(204).send();
  });

  // ---- Dagboek (D0–D6) ----
  const diaryCreateSchema = z
    .object({
      date: z.string().regex(DATE_RE),
      meal: z.string().min(1).max(80),
      productId: z.string().uuid().optional(),
      recipeId: z.string().uuid().optional(),
      grams: z.number().positive().max(10000),
      status: diaryStatusSchema.default("gegeten"),
      note: z.string().max(500).optional(),
      portionLabel: z.string().max(80).optional(),
    })
    .refine((v) => (v.productId ? !v.recipeId : !!v.recipeId), {
      message: "geef óf productId óf recipeId",
    });

  app.get("/api/diary", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const date = ((request.query as Record<string, string>).date ?? today()).trim();
    if (!DATE_RE.test(date)) return reply.status(400).send(err("ongeldige datum"));
    const prof = await db.select().from(profiles).where(eq(profiles.userId, a.userId)).limit(1);
    const entries = await db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, a.userId), eq(diaryEntries.date, date)))
      .orderBy(diaryEntries.createdAt);
    let totals: Macros = { ...EMPTY_MACROS };
    let planned: Macros = { ...EMPTY_MACROS };
    for (const e of entries) {
      const m: Macros = { kcal: e.snapKcal, protein: e.snapProtein, carbs: e.snapCarbs, fat: e.snapFat };
      if (e.status === "gegeten") totals = addMacros(totals, m);
      else planned = addMacros(planned, m);
    }
    const water = await db
      .select()
      .from(waterEntries)
      .where(and(eq(waterEntries.userId, a.userId), eq(waterEntries.date, date)));
    const waterMl = water.reduce((s, w) => s + (w.ml as number), 0);
    const notes = await db
      .select()
      .from(dayNotes)
      .where(and(eq(dayNotes.userId, a.userId), eq(dayNotes.date, date)))
      .limit(1);
    const weight = await db
      .select()
      .from(weightEntries)
      .where(and(eq(weightEntries.userId, a.userId), eq(weightEntries.date, date)))
      .limit(1);
    return {
      date,
      meals: prof[0]?.meals ?? DEFAULT_MEALS,
      entries: entries.map(entryJson),
      totals,
      planned,
      waterMl: Math.round(waterMl * 10) / 10,
      note: notes[0]?.note ?? "",
      weightKg: (weight[0]?.kg as number | undefined) ?? null,
    };
  });

  app.post("/api/diary", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = diaryCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const d = parsed.data;
    let snap: Macros;
    let productName: string;
    let productId: string | null = null;
    let recipeId: string | null = null;
    if (d.productId) {
      const p = await ownProduct(db, a.userId, d.productId);
      if (!p) return reply.status(404).send(err("product niet gevonden"));
      snap = scaleMacros(productMacros(p), d.grams);
      productName = p.name;
      productId = p.id;
      await db
        .update(products)
        .set({
          lastUsedAt: new Date(),
          ...(d.portionLabel ? { lastPortionLabel: d.portionLabel } : {}),
        })
        .where(eq(products.id, p.id));
    } else {
      const id = d.recipeId!;
      if (!UUID_RE.test(id)) return reply.status(404).send(err("recept niet gevonden"));
      const rows = await db.select().from(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, a.userId))).limit(1);
      const r = rows[0];
      if (!r) return reply.status(404).send(err("recept niet gevonden"));
      const items = (r.items ?? []) as { productId: string; grams: number }[];
      const c = await computeRecipe(db, a.userId, items);
      if (!c) return reply.status(400).send(err("recept bevat onbekend product"));
      snap = recipeSnap(c.totals, c.totalWeight, d.grams);
      productName = r.name;
      recipeId = r.id;
    }
    const [row] = await db
      .insert(diaryEntries)
      .values({
        userId: a.userId,
        date: d.date,
        meal: d.meal,
        productId,
        recipeId,
        productName,
        grams: d.grams,
        snapKcal: snap.kcal,
        snapProtein: snap.protein,
        snapCarbs: snap.carbs,
        snapFat: snap.fat,
        status: d.status,
        note: d.note ?? null,
      })
      .returning();
    return reply.status(201).send(entryJson(row!));
  });

  async function ownEntry(db: Db, userId: string, id: string) {
    if (!UUID_RE.test(id)) return null;
    const rows = await db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)))
      .limit(1);
    return rows[0] ?? null;
  }

  app.patch("/api/diary/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const e = await ownEntry(db, a.userId, (request.params as Record<string, string>).id);
    if (!e) return reply.status(404).send(err("niet gevonden"));
    const parsed = z
      .object({
        grams: z.number().positive().max(10000).optional(),
        meal: z.string().min(1).max(80).optional(),
        status: diaryStatusSchema.optional(),
        note: z.string().max(500).nullable().optional(),
        updatedAt: z.string().optional(),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const b = parsed.data;
    if (b.updatedAt && b.updatedAt !== (e.updatedAt as Date).toISOString()) {
      return reply.status(409).send({ error: "conflict", server: entryJson(e) });
    }
    let snap: Macros = { kcal: e.snapKcal, protein: e.snapProtein, carbs: e.snapCarbs, fat: e.snapFat };
    let grams = e.grams as number;
    if (b.grams !== undefined && b.grams !== grams) {
      grams = b.grams;
      if (e.productId) {
        const p = await ownProduct(db, a.userId, e.productId);
        snap = p ? scaleMacros(productMacros(p), grams) : recipeSnap(snap, e.grams as number, grams);
      } else if (e.recipeId) {
        const rows = await db.select().from(recipes).where(and(eq(recipes.id, e.recipeId), eq(recipes.userId, a.userId))).limit(1);
        const r = rows[0];
        if (r) {
          const items = (r.items ?? []) as { productId: string; grams: number }[];
          const c = await computeRecipe(db, a.userId, items);
          snap = c ? recipeSnap(c.totals, c.totalWeight, grams) : recipeSnap(snap, e.grams as number, grams);
        } else {
          snap = recipeSnap(snap, e.grams as number, grams);
        }
      } else {
        snap = recipeSnap(snap, e.grams as number, grams);
      }
    }
    const [row] = await db
      .update(diaryEntries)
      .set({
        ...(b.grams !== undefined ? { grams, snapKcal: snap.kcal, snapProtein: snap.protein, snapCarbs: snap.carbs, snapFat: snap.fat } : {}),
        ...(b.meal ? { meal: b.meal } : {}),
        ...(b.status ? { status: b.status } : {}),
        ...(b.note !== undefined ? { note: b.note } : {}),
        updatedAt: new Date(),
      })
      .where(eq(diaryEntries.id, e.id))
      .returning();
    return entryJson(row!);
  });

  app.delete("/api/diary/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const e = await ownEntry(db, a.userId, (request.params as Record<string, string>).id);
    if (!e) return reply.status(404).send(err("niet gevonden"));
    await db.delete(diaryEntries).where(eq(diaryEntries.id, e.id));
    return reply.status(204).send();
  });

  // Hergebruik (D6/ID 6+8): expliciete kopie, altijd als "gepland", nooit auto-log.
  app.post("/api/diary/copy-day", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = z
      .object({ from: z.string().regex(DATE_RE), to: z.string().regex(DATE_RE), meal: z.string().min(1).max(80).optional() })
      .safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const src = await db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.userId, a.userId), eq(diaryEntries.date, parsed.data.from)));
    if (src.length === 0) return { copied: 0 };
    await db.insert(diaryEntries).values(
      src.map((e) => ({
        userId: a.userId,
        date: parsed.data.to,
        meal: parsed.data.meal ?? (e.meal as string),
        productId: e.productId,
        recipeId: e.recipeId,
        productName: e.productName as string,
        grams: e.grams as number,
        snapKcal: e.snapKcal as number,
        snapProtein: e.snapProtein,
        snapCarbs: e.snapCarbs,
        snapFat: e.snapFat,
        status: "gepland",
        note: e.note,
      })),
    );
    return { copied: src.length };
  });

  // ---- Water / gewicht / notities (D3/D4, ID 10–12) ----
  app.post("/api/water", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = z.object({ date: z.string().regex(DATE_RE), ml: z.number().positive().max(10000) }).safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    const [row] = await db
      .insert(waterEntries)
      .values({ userId: a.userId, date: parsed.data.date, ml: parsed.data.ml })
      .returning({ id: waterEntries.id });
    return reply.status(201).send({ id: row?.id });
  });

  app.get("/api/water", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const date = ((request.query as Record<string, string>).date ?? today()).trim();
    if (!DATE_RE.test(date)) return reply.status(400).send(err("ongeldige datum"));
    const rows = await db
      .select()
      .from(waterEntries)
      .where(and(eq(waterEntries.userId, a.userId), eq(waterEntries.date, date)))
      .orderBy(waterEntries.createdAt);
    return {
      date,
      totalMl: Math.round(rows.reduce((s, w) => s + (w.ml as number), 0) * 10) / 10,
      entries: rows.map((w) => ({ id: w.id, ml: w.ml })),
    };
  });

  app.delete("/api/water/:id", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const id = (request.params as Record<string, string>).id;
    if (!UUID_RE.test(id)) return reply.status(404).send(err("niet gevonden"));
    const rows = await db
      .select({ id: waterEntries.id })
      .from(waterEntries)
      .where(and(eq(waterEntries.id, id), eq(waterEntries.userId, a.userId)))
      .limit(1);
    if (!rows[0]) return reply.status(404).send(err("niet gevonden"));
    await db.delete(waterEntries).where(eq(waterEntries.id, id));
    return reply.status(204).send();
  });

  app.put("/api/weight", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = z.object({ date: z.string().regex(DATE_RE), kg: z.number().positive().max(500) }).safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    await db
      .insert(weightEntries)
      .values({ userId: a.userId, date: parsed.data.date, kg: parsed.data.kg })
      .onConflictDoUpdate({
        target: [weightEntries.userId, weightEntries.date],
        set: { kg: parsed.data.kg },
      });
    return { ok: true };
  });

  app.get("/api/weight", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const q = request.query as Record<string, string>;
    const conds = [eq(weightEntries.userId, a.userId)];
    if (q.from && DATE_RE.test(q.from)) conds.push(gte(weightEntries.date, q.from));
    if (q.to && DATE_RE.test(q.to)) conds.push(lte(weightEntries.date, q.to));
    const rows = await db.select().from(weightEntries).where(and(...conds)).orderBy(weightEntries.date).limit(500);
    return { entries: rows.map((w) => ({ date: w.date, kg: w.kg })) };
  });

  app.put("/api/notes", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const parsed = z.object({ date: z.string().regex(DATE_RE), note: z.string().max(2000) }).safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(zod400(parsed.error).body);
    await db
      .insert(dayNotes)
      .values({ userId: a.userId, date: parsed.data.date, note: parsed.data.note, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [dayNotes.userId, dayNotes.date],
        set: { note: parsed.data.note, updatedAt: new Date() },
      });
    return { ok: true };
  });

  app.get("/api/notes", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const date = ((request.query as Record<string, string>).date ?? today()).trim();
    if (!DATE_RE.test(date)) return reply.status(400).send(err("ongeldige datum"));
    const rows = await db
      .select()
      .from(dayNotes)
      .where(and(eq(dayNotes.userId, a.userId), eq(dayNotes.date, date)))
      .limit(1);
    return { date, note: rows[0]?.note ?? "" };
  });

  app.get("/api/notes/search", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const q = ((request.query as Record<string, string>).q ?? "").trim().replace(/[%_\\]/g, "");
    if (q.length < 2) return reply.status(400).send(err("zoekterm minimaal 2 tekens"));
    const rows = await db
      .select()
      .from(dayNotes)
      .where(and(eq(dayNotes.userId, a.userId), ilike(dayNotes.note, `%${q}%`)))
      .orderBy(desc(dayNotes.date))
      .limit(50);
    return { results: rows.map((r) => ({ date: r.date, note: r.note })) };
  });

  // ---- Inzicht (I0–I2) ----
  app.get("/api/insights/trend", async (request, reply) => {
    let a: Authed;
    try {
      a = await requireAuth(request);
    } catch (e: unknown) {
      const v = e as { statusCode: number; body: unknown };
      return reply.status(v.statusCode).send(v.body);
    }
    const q = request.query as Record<string, string>;
    const end = q.to && DATE_RE.test(q.to) ? q.to : today();
    let start = q.from && DATE_RE.test(q.from) ? q.from : null;
    if (!start) {
      const d = new Date(`${end}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - 13);
      start = d.toISOString().slice(0, 10);
    }
    if (start > end) return reply.status(400).send(err("from ligt na to"));
    const days: string[] = [];
    for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
      if (days.length > 93) break;
    }
    const entries = await db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, a.userId),
          gte(diaryEntries.date, start),
          lte(diaryEntries.date, end),
          eq(diaryEntries.status, "gegeten"),
        ),
      );
    const weights = await db
      .select()
      .from(weightEntries)
      .where(and(eq(weightEntries.userId, a.userId), gte(weightEntries.date, start), lte(weightEntries.date, end)));
    const kcalByDay = new Map<string, number>();
    const hasEntry = new Set<string>();
    for (const e of entries) {
      const day = e.date as string;
      hasEntry.add(day);
      kcalByDay.set(day, Math.round(((kcalByDay.get(day) ?? 0) + (e.snapKcal as number)) * 10) / 10);
    }
    const weightByDay = new Map(weights.map((w) => [w.date as string, w.kg as number]));
    const points = days.map((date) => ({
      date,
      kcal: hasEntry.has(date) ? (kcalByDay.get(date) as number) : null,
      weightKg: weightByDay.get(date) ?? null,
    }));
    const conclusion = insightConclusion(points);
    const prof = await db.select().from(profiles).where(eq(profiles.userId, a.userId)).limit(1);
    return {
      from: start,
      to: end,
      points,
      conclusion: conclusion.text,
      conclusionOk: conclusion.ok,
      kcalGoal: prof[0]?.kcalGoal ?? null,
    };
  });

  // ---- Web-dist serveren (productie) ----
  if (existsSync(webDist)) {
    void app.register(fastifyStatic, { root: webDist });
    app.setNotFoundHandler((_, reply) => reply.sendFile("index.html"));
  } else {
    app.setNotFoundHandler((_, reply) => reply.status(404).send(err("niet gevonden")));
  }

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3001);
  const { migrate } = await import("./migrate.js");
  try {
    const files = await migrate();
    console.log(`migraties toegepast: ${files.join(", ")}`);
  } catch (e) {
    console.error("migratie mislukt (start toch, check DATABASE_URL):", (e as Error).message);
  }
  const app = buildApp();
  await app.listen({ port, host: "0.0.0.0" });
}
