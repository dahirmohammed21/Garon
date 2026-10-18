import {
  Activity,
  CalendarClock,
  Check,
  Inbox,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useGaron } from "../../lib/v3/garon";
import { date } from "../../lib/format";
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="g-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function BlankState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="blank-state">
      <span>
        <Icon size={26} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Approvals() {
  const { state, mutate, busy } = useGaron();
  const tasks = state.tasks.filter((task) => task.status === "approval");
  return (
    <div className="standard-page">
      <PageHeading
        title="Godkännanden"
        description="Du avgör vad som får gå vidare."
      />
      {tasks.length ? (
        <>
          <p className="subtle-notice">
            Dessa sparade beslut gäller endast planering av uppdrag. De startar
            inga agenter eller externa åtgärder.
          </p>
          <div className="decision-list">
            {tasks.map((task) => (
              <article className="decision-card" key={task.id}>
                <span className="status-label waiting">
                  Väntar på ditt beslut
                </span>
                <h2>{task.title}</h2>
                <p>
                  {task.description ||
                    "Ingen ytterligare beskrivning har angetts."}
                </p>
                <div className="decision-explanation">
                  <strong>Vad innebär ett godkännande?</strong>
                  <p>
                    Uppdraget flyttas till planerat. Ingen publicering,
                    betalning eller AI-körning utförs.
                  </p>
                </div>
                <footer>
                  <time>{date(task.createdAt, true)}</time>
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      mutate(
                        `/tasks/${task.id}/decision`,
                        { decision: "reject" },
                        "POST",
                        "Uppdraget är avslaget",
                      )
                    }
                  >
                    <X size={15} />
                    Avslå
                  </button>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() =>
                      mutate(
                        `/tasks/${task.id}/decision`,
                        { decision: "approve" },
                        "POST",
                        "Uppdraget är godkänt",
                      )
                    }
                  >
                    <Check size={15} />
                    Godkänn
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </>
      ) : (
        <BlankState
          icon={ShieldCheck}
          title="Inga beslut väntar"
          description="När GARON behöver ditt godkännande samlas ärendena här. Just nu finns inget att ta ställning till."
        />
      )}
    </div>
  );
}
export function InboxPage() {
  return (
    <div className="standard-page">
      <PageHeading
        title="Inkorg"
        description="En samlad plats för det som är viktigt."
      />
      <BlankState
        icon={Inbox}
        title="Din inkorg är inte ansluten"
        description="Framtida anslutningar kan samla meddelanden från dina tjänster här. Ingen e-post eller annan meddelandetjänst är ansluten."
      />
    </div>
  );
}
export function Scheduled() {
  return (
    <div className="standard-page">
      <PageHeading
        title="Schemalagt"
        description="En plats för framtida uppgifter och automatiseringar."
      />
      <BlankState
        icon={CalendarClock}
        title="Ingenting är schemalagt"
        description="Schemaläggning är inte aktiverad i den här versionen. Inga automatiseringar körs i bakgrunden."
      />
    </div>
  );
}
export function ActivityPage() {
  const { state } = useGaron();
  const [query, setQuery] = useState("");
  const events = state.activity.filter((event) =>
    `${event.title} ${event.detail}`
      .toLocaleLowerCase("sv")
      .includes(query.toLocaleLowerCase("sv")),
  );
  return (
    <div className="standard-page">
      <PageHeading
        title="Aktivitet"
        description="Riktiga händelser i din arbetsyta. Inget simulerat."
      />
      {state.activity.length > 0 && (
        <label className="search-field">
          <Search size={16} />
          <input
            placeholder="Sök i aktivitetsloggen…"
            aria-label="Sök aktivitet"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}
      {events.length ? (
        <div className="g-activity-list">
          {events.map((event) => (
            <article key={event.id}>
              <span className={`event-dot ${event.type}`} />
              <div>
                <h2>{event.title}</h2>
                <p>{event.detail}</p>
              </div>
              <time>{date(event.createdAt, true)}</time>
            </article>
          ))}
        </div>
      ) : (
        <BlankState
          icon={Activity}
          title={query ? "Ingen träff" : "En ny början"}
          description={
            query
              ? "Inga händelser matchar din sökning."
              : "När du skapar en verksamhet eller ändrar sparade uppgifter visas händelserna här."
          }
        />
      )}
    </div>
  );
}
