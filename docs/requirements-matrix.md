# Requirementsmatrix — 57 ID's (oorspronkelijke nummering 1–65, gaten opzettelijk)

Status per ID: `niet gestart | gebouwd | lokaal getest | extern geverifieerd | geblokkeerd`.
`gebouwd` ≠ `lokaal getest`. Bewijslink verplicht bij `lokaal getest` of hoger.

Kolommen: Fase = opleverfase (0 = ontwerp/risico, geen bouw). Scherm = vaste route-ID uit `SCREEN-FLOW.md`. API = doel-endpoint (Fase 0: nog niet gebouwd). Datatabel = doel-entiteit uit `docs/architecture.md`. Test = acceptatieproef. Bewijs = link naar testbewijs.

Fase 0-stand (2026-09-25): alle 57 ID's staan op `niet gestart`. Dat klopt — Fase 0 levert ontwerp + risicoanalyse, geen werkende functies. Het klikbare prototype in `apps/web` gebruikt als demo gelabelde nep-data en geldt voor geen enkele ID als bewijs.

| ID | Functie | Fase | Scherm | API (doel) | Datatabel | Test | Status | Bewijs |
|----|---------|------|--------|------------|-----------|------|--------|--------|
| 1 | Dagboek met instelbare maaltijdmomenten | 1 | D0/D2 | /api/diary, /api/diary-entries | meal moments, diary snapshots | add/edit/delete/move | niet gestart | — |
| 2 | Producten/maaltijden/recepten toevoegen | 1 | F0→F5→D0 | POST /api/diary-entries | diary snapshots, products, saved meals, recipes | F5-bevestiging | niet gestart | — |
| 3 | Portiekeuze, gram altijd, onthoud laatste, direct herberekenen | 1 | F5 | /api/products/:id/portions | portions (+conversies), products | bekende/onbekende conversie | niet gestart | — |
| 4 | Handmatige invoer naam/kcal/macro | 1 | F4→F5 | POST /api/products (handmatig) | products (handmatig, eigen) | validatie | niet gestart | — |
| 5 | Maaltijden plannen, later als gegeten registreren | 1 | D5 | /api/planned-items | planned items, diary snapshots | gepland≠gegeten | niet gestart | — |
| 6 | Gisteren/vaste consumpties opnieuw, nooit auto-log | 1 | D6 | POST /api/diary-entries (repeat, bevestigd) | diary snapshots, saved meals | bevestiging vereist | niet gestart | — |
| 7 | Items bewerken/verplaatsen/verwijderen | 1 | D2 | PATCH/DELETE /api/diary-entries/:id | diary snapshots | undo-gedrag | niet gestart | — |
| 8 | Maaltijden kopiëren/verplaatsen/bewaren/leegmaken | 1 | D2 | /api/diary-entries (copy/move), /api/saved-meals | diary snapshots, saved meals | bevestiging | niet gestart | — |
| 9 | Dag- en maaltijdtotalen | 1 | D0/D2 | GET /api/diary?date= | diary snapshots (recompute) | recompute | niet gestart | — |
| 10 | Water + dagdoel | 1 | D3 | /api/water, /api/goals | water, goals | add/edit | niet gestart | — |
| 11 | Gewicht (geen overige metingen) | 1 | D4 | /api/weight | weight | historie | niet gestart | — |
| 12 | Dagnotities + doorzoekbare geschiedenis | 1 | D1/D4 | /api/notes (+zoek) | notes | zoeken | niet gestart | — |
| 14 | Eigen producten maken/beheren | 1 | F6 | /api/products (CRUD eigen) | products (+herkomst) | CRUD | niet gestart | — |
| 15 | Foto/merk/barcode/categorie/labels/notities | 1 | F2/F6 | /api/products/:id (+upload) | products (+foto/meta) | upload-misbruiktest | niet gestart | — |
| 16 | Recent/vaak/favoriet snel terugvinden | 1 | F1 | GET /api/products (views) | products, saved meals (ranking-views) | ranking | niet gestart | — |
| 17 | Zoeken/filteren incl. allergenen | 2 | F1 | GET /api/products (filter) | products (filter-views) | filter-sheet | niet gestart | — |
| 18 | Barcode scan, onbekend via foto/handmatig + controle | 2 | F3→F4→F5 | /api/scan/barcode, POST /api/products | products, portions | bekend/onbekend | niet gestart | — |
| 19 | EU-bronnen na NL-steekproef, herkomst/kwaliteit tonen | 2 | F1/F2 | /api/products (bron-import) | products (+herkomst/kwaliteit), nutrients | licentie-gate | niet gestart | — |
| 21 | Maaltijden/recepten uit ingrediënten | 1 | F7 | /api/recipes | recipes, recipe ingredient quantities | opbouwen | niet gestart | — |
| 22 | Ingrediënten ordenen + voeding berekenen | 1 | F7 | /api/recipes/:id | recipes, nutrients | herberekend bij wijziging | niet gestart | — |
| 24 | Zichtbare nutriënten kiezen + eigen toevoegen | 2 | F1/S1 | /api/nutrients, /api/profile | nutrients (+nullable), profiles | null≠0 | niet gestart | — |
| 25 | Calorie- en macrodoelen | 1 | G0/G1 | /api/goals | goals (geldigheidsperiode) | voortgang | niet gestart | — |
| 26 | Water/gewicht/voeding/health-doelen | 1 | G0/G1 | /api/goals | goals (geldigheidsperiode) | geen lichaamsmetingen | niet gestart | — |
| 28 | Onboarding met startvoorstel kcal/macro | 1 | A0–A4 | /api/onboarding, /api/goals | profiles, goals | eerste signup | niet gestart | — |
| 29 | Voortgang dag/week | 1 | D0/I0 | /api/goals/progress, /api/diary | goals, diary snapshots | dag/week | niet gestart | — |
| 30 | Dynamisch doel alleen bij betrouwbare data | 1 | G1 | /api/goals (dynamisch) | goals, health measurements | geen schijnprecisie | niet gestart | — |
| 32 | Trends voeding/gewicht/health | 1 | I0–I3 | /api/insights | diary snapshots, weight, health measurements | periode | niet gestart | — |
| 33 | Modern begrijpelijk, niet alles grafiek | 1 | I0 | /api/insights (presentatie) | — (presentatie van bestaande data) | — | niet gestart | — |
| 34 | Periode zelf kiezen | 1 | I0 | /api/insights?periode= | — (periode-state, client) | behoud bij terugnav | niet gestart | — |
| 35 | Gemiddelden/uitschieters/regelmaat/ver retros | 2 | I3 | /api/insights (vergelijk) | diary snapshots, weight | vergelijk | niet gestart | — |
| 36 | Macroverdeling/weekpatronen/doelvoortgang | 2 | I1–I3 | /api/insights | diary snapshots, goals | — | niet gestart | — |
| 37 | Verklaarbare tips, verbergbaar, anders ‘nog geen betrouwbare conclusie’ | 2 | I4 | /api/insights/tips | diary snapshots | onvoldoende data | niet gestart | — |
| 38 | Slaap/herstel/activiteit alleen bij voldoende data | 3 | H1–H3 | /api/health/scores | health measurements/sources | drempels | niet gestart | — |
| 39 | Bron + actualiteit tonen | 3 | H0 | /api/health/measurements | health sources/measurements | stale/fout | niet gestart | — |
| 40 | Alleen nieuwe Google Health-cloud | 3 | S2/H0 | /api/health/sources (google) | health sources/consents | productnaam-gate | niet gestart | — |
| 41 | Sync: auto waar kan, laatste sync, fout, Nu synchroniseren | 3 | H0 | /api/health/sync | health sync-runs/sources | sync-fout/stale | niet gestart | — |
| 42 | Health Connect (Android) | 3 | S2/H0 | /api/health/sources (health-connect) | health sources/consents | buildpad-gate | niet gestart | — |
| 43 | Apple Health via echte iPhone-route | 3 | S2/H0 | /api/health/sources (apple) | health sources/consents | buildpad-gate | niet gestart | — |
| 44 | Strava apart | 3 | S2/H0 | /api/health/sources (strava) | health sources/consents | OAuth/dedupe | niet gestart | — |
| 45 | AI-assistent voeding/doelen/eigen data | 4 | AI0 | /api/ai/chat | AI-config/usage, consents | consent | niet gestart | — |
| 46 | AI provider/model-keuze (beheerd, geen BYOK) | 4 | S3 | /api/ai/config | AI-config/usage | budget-gate | niet gestart | — |
| 47 | Maaltijdfoto + controle vóór opslaan | 4 | F4→F5 | /api/ai/photo-concept → /api/diary-entries | products (concept), AI-usage | concept-correctie | niet gestart | — |
| 48 | Spraak + controle vóór opslaan | 4 | F4→F5 | /api/ai/voice-concept → /api/diary-entries | AI-usage (concept) | transcript-correctie | niet gestart | — |
| 49 | Suggesties op echte patronen, uitleg, verbergbaar, nooit auto-doel | 4 | I4/AI0 | /api/ai/suggesties | AI-config/usage, diary snapshots | — | niet gestart | — |
| 50 | Eén persoon per account, strikte scheiding | 1 | A1 | auth-scope (alle queries owner-scoped) | users, profiles | isolatie-test | niet gestart | — |
| 51 | Aanmelden/registreren/herstellen/profiel | 1 | A1/S1 | /api/auth/* | users/sessions/verification/reset | mailpad bij pilot | niet gestart | — |
| 52 | Admin uitnodigen/beheren, geen gedeelde accounts | 1 | S5 | /api/admin/users | users, admin audit | autorisatie | niet gestart | — |
| 53 | Vrienden + exacte zichtbaarheid, alles privé default | 4 | V0/V1 | /api/friends | friendships/ACL | ACL default-deny | niet gestart | — |
| 54 | Actuele meldingsoplossing kiezen | 4 | N0/N1 | /api/notifications | notifications (preferences/inbox) | capability-test | niet gestart | — |
| 55 | Herinneringen eten/drinken/wegen/slapen | 4 | N0 | /api/notifications/reminders | notifications (preferences) | opt-in/quiet hours | niet gestart | — |
| 56 | Waarschuwingen doelen/health/sync zonder spam | 4 | N1 | /api/notifications/alerts | notifications (inbox/preferences) | bundeling | niet gestart | — |
| 57 | Optioneel weekoverzicht (geen auto-check-in) | 4 | N0 | /api/notifications/weekoverzicht | notifications | — | niet gestart | — |
| 58 | Licht/donker + passende navigatie | 1 | alle | — (client thema) | profiles (themavoorkeur) | light/dark/tekstgrootte | niet gestart | — |
| 59 | Taal/datum/eenheden (NL default, EN beschikbaar) | 1 | S1 | /api/profile | profiles (locale) | locale-regels | niet gestart | — |
| 63 | Eigen data/account verwijderen | 1 | S4 | /api/account/export, DELETE /api/account | users (+cascade), admin audit | controleerbaar resultaat | niet gestart | — |
| 64 | Diagnostische logs alleen admin | 1 | S5 | /api/admin/logs | admin audit | PII-scrub | niet gestart | — |
| 65 | Platformmix web/PWA/native onderbouwd | 3 | — | — (platformkeuze) | — (capability-matrix) | capability-matrix | niet gestart | — |

Overgeslagen nummers (13, 20, 23, 27, 31, 60–62) zijn opzettelijk en blijven onaangeroerd.

Bron: GOAL-handoff `BiteWise-Spark-GOAL.md` + appendix (57 functies, 2026-09-25). Alleen gelezen als productinput; geen code uit de oude BiteWise hergebruikt.
