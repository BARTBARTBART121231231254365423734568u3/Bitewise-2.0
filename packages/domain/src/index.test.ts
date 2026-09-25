import { describe, expect, it } from "vitest";
import {
  addMacros,
  insightConclusion,
  parseNL,
  portionGrams,
  recipeTotals,
  scaleMacros,
} from "./index.js";

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

describe("addMacros", () => {
  it("strikt: één onbekende component maakt het totaal onbekend", () => {
    const r = addMacros(
      { kcal: 100, protein: null, carbs: 10, fat: 2 },
      { kcal: 50, protein: null, carbs: 5, fat: null },
    );
    expect(r).toEqual({ kcal: 150, protein: null, carbs: 15, fat: null });
  });
});

describe("portionGrams", () => {
  it("bekende conversie rekent om", () => {
    expect(portionGrams({ label: "snee", grams: 35 }, 2)).toBe(70);
  });
  it("onbekende conversie weigert (UI valt terug op gram/ml)", () => {
    expect(() => portionGrams({ label: "portie", grams: null }, 1)).toThrow();
  });
});

describe("recipeTotals", () => {
  it("herberekent uit actuele per100g-waarden", () => {
    const r = recipeTotals([
      { per100g: { kcal: 100, protein: 10, carbs: null, fat: 5 }, grams: 200 },
      { per100g: { kcal: 50, protein: 5, carbs: 5, fat: null }, grams: 100 },
    ]);
    expect(r.kcal).toBe(250);
    expect(r.carbs).toBeNull();
  });
});

describe("insightConclusion", () => {
  it("te weinig data → geen conclusie", () => {
    const pts = ["01", "02", "03"].map((d) => ({
      date: `2026-09-${d}`,
      kcal: 1800,
      weightKg: null as number | null,
    }));
    expect(insightConclusion(pts).ok).toBe(false);
  });
  it("null telt niet mee als datadag", () => {
    const pts = [1, 2, 3, 4, 5, 6].map((d) => ({
      date: `2026-09-0${d}`,
      kcal: d <= 2 ? (1800 as number | null) : null,
      weightKg: null as number | null,
    }));
    expect(insightConclusion(pts).ok).toBe(false);
  });
});

describe("parseNL", () => {
  it("komma en punt worden allebei begrepen", () => {
    expect(parseNL("12,5")).toBe(12.5);
    expect(parseNL("12.5")).toBe(12.5);
    expect(parseNL("")).toBeNull();
  });
});
