import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { startServer } from "./index.js";

const originalExitCode = process.exitCode;

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = originalExitCode;
});

describe("startup deploylogs", () => {
  it("logs applied migration filenames and the actual bound port only after listen succeeds", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const app = Fastify({ logger: false });
    const migrations = vi.fn(async () => ["0001_init.sql", "0002_auth_rate_limits.sql"]);
    try {
      await startServer(migrations, () => app, 0);
      const bound = app.server.address();
      if (!bound || typeof bound === "string") throw new Error("expected a TCP listener");
      expect(migrations).toHaveBeenCalledOnce();
      expect(log.mock.calls.map(([message]) => message)).toEqual([
        "migratie 0001_init.sql toegepast",
        "migratie 0002_auth_rate_limits.sql toegepast",
        `bitewise-2.0-api luistert op :${bound.port}`,
      ]);
    } finally {
      await app.close();
    }
  });

  it("does not claim a migration or open a listener if migration fails", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const makeApp = vi.fn(() => Fastify({ logger: false }));
    await expect(startServer(async () => { throw new Error("database unavailable"); }, makeApp, 8080))
      .rejects.toThrow("database unavailable");
    expect(makeApp).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("does not claim a listener if listen fails after migrations", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const app = Fastify({ logger: false });
    const failure = new Error("address in use");
    vi.spyOn(app, "listen").mockRejectedValue(failure);
    const error = vi.spyOn(app.log, "error");
    const close = vi.spyOn(app, "close");
    await startServer(async () => ["0001_init.sql"], () => app, 8080);
    expect(log.mock.calls.map(([message]) => message)).toEqual(["migratie 0001_init.sql toegepast"]);
    expect(error).toHaveBeenCalledWith(failure);
    expect(close).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(1);
  });

  it("does not invent migration filenames when none were returned", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const app = Fastify({ logger: false });
    try {
      await startServer(async () => [], () => app, 0);
      expect(log).toHaveBeenCalledOnce();
      expect(log.mock.calls[0]?.[0]).toMatch(/^bitewise-2\.0-api luistert op :\d+$/);
    } finally {
      await app.close();
    }
  });
});
