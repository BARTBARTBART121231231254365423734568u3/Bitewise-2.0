import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { getMailer } from "./mail.js";
import { migrate } from "./migrate.js";

let app: FastifyInstance;

beforeAll(async () => {
  await migrate();
  app = buildApp();
}, 60_000);

afterAll(async () => {
  await app.close();
});

type Jar = Map<string, string>;

function updateJar(jar: Jar, res: { headers: Record<string, string | string[] | undefined> }) {
  const set = res.headers["set-cookie"] as string | string[] | undefined;
  if (!set) return;
  for (const c of Array.isArray(set) ? set : [set]) {
    const pair = c.split(";")[0] ?? "";
    const idx = pair.indexOf("=");
    if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }
}

interface InjectResp {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  json(): any;
}

async function api(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, opts: { jar?: Jar; body?: unknown } = {}): Promise<InjectResp> {
  const jar = opts.jar ?? new Map<string, string>();
  const headers: Record<string, string> = {};
  if (jar.size > 0) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const csrf = jar.get("bw_csrf");
  if (csrf && method !== "GET") headers["x-csrf-token"] = csrf;
  const res = (await app.inject({
    method,
    url,
    headers,
    payload: opts.body === undefined ? undefined : (opts.body as Record<string, unknown>),
  })) as unknown as InjectResp;
  updateJar(jar, res);
  return res;
}

const uid = () => `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
const PW = "LangGenoegWachtwoord1";

async function freshUser() {
  const jar: Jar = new Map();
  const email = `fase1_${uid()}@test.nl`;
  await api("GET", "/api/auth/csrf", { jar });
  const res = await api("POST", "/api/auth/register", { jar, body: { email, password: PW } });
  expect(res.statusCode).toBe(201);
  return { jar, email };
}

async function makeProduct(jar: Jar, name = "Havermout") {
  const res = await api("POST", "/api/products", {
    jar,
    body: {
      name,
      brand: "Testmerk",
      per100g: { kcal: 350, protein: 10, carbs: 60, fat: null },
      portions: [
        { label: "portie", grams: 40 },
        { label: "schep (onbekend)", grams: null },
      ],
    },
  });
  expect(res.statusCode).toBe(201);
  return res.json().id as string;
}

describe("fase 1 kern", () => {
  it("health is ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
  });

  it("status meldt fase-1, niet-ingelogd", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/status" });
    expect(res.json()).toMatchObject({ authenticated: false, phase: "fase-1" });
  });

  it("muterende calls zonder csrf-token → 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: `x_${uid()}@test.nl`, password: PW },
    });
    expect(res.statusCode).toBe(403);
  });

  it("signup → me → onboarding → profiel", async () => {
    const { jar, email } = await freshUser();
    const me = await api("GET", "/api/auth/me", { jar });
    expect(me.json()).toMatchObject({ email, onboarded: false });
    const ob = await api("POST", "/api/onboarding", {
      jar,
      body: { kcal: 2200, protein: 110, carbs: 250, fat: 70, meals: [{ id: "ontbijt", label: "Ontbijt", sort: 0 }] },
    });
    expect(ob.statusCode).toBe(200);
    const prof = await api("GET", "/api/profile", { jar });
    expect(prof.json()).toMatchObject({ onboarded: true, goals: { kcal: 2200 } });
  });

  it("login: verkeerd wachtwoord → 401, goed → 200", async () => {
    const { email } = await freshUser();
    const jar: Jar = new Map();
    await api("GET", "/api/auth/csrf", { jar });
    const bad = await api("POST", "/api/auth/login", { jar, body: { email, password: "VerkeerdWachtwoord99" } });
    expect(bad.statusCode).toBe(401);
    const good = await api("POST", "/api/auth/login", { jar, body: { email, password: PW } });
    expect(good.statusCode).toBe(200);
  });

  it("owner-isolatie: vreemde reads/writes → 404", async () => {
    const a = await freshUser();
    const b = await freshUser();
    const pid = await makeProduct(a.jar);
    expect((await api("GET", `/api/products/${pid}`, { jar: b.jar })).statusCode).toBe(404);
    expect((await api("PUT", `/api/products/${pid}`, { jar: b.jar, body: { name: "X" } })).statusCode).toBe(404);
    expect((await api("DELETE", `/api/products/${pid}`, { jar: b.jar })).statusCode).toBe(404);
    const log = await api("POST", "/api/diary", {
      jar: b.jar,
      body: { date: "2026-09-20", meal: "lunch", productId: pid, grams: 100 },
    });
    expect(log.statusCode).toBe(404);
    const own = await api("POST", "/api/diary", {
      jar: a.jar,
      body: { date: "2026-09-20", meal: "lunch", productId: pid, grams: 100 },
    });
    expect(own.statusCode).toBe(201);
    const entryId = own.json().id as string;
    expect((await api("PATCH", `/api/diary/${entryId}`, { jar: b.jar, body: { grams: 50 } })).statusCode).toBe(404);
    expect((await api("DELETE", `/api/diary/${entryId}`, { jar: b.jar })).statusCode).toBe(404);
    const bDiary = await api("GET", "/api/diary?date=2026-09-20", { jar: b.jar });
    expect(bDiary.json().entries).toEqual([]);
  });

  it("dagboek: log → totals → edit → status → delete", async () => {
    const { jar } = await freshUser();
    const pid = await makeProduct(jar);
    const log = await api("POST", "/api/diary", {
      jar,
      body: { date: "2026-09-21", meal: "ontbijt", productId: pid, grams: 150, portionLabel: "portie" },
    });
    expect(log.statusCode).toBe(201);
    // 150g van 350 kcal/100g = 525; eiwit 15; vet onbekend → null, nooit 0
    expect(log.json().macros).toMatchObject({ kcal: 525, protein: 15, fat: null });
    const day = await api("GET", "/api/diary?date=2026-09-21", { jar });
    expect(day.json().totals.kcal).toBe(525);
    const entryId = log.json().id as string;
    const patch = await api("PATCH", `/api/diary/${entryId}`, {
      jar,
      body: { grams: 100, updatedAt: log.json().updatedAt },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().macros.kcal).toBe(350);
    const plan = await api("PATCH", `/api/diary/${entryId}`, {
      jar,
      body: { status: "gepland", updatedAt: patch.json().updatedAt },
    });
    expect(plan.json().status).toBe("gepland");
    const day2 = await api("GET", "/api/diary?date=2026-09-21", { jar });
    expect(day2.json().totals.kcal).toBe(0);
    expect(day2.json().planned.kcal).toBe(350);
    expect((await api("DELETE", `/api/diary/${entryId}`, { jar })).statusCode).toBe(204);
  });

  it("snapshot blijft immutable bij bronwijziging", async () => {
    const { jar } = await freshUser();
    const pid = await makeProduct(jar, "Kwark");
    const log = await api("POST", "/api/diary", {
      jar,
      body: { date: "2026-09-22", meal: "lunch", productId: pid, grams: 100 },
    });
    const entryId = log.json().id as string;
    await api("PUT", `/api/products/${pid}`, {
      jar,
      body: { per100g: { kcal: 999, protein: 99, carbs: 99, fat: 99 } },
    });
    const day = await api("GET", "/api/diary?date=2026-09-22", { jar });
    const entry = day.json().entries.find((e: { id: string }) => e.id === entryId);
    expect(entry.macros.kcal).toBe(350);
    // product verwijderen → snapshot overleeft
    expect((await api("DELETE", `/api/products/${pid}`, { jar })).statusCode).toBe(204);
    const day2 = await api("GET", "/api/diary?date=2026-09-22", { jar });
    expect(day2.json().entries.find((e: { id: string }) => e.id === entryId).macros.kcal).toBe(350);
  });

  it("hergebruik kopieert als gepland (nooit auto-log)", async () => {
    const { jar } = await freshUser();
    const pid = await makeProduct(jar);
    await api("POST", "/api/diary", {
      jar,
      body: { date: "2026-09-18", meal: "diner", productId: pid, grams: 200 },
    });
    const cp = await api("POST", "/api/diary/copy-day", {
      jar,
      body: { from: "2026-09-18", to: "2026-09-19" },
    });
    expect(cp.json()).toMatchObject({ copied: 1 });
    const next = await api("GET", "/api/diary?date=2026-09-19", { jar });
    expect(next.json().entries).toHaveLength(1);
    expect(next.json().entries[0].status).toBe("gepland");
    expect(next.json().totals.kcal).toBe(0);
  });

  it("stale updatedAt → 409 conflict", async () => {
    const { jar } = await freshUser();
    const pid = await makeProduct(jar);
    const log = await api("POST", "/api/diary", {
      jar,
      body: { date: "2026-09-21", meal: "snack", productId: pid, grams: 40 },
    });
    const bad = await api("PATCH", `/api/diary/${log.json().id}`, {
      jar,
      body: { grams: 50, updatedAt: "2000-01-01T00:00:00.000Z" },
    });
    expect(bad.statusCode).toBe(409);
    expect(bad.json().error).toBe("conflict");
  });

  it("wachtwoordherstel: neutraal antwoord, echte confirm-flow", async () => {
    const { jar, email } = await freshUser();
    const req1 = await api("POST", "/api/auth/password/request", { jar, body: { email } });
    expect(req1.statusCode).toBe(200);
    expect(req1.json().ok).toBe(true);
    const anon: Jar = new Map();
    await api("GET", "/api/auth/csrf", { jar: anon });
    const req2 = await api("POST", "/api/auth/password/request", {
      jar: anon,
      body: { email: `bestaatniet_${uid()}@test.nl` },
    });
    expect(req2.statusCode).toBe(200);
    expect(req2.json()).toEqual(req1.json());
    const badConfirm = await api("POST", "/api/auth/password/confirm", {
      jar: anon,
      body: { token: "ongeldig-token-xyz", password: "NieuwLangWachtwoord2" },
    });
    expect(badConfirm.statusCode).toBe(400);
    // echte flow via stub-outbox (zelfde proces, geen mail die de deur uitgaat)
    const outbox = getMailer().outbox();
    const last = outbox[outbox.length - 1];
    expect(last?.to).toBe(email);
    const token = (last?.body.split(": ")[1] ?? "").trim();
    expect(token.length).toBeGreaterThan(20);
    const okConfirm = await api("POST", "/api/auth/password/confirm", {
      jar: anon,
      body: { token, password: "NieuwLangWachtwoord2" },
    });
    expect(okConfirm.statusCode).toBe(200);
    const login = await api("POST", "/api/auth/login", {
      jar: anon,
      body: { email, password: "NieuwLangWachtwoord2" },
    });
    expect(login.statusCode).toBe(200);
    // oude sessie is ingetrokken
    expect((await api("GET", "/api/auth/me", { jar })).statusCode).toBe(401);
  });

  it("recept: opslaan → herberekend totaal → loggen", async () => {
    const { jar } = await freshUser();
    const p1 = await makeProduct(jar, "Rijst");
    const res2 = await api("POST", "/api/products", {
      jar,
      body: { name: "Kip", per100g: { kcal: 150, protein: 25, carbs: 0, fat: 5 }, portions: [] },
    });
    const p2 = res2.json().id as string;
    const rec = await api("POST", "/api/recipes", {
      jar,
      body: { name: "Rijst met kip", items: [{ productId: p1, grams: 100 }, { productId: p2, grams: 100 }] },
    });
    expect(rec.statusCode).toBe(201);
    // 350 + 150 = 500 kcal per 200g totaal
    expect(rec.json().totals.kcal).toBe(500);
    const log = await api("POST", "/api/diary", {
      jar,
      body: { date: "2026-09-21", meal: "diner", recipeId: rec.json().id, grams: 400 },
    });
    expect(log.statusCode).toBe(201);
    expect(log.json().macros.kcal).toBe(1000);
  });

  it("water/gewicht/notities + doorzoeken", async () => {
    const { jar } = await freshUser();
    await api("POST", "/api/water", { jar, body: { date: "2026-09-21", ml: 250 } });
    await api("POST", "/api/water", { jar, body: { date: "2026-09-21", ml: 500 } });
    expect((await api("GET", "/api/water?date=2026-09-21", { jar })).json().totalMl).toBe(750);
    await api("PUT", "/api/weight", { jar, body: { date: "2026-09-21", kg: 82.5 } });
    await api("PUT", "/api/weight", { jar, body: { date: "2026-09-21", kg: 82.4 } });
    const w = await api("GET", "/api/weight?from=2026-09-21&to=2026-09-21", { jar });
    expect(w.json().entries).toEqual([{ date: "2026-09-21", kg: 82.4 }]);
    await api("PUT", "/api/notes", { jar, body: { date: "2026-09-21", note: "Buikgevoel goed na havermout" } });
    const s = await api("GET", "/api/notes/search?q=havermout", { jar });
    expect(s.json().results).toHaveLength(1);
  });

  it("inzicht: null is geen nul, conclusie pas bij ≥5 datadagen", async () => {
    const { jar } = await freshUser();
    const pid = await makeProduct(jar);
    for (const d of ["2026-09-10", "2026-09-11", "2026-09-12"]) {
      await api("POST", "/api/diary", { jar, body: { date: d, meal: "lunch", productId: pid, grams: 100 } });
    }
    const t1 = await api("GET", "/api/insights/trend?from=2026-09-10&to=2026-09-16", { jar });
    expect(t1.statusCode).toBe(200);
    expect(t1.json().conclusionOk).toBe(false);
    expect(t1.json().points.find((p: { date: string }) => p.date === "2026-09-13").kcal).toBeNull();
    for (const d of ["2026-09-13", "2026-09-14"]) {
      await api("POST", "/api/diary", { jar, body: { date: d, meal: "lunch", productId: pid, grams: 100 } });
    }
    const t2 = await api("GET", "/api/insights/trend?from=2026-09-10&to=2026-09-16", { jar });
    expect(t2.json().conclusionOk).toBe(true);
  });

  it("sessies: overzicht → intrekken → alles-uitloggen", async () => {
    const { jar, email } = await freshUser();
    const second: Jar = new Map();
    await api("GET", "/api/auth/csrf", { jar: second });
    await api("POST", "/api/auth/login", { jar: second, body: { email, password: PW } });
    const list = await api("GET", "/api/auth/sessions", { jar });
    expect(list.json().sessions).toHaveLength(2);
    const other = list.json().sessions.find((s: { current: boolean }) => !s.current);
    expect((await api("DELETE", `/api/auth/sessions/${other.id}`, { jar })).statusCode).toBe(200);
    expect((await api("GET", "/api/auth/me", { jar: second })).statusCode).toBe(401);
    expect((await api("POST", "/api/auth/logout-all", { jar })).statusCode).toBe(200);
    expect((await api("GET", "/api/auth/me", { jar })).statusCode).toBe(200);
  });

  it("account verwijderen: verkeerd wachtwoord faalt, goed wist alles", async () => {
    const { jar } = await freshUser();
    const pid = await makeProduct(jar);
    expect((await api("DELETE", "/api/account", { jar, body: { password: "fout" } })).statusCode).toBe(401);
    const del = await api("DELETE", "/api/account", { jar, body: { password: PW } });
    expect(del.json()).toMatchObject({ deleted: true });
    expect((await api("GET", `/api/products/${pid}`, { jar })).statusCode).toBe(401);
  });
});
