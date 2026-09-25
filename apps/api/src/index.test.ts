import { describe, expect, it } from "vitest";
import { buildApp } from "./index.js";

describe("api", () => {
  it("health is ok", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
  });
  it("auth status meldt fase-0", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/api/auth/status" });
    expect(res.statusCode).toBe(200);
    expect(res.json().phase).toBe("fase-0-prototype");
  });
});
