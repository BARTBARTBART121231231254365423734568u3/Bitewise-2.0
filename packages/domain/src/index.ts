import { z } from "zod";

// NL-locale: decimale komma in UI, intern number met vaste afronding.
export const round1 = (n: number) => Math.round(n * 10) / 10;

export const macrosSchema = z.object({
  kcal: z.number().nonnegative(),
  protein: z.number().nonnegative().nullable(),
  carbs: z.number().nonnegative().nullable(),
  fat: z.number().nonnegative().nullable(),
});
export type Macros = z.infer<typeof macrosSchema>;

// Onbekend blijft null — nooit 0 invullen.
export function scaleMacros(per100g: Macros, grams: number): Macros {
  const f = grams / 100;
  const s = (v: number | null) => (v === null ? null : round1(v * f));
  return {
    kcal: round1(per100g.kcal * f),
    protein: s(per100g.protein),
    carbs: s(per100g.carbs),
    fat: s(per100g.fat),
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  // Strikt: zodra één component onbekend is, is het totaal onbekend (null).
  // Liever "—" dan schijnprecisie (nooit 0 invullen voor onbekend).
  const add = (x: number | null, y: number | null) =>
    x === null || y === null ? null : round1(x + y);
  // kcal is nooit null (altijd verplicht bij invoer).
  return { kcal: round1(a.kcal + b.kcal), protein: add(a.protein, b.protein), carbs: add(a.carbs, b.carbs), fat: add(a.fat, b.fat) };
}

export const EMPTY_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export const portionSchema = z.object({
  label: z.string().min(1),
  grams: z.number().positive().nullable(), // null = onbekende conversie → alleen gram/ml toegestaan in UI
  ml: z.number().positive().nullable().optional(),
});
export type Portion = z.infer<typeof portionSchema>;

// F3: portie-menge omrekenen. Onbekende conversie → werp, UI valt terug op gram/ml.
export function portionGrams(portion: Portion, amount: number): number {
  if (portion.grams === null || portion.grams === undefined) {
    throw new Error("onbekende conversie: gebruik gram/ml");
  }
  return round1(portion.grams * amount);
}

export const mealMomentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sort: z.number().int().nonnegative(),
});
export type MealMoment = z.infer<typeof mealMomentSchema>;

export const DEFAULT_MEALS: MealMoment[] = [
  { id: "ontbijt", label: "Ontbijt", sort: 0 },
  { id: "lunch", label: "Lunch", sort: 1 },
  { id: "diner", label: "Diner", sort: 2 },
  { id: "snack", label: "Snack", sort: 3 },
];

export const diaryStatusSchema = z.enum(["gegeten", "gepland"]);
export type DiaryStatus = z.infer<typeof diaryStatusSchema>;

export const diaryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal: z.string().min(1),
  productId: z.string().min(1),
  grams: z.number().positive(),
  status: diaryStatusSchema.default("gegeten"),
  note: z.string().max(500).optional(),
});
export type DiaryInput = z.infer<typeof diaryInputSchema>;

export const productInputSchema = z.object({
  name: z.string().min(1).max(160),
  brand: z.string().max(160).optional(),
  barcode: z.string().max(32).optional(),
  per100g: macrosSchema,
  portions: z.array(portionSchema).default([]),
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const recipeInputSchema = z.object({
  name: z.string().min(1).max(160),
  items: z
    .array(z.object({ productId: z.string().min(1), grams: z.number().positive() }))
    .min(1),
});
export type RecipeInput = z.infer<typeof recipeInputSchema>;

// Herbereken recept-totaal uit actuele per100g-waarden (F7 / ID 22).
export function recipeTotals(items: { per100g: Macros; grams: number }[]): Macros {
  return items.reduce<Macros>(
    (acc, it) => addMacros(acc, scaleMacros(it.per100g, it.grams)),
    { ...EMPTY_MACROS },
  );
}

export const goalsSchema = z.object({
  kcal: z.number().positive().nullable().default(null),
  protein: z.number().nonnegative().nullable().default(null),
  carbs: z.number().nonnegative().nullable().default(null),
  fat: z.number().nonnegative().nullable().default(null),
  waterMl: z.number().positive().nullable().default(null),
  weightKg: z.number().positive().nullable().default(null),
});
export type Goals = z.infer<typeof goalsSchema>;

export const onboardingSchema = z.object({
  kcal: z.number().positive().nullable().default(null),
  protein: z.number().nonnegative().nullable().default(null),
  carbs: z.number().nonnegative().nullable().default(null),
  fat: z.number().nonnegative().nullable().default(null),
  meals: z.array(mealMomentSchema).min(1).default(DEFAULT_MEALS),
});
export type Onboarding = z.infer<typeof onboardingSchema>;

// I0–I2: trendpunt; value null = geen data (nooit 0 invullen).
export const trendPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kcal: z.number().nonnegative().nullable(),
  weightKg: z.number().positive().nullable(),
});
export type TrendPoint = z.infer<typeof trendPointSchema>;

export const MIN_DAYS_FOR_CONCLUSION = 5;

export function insightConclusion(points: TrendPoint[]): { ok: boolean; text: string } {
  const withData = points.filter((p) => p.kcal !== null);
  if (withData.length < MIN_DAYS_FOR_CONCLUSION) {
    return { ok: false, text: "Nog geen betrouwbare conclusie — te weinig data." };
  }
  return { ok: true, text: `Gebaseerd op ${withData.length} dagen met data.` };
}

export const authRegisterSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(200),
});
export const authLoginSchema = authRegisterSchema;
export type AuthRegister = z.infer<typeof authRegisterSchema>;

export function formatNL(n: number, digits = 1): string {
  return n.toFixed(digits).replace(".", ",");
}

// NL-invoer: "12,5" of "12.5" → number. Lege string → null.
export function parseNL(s: string): number | null {
  const t = s.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
