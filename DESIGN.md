---
version: alpha
name: BiteWise Greenfield
description: Premium, sportieve en toegankelijke voedings- en lifestyle-app voor iPhone, Android en web.
colors:
  primary: "#123D2B"
  accent: "#46D986"
  on-primary: "#FFFFFF"
  dark-background: "#0C1511"
  dark-surface: "#14221B"
  dark-elevated: "#1C2D23"
  dark-border: "#355043"
  dark-text: "#F5FAF6"
  dark-muted: "#BACDC0"
  light-background: "#F4F7F3"
  light-surface: "#FFFFFF"
  light-elevated: "#EAF1EA"
  light-border: "#CAD9CE"
  light-text: "#17261C"
  light-muted: "#4C6354"
  light-action: "#16633E"
  carbohydrate: "#69B9E7"
  fat: "#D7A8ED"
  protein: "#F3B36A"
  hydration: "#76BDEB"
  success: "#46D986"
  warning: "#F3B36A"
  error: "#F59691"
typography:
  display:
    fontFamily: Manrope
    fontSize: 2.5rem
    fontWeight: 750
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: Manrope
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: 700
    lineHeight: 1.35
  body-md:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: 650
    lineHeight: 1.4
  caption:
    fontFamily: Manrope
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: 8px
  md: 14px
  lg: 20px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary-dark:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.dark-background}"
    rounded: "{rounded.md}"
    padding: 14px
  button-primary-light:
    backgroundColor: "{colors.light-action}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 14px
  card-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.lg}"
    padding: 16px
  card-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.lg}"
    padding: 16px
  page-light:
    backgroundColor: "{colors.light-background}"
    textColor: "{colors.light-text}"
  surface-dark-raised:
    backgroundColor: "{colors.dark-elevated}"
    textColor: "{colors.dark-text}"
  surface-light-raised:
    backgroundColor: "{colors.light-elevated}"
    textColor: "{colors.light-text}"
  divider-dark:
    backgroundColor: "{colors.dark-border}"
    height: 1px
  divider-light:
    backgroundColor: "{colors.light-border}"
    height: 1px
  secondary-text-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-muted}"
  secondary-text-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-muted}"
  macro-carbohydrate-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.carbohydrate}"
  macro-fat-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.fat}"
  macro-protein-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.protein}"
  hydration-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.hydration}"
  success-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.success}"
  warning-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.warning}"
  error-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.error}"
---

## Overview

Dit is de **nieuwe, zelfstandige BiteWise**. Gebruik geen bestaande BiteWise-code, layouts of productbesluiten als impliciete specificatie. Doelgroep: beginners én ervaren sporters, kracht én conditie; nooit uitsluitend bodybuilding, afvallen of medische monitoring. De toon is sportief en energiek, maar de interface voelt rustig, verzorgd en premium. Gebruikerstaal standaard Nederlands; volledige Engelse vertaling voorzien. Laat de OS-instelling licht/donker bepalen tenzij de gebruiker een thema kiest. Donker is de hero-presentatie, licht krijgt dezelfde kwaliteit. Hanteer één primaire actie per context; inzicht leidt naar een concrete, begrijpelijke vervolgstap. Alle ontwerpkeuzes hieronder zijn concreet startpunt en mogen alleen worden gewijzigd met een gedocumenteerde reden en een zichtbare vergelijking.

De drie door Thomas aangeleverde screenshots dienen alleen als inspiratie: (1) overzichtelijke dagelijkse calorie-/maaltijdhiërarchie, (2) compact macroblok, (3) premium donkere diepte en doordachte knoppen. Geen pixels, icoonsets, typografische lockups of productidentiteit letterlijk overnemen. Referenties zijn opgeslagen in `/home/thomas/.hermes/images/upload_20260925_175805_1.png`, `_2.png`, `_3.png` (met hetzelfde voorvoegsel).

## Colors

Het **donkergroen `#123D2B`** is de merkanker-kleur, niet een fluorescerende achtergrond voor elk scherm. Op dark surfaces levert het frisse `#46D986` de energie en herkenbare primaire interactie; op light surfaces gebruikt interactietekst of knoppen `#16633E`. Geen puur zwart/wit als volledige UI-basis; donkere lagen `#0C1511 → #14221B → #1C2D23` geven subtiele diepte. In lichtmodus `#F4F7F3 → #FFFFFF → #EAF1EA`. Gebruik semantische kleuren voor koolhydraten, vetten, eiwitten en water consequent, maar nooit kleur als enige informatiedrager: labels, waarden en waar nodig patronen blijven beschikbaar. Gebruik rood uitsluitend voor fouten/risico, niet voor het moreel beoordelen van voeding.

Contrast: normale tekst en labels minimaal WCAG AA 4.5:1; grote tekst 3:1; interactieve randen, grafische informatie en focusindicatie minimaal 3:1 tegen de aangrenzende laag. Test echte combinaties in beide thema's; lichte macroaccenten zijn geschikt als grafiekkleur op donker, niet vanzelfsprekend als tekstkleur op wit. Disabled, hovered, active, selected, loading, error en focus-visible vragen afzonderlijke zichtbare staten. Geen transparantie waardoor contrast of leesbaarheid breekt.

## Typography

Gebruik lokaal gebundelde, rechtsgeldig gelicentieerde **Manrope variable** voor interface en merkwoord; systeemfont als fallback. Geen externe fontrequest die offline de app onbruikbaar maakt. Displaygewicht 750 voor het ene primaire getal op een pagina, compacte titels 700, tekst 500. Numerieke metrics met tabular figures; kcal, g, ml, kg en datums blijven uitgelijnd, met decimale komma in NL. Nooit ultradunne witte tekst op donkergroen. Ondersteun 200% tekstvergroting, dynamische lettergroottes, lange productnamen, smalle schermen en vertalingen zonder truncatie van kritieke waarden. Leesvolgorde en labels blijven logisch voor screenreaders.

## Layout

Mobiel-eerst. Contentbreedte op telefoons 100%; horizontale gutters 16px bij 320–389px en 20px vanaf 390px; max content width 1200px op web/desktop. 8px-baseline en kaartspacing 12–16px, secties 24–32px. Dagboek-topstrook: datumkiezer → prominente resterende kcal met compact doel → voortgang → drie compacte macro-indicatoren → dunne hydratatieregel → eerstvolgende relevante actie/maaltijden. Deze volgorde is een hiërarchie, niet een opdracht om alles in aparte kaarten te zetten. Boven de vouw op een gangbare iPhone: datum, calorieën, macro's en een duidelijke logactie zichtbaar; water en eerste maaltijd zo dicht mogelijk onder de samenvatting. Toon kcal eenmaal als focus, niet opnieuw in meerdere 'daily intake'-kaarten. De gebruiker kan op details doortikken voor nutriënten, historie en verklaringen.

Vijf compacte hoofdbestemmingen: **Dagboek, Eten, Inzicht, Gezondheid, Meer**. Gebruik één vaste bottom navigation op mobiel volgens `SCREEN-FLOW.md`: Dagboek bezit dagelijkse totalen; Eten is de invoer- en bibliotheekhub; Inzicht toont trends; Gezondheid toont metingen; Meer opent een toegankelijke sheet met Doelen, Vrienden, AI-assistent, Herinneringen en Instellingen & privacy. Koppelingen lopen via Instellingen, de meldingen-inbox via één topbar-icoon. Geen hamburger met dezelfde routes. De 'Voeg eten toe'-actie bij een maaltijd opent dezelfde Eten-flow; vermijd dubbele zwevende en vaste knoppen met dezelfde werking. Op tablet en desktop nav links, inhoud in maximaal twee betekenisvolle kolommen. Behoud normale document-scroll en bereikbaarheid van laatste rij boven de bottom nav; reserveer `env(safe-area-inset-bottom)` precies eenmaal. Schermen/kaarten testen op 320, 390, 402, 430, 768 en 1280 CSS px, plus Android en iOS-PWA weergave.

## Elevation & Depth

Premium door precisie, niet decoratie: éénpixelranden met ingetogen contrast, zachte schaduw uitsluitend waar in lichtmodus hiërarchie nodig is, gedempte groenachtige highlights op donkere lagen. Geen overal-glassmorphism of blur achter voedingswaarden; alleen subtiele translucent navigatie als tekst altijd leesbaar blijft. Animaties 120–220ms voor focus, progress en bevestiging; respecteer `prefers-reduced-motion`. Schermtransities ondersteunen oriëntatie, geen entertainment-wachttijd.

## Shapes

Kaarten 20px radius, controls 14px, compacte chips 8px of pilvorm; alle targets minimaal 44×44 CSS px. Progressbars 6–8px, hydratatie 3–4px; afgeronde uiteinden. Grafieken minimalistisch met leesbare assen, perioden, tooltips/tabelalternatief en betekenisvolle lege staten. Pictogrammen uit één consistente vectorstijl, voldoende lijndikte; een logo mag niet onleesbaar worden op 24px.

## Components

- **Logo en woordmerk:** ontwerp een eigen teken dat een kleine vork/vorktanden combineert met een negatieve-ruimte-`B` of een hap uit een ronde vorm. Start met drie eenvoudige SVG-schetsen, test als 24px app-icoon en monochroom, kies op herkenbaarheid zonder gelijk te lijken op bestaande food-apps. Definitief woordmerk `BiteWise` in Manrope; geen stock-bord/fork-combinatie zonder eigen vormtaal. Lever bron-SVG, éénkleurige variant, dark/light app icon en favicon.
- **Dagboekkaart:** maaltijdkop, maaltijd-kcal, aantal items en één add-control; uitklapbare rijen; swipe is optioneel maar alle acties ook via zichtbaar menu. Een voedselrij toont naam, portie, kcal en beschikbare macro's; bewerken/verplaatsen/verwijderen via hetzelfde contextmenu, met bevestiging of undo bij destructieve stappen.
- **Nutrition summary:** groot getal voor resterende kcal en begrijpelijke tekst `resterend · doel …`, met 1 hoofdvoortgangsbalk. Toon in 3 naast elkaar geplaatste kolommen koolhydraten/vetten/eiwitten als gram + doel + kleine balk; ga onder elkaar bij tekstvergroting. Voorkom een tweede kaart met dezelfde doelen en totalen. Een aanpassing hoort op Doelen, niet als groot redundant Dagboek-CTA.
- **Producten:** rustige gateway met zoeken/scannen, recent/favorieten/maaltijden; filters (categorie/allergenen/bron) in één sheet met aantal actieve filters en Wis alles. Zoekresultaten benoemen merk, bron, geverifieerde portie en onvolledige gegevens. Scan/foto/spraak/AI eindigen altijd in één controleerbaar 'Bevestig en voeg toe'-scherm; gewicht/portie eerst, omgerekende kcal/macro's direct daarna, maaltijdselectie en één definitieve opslaanknop. Nooit generieke 'stuk'-portie zonder betrouwbare massa; grammen zijn altijd beschikbaar.
- **Inzicht/Gezondheid:** één duidelijke kernwaarde of conclusie per sectie; verdere trends achter detail, niet vijf vergelijkbare grafieken onder elkaar. Toon bron, timestamp, ontbrekende waarden en uitlegbaarheid van scores; `onvoldoende betrouwbare gegevens` is een volwaardige staat. Geen medische diagnose, geen geschatte waarden als metingen presenteren.
- **Onboarding/doelen:** toon voorstel met invoer, formule/bron, aanpasbare uitkomst en waarom; een gebruiker kan het zonder schaamte of doelgerichte taal wijzigen. Geen doelwijziging zonder expliciete bevestiging.
- **Vrienden/privacy:** toestemming per datacategorie; gewicht, doelen, dagboek en gezondheid standaard privé. Deeltoestand is onmiddellijk duidelijk.
- **Meldingen, formulieren en sheets:** relevante actie bovenaan, sluit/terug correct bereikbaar, validatie naast veld en bevestiging bij fout. Toegankelijke focus-trap en herstel van focus na sluiten; herhaalde meldingen bundelen.
- **Lege/fout/offline-staten:** onderscheid nooit gelogd, niet verbonden, sync bezig, verouderd, fout, ontbrekende voeding en echte nul. Behoud bekende waarden met expliciete laatste meetdatum; nooit lege data omzetten naar nul of fake voortgang.
- **Beeldgebruik:** productfoto's door de gebruiker of met expliciete gebruiksrechten; geen generieke fitnessmodellen of vóór/na-beelden. Zelfgemaakte eenvoudige illustraties uitsluitend bij lege staten, spaarzaam.

## Do's and Don'ts

**Wel:** minimalistische leesvolgorde, energiek groen als gericht accent, snelle logging, rustige start en optionele diepgang, premium dark én light, dataherkomst, grote klikdoelen, duidelijke feedback. **Niet:** elk cijfer als tegel, herhaalde calorie- of wateroverzichten, onverklaarde kleuren, WHOOP/MyFitnessPal-achtige kopieën, schijnprecisie, opdringerige coaching, 8-punts caption voor kritieke data, gefingeerde scanner/AI/sync-resultaten. Voor elke nieuwe kaart/knop expliciet controleren: welk uniek gebruikersdoel dient zij, welke bestaande surface vervangt zij, werkt de actie echt?

**Visual acceptance:** lever een interactieve telefoonpreview met representatieve voorbeelddata (als demo gelabeld) voor Dagboek, Producten → bevestigen, Inzicht, Gezondheid en Meer. Inspecteer complete schermen in light/dark op 390/402/430px met top- en onderrand; test normale én vergrote tekst, gedeeltelijke/lege/verouderde/foutdata. Loop iedere zichtbare knop door en leg de uitkomst vast; geen dode controls of dubbele acties. Voor implementatie van een gekozen richting is visuele goedkeuring van Thomas vereist; de preview is geen productie-deploy.
