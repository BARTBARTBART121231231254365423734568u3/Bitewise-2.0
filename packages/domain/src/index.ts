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

export const portionSchema = z.object({
  label: z.string().min(1),
  grams: z.number().positive().nullable(), // null = onbekende conversie → alleen gram/ml toegestaan in UI
  ml: z.number().positive().nullable().optional(),
});

export const diaryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal: z.enum(["ontbijt", "lunch", "diner", "snack"]),
  productId: z.string().min(1),
  grams: z.number().positive(),
});

export function formatNL(n: number, digits = 1): string {
  return n.toFixed(digits).replace(".", ",");
}
