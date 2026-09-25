# Architectuur BITEWISE 2.0 (Fase 0)

## Monorepo

- `apps/web`: React + Vite mobiele PWA, React Router, TanStack Query, Dexie (offline cache + outbox)
- `apps/api`: Fastify REST, PostgreSQL + Drizzle + versioned migrations
- `packages/domain`: Zod-contracten, rekenregels, formatters (kcal/macro, afronding, NL-locale)
- `packages/ui`: design tokens + toegankelijke controls (44px, focus, aria)
- `apps/native` pas in native fase (Capacitor-shell op bewezen plugins)

## Routes (vaste IDs uit screen flow)

A0–A4, D0–D6, F0–F7, I0–I4, H0–H4, M0, G0/G1, V0/V1, AI0, N0/N1, S0–S5.
Diepe routes herstelbaar na refresh, met auth-redirect en juiste tabstaat.

## Data (Fase 1 eerst)

users/sessions/verification/reset, profiles, goals (geldigheidsperiode),
meal moments, products (+herkomst), nutrients (+nullable), portions (+conversies),
diary snapshots (immutable), recipes, saved meals, water, weight, notes,
planned items, health sources/measurements/sync-runs/consents,
friendships/ACL, notifications, AI-config/usage, admin audit.

Regels: elke private rij heeft owner-id; adminacties gelogd; API isoleert per query;
historisch dagboek verandert niet als bronproduct wijzigt; onbekend ≠ 0.

## Auth (doel Fase 1)

Argon2id, HttpOnly/Secure/SameSite cookie, CSRF waar nodig, server-side intrekking,
rate-limit, e-mailverificatie + reset via echte mailinfra (pas bij pilot).

## Offline

Laatst bekende eigen data leesbaar met zichtbare status; outbox voor idempotente
dagboekmutaties; expliciete conflictresolutie; geen geveinsde sync.

## Tooling

Node 22.23.2, pnpm 9.12.0, lockfile gepind. `pnpm verify` = lint + typecheck + test + build.
Vitest + Playwright. Eén Dockerfile voor Railway (api serveert web-dist).
