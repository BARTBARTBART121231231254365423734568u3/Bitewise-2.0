# /goal — Bouw de nieuwe BiteWise

Je bent **Spark**, de uitvoerende bouwagent. Bouw een **volledig nieuw**, zelfstandig product met naam **BiteWise**: een premium sportieve fitness-, calorie- en lifestyle-app voor iPhone, Android en web/PWA. Lees eerst `DESIGN.md` in dezelfde map; het is de bindende visuele en interactionele specificatie. De bestanden staan in `/home/thomas/Hermes Workspace/projects/bitewise-greenfield/`. **Dit is geen opdracht om de bestaande BiteWise-app te verbouwen**: lees, kopieer en wijzig de bestaande repository `/home/thomas/Hermes Workspace/projects/BiteWise/` niet. Houd code, database, credentials, CI en deployment gescheiden. Gebruik deze greenfield-map voor het nieuwe project. Er is nog geen productie-deploy geautoriseerd.

## Definitie van succes

Een nieuw account kan op een telefoon via een nette onboarding een eigen doel vaststellen, eten via tekst/zoekfunctie/barcode of AI-foto/spraak met **controle vóór opslag** registreren, porties aanpassen met direct opnieuw berekende voedingswaarden, Dagboek en trends zien, water en gewicht beheren, optioneel en veilig gezondheidsgegevens koppelen, zijn privacy instellen en zijn gegevens exporteren/verwijderen. Het systeem moet ook zonder wearable, AI-provider of extra betaalde databron bruikbaar zijn. Elke hieronder genoemde functie is óf werkend en getest, óf staat als concreet niet-afgeronde blokkade met oorzaak en ontbrekend mandaat in je eindrapport; vink geen gesimuleerde of stubbed functie af als voltooid. Geen enkel afgewerkt scherm mag dode knoppen bevatten.

## Ontwerp en flow — niet opnieuw bedenken

- Houd `DESIGN.md` aan: donkere merkgroen `#123D2B`, verfijnde bijna-zwarte dark mode, volledige light mode, Manrope, atletisch/energiek én rustig/premium. Ontwerp een originele vork/negatieve-ruimte-B-identiteit; lever SVG/iconen. De drie referenties zijn inspiratie voor informatiehiërarchie en kwaliteit, geen te kopiëren product.
- Mobiele hoofdnavigatie: **Dagboek, Producten, Inzicht, Gezondheid, Meer**. Meer bevat Doelen, Vrienden, Meldingen, Koppelingen, Instellingen, Account. Koppelingen zijn geen eigen gezondheidsdashboard. Dagboek bezit dagelijkse registratie; Producten bezit zoeken/aanmaken/recepten; Inzicht bezit trends; Gezondheid bezit wearables/gezondheid; Doelen bezit doelen. Geen dubbele samenvattingen of hetzelfde CTA op meerdere plekken op één scherm.
- Dagboek bovenaan: datum, één groot resterend-kcal-getal met doel, compacte voortgang, drie macro-kolommen, subtiele waterregel en daarna maaltijden. Kies krachttraining noch conditietraining als verplichte identiteit; zowel beginners als ervaren sporters vinden hun informatie zonder drukte. Filters horen in een sheet. Werkende detailnavigatie achter compacte overzichten.
- Ontwerp voor 320/390/402/430px, tablet, desktop; iOS safe area eenmaal toepassen. WCAG AA, 44px targets, toetsenbord/screenreader, light/dark, tekstvergroting, leesbare taal en gereduceerde animatie. Nederlands standaard, Engels volwaardig. Bewijs designkwaliteit met **interactieve telefoonpreview** met gelabelde demo-data en inspectie van de volledige schermen, inclusief leeg/partieel/verouderd/fout/offline. Vraag pas een visuele keuze van de opdrachtgever als de complete prototypeflow controleerbaar is; implementeer geen afgewezen visuele richting in productie.

## Productcontract — niets uit deze lijst stilzwijgend schrappen

### Dagboek en eten registreren
1. Dagelijks voedingsdagboek met instelbare maaltijdmomenten.
2. Producten, opgeslagen maaltijden en recepten toevoegen.
3. Snelle portiekeuze per product; gram blijft beschikbaar. Andere maten alleen als hun omrekening naar gram/ml bekend is. Onthoud laatst gebruikte portie per product; bereken voedingswaarden onmiddellijk opnieuw.
4. Snelle handmatige invoer van naam, calorieën en macro's.
5. Maaltijden plannen en later als gegeten registreren; gepland telt niet als geconsumeerd.
6. Gisteren en vaste dagelijkse consumpties snel opnieuw toevoegen, maar nooit ongemerkt automatisch loggen.
7. Dagboekitems bewerken, verplaatsen en verwijderen.
8. Maaltijden kopiëren, verplaatsen, bewaren of leegmaken.
9. Dag- en maaltijdtotalen voor voedingswaarden.
10. Water registreren met dagdoel.
11. Gewicht vastleggen, geen andere lichaamsmetingen invoeren.
12. Dagnotities en doorzoekbare geschiedenis.

### Producten en recepten
13. Eigen producten aanmaken en beheren.
14. Productfoto, merk, barcode, categorie, labels en notities.
15. Recente, vaak gebruikte en favoriete producten snel vinden.
16. Producten doorzoeken en filteren, inclusief allergenen.
17. Barcode scanner; onbekend product via etiketfoto of gecontroleerde handmatige waarden bewaren. OCR/AI mag nooit ongezien wegschrijven.
18. Test Nederlandse en relevante Europese winkelproducten met steekproeven op vindbaarheid, juiste variant en correcte waarden **vóór** bronkeuze. Evalueer bruikbare EU-bronnen en hun licenties/toegangsvoorwaarden. Laat bron, gecontroleerde gegevens, onderbouwde porties en ontbrekende waarden zien; geen verzonnen dekking.
19. Eigen maaltijden en recepten uit ingrediënten bouwen, ingrediënten ordenen, voedingswaarden berekenen en porties/hoeveelheden correct herschalen.
20. Selecteer zichtbare nutriënten en voeg desgewenst eigen nutriënten toe. Ontbrekend is onbekend, niet nul.

### Doelen
21. Calorie- en macrodoelen.
22. Water- en gewichtsdoelen en doelen voor beschikbare relevante voeding/gezondheidsgegevens; geen doelen voor andere lichaamsmetingen.
23. Onboarding met uitlegbaar voorstel voor energie en macro's, handmatig aanpasbaar, zonder medische claims.
24. Heldere dagelijkse en wekelijkse voortgang.
25. Optioneel dynamisch caloriedoel uit betrouwbare activiteit, met uitschakelbare expliciete berekening; ontbrekende logs leveren geen schijnprecisie en geen stilzwijgende doelwijziging.

### Inzicht en gezondheid
26. Trends in voeding, gewicht en beschikbare relevante gezondheidsgegevens; geen overige lichaamsmetingen.
27. Moderne, begrijpelijke inzichten — niet alles hoeft een klassieke grafiek te zijn. Zelf periode selecteren.
28. Gemiddelden, uitschieters, regelmaat, vergelijking met eerdere periode, macroverdeling, weekpatronen en doelvoortgang.
29. Onderzoek wat gebruikers van gezondheidsinformatie werkelijk helpt; bouw kleine verklaarbare, verbergbare, niet-medische tips op echte gegevens. Bij onvoldoende input: `Nog geen betrouwbare conclusie`.
30. Slaap-, herstel- en activiteitsscores alleen bij voldoende betrouwbare relevante metingen; label als schatting met uitleg en bron.
31. Toon bron en actualiteit van elke gezondheidsmeting; maak ontbrekend, verouderd, uitgevallen sync en echte nul onderscheidbaar.

### Koppelingen
32. Als cloudkoppeling uitsluitend de **actuele nieuwe Google Health-route**, niet Garmin of Withings. Controleer officiële huidige API/documentatie, beschikbaarheid, scopes en voorwaarden vóór implementatie; verzin geen endpoint of entitlement. Leg de exacte keuze en eventuele beperking vast.
33. Na koppelen zo veel mogelijk automatisch synchroniseren; toon laatste succesvolle sync, foutstatus en `Nu synchroniseren`. Geen ingewikkelde interval-/tijdvensterinstellingen voor gebruikers.
34. Onderzoek en implementeer Android Health Connect als geschikte directe Android-bron met expliciete scopes.
35. Apple Health via een passende **echte** iPhone/native route naar dezelfde Gezondheid-ervaring; een pure web/PWA mag niet doen alsof die HealthKit leest. Native toegang en rechten moeten op een reëel iOS-buildpad zijn bewezen; zo nodig apart fase-gaten.
36. Strava als aparte optionele connector; activiteitenimport is nieuw werk en vereist echte scopes, sync/dedupe en tests.

### AI
37. Assistent die vragen over voeding, doelen en toegestane eigen gegevens beantwoordt, met bron/feit/advies duidelijk gescheiden; geen medische claims.
38. Keuze van AI-provider en model; veilige server-side opslag van sleutels of veilige gebruikersconfiguratie, kosten/gegevensdeling expliciet maken. Geen geheime sleutels in client of repo.
39. Maaltijdfoto analyseren en voor opslaan reviewen; portie en onzekerheid expliciet.
40. Ingesproken maaltijd analyseren en voor opslaan reviewen; transcript corrigeerbaar.
41. Kleine, verbergbare suggesties op echte patronen, mét uitleg, zonder automatische doelwijziging. Ontbrekende voedingswaarden zijn onbekend, nooit nul.

### Accounts, vrienden en meldingen
42. Eén persoon per account met strikt geïsoleerde gegevens, ook in zoekindex, jobs, caches en AI-context.
43. Registratie, aanmelden, wachtwoordherstel, profielbeheer.
44. Admin kan accounts uitnodigen en beheren; geen gedeelde gebruikersaccounts.
45. Mensen vinden/toevoegen, verzoeken accepteren/weigeren, permissies precies per gegevenssoort instellen. Gewicht, doelen, dagboek en gezondheidsgegevens standaard privé en niet in publieke zoekresultaten lekken.
46. Kies een actuele meldingsstrategie op basis van PWA/iOS/Android-capaciteiten; neem geen oude pushdiensten klakkeloos over.
47. Instelbare herinneringen voor eten, drinken, wegen en slapen; relevante waarschuwingen rond doelen, gezondheid en synchronisatie zonder spam, met opt-out en quiet hours.
48. Optioneel weekoverzicht. Bouw géén aparte wekelijkse check-in die doelen wijzigt zonder nieuwe productkeuze.

### Basis
49. Licht/donker thema en passende responsive navigatie.
50. Taal, datumweergave en eenheden, correct en consistent omgerekend.
51. Eigen gegevens en account veilig kunnen exporteren/verwijderen met expliciete bevestiging en controleerbaar resultaat.
52. Diagnostische logs alleen via admin-account; scrub credentials/PII en bescherm toegang.
53. Kies onderbouwd de beste combinatie van web/PWA en native iOS/Android voor offline, camera, gezondheidstoegang en meldingen. Toon eerlijk welke functionaliteit per platform echt mogelijk is.

## Technische route (standaard, afwijking alleen schriftelijk onderbouwd)

- TypeScript-monorepo met `apps/client` (**React + Vite PWA**, responsive web) en `apps/api` (**Fastify REST**), `packages/domain` voor gedeelde types/berekeningen/validatie, PostgreSQL met versioned migrations. Gebruik Capacitor voor iOS/Android verpakking zodra echte health/camera/notification-capabilities dat vereisen; controleer plugins op onderhoud, licentie, platformondersteuning en echte native buildbaarheid. Zonder macOS/Xcode of apparaat niet beweren dat iOS Health getest is; laat de flow veilig onbeschikbaar in PWA en rapporteer het als open gate. Maak keuze/motivatie van Vite, router, query state, cache en plugincontract kort vast in `docs/architecture.md` vóór implementatie.
- Server is bron van waarheid voor gebruikersdata. Elk tabelrecord owner-scoped; autorisatie op elke read/write en achtergrondjob; password hashing via bewezen library, secure sessions of correct roterende tokens, rate limiting, CSRF waar van toepassing, minimale provider-scopes, versleutelde tokens en audit-events. Geen eigen crypto. Recept- en productdata hebben nutrition-basis per 100g of gevalideerde portie, expliciete waarde-status (`measured|label|estimated|missing`), provenance en traceerbare meeteenheden. Decimal-safe hoeveelheden; tests voor afronding, gram/ml-conversies, negatieve/ongeldige waarden en ontbrekende velden. Allergenen nooit afleiden uit ontbrekende data.
- Houd offline leesbare eigen data en pending lokale dagboek-invoer waar haalbaar; sync met idempotency keys, conflictresolutie/duidelijke status en betrouwbare dedupe. Security/privacy blijft leidend: geen gezondheidsdata in analytics, error logs of publieke demo-data. Stel geen productie-credentials of externe deployment in zonder expliciete bevoegdheid. Integreer externe diensten pas na bron-/privacy-/kostencheck; als toegang ontbreekt, blokkeer uitsluitend die connector, niet de rest van de app.
- Kies actuele, toegankelijke, kleine dependencies; pin versies, lockfile en omgeving via `.env.example` zonder secrets. Container/dev setup, migrations, seeddata **alleen lokaal/demo** en reproduceerbare build, test en lint scripts. Maak echte lokale end-to-end runs en HTTP API-tests. Geen fictieve handmatige resultaten.

## Uitvoeringsvolgorde en afbakening

1. Inspecteer uitsluitend deze greenfield-map en de meegeleverde specificatie; voer korte haalbaarheidschecks uit voor data/licenties, de actuele Google Health-route, Health Connect, iOS HealthKit en Strava, plus Expo/Capacitor/PWA-toegangsgrenzen. Documenteer feiten en open gates in `docs/decisions.md`. Vraag alleen om een besluit wanneer het team geen veilige bevoegdheid of noodzakelijke toegang heeft.
2. Bouw een interactieve, lokaal te openen **ontwerp-preview** voor Dagboek, Producten/scan/portie-bevestiging, Inzicht, Gezondheid en Meer in dark/light en relevante lege/foutstaten. Inspecteer op telefoonformaten en verwerk feedback; niets naar productie. Laat alleen echte productrichting/visuele keuze aan Thomas over.
3. Bouw auth + owner-isolatie + datamodel + migrations + kern Dagboek/Producten/Recepten/Doelen; implementeer functionaliteit per verticale flow met tests vóór uitbreiding. Daarna insights, Gezondheid/connectors, AI, vrienden/meldingen, instellingen/export/verwijderen. Onafhankelijke onderdelen mogen parallel, conflicterende migraties en gedeelde bestanden serieel. Houd volledige functie/checklist per fase bij; verlies geen geaccepteerde requirements.
4. Test per werkende flow op echte lokale API en browser: nieuwe gebruiker, edit/delete/undo, eigen versus ander account, gepland versus gegeten, vervalste portie, offline→online, barcode bekend/onbekend, ontbrekende macro's, AI correctie, gescheiden vriendenrechten, consent/sync error. Accessibility- en viewport-evidence in beide thema's, inclusief onderste acties boven de bottom nav. Controleer extern gedrag alleen waar echte toegang aanwezig is.
5. Vraag een onafhankelijke security-review van auth, privacy, AI, externe tokens en verwijdering; verwerk reële bevindingen. Finaliseer met een werkend lokaal artefact, testcommando's plus echte uitslag, screenshots/preview-handle, requirementmatrix (werkend / gedeeltelijk / geblokkeerd), resterende externe gates, en **geen** claims over App Store, iOS Health, cloudsync of productie-deploy die niet daadwerkelijk geverifieerd zijn.

## Niet-onderhandelbare grenzen

Geen stille automatische voedinglogging, automatische doelwijzigingen, bedachte medische scores, verzonnen micronutriënten of geveinsde AI/scan/sync-resultaten. Geen Garmin/Withings. Geen niet-geautoriseerde betalingen, abonnementen, productie-uitrol, rechten- of privacyscope-uitbreiding. Accepteer expliciete afwijzing als stop. Noem het project pas af wanneer de geaccepteerde functies waarneembaar werken; een prototype of mock is geen backend. Rapporteer blokkades eerlijk met exact ontbrekende voorwaarde, maar bouw onafhankelijk veilig werk door. Schrijf voortgang intern; vraag Thomas alleen een noodzakelijke keuze en lever het resultaat compact in het oorspronkelijke gesprek.
