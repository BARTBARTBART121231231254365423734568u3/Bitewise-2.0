// BITEWISE 2.0 web-client: echte API, CSRF double-submit, JSON, offline-outbox.
// Geen mock-API, geen demo-data: alles komt van /api of uit de outbox-rij.
export interface Macros {
  kcal: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface MealMoment {
  id: string;
  label: string;
  sort: number;
}

export interface Goals {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  waterMl: number | null;
  weightKg: number | null;
}

export interface Me {
  id: string;
  email: string;
  onboarded: boolean;
  meals: MealMoment[];
  goals: Goals;
}

export interface DiaryEntry {
  id: string;
  date: string;
  meal: string;
  productId: string | null;
  recipeId: string | null;
  productName: string;
  grams: number;
  macros: Macros;
  status: "gegeten" | "gepland";
  note: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface DayData {
  date: string;
  meals: MealMoment[];
  entries: DiaryEntry[];
  totals: Macros;
  planned: Macros;
  waterMl: number;
  note: string;
  weightKg: number | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  per100g: Macros;
  portions: { label: string; grams: number | null; ml?: number | null }[];
  lastPortionLabel: string | null;
  lastUsedAt: string | null;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  items: { productId: string; grams: number }[];
  totals: Macros | null;
  updatedAt: string;
}

export class AuthError extends Error {
  constructor() {
    super("niet ingelogd");
  }
}

export class ConflictError extends Error {
  server: unknown;
  constructor(server: unknown) {
    super("conflict");
    this.server = server;
  }
}

let csrfToken: string | null = null;

async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const r = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!r.ok) throw new Error("csrf mislukt");
  csrfToken = (await r.json()).token as string;
  return csrfToken as string;
}

export async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  let init: RequestInit = { method, credentials: "same-origin", headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init = { ...init, body: JSON.stringify(body) };
  }
  // CSRF double-submit geldt voor ALLE mutaties, ook zonder body (bv. DELETE).
  if (method !== "GET") headers["X-CSRF-Token"] = await ensureCsrf();
  const r = await fetch(path, init);
  if (r.status === 401) throw new AuthError();
  if (r.status === 409) {
    const j = await r.json().catch(() => ({}));
    throw new ConflictError((j as { server?: unknown }).server ?? null);
  }
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `http ${r.status}`);
  }
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}

export const get = <T>(path: string) => req<T>("GET", path);
export const post = <T>(path: string, body?: unknown) => req<T>("POST", path, body);
export const put = <T>(path: string, body?: unknown) => req<T>("PUT", path, body);
export const patch = <T>(path: string, body?: unknown) => req<T>("PATCH", path, body);
export const del = <T>(path: string, body?: unknown) => req<T>("DELETE", path, body);

// ---- Offline-outbox (localStorage) ----
// Alleen dagboek-mutaties gaan door de outbox: producten/recepten/auth
// vereisen bewust online (geen stille server-divergentie bij identifiers).
export type OutboxKind = "diary-create" | "diary-patch";
export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  payload: Record<string, unknown>;
  entryId?: string;
  createdAt: string;
  conflictServer?: unknown;
  lastError?: string;
}

const OUTBOX_KEY = "bw2_outbox_v1";

export function loadOutbox(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as OutboxItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveOutbox(items: OutboxItem[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

export function enqueue(item: Omit<OutboxItem, "id" | "createdAt">): OutboxItem {
  const full: OutboxItem = {
    ...item,
    id: `${Date.now()}_${Math.floor(Math.random() * 1e9)}`,
    createdAt: new Date().toISOString(),
  };
  const items = loadOutbox();
  items.push(full);
  saveOutbox(items);
  return full;
}

export function removeOutbox(id: string) {
  saveOutbox(loadOutbox().filter((i) => i.id !== id));
}

export function markConflict(id: string, server: unknown) {
  saveOutbox(loadOutbox().map((i) => (i.id === id ? { ...i, conflictServer: server, lastError: "conflict" } : i)));
}

export function isOfflineError(e: unknown): boolean {
  return e instanceof TypeError || (e instanceof Error && /failed to fetch|networkerror|load failed/i.test(e.message));
}

// Probeer de rij te legen. Geeft {done, conflicts} terug.
export async function syncOutbox(): Promise<{ done: number; conflicts: number; errors: number }> {
  let done = 0;
  let conflicts = 0;
  let errors = 0;
  for (const item of loadOutbox()) {
    if (item.conflictServer) {
      conflicts += 1;
      continue;
    }
    try {
      if (item.kind === "diary-create") {
        await post<DiaryEntry>("/api/diary", item.payload);
      } else if (item.entryId) {
        await patch<DiaryEntry>(`/api/diary/${item.entryId}`, item.payload);
      }
      removeOutbox(item.id);
      done += 1;
    } catch (e) {
      if (e instanceof ConflictError) {
        markConflict(item.id, e.server);
        conflicts += 1;
      } else if (isOfflineError(e)) {
        errors += 1;
        break; // nog steeds offline: stop, probeer later opnieuw
      } else {
        // validatiefout o.i.d.: bewaar met melding, blokkeer de rest niet
        saveOutbox(
          loadOutbox().map((i) => (i.id === item.id ? { ...i, lastError: (e as Error).message } : i)),
        );
        errors += 1;
      }
    }
  }
  return { done, conflicts, errors };
}

// Conflict oplossen: "mine" = forceer (opnieuw zonder updatedAt), "theirs" = verwerp.
export async function resolveConflict(item: OutboxItem, choice: "mine" | "theirs"): Promise<void> {
  if (choice === "theirs" || item.kind === "diary-create") {
    removeOutbox(item.id);
    return;
  }
  const payload = { ...(item.payload as Record<string, unknown>) };
  delete payload.updatedAt;
  await patch(`/api/diary/${item.entryId}`, payload);
  removeOutbox(item.id);
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
