import { parseNL } from "@bitewise/domain";

// Keep the payload constructor beside the form so portions cannot be parsed
// and then silently dropped when the product is submitted.
export function newProductPayload(input: {
  name: string;
  brand: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  portions: string;
}) {
  return {
    name: input.name.trim(),
    brand: input.brand.trim() || undefined,
    per100g: {
      kcal: parseNL(input.kcal),
      protein: parseNL(input.protein),
      carbs: parseNL(input.carbs),
      fat: parseNL(input.fat),
    },
    portions: input.portions
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => {
        const [label, rest] = row.split("=").map((value) => value.trim());
        return { label, grams: rest ? parseNL(rest) : null };
      }),
  };
}
