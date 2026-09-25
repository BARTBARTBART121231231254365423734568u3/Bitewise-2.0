import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LogForm } from "../src/screens/Food";
import { newProductPayload } from "../src/screens/food-input";
import { finishAuth } from "../src/screens/auth-flow";
import type { Product } from "../src/api";

const meals = [{ id: "ontbijt", label: "Ontbijt", sort: 0 }];
const payload = newProductPayload({ name: " Bakje yoghurt ", brand: "", kcal: "350", protein: "10", carbs: "20", fat: "5", portions: "bakje=40\nschep" });
function product(lastPortionLabel: string): Product {
  return { id: "test", name: payload.name, brand: null, barcode: null, per100g: { kcal: 350, protein: 10, carbs: 20, fat: 5 }, portions: payload.portions, lastPortionLabel, lastUsedAt: null, updatedAt: "" };
}

test("new product POST payload includes known and unknown portions; last-used known portion previews 40g/140kcal", () => {
  assert.equal(payload.name, "Bakje yoghurt");
  assert.deepEqual(payload.portions, [{ label: "bakje", grams: 40 }, { label: "schep", grams: null }]);
  const html = renderToStaticMarkup(<LogForm product={product("bakje")} recepten={[]} date="2026-09-23" meals={meals} onGelukt={() => {}} />);
  assert.match(html, /<option value="bakje" selected="">bakje \(40 g\)<\/option>/);
  assert.match(html, /Aantal porties/);
  assert.match(html, /40,0 g · 140 kcal/);
});

test("last-used unknown portion requires manually entered grams instead of a false conversion", () => {
  const html = renderToStaticMarkup(<LogForm product={product("schep")} recepten={[]} date="2026-09-23" meals={meals} onGelukt={() => {}} />);
  assert.match(html, /<option value="schep" selected="">schep \(conversie onbekend\)<\/option>/);
  assert.match(html, /Gram \/ ml/);
  assert.match(html, /placeholder="alleen gram\/ml"/);
  assert.doesNotMatch(html, /40,0 g · 140 kcal/);
});

for (const path of ["/onboarding", "/"]) {
  test(`auth waits for the refreshed identity before navigating to ${path}`, async () => {
    const calls: string[] = [];
    let resume!: () => void;
    const pending = new Promise<void>((resolve) => { resume = resolve; });
    const flow = finishAuth(async () => { calls.push("GET /api/auth/me"); await pending; calls.push("setMe"); }, (to) => { calls.push(`navigate ${to}`); }, path);
    assert.deepEqual(calls, ["GET /api/auth/me"]);
    resume();
    await flow;
    assert.deepEqual(calls, ["GET /api/auth/me", "setMe", `navigate ${path}`]);
  });
}
