import { describe, expect, it } from "vitest";
import { scaleMacros } from "./index.js";

describe("scaleMacros", () => {
  it("schaalt per 100g naar grammen", () => {
    expect(scaleMacros({ kcal: 200, protein: 10, carbs: 20, fat: 5 }, 50)).toEqual({
      kcal: 100,
      protein: 5,
      carbs: 10,
      fat: 2.5,
    });
  });
  it("onbekend blijft onbekend (geen nul)", () => {
    const r = scaleMacros({ kcal: 100, protein: null, carbs: null, fat: null }, 200);
    expect(r.protein).toBeNull();
    expect(r.kcal).toBe(200);
  });
});
