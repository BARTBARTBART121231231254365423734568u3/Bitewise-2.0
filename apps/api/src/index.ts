import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3001);
// In dist/ is dit ../web/dist; lokaal valt het terug op no-static.
const webDist = process.env.WEB_DIST ?? join(__dirname, "..", "web", "dist");

export function buildApp() {
  const app = Fastify({ logger: true });
  app.get("/health", async () => ({ ok: true, service: "bitewise-2.0-api" }));
  app.get("/api/auth/status", async () => ({ authenticated: false, phase: "fase-0-prototype" }));
  return app;
}

const app = buildApp();

if (existsSync(webDist)) {
  void app.register(fastifyStatic, { root: webDist });
  app.setNotFoundHandler((_, reply) => reply.sendFile("index.html"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await app.listen({ port, host: "0.0.0.0" });
}
