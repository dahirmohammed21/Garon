import {
  ArrowDownToLine,
  Check,
  CircleCheck,
  Clock3,
  Layers3,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge, SectionTitle } from "../../components/ui";
import { formObject } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
export default function SettingsPage() {
  const { state, busy, mutate } = useWorkspace();
  return (
    <div className="settings-grid">
      <section className="panel settings-card">
        <SectionTitle
          icon={Settings}
          title="Ditt huvudkontor"
          description="Personligt tilltal och lokala kostnadsgränser."
        />
        <form
          onSubmit={(event) => {
            const data = formObject(event);
            mutate(
              "/settings",
              { name: data.name, budget: Number(data.budget) },
              "PATCH",
            );
          }}
        >
          <label>
            Ditt namn
            <input
              name="name"
              required
              maxLength={60}
              defaultValue={state.settings.name}
            />
          </label>
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
          <p className="fine-print">
            Din befintliga budget sparas. AI-anrop är dessutom spärrade på
            servern under Fas 1, oavsett budget och API-nycklar.
          </p>
          <button className="button primary" disabled={busy} type="submit">
            <Check size={16} />
            Spara inställningar
          </button>
        </form>
      </section>
      <section className="panel settings-card">
        <SectionTitle
          icon={Layers3}
          title="AI-anslutning"
          description="Förberedd teknik. Separat aktivering i Fas 3."
        />
        <div className="provider-status">
          <span className="icon-box">
            <Sparkles size={20} />
          </span>
          <div>
            <strong>AI-anrop spärrade</strong>
            <p>
              {state.ai.configured
                ? "En leverantörsnyckel finns. Den används inte i Fas 1."
                : "Ingen leverantör är konfigurerad."}
            </p>
          </div>
          <Badge>Fas 1</Badge>
        </div>
        <p className="settings-instruction">
          OpenAI- och Anthropic-adaptrar finns bevarade för senare aktivering.
          Ingen nyckel behöver läggas till nu. Riktiga anrop kräver ett separat
          godkännande i Fas 3.
        </p>
        <p className="fine-print">
          Eventuella befintliga API-nycklar stannar på servern och visas aldrig
          här. Tidigare chatt och registrerad användning är bevarade.
        </p>
      </section>
      <section className="panel settings-card">
        <SectionTitle
          icon={ShieldCheck}
          title="Data & integritet"
          description="Befintliga data bevaras i samma lokala databas."
        />
        <div className="storage-line">
          <CircleCheck size={18} className="green" />
          <div>
            <strong>SQLite-databas</strong>
            <p>
              Uppdrag, anteckningar och chatthistorik sparas i{" "}
              <code>.garon/garon.sqlite</code>. Fas 1 ändrar inte databasens
              struktur.
            </p>
          </div>
        </div>
        <div className="storage-line">
          <Shield size={18} />
          <div>
            <strong>Privat användning</strong>
            <p>
              Ingen inloggning finns. Servern lyssnar lokalt som standard.
              Publik åtkomst kräver ett separat åtkomstskydd.
            </p>
          </div>
        </div>
        <a href="/api/export" download className="button">
          <ArrowDownToLine size={16} />
          Exportera mina data
        </a>
      </section>
      <section className="panel settings-card roadmap">
        <SectionTitle
          icon={Zap}
          title="GARON 2.0 · Fas 1"
          description="En tydlig struktur för kommande utveckling."
        />
        <ul>
          <li>
            <Check size={15} />
            Huvudkontor och ny navigation
          </li>
          <li>
            <Check size={15} />
            Befintliga uppdrag, minne och historik
          </li>
          <li>
            <Clock3 size={15} />
            Verksamheter och projekt · Fas 2
          </li>
          <li>
            <Clock3 size={15} />
            Aktiverad GARON Core · Fas 3
          </li>
          <li>
            <Clock3 size={15} />
            AI-chefer och agentkörning · Fas 4–5
          </li>
          <li className="future">
            <Clock3 size={15} />
            Integrationer och autonomi · Fas 6–7
          </li>
        </ul>
      </section>
    </div>
  );
}
