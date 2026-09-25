# Risico's en externe gates BITEWISE 2.0

## Gates (blokkeren alleen afhankelijk deel, nooit al het veilige lokale werk)

- [ ] Voedingsbron: NL/EU-steekproef (rechten, opslag, commercieel gebruik, updates). Zonder geschikte bron: eigen invoer blijft werken.
- [ ] Apple Health / Health Connect: pas na bewezen buildpad, toestemming, rechten, echte testdata, dedupe. Linux-host heeft geen Xcode/iPhone — geen fictieve iOS-claims.
- [ ] ‘Nieuwe Google Health’-cloud: eerst exacte productnaam/API/scopes/reikwijdte valideren. Geen connector voor onbewezen API.
- [ ] Strava: eigen OAuth/scope/importcontract/dedupe.
- [ ] AI: geen betaalde calls tot provider/model/maandplafond/datadeling/facturering expliciet akkoord. Kill-switch + quota verplicht.
- [ ] Meldingen/push: per platform capability-test, opt-in, quiet hours, afmelden.
- [ ] Publieke pilot: legale/privacy/security/mail/hosting-gates + expliciete release-goedkeuring (doelomgeving, budget, rollback). Geen auto-gevolg van fase 1–4.

## Uitgesloten

Overige lichaamsmetingen, Garmin/Withings, gedeelde accounts, stilzwijgend loggen,
automatische doelwijziging, onbekend-als-nul.
