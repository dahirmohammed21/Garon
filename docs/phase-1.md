# Fas 1: genomförande och fortsatt arkitektur

## Avgränsning

Den godkända Fas 1 ändrar informationsarkitektur, presentation och kodorganisation. Den bygger vidare på React, TypeScript, Vite, Node/Express och SQLite. Det finns en lokal serverprocess och en databas. Inga verksamhetsregister, projektdatabaser, autonoma körmotorer eller externa integrationer införs.

## Genomförda delar

1. Gemensamma paneler, sidopanel och formulärdialog har separerats från vyerna. Format, navigation och API-anrop har egna moduler.
2. Befintliga funktioner har separata vyer. Huvudkontor, affärspartner, AI-ledning samt förberedda verksamhets-, projekt- och integrationsvyer har tillkommit.
3. Sidopanelen följer de tre godkända grupperna och de tolv angivna menynamnen. Fristående uppdrag nås via Projekt; gamla `#tasks`-länkar fungerar fortfarande.
4. SQLite-åtkomst, uppdrags-/minnes-/agent-/inställningsfunktioner, HTTP-skydd och leverantörsadaptrar har separerats på servern.
5. `/api/chat` nekar anrop med HTTP 403 i normal serverstart. Spärren sker före kostnadsreservation, historikskrivning och kontakt med en leverantör. Förekomst av en nyckel eller manipulerade frontendfält aktiverar inte AI. Intern parameter `allowAI` används bara av isolerade tester med uttryckligen simulerad nätverkstransport; serverstarten läser aldrig den parametern från miljövariabler eller en begäran.
6. Budget, aktivitetslogg och tidigare dataformat behålls. Design-demo är ett tillstånd i gränssnittet och skriver inte poster till databasen.

## Status för kommande funktioner

| Funktion | Status efter Fas 1 |
| --- | --- |
| Uppdrag, manuell planering och anteckningar | Implementerat, bevarat |
| Huvudkontor och ny navigation | Implementerat |
| Verksamhets- och projektkort | Märkt design-demo |
| AI-chefer och organisationsrelationer | Planerad struktur, inga körningar |
| AI-chatt | Tidigare teknik och historik bevarad, anrop spärrade |
| Globalt minne | Befintliga anteckningar; ingen automatisk AI-åtkomst |
| Verksamhets- och projektminne | Framtida fas |
| Rapporter och rekommendationer | Aktivitetslogg och tydligt märkt regelbaserad vägledning |
| Verktygsbehörigheter, stoppfunktion och autonomi | Framtida faser, krävs före faktisk agentkörning |

Dagens godkännanden tillåter bara att ett uppdrag flyttas till planerat. De godkänner inte betalningar, publicering, utskick eller verktygsanvändning. Nivå A/B/C visas som en plan för framtida behörigheter.

## Säker migrationsplan inför Fas 2

Fas 1 kräver ingen migrering och ändrar inga tabeller eller befintliga poster. En SQLite-säkerhetskopia togs utanför Git-checkouten före arbetet i molnmiljön. Den är inte en säkerhetskopia av eventuella separata data på användarens Mac.

Före Fas 2:

1. Ta säkerhetskopia av den faktiska databas som ska uppgraderas med SQLite backup-API, eller med servern stoppad. Bevara även `.env` separat utan att skriva nycklar i loggar eller Git.
2. Introducera versionsstyrda, transaktionella och upprepningssäkra tilläggsmigreringar på en kopia först. Slutligt tabellval bestäms och granskas inför Fas 2.
3. Lägg till verksamhet, projekt och valfria relationer. Modellera verksamhet → projekt → uppdrag; behåll gamla uppdrags-ID:n. Befintliga uppdrag har ingen projektkoppling förrän ägaren väljer en.
4. Förbered globalt, verksamhetsspecifikt och projektspecifikt minne utan att flytta gammal kunskap automatiskt eller ändra dess sanningsstatus.
5. Kontrollera antal, identiteter, innehåll, chatt, kostnader och relationer före och efter migreringen. Testa att körning två inte skapar dubbletter eller förändrar redan migrerade data.
6. Prova återställning av säkerhetskopian med föregående appversion. Aktivera inte migreringen på originalet förrän kontrollen och ägarens godkännande finns.

Inga tabeller eller befintliga data behöver raderas för den föreslagna övergången.

## Verifiering

- API-tester för uppdrag, godkännanden, agentroller, anteckningar och export.
- Omstart med beständig SQLite-lagring.
- Regressionstest med tidigare databasformat: innehåll och schema jämförs före och efter läsning.
- AI-spärr med simulerad nyckel och manipulerad begäran: inga leverantörsanrop, kostnader, meddelanden eller aktivitet skapas.
- Adapter- och budgettester använder enbart simulerade leverantörssvar.
- Webbläsartester för det gamla arbetsflödet genom den nya navigationen, tydlig demo och alla vyer på smala och breda skärmar.
- TypeScript-kontroll och produktionsbygge.

## Nästa beslut

Nästa möjliga steg är Fas 2: verkligt skapande, redigering och lagring av verksamheter och projekt. Det kräver ett separat godkännande. AI-aktivering väntar till ett senare separat beslut.
