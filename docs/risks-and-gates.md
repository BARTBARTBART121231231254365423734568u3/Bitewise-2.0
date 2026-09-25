# Risico's en externe gates BITEWISE 2.0

Stand: Fase 0 (2026-09-25). Alle gates OPEN — geen enkele externe proef is uitgevoerd.
Gates blokkeren alleen het afhankelijke deel, nooit al het veilige lokale werk (zie onderaan).

## Gate 1 — Voedingsbron: NL/EU-steekproef (ID 19)

Concrete proef vóór bronkeuze: afgebakende representatieve steekproef van Nederlandse en
relevante Europese winkelproducten — barcodes + verschillende varianten + macro's + porties +
allergenen. Per kandidaat-bron toetsen: vindbaarheid, juiste variant, correcte waarden,
rechten, toegestane opslag/commercieel gebruik, updatefrequentie, ontbrekende waarden.
Pas daarna bron(nen) kiezen; bij producten herkomst, gecontroleerde gegevens, onderbouwde
porties en ontbrekende waarden tonen. Zonder geschikte vrij beschikbare bron blijft eigen
productinvoer (ID 14/15) volledig werken; betaalde/licentie-afhankelijke import wordt als
externe gate gemarkeerd. Ontbrekende waarden zijn onbekend, nooit nul.

## Gate 2 — ‘Nieuwe Google Health’-cloud: naam/API eerst valideren (ID 40)

Concrete proef: exacte actuele productnaam, toegang, API/documentatie, regionaal bereik,
scopes, gebruiksrechten en privacy valideren vóór implementatie. Geen connector schrijven
voor een verouderde of onbewezen API; geen verzonnen endpoint of entitlement. Geen
Garmin/Withings (uitgesloten, geen gate maar besluit).

## Gate 3 — Health Connect / Apple-route: bewezen buildpad (ID 42/43)

Concrete proef: provider-agnostische datacontracten eerst (kan in Fase 1 zonder gate);
native clienttoegang pas na aantoonbaar buildpad + toestemmingsstromen + platformrechten +
echte testgegevens + dedupe. Deze Linux-host heeft geen Xcode/iPhone — geen fictieve
iOS-claims. Een pure web/PWA mag niet doen alsof die HealthKit leest; de flow blijft veilig
onbeschikbaar in PWA tot het buildpad bewezen is. Ontbrekende native toegang blokkeert
alleen de connector, niet de rest.

## Gate 4 — Strava: eigen contract (ID 44)

Concrete proef: eigen OAuth/scope, importcontract, sync/dedupe en foutstatus met echte
Strava-toegang. Activiteitenimport is nieuw werk; zonder echte scopes geen connectorclaim.

## Gate 5 — AI: geen betaalde calls zonder budgetbesluit (ID 45/46)

Concrete proef/voorwaarde: interfaces + server-side provider-adapters + kostenregistratie +
per-user en globale quota + rate limit + kill-switch bouwen; betaalde calls blijven
uitgeschakeld tot provider/model, maandplafond, datadeling en facturering afzonderlijk zijn
goedgekeurd door Thomas. AI-kosten komen tijdens de publieke test voor rekening van BiteWise,
maar er is géén maandbudget verleend. Geen mock als werkende AI-functie afvinken; geen
user-supplied BYOK als betaald model tenzij later besloten. Gezondheids-/voedingsdata alleen
met specifiek consent delen.

## Gate 6 — Meldingen/push: capability-test per platform (ID 54)

Concrete proef: per platform (PWA/iOS/Android) een onderhouden oplossing kiezen na
capability-test voor in-app inbox, herinneringen en optionele push; geen oude dienst
automatisch hergebruiken. Vereist: opt-in, quiet hours, bundeling, afmelden; permission pas
in context vragen. Zonder bewezen capability geen pushclaim.

## Gate 7 — Publieke pilot: legale/privacy/security/mail/hosting + release-goedkeuring (Fase 5)

Concrete voorwaarden: privacydocumenten/gegevensverwijdering, e-mailverificatie via echte
mailinfra, rate limiting, onafhankelijke security-review (publieke registratie,
privacyscheiding, sleutelbeheer, connectorrechten), toegankelijkheid, beheer/logs,
hosting/backup/rollback, exacte release- en AI-kostenbesluiten, niet-misleidende
storeclaims. Publieke registratie pas in de uiteindelijke NL-testversie voor volwassenen.
Een echte externe release uitsluitend na expliciete scope- en omgevingsgoedkeuring door
Thomas; verifieer dan de exact gepubliceerde revisie en kernflow. Geen auto-gevolg van
fase 1–4. Open registratie als productfunctie is toegestaan; publieke deployment is níét
automatisch geautoriseerd.

## Veilig door zonder gate (mag parallel doorgaan)

- Fase 1-kern op mobiel web/PWA: account+onboarding, dagboek+doelen+water+gewicht,
  eigen producten/porties/recepten, handmatige invoer, geplande/herhaalde maaltijden met
  bevestiging, basis-inzicht op eigen data — alles met echte API/Postgres, auth,
  owner-isolatie, offline-gedrag en tests.
- Provider-agnostische health-datacontracten; Gezondheid zonder koppeling als eerlijke
  lege staat (`nog geen betrouwbare conclusie`).
- AI-interfaces, kostenbewaking, quota en kill-switch zonder betaalde calls.
- Notificatie-inbox en herinneringsvoorkeuren lokaal; push pas na Gate 6.
- Mailpaden lokaal bouwen; echte mailinfra pas bij pilot (Gate 7).

## Bewijsregel (alle fasen)

`pnpm verify` (lint + typecheck + test + build) groen + echte lokale API/browser-runs met
uitvoer. Nooit een ongeteste connector, native app of publieke release ‘klaar’ noemen.
Handoff per fase: wat werkt echt, tests met uitvoer, resterende ID's/gates —
zie `docs/fase-0-handoff.md`.

## Uitgesloten

Overige lichaamsmetingen, Garmin/Withings, gedeelde accounts, stilzwijgend loggen,
automatische doelwijziging, onbekend-als-nul.
