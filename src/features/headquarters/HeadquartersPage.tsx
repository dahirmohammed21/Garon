import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CircleCheck,
  Clock3,
  FolderKanban,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { Badge, Empty, SectionTitle } from "../../components/ui";
import { money, relative, statusLabels } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
export function DemoToggle() {
  const { demo, setDemo } = useWorkspace();
  return (
    <label className="demo-switch">
      <input
        type="checkbox"
        checked={demo}
        onChange={(event) => setDemo(event.target.checked)}
      />
      <span className="switch-track" />
      Visa design-demo
    </label>
  );
}
export default function HeadquartersPage() {
  const { state, go, setModal, demo, lastVisit } = useWorkspace();
  const approvals = state.tasks.filter((task) => task.status === "approval");
  const priorities = state.tasks
    .filter((task) => ["pending", "running"].includes(task.status))
    .sort(
      (a, b) =>
        ({ high: 0, normal: 1, low: 2 })[a.priority] -
        { high: 0, normal: 1, low: 2 }[b.priority],
    )
    .slice(0, 4);
  const events = state.activity.filter(
    (event) => !lastVisit || new Date(event.createdAt) > new Date(lastVisit),
  );
  return (
    <div className="headquarters">
      <section className="hq-hero panel">
        <div className="hq-hero-copy">
          <span className="eyebrow">DITT DIGITALA HUVUDKONTOR</span>
          <h2>
            En tydlig riktning.
            <br />
            <span>För allt du bygger.</span>
          </h2>
          <p>
            Samla verksamheter, följ prioriteringar och fatta genomtänkta
            beslut. GARON växer med ditt arbete, ett steg i taget.
          </p>
          <button className="button primary" onClick={() => go("chat")}>
            <MessageSquare size={16} />
            Öppna min affärspartner
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="hq-core">
          <div className="hq-core-orbit">
            <span className="brand-orb" />
          </div>
          <span className="eyebrow">GARON CORE</span>
          <strong>Din centrala kontaktpunkt</strong>
          <Badge>AI pausad · Fas 1</Badge>
          <small>Ingen delegering eller agentkörning är aktiv.</small>
        </div>
      </section>
      <div className="overview-toolbar">
        <span>
          <span className="green-dot" />
          Lokal arbetsyta · verkliga data
        </span>
        <DemoToggle />
      </div>
      {demo && (
        <div className="notice demo-notice">
          <Sparkles size={16} />
          Design-demo: endast kort uttryckligen märkta ”Demo” visar exempel.
          Beslut, kostnader och uppdrag nedan är dina verkliga data.
        </div>
      )}
      <div className="hq-metrics">
        <button className="panel hq-metric" onClick={() => go("approvals")}>
          <ShieldCheck size={19} />
          <span>
            Beslut som väntar<strong>{approvals.length}</strong>
          </span>
          <ArrowUpRight size={15} />
        </button>
        <button className="panel hq-metric" onClick={() => go("projects")}>
          <FolderKanban size={19} />
          <span>
            Pågående uppdrag
            <strong>
              {state.tasks.filter((task) => task.status === "running").length}
            </strong>
          </span>
          <ArrowUpRight size={15} />
        </button>
        <button className="panel hq-metric" onClick={() => go("finance")}>
          <Wallet size={19} />
          <span>
            AI-kostnad denna månad<strong>{money(state.ai.spent)}</strong>
          </span>
          <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="hq-columns">
        <section className="panel hq-section">
          <SectionTitle
            icon={Building2}
            title="Dina verksamheter"
            description="Samlad riktning för dina olika satsningar."
            action={
              <button className="text-button" onClick={() => go("businesses")}>
                Visa vy <ArrowRight size={13} />
              </button>
            }
          />
          {demo ? (
            <div className="business-previews">
              {[
                {
                  name: "SITELY",
                  tag: "Webbdesign & utveckling",
                  color: "blue",
                },
                {
                  name: "E-handel",
                  tag: "Research & affärsutveckling",
                  color: "purple",
                },
              ].map((item) => (
                <button key={item.name} onClick={() => go("businesses")}>
                  <span className={`business-monogram ${item.color}`}>
                    <Building2 size={22} />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.tag}</small>
                  </span>
                  <Badge>Demo</Badge>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              icon={Building2}
              title="Plats för dina verksamheter"
              detail="Verksamheter kan skapas och sparas i Fas 2. Utforska den planerade strukturen redan nu."
              action={
                <button
                  className="text-button"
                  onClick={() => go("businesses")}
                >
                  Se verksamhetsvyn <ArrowRight size={14} />
                </button>
              }
            />
          )}
        </section>
        <section className="panel hq-section">
          <SectionTitle
            icon={ShieldCheck}
            title="Din uppmärksamhet behövs"
            description="Beslut som väntar på dig."
          />
          {approvals.length ? (
            <div className="hq-list">
              {approvals.slice(0, 3).map((task) => (
                <button key={task.id} onClick={() => go("approvals")}>
                  <span className="icon-box orange">
                    <ShieldCheck size={17} />
                  </span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>Godkänn eller avslå planering av uppdraget.</small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          ) : (
            <Empty
              icon={CircleCheck}
              title="Inga beslut väntar"
              detail="Du har inga uppdrag att godkänna just nu. Externa åtgärder är inte aktiverade."
            />
          )}
        </section>
      </div>
      <div className="hq-columns">
        <section className="panel hq-section">
          <SectionTitle
            icon={FolderKanban}
            title="Prioriteringar & projekt"
            description="Dina befintliga uppdrag, i prioritetsordning."
            action={
              <button className="text-button" onClick={() => go("projects")}>
                Visa alla <ArrowRight size={13} />
              </button>
            }
          />
          {priorities.length ? (
            <div className="hq-list">
              {priorities.map((task) => (
                <button key={task.id} onClick={() => setModal(task)}>
                  <span className="icon-box">
                    <FolderKanban size={17} />
                  </span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      Fristående uppdrag ·{" "}
                      {task.priority === "high"
                        ? "hög"
                        : task.priority === "low"
                          ? "låg"
                          : "normal"}{" "}
                      prioritet
                    </small>
                  </span>
                  <Badge tone={task.status}>{statusLabels[task.status]}</Badge>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              icon={FolderKanban}
              title="Vad blir ditt nästa steg?"
              detail="Projekt kan sparas i Fas 2. Dina fristående uppdrag fungerar redan idag."
              action={
                <button className="text-button" onClick={() => go("tasks")}>
                  Öppna fristående uppdrag <ArrowRight size={14} />
                </button>
              }
            />
          )}
        </section>
        <section className="panel hq-section">
          <SectionTitle
            icon={Zap}
            title={lastVisit ? "Sedan ditt senaste besök" : "Senaste händelser"}
            description="Händelser från den lokala aktivitetsloggen."
            action={
              <button className="text-button" onClick={() => go("activity")}>
                Visa alla <ArrowRight size={13} />
              </button>
            }
          />
          {events.length ? (
            <div className="timeline">
              {events.slice(0, 4).map((event) => (
                <div className={`timeline-item ${event.type}`} key={event.id}>
                  <span className="timeline-dot" />
                  <span className="event-icon">
                    <Clock3 size={15} />
                  </span>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                  <time>{relative(event.createdAt)}</time>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon={Clock3}
              title="Lugnt i huvudkontoret"
              detail="Inga nya händelser att visa. Befintlig historik finns i Aktivitet & rapporter."
            />
          )}
        </section>
      </div>
      <section className="panel hq-guidance">
        <SectionTitle
          icon={Sparkles}
          title="Vägledning för nästa steg"
          description="Fasta regler utifrån arbetsytans status. Ingen AI-analys."
        />
        <div className="guidance-grid">
          <div>
            <Badge tone={approvals.length ? "approval" : "pending"}>
              {approvals.length ? "Beslut väntar" : "Nästa steg"}
            </Badge>
            <h3>
              {approvals.length
                ? "Granska dina väntande uppdrag"
                : "Definiera riktningen för dina verksamheter"}
            </h3>
            <p>
              {approvals.length
                ? "Ta ställning till uppdragen innan du planerar vidare."
                : "Använd samtalsvyn för att förbereda dina mål och idéer inför att GARON Core aktiveras."}
            </p>
            <button
              className="text-button"
              onClick={() => go(approvals.length ? "approvals" : "chat")}
            >
              Öppna vyn <ArrowRight size={13} />
            </button>
          </div>
          <div>
            <Badge>Begränsning</Badge>
            <h3>Organisationen är ännu inte operativ</h3>
            <p>
              {state.agents.length} agentroller finns sparade. AI-chefer,
              automatiska rapporter och delegering är planerade för kommande
              faser.
            </p>
            <button className="text-button" onClick={() => go("leadership")}>
              Se organisationsplanen <ArrowRight size={13} />
            </button>
          </div>
          <div>
            <Badge tone="pending">Budgetkontroll</Badge>
            <h3>
              {money(Math.max(0, state.settings.budget - state.ai.spent))} kvar
              i lokal AI-budget
            </h3>
            <p>
              AI-anrop är spärrade i Fas 1. Tidigare användning och
              kostnadsreservationer finns bevarade.
            </p>
            <button className="text-button" onClick={() => go("finance")}>
              Granska AI-kostnader <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>
      <footer className="workspace-footer">
        <span>
          <ShieldCheck size={13} />
          Du äger riktningen. GARON samlar arbetet.
        </span>
        <span>GARON 2.0 · Fas 1</span>
      </footer>
    </div>
  );
}
