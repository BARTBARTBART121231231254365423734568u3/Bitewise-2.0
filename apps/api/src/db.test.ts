import { describe, expect, it } from "vitest";
import { postgresTlsOptions } from "./db.js";

describe("Railway private Postgres TLS exception", () => {
  it("accepts only private Railway DNS", () => {
    expect(postgresTlsOptions("postgres://u:p@postgres.railway.internal:5432/db")).toEqual({ ssl: { rejectUnauthorized: false } });
    expect(postgresTlsOptions("postgres://u:p@pg.prod.railway.internal/db?sslmode=disable")).toEqual({ ssl: { rejectUnauthorized: false } });
  });
  it("rejects public, suffix-spoofed, and userinfo-spoofed hosts", () => {
    for (const url of [
      "postgres://u:p@public.proxy.rlwy.net:5432/db?sslmode=require",
      "postgres://u:p@postgres.railway.internal.attacker.com/db?sslmode=require",
      "postgres://postgres.railway.internal@evil.net/db?sslmode=require",
      "postgres://u:p@db.example.com/db?sslmode=disable",
    ]) expect(postgresTlsOptions(url)).toEqual({ ssl: "verify-full" });
    expect(postgresTlsOptions("postgres://u:p@localhost:5432/db")).toEqual({});
    expect(postgresTlsOptions("postgres://u:p@localhost:5432/db?sslmode=require")).toEqual({ ssl: "verify-full" });
  });
});
