// BITEWISE 2.0 API — production entrypoint; app routes and SPA live in app.ts.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { migrate } from "./migrate.js";

export async function startServer(
  runMigrations: typeof migrate = migrate,
  makeApp: typeof buildApp = buildApp,
  port = Number(process.env.PORT ?? 3001),
) {
  // Never expose an unmigrated or unavailable database as a healthy deployment.
  const files = await runMigrations();
  for (const file of files) console.log(`migratie ${file} toegepast`);
  const app = makeApp();
  try {
    const address = await app.listen({ port, host: "0.0.0.0" });
    console.log(`bitewise-2.0-api luistert op :${new URL(address).port}`);
  } catch (error) {
    app.log.error(error);
    await app.close();
    process.exitCode = 1;
  }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) {
  await startServer();
}

export { buildApp };
