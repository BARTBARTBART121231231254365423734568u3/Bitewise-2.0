// BITEWISE 2.0 API — bootstrap. App staat in app.ts (testbaar via buildApp),
// migraties in migrate.ts. Start: `pnpm dev` / `pnpm start` (na `pnpm build`).
import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);

if (import.meta.url === `file://${process.argv[1]}`) {
  const { migrate } = await import("./migrate.js");
  try {
    const files = await migrate();
    console.log(`migraties toegepast: ${files.join(", ")}`);
  } catch (e) {
    console.error("migratie mislukt (start toch, check DATABASE_URL):", (e as Error).message);
  }
  const app = buildApp();
  await app.listen({ port, host: "0.0.0.0" });
}

export { buildApp };
