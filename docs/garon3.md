# GARON 3.0 – tekniska anteckningar

## Omfattning

Designen och navigationen har byggts om från grunden. Fungerande React/TypeScript/Vite, Node/Express, SQLite, HTTP-skydd, AI-spärr och leverantörsadaptrar återanvänds. Inga stora nya bibliotek eller externa tjänster behövs.

Nya huvudkontoret består av Översikt, Godkännanden, Inkorg, Schemalagt och Aktivitet. Verksamheter har en egen sida och en separat mappsektion. Inställningar är uppdelade i Utseende, Minne, Plugins, AI-modeller och Allmänt. Äldre avancerade vyer har inte fått plats i den nya navigationen; deras serverfunktioner och data behålls.

## Verksamhetsmodell

Verksamheter lagras som `kind=business` i den redan befintliga `entities`-tabellen. Det behövs ingen schemamigrering och ingen befintlig rad skrivs om vid start.

```text
Business
  id             UUID
  name           1–100 tecken, unikt bland verksamheter
  description    valfri text, högst 3 000 tecken
  sections       lista av { id, title, view }
  createdAt      ISO-tid
  updatedAt      ISO-tid
```

En ny verksamhet får en enda sektion: Översikt. En verksamhet kan sedan visa ytterligare menyval. `sections` är metadata per verksamhet, inte hårdkodade globala mappmenyer. Servern validerar id:n, titlar, sidtyper och unika meny-id:n. Okända framtida sidtyper visas som förberedda vyer tills en renderer finns. Användarens egna, andra menydefinitioner behålls av redigeringsdialogen.

API:

- `POST /api/businesses`: skapa med namn och valfri beskrivning.
- `PATCH /api/businesses/:id`: uppdatera namn, beskrivning och/eller sektioner.
- `DELETE /api/businesses/:id`: kräver `confirm: true`; gränssnittet begär först en uttrycklig bekräftelse.
- `GET /api/state` och `GET /api/export`: inkluderar verksamheter.

Borttagning raderar bara verksamhetsposten. Det finns ingen dold kaskadradering av gamla uppdrag, agentroller, anteckningar eller historik. Inga förvalda verksamheter eller agenter skapas.

## Temasystem

`ThemeProvider` äger det aktiva temat. CSS-variabler används av hela nya gränssnittet: bakgrund, sidopanel, ytor, text, ramar, accent och accentknapparnas kontrastfärg. Egen accentfärg valideras som en sexsiffrig hexkod och kontrastfärgen väljs utifrån luminans. Mörkt/ljust och normal/kompakt sparas tillsammans med färgen och bekräftelseinställningen.

Inställningarna sparas i localStorage för aktuell origin. Om lagringen är blockerad visas ett tydligt fel; temat kan fortfarande ändras i den öppna sessionen. Inga nycklar eller AI-konversationer sparas i localStorage av den nya klienten.

## Nätverk

Nätverksvyn ritar bara GARON Core och databasens verkliga verksamheter. Kopplingslinjerna anger organisatorisk struktur, inte kommunikation, AI-körning eller anslutna tjänster. Verksamhetsnoder är riktiga navigationsknappar. Zoomknappar, dragbaserad panorering och återställning fungerar utan ett stort diagrambibliotek. Listvyn ger en alternativ väg till samtliga verksamheter.

## Minne, AI och data

Automatiskt AI-minne är inte aktiverat. Tidigare manuella anteckningar finns under Inställningar → Minne. En kompletterande `PATCH /api/notes/:id` möjliggör redigering av dessa anteckningar utan att införa ett låtsasminne.

Båda leverantörernas konfigurationsmetadata visas utan nyckelvärden. En konfigurerad nyckel betyder enbart att den finns på servern. Servern nekar riktiga chattanrop innan transport eller kostnadsreservation. Interna tester som uttryckligen använder simulerad transport kan fortfarande verifiera bevarad adapter- och budgetlogik.

Nya notiser är endast bekräftelser i appen när en ändring har sparats. Fel visas alltid. Inställningen skickar inga externa notiser.

Säkerhetskopia togs före arbetet i molnmiljön. API-testerna kör mot separata databaser, liksom webbläsartesterna. Kontroll av originaldatabasens poster och inställningar görs efter utvecklingskontrollerna för att upptäcka oavsiktliga ändringar.

## Lokal körning och framtida utbyggnad

Appen är en privat lokal prototyp utan autentisering. API-servern binds till loopback som standard. Lägg till ett separat åtkomstskydd innan fjärråtkomst blir aktuellt.

Framtida funktioner kan läggas till som nya sidrenderers, verksamhetssektioner och servermoduler. Nästa utvecklingssteg behöver inte förändra den centrala layouten. AI-körning, verklig schemaläggning, verktygsbehörigheter, plugins och integrationsflöden är inte en del av GARON 3.0-grunden.
