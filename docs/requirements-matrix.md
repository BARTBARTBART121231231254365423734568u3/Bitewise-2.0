# Requirementsmatrix — 57 ID's (oorspronkelijke nummering 1–65, gaten opzettelijk)

Status per ID: `niet gestart | gebouwd | lokaal getest | extern geverifieerd | geblokkeerd`.
`gebouwd` ≠ `lokaal getest`. Bewijslink verplicht bij getest.

| ID | Functie | Fase | Scherm/API | Test | Status | Bewijs |
|----|---------|------|------------|------|--------|--------|
| 1 | Dagboek met instelbare maaltijdmomenten | 1 | D0/D2 | add/edit/delete/move | niet gestart | — |
| 2 | Producten/maaltijden/recepten toevoegen | 1 | F0→F5→D0 | F5-bevestiging | niet gestart | — |
| 3 | Portiekeuze, gram altijd, onthoud laatste, direct herberekenen | 1 | F5 | bekende/onbekende conversie | niet gestart | — |
| 4 | Handmatige invoer naam/kcal/macro | 1 | F4→F5 | validatie | niet gestart | — |
| 5 | Maaltijden plannen, later als gegeten registreren | 1 | D5 | gepland≠gegeten | niet gestart | — |
| 6 | Gisteren/vaste consumpties opnieuw, nooit auto-log | 1 | D6 | bevestiging vereist | niet gestart | — |
| 7 | Items bewerken/verplaatsen/verwijderen | 1 | D2 | undo-gedrag | niet gestart | — |
| 8 | Maaltijden kopiëren/verplaatsen/bewaren/leegmaken | 1 | D2 | bevestiging | niet gestart | — |
| 9 | Dag- en maaltijdtotalen | 1 | D0/D2 | recompute | niet gestart | — |
| 10 | Water + dagdoel | 1 | D3 | add/edit | niet gestart | — |
| 11 | Gewicht (geen overige metingen) | 1 | D4 | historie | niet gestart | — |
| 12 | Dagnotities + doorzoekbare geschiedenis | 1 | D1/D4 | zoeken | niet gestart | — |
| 14 | Eigen producten maken/beheren | 1 | F6 | CRUD | niet gestart | — |
| 15 | Foto/merk/barcode/categorie/labels/notities | 1 | F2/F6 | upload-misbruiktest | niet gestart | — |
| 16 | Recent/vaak/favoriet snel terugvinden | 1 | F1 | ranking | niet gestart | — |
| 17 | Zoeken/filteren incl. allergenen | 2 | F1 | filter-sheet | niet gestart | — |
| 18 | Barcode scan, onbekend via foto/handmatig + controle | 2 | F3→F4→F5 | bekend/onbekend | niet gestart | — |
| 19 | EU-bronnen na NL-steekproef, herkomst/kwaliteit tonen | 2 | F1/F2 | licentie-gate | niet gestart | — |
| 21 | Maaltijden/recepten uit ingrediënten | 1 | F7 | opbouwen | niet gestart | — |
| 22 | Ingrediënten ordenen + voeding berekenen | 1 | F7 | herberekend bij wijziging | niet gestart | — |
| 24 | Zichtbare nutriënten kiezen + eigen toevoegen | 2 | F1/S1 | null≠0 | niet gestart | — |
| 25 | Calorie- en macrodoelen | 1 | G0/G1 | voortgang | niet gestart | — |
| 26 | Water/gewicht/voeding/health-doelen | 1 | G0/G1 | geen lichaamsmetingen | niet gestart | — |
| 28 | Onboarding met startvoorstel kcal/macro | 1 | A0–A4 | eerste signup | niet gestart | — |
| 29 | Voortgang dag/week | 1 | D0/I0 | dag/week | niet gestart | — |
| 30 | Dynamisch doel alleen bij betrouwbare data | 1 | G1 | geen schijnprecisie | niet gestart | — |
| 32 | Trends voeding/gewicht/health | 1 | I0–I3 | periode | niet gestart | — |
| 33 | Modern begrijpelijk, niet alles grafiek | 1 | I0 | — | niet gestart | — |
| 34 | Periode zelf kiezen | 1 | I0 | behoud bij terugnav | niet gestart | — |
| 35 | Gemiddelden/uitschieters/regelmaat/ver retros | 2 | I3 | vergelijk | niet gestart | — |
| 36 | Macroverdeling/weekpatronen/doelvoortgang | 2 | I1–I3 | — | niet gestart | — |
| 37 | Verklaarbare tips, verbergbaar, anders ‘nog geen betrouwbare conclusie’ | 2 | I4 | onvoldoende data | niet gestart | — |
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
| 50 | Eén persoon per account, strikte scheiding | 1 | A1 | isolatie-test | niet gestart | — |
| 51 | Aanmelden/registreren/herstellen/profiel | 1 | A1/S1 | mailpad bij pilot | niet gestart | — |
| 52 | Admin uitnodigen/beheren, geen gedeelde accounts | 1 | S5 | autorisatie | niet gestart | — |
| 53 | Vrienden + exacte zichtbaarheid, alles privé default | 4 | V0/V1 | ACL default-deny | niet gestart | — |
| 54 | Actuele meldingsoplossing kiezen | 4 | N0/N1 | capability-test | niet gestart | — |
| 55 | Herinneringen eten/drinken/wegen/slapen | 4 | N0 | opt-in/quiet hours | niet gestart | — |
| 56 | Waarschuwingen doelen/health/sync zonder spam | 4 | N1 | bundeling | niet gestart | — |
| 57 | Optioneel weekoverzicht (geen auto-check-in) | 4 | N0 | — | niet gestart | — |
| 58 | Licht/donker + passende navigatie | 1 | alle | light/dark/tekstgrootte | niet gestart | — |
| 59 | Taal/datum/eenheden (NL default, EN beschikbaar) | 1 | S1 | locale-regels | niet gestart | — |
| 63 | Eigen data/account verwijderen | 1 | S4 | controleerbaar resultaat | niet gestart | — |
| 64 | Diagnostische logs alleen admin | 1 | S5 | PII-scrub | niet gestart | — |
| 65 | Platformmix web/PWA/native onderbouwd | 3 | — | capability-matrix | niet gestart | — |

Overgeslagen nummers (13, 20, 23, 27, 31, 60–62) zijn opzettelijk en blijven onaangeroerd.
