# GARON 4.0 – arkitektur och fortsättning

## Granskning och återanvändning

Tillgängligt material före bygget var Git-historiken för GARON 2.0 och 3.0 samt ZIP-filen för GARON 1.0. Innehållet granskades innan implementationen; inga saknade funktioner antogs finnas.

- **1.0:** OpenAI-/Anthropic-adaptrar, manuella uppdrag, lokal SQLite-lagring, budgetlogik och API-validering återanvänds.
- **2.0:** mörkblå färgidentitet och organisationshierarkin återinförs. Den gamla breda navigationen ersätts.
- **3.0:** förenklat huvudkontor, dynamiska verksamheter, tillgängliga dialoger, central routing och tema, loopback/HTTP-skydd, persistenta verksamhetsmetadata och export återanvänds.
- **4.0:** nya separata modellkanaler, backendkontext, krypterat nyckelvalv, uttrycklig AI-aktivering, gemensamma beslut, granskad delegation, minnesåtkomst, schemaläggare och databaslagrad widget-/utseendekonfiguration.

Arbetet ligger på **garon-v4**. GARON 3.0 på `garon-v1` och tidigare historik finns kvar. Före arbetet skapades även en SQLite-kopia och ett källkodsarkiv i arbetsmiljön. Dessa är inte en backup av filer på användarens Mac.

## Modulstruktur

```text
src/features/v4/
  Brand.tsx           Egen GARON-symbol och leverantörsmärken
  Sidebar.tsx         Fyra navigationssektioner och verksamhetsmappar
  Home.tsx            Fast chatt, grid, widgetregister och layoutlagring
  Chat.tsx            Kanalchatt, utkast och ärlig anslutningsstatus
  Organization.tsx    Hierarki, agentroller, granskning och delegation
  BusinessCreate.tsx  Tomt/mall/strukturerat AI-förslag
  BusinessWork.tsx    Verksamhetsuppdrag, valfria projekt, kopplade agenter
  Operations.tsx      Godkännanden, inkorg och schemalagda objekt
  Settings.tsx        Modeller, minne, kostnader, export/import och backup
src/features/v3/       Återanvända dialoger, verksamhetsvy och inställningsdelar
src/lib/v3/            Gemensamt tillstånd, routing och centralt tema
src/garon4.css         4.0-variabler, komponenter och responsiv design
server/
  core/ai4.js          AI-orkestrering, modeller/priser, budget och en pågående körning
  core/context.js      Kanalgränser, relevant minne och begränsad historik
  core/vault.js        AES-GCM-valv med separat lokal huvudnyckel
  v4/api.js            Validerade nya API-rutter och intern tick-funktion
  v4/import.js         Fullständig validering före atomisk import
  providers/           HTTP-adaptrar för OpenAI och Anthropic
  modules/             Återanvända verksamhets-/uppdrags-/antecknings-API:er
  storage/             SQLite och versionsregister för migreringar
  policies/            JSON-gränser och kontroller av webbursprung
```

De äldre komponenterna och det äldre chatt-API:t ligger kvar för kompatibilitet. Äldre `/api/chat` är fortfarande spärrat i normal drift. 4.0 använder `/api/v4/chat/:channel` med separat uttrycklig aktivering. Testsviten bevarar kompatibilitetskontrollerna och lägger till 4.0-tester.

## Data och migrering

Befintlig `entities(id, kind, data)` och `settings` återanvänds. Nya typer är bland annat `chatMessage`, `memory`, `approval`, `delegation`, `inbox`, `schedule`, `project`, `draft`, `connection` och `config`. Migration 4 skapar `schema_migrations` och ett typindex. Den skriver inte om användarens rader eller inställningar.

`v4-ui` innehåller widgetlayout och utseende. `ai-config` innehåller valda modeller och aktiveringsflagga, aldrig nycklar. Utkast har ett fast id per kanal. Konversationer och användning har separata poster. Godkännanden och delegeringar sparas före körning. Agentkonfiguration är skild från en körprocess.

SQLite-backup använder backup-API; före första uppgraderingen av en databas med användarposter används `VACUUM INTO`. JSON-import valideras helt före `BEGIN IMMEDIATE`, lägger till nya id:n och rullar tillbaka vid fel. Befintliga poster skrivs aldrig över. AI-konfiguration kan inte importeras. Importerade godkännanden har ingen körbar handling; importerade delegeringar måste skapas på nytt för körning.

Lagringsmodulen ska även fortsättningsvis vara den enda platsen som öppnar databasanslutningen. Lägg kommande schemaändringar som nya versionssteg; radera aldrig den befintliga databasen för att få en ny version att starta.

## Behörighet och AI

Kanalnamn och åtkomst bestäms av backendrutt. Klienten kan inte lägga till egna systemmeddelanden, historiker eller privatåtkomst. GARON får relevant chefsunderlag. Mellanchefer får egen historik och relevanta delade minnen, aldrig privat GARON-historik. Verksamhetsminnen kräver rätt vald kontext. All kontext är underlag, inte en behörighetskälla.

En delegering lagrar exakt granskat underlag, mottagare, eventuell agent och hash av agentkonfigurationen. Godkännandet är bundet till en SHA-256-hash av jobbets innehåll. Backend kräver rätt status, beslut, resurs och hash, och förbrukar beslutet före nätverksanropet. Ändrad eller avstängd agent kan inte köras med tidigare beslut. Körningen är isolerad från chatt- och minneshistorik. Resultatet blir synligt i delegeringslistan och mottagarens kanal.

AI har inga externa verktyg. JSON-förslag valideras som data och exekveras aldrig som kod. Det finns inga modellfunktioner som skriver till databasen eller registrerar ägarens godkännande.

AI-orkestreraren tillåter en pågående betald körning per serverprocess och reserverar konservativ kostnad före anropet. Svaren begränsas till 1024 token. Rapportering av faktiska token ersätter reservationen; saknad tokeninformation eller fel behåller den. Kör en backendprocess per databas. Flera processer behöver gemensamma lås och atomiska kostnadsreservationer innan det stöds.

Valvet krypterar sparade leverantörsnycklar med AES-256-GCM, separat nyckelfil och atomisk filersättning. Servern återger inte nyckelvärden och leverantörsfel saneras. JSON-parserfel återger inte inskickad text. Nycklar hålls bara tillfälligt i lösenordsfältet under användarens inmatning; de läggs inte i localStorage, klientkonfiguration eller export.

## Schemaläggning och fel

Servern behandlar förfallna interna objekt vid start och var 30:e sekund. Varje leverans och eventuell uppgift skrivs i en SQLite-transaktion tillsammans med statusändringen. Upprepade tick ger ingen extra leverans. Avbrutna objekt körs inte. Detta är interna påminnelser och uppgifter, utan modell- eller verktygsanrop, systemnotiser eller extern e-post.

En körning som var `running` vid en processkrasch markeras vid nästa start som misslyckad med förklaring. Den återstartas aldrig automatiskt eftersom leverantören kan ha debiterat anropet. Granska leverantörens användning och skapa vid behov ett nytt förslag. Schemaläggaren kräver att datorn och serverprocessen är igång; den är ingen macOS-bakgrundstjänst.

Chattutkast sparas med debounce och flush vid sidbyte/stängning. Widgetlayout sparas när drag/resize avslutas. Viktiga redigeringar kräver Spara för att inte skriva halvfärdiga agent- eller verksamhetsinstruktioner; ingen ytterligare global sparknapp behövs efter godkänd ändring.

## Utbyggnadsgränssnitt

Fortsätt vid nästa behov; de här delarna är inte aktiva funktioner:

1. **Ny AI-leverantör:** lägg till adapter som tar `{ model, messages, system, key, fetchImpl }` och returnerar `{ answer, inputTokens, outputTokens }`; registrera pris och serverstyrd kanalåtkomst.
2. **Externa integrationer:** separera anslutning, hemligheter, deklarerade verktyg och körbehörigheter. Ge varje verktyg ett schema, risknivå och scope. Koppla inget verktyg direkt till modelltext. OAuth och kontobevis kräver en egen implementation.
3. **Riskfyllda åtgärder:** bind godkännandet till oföränderligt innehåll, resurs, kostnadsgräns och verktyg. Kräv backendkontroll, idempotens och loggning. Återanvänd inte dagens promptdelegering för betalningar eller publicering.
4. **Agentmotor:** skilj agentkonfiguration från köad körning, budget, avbrott och resultat. Planera återhämtning efter krasch före autonoma loopar.
5. **Dokumentkällor:** inför filvalidering, källregister, åtkomstscope och begränsad hämtning. Nu finns manuella minnesposter med källa; ingen filindexering eller vektordatabas.
6. **Moln/macOS-app:** bygg autentisering och åtkomstskydd före fjärråtkomst. Behåll lagring utanför appversionen och säkerhetskopior före migrering. Ingen molnsynk aktiveras av denna version.

## Genomförda faser

Fas 1–6 är implementerade: identitet/navigation/widgets, lokal lagring, AI-organisation, riktiga API-adaptrar och granskad orkestrering, verksamheter och huvudkontorets funktioner. Fas 7 omfattar automatiserade tester, originaldatakontroll, svensk README och skärmbilder av appen. Verkliga API-anrop behöver användarens nycklar. macOS-specifik Finder-/webbläsaröppning behöver verifieras på användarens Mac; scriptets bygg- och serverflöde testas i Linux.
