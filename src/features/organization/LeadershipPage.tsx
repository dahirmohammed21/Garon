import {
  ArrowDown,
  ArrowRight,
  Bot,
  Crown,
  Network,
  Shield,
  Sparkles,
} from "lucide-react";
import { Badge, SectionTitle } from "../../components/ui";
import { useWorkspace } from "../../lib/workspace";
export default function LeadershipPage() {
  const { state, go } = useWorkspace();
  return (
    <>
      <div className="notice">
        <Shield size={17} />
        Planerad organisationsstruktur · inga AI-chefer, delegeringar eller
        agentkörningar är aktiva. Rollerna nedan är inte körande system.
      </div>
      <section className="panel organization-panel">
        <div className="org-root">
          <span className="icon-box">
            <Crown size={22} />
          </span>
          <span className="eyebrow">ÄGARE</span>
          <h2>{state.settings.name}</h2>
          <p>Vision, prioriteringar, budget och yttersta beslutanderätt.</p>
          <Badge tone="pending">Du fattar besluten</Badge>
        </div>
        <ArrowDown className="org-arrow" size={23} />
        <div className="org-root org-core">
          <span className="brand-orb" />
          <span className="eyebrow">GARON CORE · PLANERAD ORKESTRERING</span>
          <h2>Din digitala VD & affärspartner</h2>
          <p>
            Central kontaktpunkt för analys, planering och framtida samordning.
          </p>
          <Badge>Inte aktiverad</Badge>
          <button className="text-button" onClick={() => go("chat")}>
            Öppna samtalsvyn <ArrowRight size={13} />
          </button>
        </div>
        <ArrowDown className="org-arrow" size={23} />
        <div className="manager-grid">
          {[
            {
              name: "OpenAI-chef",
              tag: "Strategi & analys",
              icon: Sparkles,
              roles: [
                "Research och marknadsanalys",
                "Affärsstrategi och ekonomiskt beslutsunderlag",
                "Planering och kvalitetssäkring av analyser",
              ],
            },
            {
              name: "Claude-chef",
              tag: "Teknik & utveckling",
              icon: Bot,
              roles: [
                "Programmering och systemarkitektur",
                "Webbdesign och teknisk problemlösning",
                "Integrationer och kvalitetssäkring av kod",
              ],
            },
          ].map((manager) => (
            <article className="manager-card" key={manager.name}>
              <span className="icon-box">
                <manager.icon size={23} />
              </span>
              <Badge>Planerad roll · Fas 4</Badge>
              <span className="eyebrow">{manager.tag}</span>
              <h2>{manager.name}</h2>
              <ul>
                {manager.roles.map((role) => (
                  <li key={role}>{role}</li>
                ))}
              </ul>
              <div className="manager-limits">
                <small>Behörigheter: inga externa verktyg</small>
                <small>Kostnadsgräns: ingen egen körbudget</small>
                <small>Status: ingen körning eller rapporthistorik</small>
              </div>
            </article>
          ))}
        </div>
        <div className="org-agents">
          <Network size={21} />
          <div>
            <strong>Specialiserade agenter · Fas 5</strong>
            <p>
              {state.agents.length} befintliga agentroller är sparade utan
              chefs- eller verksamhetskoppling. Inga relationer har skapats
              automatiskt.
            </p>
          </div>
          <button className="button" onClick={() => go("agents")}>
            Visa agentroller <ArrowRight size={14} />
          </button>
        </div>
      </section>
      <section className="panel structure-panel">
        <SectionTitle
          icon={Shield}
          title="Beslutsrätt och autonomi"
          description="Plan för framtida behörigheter, inte en aktiverad körmotor."
        />
        <div className="guidance-grid">
          {[
            {
              level: "A",
              title: "Rutinåtgärder",
              detail: "Intern analys och utkast inom uttryckliga gränser.",
            },
            {
              level: "B",
              title: "Villkorligt godkända",
              detail:
                "Förhandsgodkända arbetsflöden med begränsad omfattning och kostnad.",
            },
            {
              level: "C",
              title: "Ägarens godkännande",
              detail:
                "Externa utskick, betalningar, avtal och andra betydande åtgärder.",
            },
          ].map((item) => (
            <div key={item.level}>
              <Badge>Nivå {item.level} · planerad</Badge>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
        <p className="fine-print">
          Dagens godkännanden gäller enbart manuell uppdragsplanering. Tekniska
          behörighetsspärrar och en stoppfunktion för framtida körningar byggs
          innan verktyg kan aktiveras.
        </p>
      </section>
    </>
  );
}
