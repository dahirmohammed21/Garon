import { useState } from "react";
import { useGaron } from "../../lib/v3/garon";
import { useTheme, appearanceDefaults } from "../../lib/v3/theme";
import { Appearance, Plugins } from "../v3/SettingsPage";
import { PageHeading } from "../v3/Pages";
import Dialog from "../v3/Dialog";
import { request } from "../../lib/api";
import { money, date } from "../../lib/format";
import type { MemoryItem } from "../../types";
const tabs = [
  ["appearance", "Utseende"],
  ["models", "AI-modeller"],
  ["memory", "Minne och kunskap"],
  ["plugins", "Plugins och integrationer"],
  ["costs", "Ekonomi och AI-kostnader"],
  ["general", "Allmänt"],
];
function Models() {
  const { state, mutate, busy } = useGaron();
  const ai = state.v4.ai;
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  return (
    <>
      <h2>AI-modeller och behörighet</h2>
      <p className="subtle-notice">
        Din privata GARON-kanal skickas till vald inferensleverantör för att
        skapa svaret. Den delas inte som historik med mellanchefernas andra
        kanaler. Leverantörens egna datavillkor gäller fortfarande.
      </p>
      {ai.providers.map((provider) => (
        <section className="settings-section" key={provider.id}>
          <h3>{provider.name}</h3>
          <p>
            {provider.configured
              ? "En nyckel är konfigurerad."
              : "Ingen nyckel är konfigurerad."}{" "}
            {state.v4.connections.find((row) => row.id === provider.id)
              ? `Senast verifierad: ${date(state.v4.connections.find((row) => row.id === provider.id)!.verifiedAt, true)}`
              : "Ingen verifierad anslutning ännu."}
          </p>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (
                await mutate(
                  `/v4/keys/${provider.id}`,
                  { key: keys[provider.id] },
                  "POST",
                  "Nyckeln är sparad på servern",
                )
              )
                setKeys((value) => ({ ...value, [provider.id]: "" }));
            }}
          >
            <label>
              API-nyckel
              <input
                type="password"
                autoComplete="off"
                aria-label={`${provider.name} API-nyckel`}
                value={keys[provider.id] || ""}
                onChange={(event) =>
                  setKeys((value) => ({
                    ...value,
                    [provider.id]: event.target.value,
                  }))
                }
              />
            </label>
            <button className="button" disabled={busy || !keys[provider.id]}>
              Spara nyckel
            </button>
          </form>
          <button
            className="button"
            disabled={busy || !provider.configured}
            onClick={async () => {
              try {
                await request(`/v4/connection/${provider.id}`, {});
                setStatus(
                  `${provider.name}: anslutningen fungerar. Ingen textgenerering gjordes.`,
                );
              } catch (error) {
                setStatus((error as Error).message);
              }
            }}
          >
            Testa anslutning
          </button>
        </section>
      ))}
      {status && <p role="status">{status}</p>}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          await mutate(
            "/v4/ai",
            {
              enabled: data.get("enabled") === "on",
              acceptCosts: data.get("costs") === "on",
              garonProvider: data.get("provider"),
              models: {
                openai: data.get("openaiModel"),
                anthropic: data.get("anthropicModel"),
              },
            },
            "PATCH",
            "AI-inställningarna är sparade",
          );
        }}
      >
        <label>
          GARONs inferensleverantör
          <select name="provider" defaultValue={ai.garonProvider}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </label>
        <label>
          OpenAI-modell
          <select name="openaiModel" defaultValue={ai.models.openai}>
            <option value="gpt-4.1-mini">gpt-4.1-mini</option>
            <option value="gpt-4.1">gpt-4.1</option>
          </select>
        </label>
        <label>
          Anthropic-modell
          <select name="anthropicModel" defaultValue={ai.models.anthropic}>
            <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
            <option value="claude-sonnet-4-5-20250929">
              Claude Sonnet 4.5
            </option>
          </select>
        </label>
        <label className="check-row">
          <input type="checkbox" name="enabled" defaultChecked={ai.enabled} />
          Aktivera riktiga AI-anrop
        </label>
        <label className="check-row">
          <input type="checkbox" name="costs" />
          Jag godkänner API-kostnader inom min budget.
        </label>
        <button className="button primary" disabled={busy}>
          Spara AI-inställningar
        </button>
      </form>
      <p className="small-note">
        Nycklar krypteras lokalt på servern med AES-GCM och filer med begränsad
        åtkomst. Skyddet ersätter inte säkerheten i ditt macOS-konto. Nycklar
        finns inte i exporten.
      </p>
    </>
  );
}
function Memory() {
  const { state, mutate, busy } = useGaron();
  const [editing, setEditing] = useState<MemoryItem | "new" | null>(null);
  const item = editing && editing !== "new" ? editing : null;
  return (
    <>
      <div className="section-header">
        <h2>Minne och kunskap</h2>
        <button className="button" onClick={() => setEditing("new")}>
          Ny minnespost
        </button>
      </div>
      <p className="subtle-notice">
        Relevanta minnen hämtas utifrån frågan. Privata poster läses endast av
        GARON-kanalen. Delade poster kan användas av mellanchefer. AI-slutsatser
        räknas inte automatiskt som verifierade fakta.
      </p>
      {state.v4.memory.map((memory) => (
        <article className="memory-item" key={memory.id}>
          <span className="status-label">
            {memory.visibility === "private" ? "Privat för GARON" : "Delad"} ·{" "}
            {memory.verified ? "Ägarverifierad" : "Ej verifierad"}
          </span>
          <h3>{memory.title}</h3>
          <p>{memory.content}</p>
          <small>
            Källa: {memory.source} ·{" "}
            {state.businesses.find((row) => row.id === memory.businessId)
              ?.name || "Globalt minne"}
          </small>
          <div>
            <button className="button" onClick={() => setEditing(memory)}>
              Redigera
            </button>
            <button
              className="button"
              disabled={busy}
              onClick={() => {
                if (confirm(`Ta bort minnesposten ”${memory.title}”?`))
                  void mutate(
                    `/v4/memory/${memory.id}`,
                    { confirm: true },
                    "DELETE",
                  );
              }}
            >
              Ta bort
            </button>
          </div>
        </article>
      ))}
      {!state.v4.memory.length && (
        <p className="quiet-empty">
          Inga långsiktiga minnen har skapats. Tidigare manuella anteckningar
          finns bevarade och ingår i exporten.
        </p>
      )}
      {editing && (
        <Dialog
          title={item ? "Redigera minne" : "Ny minnespost"}
          busy={busy}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const data = Object.fromEntries(
                new FormData(event.currentTarget),
              );
              if (
                await mutate(
                  item ? `/v4/memory/${item.id}` : "/v4/memory",
                  { ...data, verified: data.verified === "on" },
                  item ? "PATCH" : "POST",
                )
              )
                setEditing(null);
            }}
          >
            <label>
              Rubrik
              <input
                name="title"
                maxLength={160}
                required
                defaultValue={item?.title}
              />
            </label>
            <label>
              Innehåll
              <textarea
                name="content"
                rows={5}
                required
                maxLength={6000}
                defaultValue={item?.content}
              />
            </label>
            <label>
              Källa
              <input
                name="source"
                required
                maxLength={300}
                defaultValue={item?.source || "Ägaren"}
              />
            </label>
            <label>
              Åtkomst
              <select
                name="visibility"
                defaultValue={item?.visibility || "private"}
              >
                <option value="private">Endast GARON</option>
                <option value="shared">Delat med mellanchefer</option>
              </select>
            </label>
            <label>
              Verksamhet
              <select name="businessId" defaultValue={item?.businessId || ""}>
                <option value="">Globalt</option>
                {state.businesses.map((row) => (
                  <option value={row.id} key={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                name="verified"
                defaultChecked={item?.verified}
              />
              Jag har verifierat uppgiften.
            </label>
            <footer className="dialog-footer">
              <button
                className="button"
                type="button"
                onClick={() => setEditing(null)}
              >
                Avbryt
              </button>
              <button className="button primary" disabled={busy}>
                Spara minne
              </button>
            </footer>
          </form>
        </Dialog>
      )}
    </>
  );
}
function Costs() {
  const { state, mutate, busy } = useGaron();
  return (
    <>
      <h2>Ekonomi och AI-kostnader</h2>
      <div className="settings-row">
        <span>Registrerat denna månad</span>
        <strong>{money(state.v4.ai.spent)}</strong>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void mutate(
            "/settings",
            { budget: Number(new FormData(event.currentTarget).get("budget")) },
            "PATCH",
          );
        }}
      >
        <label>
          Månadsbudget i USD
          <input
            type="number"
            min="0"
            max="10000"
            step=".01"
            name="budget"
            required
            defaultValue={state.settings.budget}
          />
        </label>
        <button className="button" disabled={busy}>
          Spara budget
        </button>
      </form>
      <p className="small-note">
        Uppskattningar, inte fakturor. Budget per kalendermånad i UTC. Osäkra
        anrop behåller en reservation. Sätt även gränser hos leverantören.
      </p>
      <h3>Prismodell · USD per miljon token in/ut</h3>
      {state.v4.ai.providers.map((row) => (
        <p key={row.id}>
          {row.model}: {row.price?.join(" / ") || "Pris saknas"}
        </p>
      ))}
      <div className="usage-scroll">
        <table>
          <thead>
            <tr>
              <th>Modell / agent</th>
              <th>Token in/ut</th>
              <th>Beräknat</th>
            </tr>
          </thead>
          <tbody>
            {state.usage.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.model}
                  <small>
                    {state.agents.find(
                      (agent) => agent.id === (row as any).agentId,
                    )?.name || "Direkt AI-anrop"}
                  </small>
                </td>
                <td>
                  {row.inputTokens} / {row.outputTokens}
                </td>
                <td>
                  {money(row.cost)}
                  {row.estimated ? " · reservation" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function General() {
  const { state, mutate, busy } = useGaron();
  const { preferences, update } = useTheme();
  const [status, setStatus] = useState("");
  return (
    <>
      <h2>Allmänt och dataintegritet</h2>
      <div className="settings-row">
        <span>Språk</span>
        <strong>Svenska</strong>
      </div>
      <label className="settings-toggle">
        <span>Bekräftelser i appen</span>
        <input
          type="checkbox"
          role="switch"
          aria-label="Bekräftelser i appen"
          checked={preferences.confirmations}
          onChange={(event) => update({ confirmations: event.target.checked })}
        />
      </label>
      <p className="subtle-notice">
        Privat lokal app utan inloggning. Backend lyssnar på loopback. Ingen
        molnsynkronisering är aktiverad. Skydda åtkomsten före fjärranslutning.
      </p>
      <a href="/api/v4/export" download className="button">
        Exportera alla data
      </a>
      <button
        className="button"
        disabled={busy}
        onClick={async () => {
          try {
            const result = await request("/v4/backup", {});
            setStatus(
              `Säkerhetskopia skapad: ${result.file} i datamappens backups-katalog`,
            );
          } catch (error) {
            setStatus((error as Error).message);
          }
        }}
      >
        Säkerhetskopiera databasen
      </button>
      <label className="import-label">
        Importera GARON-säkerhetskopia
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 5e6) {
              setStatus("Filen är för stor. Max 5 MB.");
              return;
            }
            try {
              const backup = JSON.parse(await file.text());
              if (
                !confirm(
                  "Importera nya poster? Befintliga poster skrivs inte över. Godkännanden återställs till väntande.",
                )
              )
                return;
              await mutate(
                "/v4/import",
                { confirm: true, backup },
                "POST",
                "Nya poster är importerade",
              );
            } catch {
              setStatus("Kunde inte läsa säkerhetskopian.");
            }
            event.target.value = "";
          }}
        />
      </label>
      {status && <p role="status">{status}</p>}
      <p className="small-note">
        Databas: {state.v4.system.dataFile} · migrering version 4. Nyckelvalvet
        och dess huvudnyckel exporteras inte. Säkerhetskopiera dem separat med
        servern stoppad om du vill återställa nycklar. Hela katalogen ska
        hanteras som privat.
      </p>
      <div className="settings-row">
        <span>Verksamheter / agentroller</span>
        <strong>
          {state.businesses.length} / {state.agents.length}
        </strong>
      </div>
    </>
  );
}
export default function Settings() {
  const { route, go } = useGaron();
  const { update } = useTheme();
  const selected = tabs.some(([id]) => id === route.section)
    ? route.section
    : "appearance";
  return (
    <div className="standard-page settings-page">
      <PageHeading
        title="Inställningar"
        description="Utseende, kunskap, AI och lokala data."
      />
      <div className="settings-layout">
        <nav
          className="settings-navigation"
          aria-label="Inställningskategorier"
        >
          {tabs.map(([id, title]) => (
            <button
              className={selected === id ? "active" : ""}
              key={id}
              onClick={() => go({ page: "settings", section: id })}
            >
              {title}
            </button>
          ))}
        </nav>
        <div className="settings-content">
          {selected === "appearance" ? (
            <>
              <Appearance />
              <button
                className="button"
                onClick={() => update(appearanceDefaults)}
              >
                Återställ standardutseende
              </button>
            </>
          ) : selected === "models" ? (
            <Models />
          ) : selected === "memory" ? (
            <Memory />
          ) : selected === "plugins" ? (
            <Plugins />
          ) : selected === "costs" ? (
            <Costs />
          ) : (
            <General />
          )}
        </div>
      </div>
    </div>
  );
}
