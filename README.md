# GARON

En personlig kontrollcentral för idéer, uppdrag, kunskap och AI. Gränssnittet är på svenska och inspirerat av den mörka GARON-referensen.

## Starta

Kräver **Node.js 24 eller senare** och npm.

```sh
npm ci
npm run dev
```

Utvecklingsservern använder port 5173 och vidarebefordrar API-anrop till port 3001. API:t lyssnar lokalt. Vite är tillgängligt för den privata utvecklingsmiljön; appen saknar autentisering och ska inte exponeras på internet.

För att köra den byggda appen:

```sh
npm run build
npm start
```

Den byggda appen och API:t serveras tillsammans på port 3001. `HOST` är `127.0.0.1` som standard. Kör alltid kommandona i projektets rot.

## Det som fungerar

- Översikt med verkliga uppdragsdata och ett separat, tydligt märkt design-demo.
- Skapa, redigera, söka, prioritera, slutföra och radera uppdrag.
- Godkänna eller avslå uppdrag som kräver ett manuellt beslut.
- Skapa agentroller, koppla dem till uppdrag och pausa konfigurationerna.
- Spara och söka anteckningar i minnet.
- Aktivitetslogg, global sökning och aviseringar för väntande beslut.
- AI-chatt med OpenAI eller Anthropic när en API-nyckel har konfigurerats.
- Lokal månadsbudget, registrerad tokenanvändning och JSON-export.
- Beständig SQLite-lagring, responsiv layout och tangentbordsnavigation.

Agentrollerna är **konfigurationer**. De kör inte uppdrag, använder inga verktyg och samarbetar inte automatiskt. Uppdragsstatus ändras manuellt. AI-chatten är en samtalsfunktion utan verktyg och får inte automatiskt tillgång till anteckningar eller uppdrag. Sparad tid mäts inte i den här versionen.

## Anslut en AI-modell

Kopiera `.env.example` till `.env` och lägg till en nyckel från din leverantör:

```dotenv
OPENAI_API_KEY=din_nyckel
```

eller:

```dotenv
ANTHROPIC_API_KEY=din_nyckel
```

Starta om servern efter ändringen. OpenAI prioriteras om båda nycklarna är satta. Standardmodellerna är `gpt-4.1-mini` respektive `claude-sonnet-4-20250514`. Konfigurerad betyder att en nyckel finns; anslutningen prövas först vid ett meddelande. Nycklar skickas aldrig till webbläsaren och `.env` ignoreras av Git. Hårdkoda eller checka aldrig in nycklar.

Ingen nyckel krävs för resten av plattformen. Chattinnehåll skickas till vald AI-leverantör när du skickar ett meddelande. Historiken från de senaste tolv meddelandena följer med för sammanhang.

### Budget

Standardbudgeten är 10 USD per kalendermånad i UTC. Ändra den i Inställningar. 0 USD blockerar nya anrop. Servern reserverar en konservativ kostnad före anropet och ersätter den med en tokenbaserad beräkning när användningsdata kommer tillbaka. Endast ett AI-anrop körs åt gången per serverprocess. Kör **en** serverprocess för samma databas.

Pristabellen använder 0,40 / 1,60 USD per miljon in-/uttoken för `gpt-4.1-mini` och 3 / 15 USD för `claude-sonnet-4-20250514`. Priser kan ändras. Andra modellnamn blockeras tills en verifierad prispost lagts till. Kostnaderna är uppskattningar, inte leverantörsfakturor. Osäkra eller misslyckade anrop behåller reservationen eftersom leverantören kan ha debiterat dem. Sätt även kostnadsgränser hos leverantören. Andra appar och installationer ingår inte i den lokala budgeten.

## Data och säkerhet

SQLite skapas automatiskt i `.garon/garon.sqlite`. Data och chatthistorik är lokala och okrypterade. `.garon/` ignoreras av Git. Säkerhetskopiera data med exportknappen i Inställningar. Exporten innehåller även chatthistorik; hantera den som privat information. Exporten är för säkerhetskopiering och granskning; import är inte byggd.

Om du vill kopiera själva databasen, stoppa servern först och kopiera hela `.garon/` så att även eventuell WAL-data följer med. `GARON_DB` kan ange en annan databasfil.

Appen har ingen inloggning, kryptering eller produktionshärdning. Den binds till loopback som standard. Exponera den inte publikt. Lägg till privat åtkomst och autentisering innan fjärråtkomst används. API:t begränsar JSON-storlek, validerar indata och blockerar kända anrop från främmande webbplatser.

## Kontrollera installationen

```sh
npm test
npm run build
npm run test:e2e
```

API-testerna använder isolerade databaser och simulerade leverantörssvar, utan nätverksanrop eller AI-kostnader. De kontrollerar beständig lagring, uppdragsbeslut, validering, budgetspärr och båda leverantörsformaten. Webbläsartesterna går igenom ett riktigt arbetsflöde på desktop och mobil, inklusive sparande och återläsning. De använder en separat tillfällig databas.

Webbläsartesterna använder `/usr/bin/chromium` i den här molnmiljön. På en annan dator anger du `CHROMIUM_PATH` till din Chromium- eller Chrome-binär. Skärmbilder från testerna sparas i `/tmp/garon-desktop.png` och `/tmp/garon-mobile.png`.

## Struktur

```text
src/                 React-gränssnitt, typer och stilar
server/app.js        API, SQLite-lagring, AI och budgetkontroll
server/index.js      Serverstart
tests/               Isolerade API-tester och webbläsartester
public/              Lokal logotyp
.env.example         Mall för frivillig AI-anslutning
```

Teckensnitt paketeras lokalt. Gränssnittet kräver inga externa CDN:er. Framtida steg är verktygsbehörigheter, faktisk agentkörning, schemaläggning och ett separat skyddat körsystem.
