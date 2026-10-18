import { useState } from "react";
import {
  Plus,
  CalendarClock,
  Inbox,
  ShieldCheck,
  Pencil,
  X,
} from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import { PageHeading, BlankState } from "../v3/Pages";
import Dialog from "../v3/Dialog";
import { date } from "../../lib/format";
import type { Schedule } from "../../types";
export function Approvals() {
  const { state, mutate, busy } = useGaron();
  const [creating, setCreating] = useState(false);
  return (
    <div className="standard-page">
      <PageHeading
        title="Godkännanden"
        description="Backend verifierar varje beslut. Ett AI-svar kan aldrig godkänna sig självt."
        action={
          <button className="button" onClick={() => setCreating(true)}>
            <Plus size={15} />
            Nytt beslutsförslag
          </button>
        }
      />
      {state.v4.approvals.length ? (
        state.v4.approvals.map((item) => (
          <article className="decision-card" key={item.id}>
            <span className="status-label">
              {(
                {
                  pending: "Väntar på beslut",
                  approved: "Godkänt",
                  rejected: "Avslaget",
                  consumed: "Använt",
                } as Record<string, string>
              )[item.status] || item.status}
            </span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <div className="decision-explanation">
              <strong>Föreslaget av: {item.proposedBy}</strong>
              <p>
                Verksamhet:{" "}
                {state.businesses.find((row) => row.id === item.businessId)
                  ?.name || "Hela GARON"}
              </p>
              <p>Risk: {item.risk}</p>
              <p>
                Kostnad:{" "}
                {item.estimatedCost === null
                  ? "Beräknas före AI-anrop och begränsas av din budget."
                  : `${item.estimatedCost} USD uppskattat`}
              </p>
            </div>
            <footer>
              <time>{date(item.createdAt, true)}</time>
              {item.status === "pending" && (
                <>
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      mutate(`/v4/approvals/${item.id}/decision`, {
                        decision: "reject",
                      })
                    }
                  >
                    Avslå
                  </button>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() =>
                      mutate(`/v4/approvals/${item.id}/decision`, {
                        decision: "approve",
                      })
                    }
                  >
                    Godkänn
                  </button>
                </>
              )}
              {item.status === "approved" &&
                item.action.type === "delegation" && (
                  <button
                    className="button primary"
                    disabled={busy || !state.v4.ai.enabled}
                    onClick={() =>
                      mutate(
                        `/v4/delegations/${item.action.resourceId}/run`,
                        {},
                        "POST",
                        "Delegeringen är slutförd. Resultatet finns i AI-ledning.",
                      )
                    }
                  >
                    Kör godkänt AI-anrop
                  </button>
                )}
              {item.status === "approved" &&
                item.action.type === "proposal" && (
                  <small>
                    Beslutet är registrerat. Ingen extern åtgärd är ansluten.
                  </small>
                )}
            </footer>
          </article>
        ))
      ) : (
        <BlankState
          icon={ShieldCheck}
          title="Inga beslutsförslag"
          description="När ett verkligt förslag skapas visas det här och på skrivbordet."
        />
      )}
      {state.tasks
        .filter((task) => task.status === "approval")
        .map((task) => (
          <article className="decision-card" key={task.id}>
            <span className="status-label">Tidigare uppdragsplanering</span>
            <h2>{task.title}</h2>
            <p>{task.description}</p>
            <p>
              Godkännande ändrar bara planeringsstatus, inte externa
              behörigheter.
            </p>
            <footer>
              <button
                className="button"
                disabled={busy}
                onClick={() =>
                  mutate(`/tasks/${task.id}/decision`, { decision: "reject" })
                }
              >
                Avslå uppdrag
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  mutate(`/tasks/${task.id}/decision`, { decision: "approve" })
                }
              >
                Godkänn uppdrag
              </button>
            </footer>
          </article>
        ))}
      {creating && (
        <Dialog
          title="Nytt beslutsförslag"
          onClose={() => setCreating(false)}
          busy={busy}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (
                await mutate(
                  "/v4/approvals",
                  Object.fromEntries(new FormData(event.currentTarget)),
                )
              )
                setCreating(false);
            }}
          >
            <label>
              Rubrik
              <input name="title" required maxLength={160} />
            </label>
            <label>
              Åtgärd och bakgrund
              <textarea name="description" required maxLength={6000} />
            </label>
            <label>
              Risker
              <input name="risk" maxLength={1000} />
            </label>
            <label>
              Verksamhet
              <select name="businessId">
                <option value="">Hela GARON</option>
                {state.businesses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="small-note">
              Ett manuellt beslutsunderlag. Ingen extern åtgärd utförs när det
              godkänns.
            </p>
            <footer className="dialog-footer">
              <button
                type="button"
                className="button"
                onClick={() => setCreating(false)}
              >
                Avbryt
              </button>
              <button className="button primary" disabled={busy}>
                Spara förslag
              </button>
            </footer>
          </form>
        </Dialog>
      )}
    </div>
  );
}
export function InboxPage() {
  const { state, mutate, busy } = useGaron();
  return (
    <div className="standard-page">
      <PageHeading
        title="Inkorg"
        description="Interna meddelanden och påminnelser. Inga externa mejlkonton är anslutna."
      />
      {state.v4.inbox.length ? (
        <div className="internal-inbox">
          {state.v4.inbox.map((item) => (
            <article key={item.id} className={item.read ? "read" : ""}>
              <span className="status-label">
                {item.read ? "Läst" : "Oläst"} · {item.source}
              </span>
              <h2>{item.title}</h2>
              <p>{item.content}</p>
              <footer>
                <time>{date(item.createdAt, true)}</time>
                {!item.read && (
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      mutate(
                        `/v4/inbox/${item.id}`,
                        {},
                        "PATCH",
                        "Meddelandet är markerat som läst",
                      )
                    }
                  >
                    Markera som läst
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <BlankState
          icon={Inbox}
          title="Inga interna meddelanden"
          description="Schemalagda interna påminnelser kommer hit när deras tidpunkt infaller. Extern e-post är en framtida integration."
        />
      )}
    </div>
  );
}
export function Scheduled() {
  const { state, mutate, busy } = useGaron();
  const [editing, setEditing] = useState<Schedule | "new" | null>(null);
  return (
    <div className="standard-page">
      <PageHeading
        title="Schemalagt"
        description="Interna påminnelser och uppgifter. GARON måste vara igång för leverans."
        action={
          <button className="button primary" onClick={() => setEditing("new")}>
            <Plus size={15} />
            Schemalägg
          </button>
        }
      />
      <p className="subtle-notice">
        Schemaläggaren kontrollerar var 30:e sekund och vid start. Missade
        tidpunkter fångas upp när du startar igen. Den kör inga AI-anrop eller
        externa verktyg.
      </p>
      {state.v4.schedules.length ? (
        state.v4.schedules.map((item) => (
          <article className="schedule-row" key={item.id}>
            <CalendarClock size={20} />
            <div>
              <h2>{item.title}</h2>
              <p>
                {date(item.dueAt, true)} ·{" "}
                {item.type === "task" ? "Intern uppgift" : "Påminnelse"} ·{" "}
                {
                  (
                    {
                      pending: "Planerad",
                      done: "Levererad",
                      cancelled: "Avbruten",
                    } as Record<string, string>
                  )[item.status]
                }
              </p>
            </div>
            {item.status === "pending" && (
              <>
                <button
                  className="icon-button"
                  aria-label={`Redigera ${item.title}`}
                  onClick={() => setEditing(item)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Avbryt ${item.title}`}
                  disabled={busy}
                  onClick={() =>
                    mutate(
                      `/v4/schedules/${item.id}`,
                      { cancel: true },
                      "PATCH",
                    )
                  }
                >
                  <X size={16} />
                </button>
              </>
            )}
          </article>
        ))
      ) : (
        <BlankState
          icon={CalendarClock}
          title="Ingenting planerat"
          description="Skapa en intern påminnelse när du vill följa upp något."
        />
      )}
      {editing && (
        <Dialog
          title={
            editing === "new"
              ? "Schemalägg intern aktivitet"
              : "Redigera tidpunkt"
          }
          busy={busy}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const data = Object.fromEntries(
                new FormData(event.currentTarget),
              );
              const body = {
                ...data,
                dueAt: new Date(String(data.dueAt)).toISOString(),
              };
              if (
                await mutate(
                  editing === "new"
                    ? "/v4/schedules"
                    : `/v4/schedules/${editing.id}`,
                  body,
                  editing === "new" ? "POST" : "PATCH",
                )
              )
                setEditing(null);
            }}
          >
            <label>
              Rubrik
              <input
                name="title"
                required
                maxLength={160}
                defaultValue={editing === "new" ? "" : editing.title}
              />
            </label>
            <label>
              Lokal tid
              <input
                name="dueAt"
                type="datetime-local"
                required
                defaultValue={
                  editing === "new"
                    ? ""
                    : new Date(
                        new Date(editing.dueAt).getTime() -
                          new Date(editing.dueAt).getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)
                }
              />
            </label>
            {editing === "new" && (
              <label>
                Typ
                <select name="type">
                  <option value="reminder">Intern påminnelse</option>
                  <option value="task">
                    Skapa intern uppgift vid tidpunkten
                  </option>
                </select>
              </label>
            )}
            <footer className="dialog-footer">
              <button
                type="button"
                className="button"
                onClick={() => setEditing(null)}
              >
                Avbryt
              </button>
              <button className="button primary" disabled={busy}>
                Spara
              </button>
            </footer>
          </form>
        </Dialog>
      )}
    </div>
  );
}
