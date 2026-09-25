# Fase 0-handoff BITEWISE 2.0 (2026-09-25)

Fase 0 = ontwerp + technische risico's. Dit is géén werkende applicatie.

## Wat werkt echt

- Monorepo-scaffold (`apps/web`, `apps/api`, `packages/domain`, `packages/ui`),
  Node 22.23.2 / pnpm 9.12.0 gepind, lockfile, `.env.example` zonder secrets.
- Klikbaar ontwerp-prototype in `apps/web`: 5 tabs + F0→F5→D0 met demo-data
  (expliciet als demo gelabeld, geen echte logs, geen backend).
- API-skelet: `GET /health` → `{ok:true}`, `GET /api/auth/status` →
  `{authenticated:false, phase:"fase-0-prototype"}`; serveert web-dist in productie.
- Domeinregels: `scaleMacros` (onbekend=null, nooit 0), `formatNL` (decimale komma),
  Zod-contracten voor macro's/porties/dagboekinvoer.
- Docs: `product-decisions.md` (conflictresolutie), `requirements-matrix.md`
  (exact 57 ID's, alle `niet gestart`), `architecture.md`, `risks-and-gates.md`
  (7 concrete gates + veilig-door-lijst), deze handoff.

## Tests met echte uitvoer (2026-09-25, `pnpm verify` → exit 0)

- lint: alle 4 workspace-projecten ok.
- typecheck: alle 4 projecten ok.
- test: `packages/domain` 2/2 geslaagd (schaal + onbekend≠nul), `apps/api` 2/2
  geslaagd (`/health` 200, `/api/auth/status` fase-0); web/ui test-scripts zijn nog
  echo-placeholders (`web-test-ok`), géén echte tests.
- build: domain/ui/api `tsc` ok; web `vite build` ok (42 modules,
  `dist/index.html` 0,48 kB, JS 202,72 kB / gzip 59,85 kB).
- Eerlijke beperking: web/ui lint- en test-scripts zijn placeholders; echte ESLint-,
  Vitest- en Playwright-dekking (incl. DB-migratie op tijdelijke DB, offline→online,
  toegankelijkheid) volgt in Fase 1. Niets hierboven bewijst een productfunctie.

## Resterende ID's

Alle 57 ID's `niet gestart` (zie `requirements-matrix.md`). Fase 1-doelkern: ID
1–12, 14–16, 21–22, 25–26, 28–30, 32–34, 50–52, 58–59, 63–64.

## Resterende gates

Alle 7 gates open (zie `risks-and-gates.md`): voedingsbron-steekproef, Google
Health-naam/API, Health Connect/Apple-buildpad, Strava-contract, AI-budgetbesluit,
push-capability, pilot-gates + release-goedkeuring. Geen enkele externe proef uitgevoerd.

## Handoff-regel (alle fasen)

Na elke fase: wat werkt echt, tests met echte uitvoer, resterende ID's/gates.
Nooit een ongeteste connector, native app of publieke release ‘klaar’ noemen.
Bewijslink verplicht bij `lokaal getest` of hoger.
