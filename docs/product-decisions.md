# Productbesluiten BITEWISE 2.0

Status: Fase 0 gestart op 2026-09-25. Bron: handoff-GOAL (vervangt SPARK_GOAL.md).

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
