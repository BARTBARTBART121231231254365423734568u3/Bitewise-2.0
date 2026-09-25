# BITEWISE 2.0 — greenfield

Nieuwe, zelfstandige BiteWise-app. Geen refactor van de bestaande BiteWise.
Bestaande code/DB/hosting wordt niet geraakt. Werk uitsluitend in deze map.

Bronnen (alleen lezen als productinput, niet kopiëren):
- `DESIGN.md` — visuele tokens
- `SCREEN-FLOW.md` — leidend voor navigatie (Dagboek | Eten | Inzicht | Gezondheid | Meer)
- `SPARK_GOAL.md` — oude prompt (vervangen door `GOAL.md` in handoff-zip)
- `FUNCTIONALITEITEN.md` — zie handoff (57 ID's, eindscope)

## Structuur (pnpm TypeScript-monorepo)

- `apps/web` — React + Vite mobiele PWA (5 tabs + F0→F5→D0 prototype)
- `apps/api` — Fastify REST (`/health`, `/api/auth/status`, serveert web-dist in productie)
- `packages/domain` — Zod-contracten, rekenregels, formatters
- `packages/ui` — design tokens + toegankelijke controls
- `docs/` — Fase 0 besluiten, matrix, architectuur, gates

## Lokaal draaien

Vereist: Node 22.23.2, pnpm 9.12.0 (`~/.local/bin/pnpm` op hermesjpt).

```bash
export PATH="$HOME/.local/bin:$PATH"
pnpm install
pnpm dev        # api :3001, web :5173
pnpm verify     # lint + typecheck + unit + build
```

Docker (Postgres + API + web):

```bash
docker compose up --build
```

## Railway

Repo is Railway-klaar, maar er is **geen** publieke deployment geautoriseerd.
Thomas koppelt zelf `Bitewise-2.0` op GitHub aan een nieuw Railway-project:

- Root `Dockerfile` bouwt web + api en serveert alles via api op `$PORT`
- `railway.json` gebruikt Dockerfile-builder
- Geen secrets in repo — zie `.env.example`

## Status

Fase 0 gestart: klikbaar prototype in `apps/web`, docs in `docs/`.
57 ID's: zie `docs/requirements-matrix.md`. Niets is ‘klaar’ zonder testbewijs.
