// Kopieerdoel voor dist/: drizzle/*.sql moet naast dist/src bereikbaar zijn.
// `pnpm build` kopieert de map (zie package.json build-script).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { databaseUrl } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [join(here, "..", "drizzle"), join(here, "..", "..", "drizzle")];

function drizzleDir(): string {
  const hit = candidates.find((d) => existsSync(d));
  if (!hit) throw new Error(`drizzle-map niet gevonden (gezocht: ${candidates.join(", ")})`);
  return hit;
}

export async function migrate(url = databaseUrl()): Promise<string[]> {
  const dir = drizzleDir();
  const sql = postgres(url, { max: 1 });
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const f of files) {
      await sql.unsafe(readFileSync(join(dir, f), "utf8"));
    }
    return files;
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = await migrate();
  console.log(`migrated: ${files.join(", ")}`);
}
