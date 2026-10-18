import { useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Globe,
  Mail,
  Moon,
  Palette,
  Pencil,
  Plug,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
} from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import { useTheme } from "../../lib/v3/theme";
import { money } from "../../lib/format";
import type { Note } from "../../types";
import Dialog from "./Dialog";
import { PageHeading } from "./Pages";
const categories = [
  { id: "appearance", title: "Utseende", icon: Palette },
  { id: "memory", title: "Minne", icon: BookOpen },
  { id: "plugins", title: "Plugins", icon: Plug },
  { id: "models", title: "AI-modeller", icon: Brain },
  { id: "general", title: "Allmänt", icon: SlidersHorizontal },
];
function Appearance() {
  const { preferences, update } = useTheme();
  return (
    <>
      <div className="settings-intro">
        <h2>Gör GARON till ditt</h2>
        <p>
          En lugn arbetsmiljö, i de färger du trivs med. Ändringar sparas direkt
          i den här webbläsaren.
        </p>
      </div>
      <section className="settings-section">
        <h3>Tema</h3>
        <p>Välj grunden för din arbetsyta.</p>
        <div className="theme-options">
          {[
            { id: "dark" as const, title: "Mörkt", icon: Moon },
            { id: "light" as const, title: "Ljust", icon: Sun },
          ].map((theme) => (
            <label
              key={theme.id}
              className={`theme-option ${preferences.theme === theme.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="theme"
                value={theme.id}
                checked={preferences.theme === theme.id}
                onChange={() => update({ theme: theme.id })}
              />
              <span className={`theme-preview ${theme.id}`}>
                <span />
                <i />
                <b />
                <em />
              </span>
              <span>
                <theme.icon size={15} />
                {theme.title}
                {preferences.theme === theme.id && <Check size={15} />}
              </span>
            </label>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <h3>Accentfärg</h3>
        <p>Detaljer, valda menyval och viktiga knappar får din färg.</p>
        <div className="accent-options">
          {[
            { name: "Blå", color: "#8aafff" },
            { name: "Lila", color: "#b399ef" },
            { name: "Grön", color: "#7fbea2" },
            { name: "Orange", color: "#e8ab7c" },
          ].map((option) => (
            <button
              key={option.name}
              className={`accent-option ${preferences.accent === option.color ? "selected" : ""}`}
              style={{ "--swatch": option.color } as React.CSSProperties}
              onClick={() => update({ accent: option.color })}
              aria-label={`Accentfärg ${option.name}`}
              aria-pressed={preferences.accent === option.color}
            >
              <span />
              {option.name}
            </button>
          ))}
          <label className="custom-color">
            <input
              type="color"
              aria-label="Egen accentfärg"
              value={preferences.accent}
              onChange={(event) => update({ accent: event.target.value })}
            />
            <span>Egen färg</span>
            <code>{preferences.accent.toUpperCase()}</code>
          </label>
        </div>
      </section>
      <section className="settings-section">
        <h3>Sidopanel</h3>
        <p>Lite mer utrymme eller lite mer kompakt.</p>
        <div className="segmented density-options">
          {[
            { id: "normal" as const, title: "Normal" },
            { id: "compact" as const, title: "Kompakt" },
          ].map((option) => (
            <button
              key={option.id}
              aria-pressed={preferences.density === option.id}
              className={preferences.density === option.id ? "selected" : ""}
              onClick={() => update({ density: option.id })}
            >
              {option.title}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
function NoteDialog({
  note,
  onClose,
}: {
  note: Note | null;
  onClose: () => void;
}) {
  const { busy, mutate } = useGaron();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (
      await mutate(
        note ? `/notes/${note.id}` : "/notes",
        values,
        note ? "PATCH" : "POST",
        "Anteckningen är sparad",
      )
    )
      onClose();
  }
  return (
    <Dialog
      title={note ? "Redigera anteckning" : "Ny anteckning"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <label>
          Rubrik
          <input
            name="title"
            autoFocus
            required
            maxLength={160}
            defaultValue={note?.title || ""}
            placeholder="Vad vill du komma ihåg?"
          />
        </label>
        <label>
          Anteckning
          <textarea
            name="content"
            required
            maxLength={10000}
            rows={6}
            defaultValue={note?.content || ""}
            placeholder="Skriv en idé, ett mål eller något du lärt dig…"
          />
        </label>
        <footer className="dialog-footer">
          <button
            className="button"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Avbryt
          </button>
          <button className="button primary" disabled={busy} type="submit">
            Spara
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
function Memory() {
  const { state, mutate, busy } = useGaron();
  const [editing, setEditing] = useState<Note | "new" | null>(null);
  return (
    <>
      <div className="settings-intro">
        <h2>Minne & kunskap</h2>
        <p>En framtida plats för det GARON får lära känna och komma ihåg.</p>
      </div>
      <div className="honest-status">
        <BookOpen size={20} />
        <div>
          <strong>Automatiskt AI-minne är inte aktiverat</strong>
          <p>
            GARON läser inte dina anteckningar eller samtal automatiskt och lär
            sig inte i bakgrunden. Ingen minnesfunktion aktiveras med en knapp
            här.
          </p>
        </div>
      </div>
      <section className="settings-section">
        <div className="section-header">
          <div>
            <h3>Manuella anteckningar</h3>
            <p>
              Dina egna sparade anteckningar, separat från framtida AI-minne.
            </p>
          </div>
          <button className="button" onClick={() => setEditing("new")}>
            <Plus size={15} />
            Ny anteckning
          </button>
        </div>
        {state.notes.length ? (
          <div className="saved-notes">
            {state.notes.map((note) => (
              <article key={note.id}>
                <span className="note-icon">
                  <FileText size={18} />
                </span>
                <div>
                  <h4>{note.title}</h4>
                  <p>{note.content}</p>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Redigera ${note.title}`}
                  onClick={() => setEditing(note)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button danger-text"
                  disabled={busy}
                  aria-label={`Ta bort ${note.title}`}
                  onClick={() => {
                    if (confirm(`Ta bort anteckningen ”${note.title}”?`))
                      void mutate(
                        `/notes/${note.id}`,
                        {},
                        "DELETE",
                        "Anteckningen är borttagen",
                      );
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="quiet-empty">Inga anteckningar är sparade ännu.</p>
        )}
      </section>
      {editing && (
        <NoteDialog
          note={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
function Plugins() {
  return (
    <>
      <div className="settings-intro">
        <h2>En plats för framtida kopplingar</h2>
        <p>
          Utöka GARON när behovet finns. Inga externa tjänster är anslutna i den
          här versionen.
        </p>
      </div>
      <div className="honest-status">
        <Plug size={20} />
        <div>
          <strong>Inga plugins är anslutna</strong>
          <p>
            Det finns ännu inget flöde för att ansluta konton, installera
            plugins eller ge externa behörigheter.
          </p>
        </div>
      </div>
      <div className="plugin-categories">
        {[
          { name: "E-post", icon: Mail },
          { name: "Kalender", icon: CalendarDays },
          { name: "Dokument", icon: FileText },
          { name: "Produktivitetsverktyg", icon: SlidersHorizontal },
          { name: "Affärssystem", icon: Globe },
        ].map((category) => (
          <div key={category.name}>
            <category.icon size={18} />
            <span>{category.name}</span>
            <small>Framtida kategori</small>
          </div>
        ))}
      </div>
    </>
  );
}
function Models() {
  const { state } = useGaron();
  return (
    <>
      <div className="settings-intro">
        <h2>AI, på dina villkor</h2>
        <p>
          Leverantörerna hanteras på servern. Inga API-nycklar lagras i
          gränssnittet eller i webbläsarens lokala lagring.
        </p>
      </div>
      <div className="honest-status">
        <ShieldCheck size={20} />
        <div>
          <strong>AI-anrop är spärrade</strong>
          <p>
            AI behöver aktiveras separat innan du kan skicka meddelanden. Inga
            betalda tjänster krävs för att använda den här versionen.
          </p>
        </div>
      </div>
      <section className="settings-section">
        <h3>Förberedda leverantörer</h3>
        <div className="provider-list">
          {(state.ai.providers || []).map((provider) => (
            <div key={provider.id}>
              <span className="provider-letter">{provider.name[0]}</span>
              <span>
                <strong>{provider.name}</strong>
                <small>
                  {provider.configured
                    ? provider.model
                    : "Ingen servernyckel konfigurerad"}
                </small>
              </span>
              <span className="status-label">
                {provider.configured
                  ? "Konfigurerad · anrop spärrade"
                  : "Ej konfigurerad"}
              </span>
            </div>
          ))}
        </div>
        <p className="small-note">
          En konfigurerad nyckel betyder inte att anslutningen har verifierats.
          Befintliga adaptrar för OpenAI och Anthropic är bevarade för senare
          aktivering. Fler leverantörer kan läggas till utan att gränssnittet
          byggs om.
        </p>
      </section>
      <section className="settings-section">
        <h3>Bevarad kostnadskontroll</h3>
        <div className="settings-row">
          <span>Registrerad AI-kostnad denna månad</span>
          <strong>{money(state.ai.spent)}</strong>
        </div>
        <div className="settings-row">
          <span>Lokal månadsbudget</span>
          <strong>{money(state.settings.budget)}</strong>
        </div>
        <p className="small-note">
          Historiken är bevarad. Beräknade kostnader är inte fakturor. Den
          tekniska AI-spärren gäller oavsett budget.
        </p>
      </section>
    </>
  );
}
function General() {
  const { state, mutate, busy } = useGaron();
  const { preferences, update } = useTheme();
  return (
    <>
      <div className="settings-intro">
        <h2>Det grundläggande</h2>
        <p>En privat, lokal arbetsyta med tydliga gränser.</p>
      </div>
      <section className="settings-section">
        <h3>Språk</h3>
        <div className="settings-row">
          <span>Gränssnittets språk</span>
          <strong>Svenska</strong>
        </div>
      </section>
      <section className="settings-section">
        <h3>Notiser</h3>
        <label className="settings-toggle">
          <span>
            <strong>Bekräftelser i appen</strong>
            <small>
              Visa ett meddelande när en ändring har sparats. Fel visas alltid.
            </small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={preferences.confirmations}
            onChange={(event) =>
              update({ confirmations: event.target.checked })
            }
            aria-label="Bekräftelser i appen"
          />
        </label>
        <p className="small-note">
          Inga externa utskick eller systemnotiser används.
        </p>
      </section>
      <section className="settings-section">
        <h3>Privat användning</h3>
        <div className="settings-row">
          <span>Åtkomst</span>
          <strong>Lokal prototyp utan inloggning</strong>
        </div>
        <p className="small-note">
          Servern lyssnar lokalt som standard. Publicera inte appen på internet
          utan ett separat åtkomstskydd. Data lagras okrypterade i din lokala
          SQLite-databas.
        </p>
      </section>
      <section className="settings-section">
        <h3>Dina data</h3>
        <p>
          Verksamheter, anteckningar och tidigare sparade uppgifter finns kvar i
          samma databas. Exporten innehåller även eventuell chatthistorik.
        </p>
        <a className="button" href="/api/export" download>
          <ArrowDownToLine size={15} />
          Exportera mina data
        </a>
        <details className="advanced-settings">
          <summary>Bevarade budgetinställningar</summary>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              await mutate(
                "/settings",
                { budget: Number(data.get("budget")) },
                "PATCH",
                "Budgeten är sparad",
              );
            }}
          >
            <label>
              Månadsbudget för AI (USD)
              <input
                name="budget"
                type="number"
                min="0"
                max="10000"
                step="0.01"
                required
                defaultValue={state.settings.budget}
              />
            </label>
            <button className="button" disabled={busy} type="submit">
              Spara budget
            </button>
          </form>
          <p className="small-note">
            Gäller den här installationen per månad i UTC. AI-anrop förblir
            spärrade.
          </p>
        </details>
      </section>
    </>
  );
}
export default function SettingsPage() {
  const { route, go } = useGaron();
  const selected = categories.some((category) => category.id === route.section)
    ? route.section
    : "appearance";
  return (
    <div className="standard-page settings-page">
      <PageHeading
        title="Inställningar"
        description="En arbetsmiljö som känns som din."
      />
      <div className="settings-layout">
        <nav
          className="settings-navigation"
          aria-label="Inställningskategorier"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              className={selected === category.id ? "active" : ""}
              aria-current={selected === category.id ? "page" : undefined}
              onClick={() => go({ page: "settings", section: category.id })}
            >
              <category.icon size={17} />
              {category.title}
              <ChevronRight size={13} />
            </button>
          ))}
        </nav>
        <div className="settings-content">
          {selected === "appearance" ? (
            <Appearance />
          ) : selected === "memory" ? (
            <Memory />
          ) : selected === "plugins" ? (
            <Plugins />
          ) : selected === "models" ? (
            <Models />
          ) : (
            <General />
          )}
        </div>
      </div>
    </div>
  );
}
