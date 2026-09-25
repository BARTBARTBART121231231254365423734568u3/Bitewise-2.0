# Requirementsmatrix — 57 ID's (oorspronkelijke nummering 1–65, gaten opzettelijk)

Status per ID: `niet gestart | gebouwd | lokaal getest | extern geverifieerd | geblokkeerd`.
`gebouwd` ≠ `lokaal getest`. Bewijslink verplicht bij getest.

Fase 0-besluiten, scope en open gates staan in [fase-0-handoff.md](fase-0-handoff.md), [product-decisions.md](product-decisions.md) en [risks-and-gates.md](risks-and-gates.md). Fase-1-bewijs uit t_200df7b5 gold voor de oorspronkelijke commit 02b342f (9 domain-tests, 16 API-tests en 9 screenshots), **niet** als UI-herreview van het herstel. t_9f2ce097 herstelt de in t_2644c38d gevonden regressies: lokale Postgres-API-suite + Chromium-mobile smoke op 390×844 (gekozen datum/eigen moment/portie 40g=140kcal/gewichtshistorie/account DELETE). t_535f360a test de auth-limieten in tijdelijke Postgres en nieuwe web-regressies voor productpayload, portie-SSR en auth-volgorde, **niet** een nieuwe Chromium-clickflow; registratie→onboarding en product opslaan→herladen blijven als browser-herreview open. De onafhankelijke security- en functionele review lopen nog; `lokaal getest` betekent niet extern geverifieerd. Een lokaal geteste API bewijst niet automatisch de hele UI-flow; open deelvereisten blijven expliciet genoemd.

| ID | Functie | Fase | Scherm/API | Test | Status | Bewijs |
|----|---------|------|------------|------|--------|--------|
| 1 | Dagboek met instelbare maaltijdmomenten | 1 | D0/D2 | add/edit/delete/move | gebouwd | t_200df7b5 + t_9f2ce097 (eigen momenten in eten; verplaatsen via UI nog open) |
| 2 | Producten/maaltijden/recepten toevoegen | 1 | F0→F5→D0 | F5-bevestiging | lokaal getest | t_200df7b5 |
| 3 | Portiekeuze, gram altijd, onthoud laatste, direct herberekenen | 1 | F5 | bekende/onbekende conversie | lokaal getest | t_9f2ce097 (Chromium 40g/140kcal); t_535f360a (SSR last-used/preview + onbekende conversie). Nieuwe browserklik voor opslaan/laatst gebruikt nog open. |
| 4 | Handmatige invoer naam/kcal/macro | 1 | F4→F5 | validatie | lokaal getest | t_200df7b5 |
| 5 | Maaltijden plannen, later als gegeten registreren | 1 | D5 | gepland≠gegeten | lokaal getest | t_200df7b5 |
| 6 | Gisteren/vaste consumpties opnieuw, nooit auto-log | 1 | D6 | bevestiging vereist | lokaal getest | t_200df7b5 |
| 7 | Items bewerken/verplaatsen/verwijderen | 1 | D2 | undo-gedrag | gebouwd | t_200df7b5 (geen undo) |
| 8 | Maaltijden kopiëren/verplaatsen/bewaren/leegmaken | 1 | D2 | bevestiging | gebouwd | t_200df7b5 (alleen kopiëren) |
| 9 | Dag- en maaltijdtotalen | 1 | D0/D2 | recompute | gebouwd | t_200df7b5 (API/dagtotaal); maaltijdtotalen bij wijzigingen niet afzonderlijk end-to-end hergetest. |
| 10 | Water + dagdoel | 1 | D3 | add/edit | gebouwd | t_200df7b5 (toevoegen/verwijderen, geen edit) |
| 11 | Gewicht (geen overige metingen) | 1 | D4 | historie | lokaal getest | t_200df7b5 |
| 12 | Dagnotities + doorzoekbare geschiedenis | 1 | D1/D4 | zoeken | lokaal getest | t_200df7b5 |
| 14 | Eigen producten maken/beheren | 1 | F6 | CRUD | gebouwd | t_200df7b5 (API CRUD); t_535f360a (porties in nieuwe productpayload). Browserflow product opslaan→ophalen/bewerken nog open. |
| 15 | Foto/merk/barcode/categorie/labels/notities | 1 | F2/F6 | upload-misbruiktest | gebouwd | t_200df7b5 (merk/barcode; geen foto-upload) |
| 16 | Recent/vaak/favoriet snel terugvinden | 1 | F1 | ranking | gebouwd | t_200df7b5 (recent; geen favorieten) |
| 17 | Zoeken/filteren incl. allergenen | 2 | F1 | filter-sheet | niet gestart | — |
| 18 | Barcode scan, onbekend via foto/handmatig + controle | 2 | F3→F4→F5 | bekend/onbekend | niet gestart | — |
| 19 | EU-bronnen na NL-steekproef, herkomst/kwaliteit tonen | 2 | F1/F2 | licentie-gate | niet gestart | — |
| 21 | Maaltijden/recepten uit ingrediënten | 1 | F7 | opbouwen | lokaal getest | t_200df7b5 |
| 22 | Ingrediënten ordenen + voeding berekenen | 1 | F7 | herberekend bij wijziging | gebouwd | t_200df7b5 (berekening); herschikken en herberekenen na UI-wijziging nog open. |
| 24 | Zichtbare nutriënten kiezen + eigen toevoegen | 2 | F1/S1 | null≠0 | niet gestart | — |
| 25 | Calorie- en macrodoelen | 1 | G0/G1 | voortgang | lokaal getest | t_200df7b5 |
| 26 | Water/gewicht/voeding/health-doelen | 1 | G0/G1 | geen lichaamsmetingen | gebouwd | t_200df7b5 (geen health-koppelingen) |
| 28 | Onboarding met startvoorstel kcal/macro | 1 | A0–A4 | eerste signup | lokaal getest | t_200df7b5 |
| 29 | Voortgang dag/week | 1 | D0/I0 | dag/week | gebouwd | t_200df7b5 (dag; week beperkt tot trendperiode) |
| 30 | Dynamisch doel alleen bij betrouwbare data | 1 | G1 | geen schijnprecisie | lokaal getest | t_200df7b5 |
| 32 | Trends voeding/gewicht/health | 1 | I0–I3 | periode | gebouwd | t_200df7b5 (voeding/gewicht, health-data ontbreken) |
| 33 | Modern begrijpelijk, niet alles grafiek | 1 | I0 | — | lokaal getest | t_200df7b5 |
| 34 | Periode zelf kiezen | 1 | I0 | behoud bij terugnav | gebouwd | t_200df7b5 (periode kiezen; behoud bij terugnav nog open) |
| 35 | Gemiddelden/uitschieters/regelmaat/ver retros | 2 | I3 | vergelijk | niet gestart | — |
| 36 | Macroverdeling/weekpatronen/doelvoortgang | 2 | I1–I3 | — | niet gestart | — |
| 37 | Verklaarbare tips, verbergbaar, anders ‘nog geen betrouwbare conclusie’ | 2 | I4 | onvoldoende data | gebouwd | t_200df7b5 (alleen conclusie-drempel; tips = fase 4) |
| 38 | Slaap/herstel/activiteit alleen bij voldoende data | 3 | H1–H3 | drempels | niet gestart | — |
| 39 | Bron + actualiteit tonen | 3 | H0 | stale/fout | niet gestart | — |
| 40 | Alleen nieuwe Google Health-cloud | 3 | S2/H0 | productnaam-gate | niet gestart | — |
| 41 | Sync: auto waar kan, laatste sync, fout, Nu synchroniseren | 3 | H0 | sync-fout/stale | niet gestart | — |
| 42 | Health Connect (Android) | 3 | S2/H0 | buildpad-gate | niet gestart | — |
| 43 | Apple Health via echte iPhone-route | 3 | S2/H0 | buildpad-gate | niet gestart | — |
| 44 | Strava apart | 3 | S2/H0 | OAuth/dedupe | niet gestart | — |
| 45 | AI-assistent voeding/doelen/eigen data | 4 | AI0 | consent | niet gestart | — |
| 46 | AI provider/model-keuze (beheerd, geen BYOK) | 4 | S3 | budget-gate | niet gestart | — |
| 47 | Maaltijdfoto + controle vóór opslaan | 4 | F4→F5 | concept-correctie | niet gestart | — |
| 48 | Spraak + controle vóór opslaan | 4 | F4→F5 | transcript-correctie | niet gestart | — |
| 49 | Suggesties op echte patronen, uitleg, verbergbaar, nooit auto-doel | 4 | I4/AI0 | — | niet gestart | — |
| 50 | Eén persoon per account, strikte scheiding | 1 | A1 | isolatie-test | lokaal getest | t_200df7b5 |
| 51 | Aanmelden/registreren/herstellen/profiel | 1 | A1/S1 | mailpad bij pilot | gebouwd | t_200df7b5 (herstel = stub zonder maildienst); t_535f360a (auth-wachtvolgorde unit). Browser registratie→onboarding en mailpad bij pilot open. |
| 52 | Admin uitnodigen/beheren, geen gedeelde accounts | 1 | S5 | autorisatie | niet gestart | expliciet open |
| 53 | Vrienden + exacte zichtbaarheid, alles privé default | 4 | V0/V1 | ACL default-deny | niet gestart | — |
| 54 | Actuele meldingsoplossing kiezen | 4 | N0/N1 | capability-test | niet gestart | — |
| 55 | Herinneringen eten/drinken/wegen/slapen | 4 | N0 | opt-in/quiet hours | niet gestart | — |
| 56 | Waarschuwingen doelen/health/sync zonder spam | 4 | N1 | bundeling | niet gestart | — |
| 57 | Optioneel weekoverzicht (geen auto-check-in) | 4 | N0 | — | niet gestart | — |
| 58 | Licht/donker + passende navigatie | 1 | alle | light/dark/tekstgrootte | lokaal getest | t_200df7b5 (screenshots) |
| 59 | Taal/datum/eenheden (NL default, EN beschikbaar) | 1 | S1 | locale-regels | gebouwd | t_200df7b5 (NL; EN ontbreekt) |
| 63 | Eigen data/account verwijderen | 1 | S4 | controleerbaar resultaat | lokaal getest | t_9f2ce097 (Chromium verwijderknop → DELETE en /api/auth/me=401; API-cascade-test t_200df7b5) |
| 64 | Diagnostische logs alleen admin | 1 | S5 | PII-scrub | niet gestart | expliciet open |
| 65 | Platformmix web/PWA/native onderbouwd | 3 | — | capability-matrix | niet gestart | — |

Overgeslagen nummers (13, 20, 23, 27, 31, 60–62) zijn opzettelijk en blijven onaangeroerd.

## Brontracé voor open deelvereisten

| ID | Besluit / bron | Bewijsgrens / open vervolg |
|----|----------------|---------------------------|
| 3, 14 | [product-decisions.md](product-decisions.md) §Conflictresolutie (F5: gram altijd, onbekend ≠ 0); [risks-and-gates.md](risks-and-gates.md) Gate 1 en Veilig door (eigen producten zonder import) | `apps/web/tests/flows.test.tsx` bewijst payload/SSR, geen echte product-opslag in browser; API CRUD in `apps/api/src/index.test.ts`. |
| 9, 22 | [product-decisions.md](product-decisions.md) §Conflictresolutie (één F5-bevestiging); [fase-0-handoff.md](fase-0-handoff.md) §Resterende ID's | D2-maaltijdtotaal en F7-receptberekening na wijziging vragen nog gerichte UI/API-test vóór `lokaal getest`. |
| 51 | [risks-and-gates.md](risks-and-gates.md) Gate 7 (mail/privacy/security/pilot) | `apps/web/tests/flows.test.tsx` toetst alleen callback-volgorde; browserroute + echte mail zijn niet bewezen. |
