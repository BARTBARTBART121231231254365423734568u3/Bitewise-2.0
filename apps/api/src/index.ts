// BITEWISE 2.0 API — production entrypoint; app routes and SPA live in app.ts.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { migrate } from "./migrate.js";

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) {
  // Never expose an unmigrated or unavailable database as a healthy deployment.
  await migrate();
  const app = buildApp();
  try {
    await app.listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    await app.close();
    process.exitCode = 1;
  }
}

export { buildApp };
