import {
  ArrowRight,
  Building2,
  FolderKanban,
  Plug,
  Shield,
  Sparkles,
} from "lucide-react";
import { Badge, Empty, SectionTitle } from "../../components/ui";
import { useWorkspace } from "../../lib/workspace";
import { DemoToggle } from "../headquarters/HeadquartersPage";
function PhaseNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice">
      <Shield size={17} />
      <span>
        <strong>Fas 1 · struktur och design.</strong> {children}
      </span>
    </div>
  );
}
const examples = [
  {
    name: "SITELY",
    category: "Webbdesign & webbutveckling",
    goal: "En samlad plats för kundprojekt, leveranser och verksamhetsutveckling.",
    projects: ["Utveckla tjänsteerbjudandet", "Planera nästa kundwebbplats"],
  },
  {
    name: "E-handel",
    category: "Research & affärsutveckling",
    goal: "Undersöka produkter, förstå marknaden och förbereda genomtänkta beslut.",
    projects: ["Undersöka en produktnisch", "Sammanställa en produktkalkyl"],
  },
];
export function BusinessesPage() {
  const { demo, go } = useWorkspace();
  return (
    <>
      <PhaseNotice>
        Skapande, redigering och lagring av verksamheter byggs i Fas 2. Inga
        verksamheter har skapats automatiskt.
      </PhaseNotice>
      <div className="list-toolbar">
        <span className="tab-label">Verksamhet → projekt → uppdrag</span>
        <DemoToggle />
      </div>
      {demo ? (
        <>
          <div className="notice demo-notice">
            <Sparkles size={16} />
            Demo: SITELY och E-handel är exempel på struktur. Inga kunder,
            intäkter eller projekt är verkliga poster.
          </div>
          <div className="business-grid">
            {examples.map((business, index) => (
              <article className="panel business-card" key={business.name}>
                <div className="business-card-heading">
                  <span
                    className={`business-monogram ${index ? "purple" : "blue"}`}
                  >
                    <Building2 size={26} />
                  </span>
                  <Badge>Demo · ej sparad</Badge>
                </div>
                <span className="eyebrow">{business.category}</span>
                <h2>{business.name}</h2>
                <p>{business.goal}</p>
                <details>
                  <summary>Utforska exempelstrukturen</summary>
                  <div>
                    <strong>Exempel på projekt</strong>
                    <ul>
                      {business.projects.map((project) => (
                        <li key={project}>{project}</li>
                      ))}
                    </ul>
                    <p>
                      Varje projekt får senare egna uppdrag, instruktioner och
                      kunskapsunderlag.
                    </p>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </>
      ) : (
        <section className="panel">
          <Empty
            icon={Building2}
            title="Ditt huvudkontor är redo att växa"
            detail="I nästa fas kan du skapa verksamheter med egna mål, projekt och kunskap. Slå på design-demo för att se exempel på upplägget."
          />
        </section>
      )}
      <section className="panel structure-panel">
        <SectionTitle
          icon={FolderKanban}
          title="Så hänger arbetet ihop"
          description="En gemensam struktur för framtida verksamheter."
        />
        <div className="structure-flow">
          <span>
            Verksamhet<small>Mål & riktning</small>
          </span>
          <ArrowRight size={17} />
          <span>
            Projekt<small>Avgränsad satsning</small>
          </span>
          <ArrowRight size={17} />
          <span>
            Uppdrag<small>Konkreta arbetssteg</small>
          </span>
        </div>
        <button className="text-button" onClick={() => go("projects")}>
          Utforska projektvyn <ArrowRight size={14} />
        </button>
      </section>
    </>
  );
}
export function ProjectsPage() {
  const { state, go, demo } = useWorkspace();
  return (
    <>
      <PhaseNotice>
        Projekt kan skapas och sparas i Fas 2. Befintliga uppdrag ligger kvar
        utan projektkoppling.
      </PhaseNotice>
      <div className="list-toolbar">
        <span className="tab-label">Projektöversikt</span>
        <DemoToggle />
      </div>
      <section className="panel legacy-project">
        <span className="icon-box">
          <FolderKanban size={23} />
        </span>
        <div>
          <Badge tone="pending">Fungerande funktion</Badge>
          <h2>Fristående uppdrag</h2>
          <p>
            {state.tasks.length} sparade uppdrag ·{" "}
            {state.tasks.filter((task) => task.status === "done").length}{" "}
            slutförda. Dina uppdrag, statusar och godkännanden är bevarade.
          </p>
        </div>
        <button className="button" onClick={() => go("tasks")}>
          Öppna uppdrag <ArrowRight size={15} />
        </button>
      </section>
      {demo ? (
        <>
          <div className="notice demo-notice">
            <Sparkles size={16} />
            Demo: projektkorten nedan är en visuell demonstration och sparas
            inte.
          </div>
          <div className="business-grid">
            {examples.map((business) => (
              <article className="panel business-card" key={business.name}>
                <Badge>Demo · ej sparat</Badge>
                <span className="eyebrow">{business.name}</span>
                <h2>{business.projects[0]}</h2>
                <p>
                  Ett exempel på ett projekt med egen riktning, avgränsning och
                  kommande uppdrag.
                </p>
                <details>
                  <summary>Visa exempel på arbetssteg</summary>
                  <ul>
                    <li>Definiera mål och förutsättningar</li>
                    <li>Samla underlag och bedöm risker</li>
                    <li>Granska förslaget tillsammans med Dahir</li>
                  </ul>
                </details>
              </article>
            ))}
          </div>
        </>
      ) : (
        <section className="panel">
          <Empty
            icon={FolderKanban}
            title="Nästa idé kan bli ett projekt"
            detail="Projektvyn är förberedd. Skapa och hantera fristående uppdrag redan nu, eller slå på design-demo för att utforska framtida projektkort."
          />
        </section>
      )}
    </>
  );
}
export function IntegrationsPage() {
  const { state, go } = useWorkspace();
  return (
    <>
      <PhaseNotice>
        Inga nya tjänster ansluts här. Externa åtgärder och AI-anrop är inte
        aktiverade.
      </PhaseNotice>
      <div className="integration-grid">
        {[
          {
            name: "OpenAI",
            detail: "Förberedd adapter för framtida analys och affärsstöd.",
            status:
              state.ai.provider === "openai"
                ? "Nyckel finns · AI spärrad"
                : "Ej aktiverad",
            phase: "Fas 3–4",
          },
          {
            name: "Anthropic",
            detail:
              "Förberedd adapter för framtida tekniskt stöd och utveckling.",
            status:
              state.ai.provider === "anthropic"
                ? "Nyckel finns · AI spärrad"
                : "Ej aktiverad",
            phase: "Fas 3–4",
          },
          {
            name: "Verksamhetsverktyg",
            detail:
              "Framtida kopplingar till webbverktyg och e-handelsplattformar.",
            status: "Inte implementerat",
            phase: "Fas 6",
          },
        ].map((item) => (
          <article className="panel integration-card" key={item.name}>
            <span className="icon-box">
              <Plug size={23} />
            </span>
            <Badge>{item.status}</Badge>
            <h2>{item.name}</h2>
            <p>{item.detail}</p>
            <small>Planerat: {item.phase}</small>
          </article>
        ))}
      </div>
      <section className="panel structure-panel">
        <SectionTitle
          icon={Shield}
          title="Åtkomst börjar med tydliga gränser"
          description="Aktivering kräver ett separat beslut i en senare fas."
        />
        <p className="planned-description">
          API-nycklar stannar på servern. Framtida verktyg behöver egna
          behörigheter, kostnadsgränser och loggning. Den här vyn ansluter inga
          konton eller abonnemang.
        </p>
        <button className="text-button" onClick={() => go("settings")}>
          Visa lokala inställningar <ArrowRight size={14} />
        </button>
      </section>
    </>
  );
}
