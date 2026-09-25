# Productbesluiten BITEWISE 2.0

Status: Fase 0 gestart op 2026-09-25. Bron: GOAL-handoff (`BiteWise-Spark-GOAL.md` + bijlagen
`BiteWise-Functionaliteiten.md`, `BiteWise-DESIGN-2.md`, `BiteWise-Screen-Flow-2.md`).
Deze handoff vervangt de eerdere `SPARK_GOAL.md`. Bijlagen zijn alleen gelezen als
productinput; geen code uit de oude BiteWise hergebruikt.

## Conflictresolutie bronnen (besloten, 2026-09-25)

Conflict: oudere designsheets (o.a. DESIGN-revisie met tab `Producten` en Meer-opties als
directe routes, dubbele kcal-hero/log-CTA) versus de recentere screen flow
(`Screen-Flow-2`, versie 1.0). Beslecht door Thomas via de GOAL-handoff:
**`SCREEN-FLOW.md` wint voor navigatie; `DESIGN.md` blijft behouden voor tokens en merk.**
Bronbestanden worden niet stilzwijgend gewijzigd — de resolutie ligt hier vast.

- Tabs: **Dagboek | Eten | Inzicht | Gezondheid | Meer** (vaste volgorde, 5 items).
  Geen hamburger met dezelfde routes, geen centrale plus, geen zesde tab.
- Meer is een **sheet** (geen dashboard): Doelen, Vrienden, AI-assistent, Herinneringen,
  Instellingen & privacy. Sluit bij Back/Escape; tik op dezelfde tab gaat naar root.
- Meldingen-**inbox** achter één topbar-icoon (N1, met detail en dismiss);
  Meer → Herinneringen (N0) beheert alleen voorkeuren — geen tweede inbox.
- **Koppelingen onder Instellingen** (S2); Gezondheid (H0) toont bron + actualiteit maar
  geen tweede configuratiescherm.
- Geen dubbele kcal-hero of log-CTA. Eén **`F5`-bevestiging** voor alle invoerroutes
  (zoekresultaat, barcode, etikelfoto, tekst, spraak, AI, recept): gewicht/portie eerst,
  omgerekende kcal/macro's direct daarna, maaltijdselectie, één definitieve opslaanknop.
  Alles vóór opslaan is concept; onbekend ≠ 0; gram altijd beschikbaar.
- **`D2→F0` draagt dag+maaltijd als expliciete context.** Via de tab gekozen in F5;
  via D2 voorgeselecteerd maar wijzigbaar. Hergebruik gisteren/planning altijd met
  bewuste bevestiging — nooit stilzwijgend loggen.
- Liquid-glass alleen voor de navigatielaag met ondoorzichtige fallback.
  Een PWA claimt geen native Apple-effect.
- Tokens (DESIGN.md behouden): primary `#123D2B`, accent `#46D986`, Manrope,
  atletisch/rustig/premium.

## Vastgelegde navigatie (SCREEN-FLOW wint)

- Tabs: **Dagboek | Eten | Inzicht | Gezondheid | Meer** (vaste volgorde).
- Meer is een sheet: Doelen, Vrienden, AI-assistent, Herinneringen, Instellingen & privacy.
- Meldingen-inbox achter één topbar-icoon; Koppelingen onder Instellingen.
- Geen dubbele kcal-hero of log-CTA. Eén `F5`-bevestiging voor alle invoerroutes.
- `D2→F0` draagt dag+maaltijd als expliciete context. Hergebruik gisteren/planning altijd met bevestiging.

## Tokens (DESIGN.md behouden)

- Primary `#123D2B`, accent `#46D986`, Manrope, atletisch/rustig/premium.
- Liquid-glass alleen voor navigatielaag met ondoorzichtige fallback. PWA claimt geen native Apple-effect.

## Scope

- Alle 57 ID's zijn eindscope (nummering 1–65 met gaten). Zie `requirements-matrix.md`.
- Gefaseerd: mobiele web/PWA eerst, iOS/Android later. Publieke registratie pas in uiteindelijke NL-testversie voor volwassenen.
- Bestaande BiteWise blijft volledig gescheiden. Geen migratie, geen kopie/import.
- AI-kosten voor rekening BiteWise tijdens publieke test, maar **geen** maandbudget verleend: interfaces + kostenbewaking bouwen, betaalde calls uitgeschakeld tot expliciet akkoord (provider/model/plafond/datadeling/facturering).
- Open registratie als productfunctie is toegestaan; publieke deployment is **niet** automatisch geautoriseerd.
- Geen abonnement/betaling zonder besluit.

## Afgewezen opties

- Geen hergebruik bestaande BiteWise-service/auth/DB/branch/assets/credentials/staging-URL.
- Geen microservices, geen eigen trainingsmodel.
- Geen Garmin/Withings. Geen stilzwijgende logging, geen automatische doelwijziging, geen onbekend-als-nul.
