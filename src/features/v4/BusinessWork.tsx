import { useState } from "react";
import { Plus } from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import Dialog from "../v3/Dialog";
export default function BusinessWork({
  businessId,
  view,
}: {
  businessId: string;
  view: string;
}) {
  const { state, mutate, busy } = useGaron();
  const [creating, setCreating] = useState(false);
  const projects = state.v4.projects.filter(
    (item) => item.businessId === businessId,
  );
  const tasks = state.tasks.filter((item) => item.businessId === businessId);
  const agents = state.agents.filter((item) =>
    item.businessIds?.includes(businessId),
  );
  return (
    <section className="business-work">
      <div className="section-header">
        <h2>
          {view === "projects"
            ? "Projekt"
            : view === "agents"
              ? "Kopplade agentroller"
              : "Uppdrag"}
        </h2>
        {view !== "agents" && (
          <button className="button" onClick={() => setCreating(true)}>
            <Plus size={14} />
            {view === "projects" ? "Nytt projekt" : "Nytt uppdrag"}
          </button>
        )}
      </div>
      {view === "agents" ? (
        <>
          {agents.map((agent) => (
            <article key={agent.id}>
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <small>
                Konfiguration · inga externa verktyg. Redigera i det globala
                Agentnätverket.
              </small>
            </article>
          ))}
          {!agents.length && (
            <p className="quiet-empty">
              Koppla agentroller via det gemensamma Agentnätverket.
            </p>
          )}
        </>
      ) : view === "projects" ? (
        <>
          {projects.map((project) => (
            <article key={project.id}>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <small>
                {tasks.filter((task) => task.projectId === project.id).length}{" "}
                uppdrag kopplade
              </small>
            </article>
          ))}
          {!projects.length && (
            <p className="quiet-empty">
              Projekt är valfria. Uppdrag kan ligga direkt under verksamheten.
            </p>
          )}
        </>
      ) : (
        <>
          {tasks.map((task) => (
            <article className="task-work-row" key={task.id}>
              <div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <small>
                  {projects.find((item) => item.id === task.projectId)?.name ||
                    "Direkt under verksamheten"}
                </small>
              </div>
              <select
                aria-label={`Status för ${task.title}`}
                value={task.status}
                disabled={busy || task.status === "approval"}
                onChange={(event) =>
                  mutate(
                    `/tasks/${task.id}`,
                    { status: event.target.value },
                    "PATCH",
                  )
                }
              >
                <option value="pending">Planerat</option>
                <option value="running">Manuellt pågående</option>
                <option value="done">Slutfört</option>
                <option value="cancelled">Avbrutet</option>
                {task.status === "approval" && (
                  <option value="approval">Väntar på beslut</option>
                )}
              </select>
            </article>
          ))}
          {!tasks.length && (
            <p className="quiet-empty">Inga uppdrag i verksamheten ännu.</p>
          )}
        </>
      )}
      {creating && (
        <Dialog
          title={view === "projects" ? "Nytt projekt" : "Nytt uppdrag"}
          busy={busy}
          onClose={() => setCreating(false)}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const data = Object.fromEntries(
                new FormData(event.currentTarget),
              );
              if (
                await mutate(
                  view === "projects" ? "/v4/projects" : "/tasks",
                  {
                    ...data,
                    businessId,
                    requiresApproval: data.requiresApproval === "on",
                  },
                  "POST",
                )
              )
                setCreating(false);
            }}
          >
            <label>
              {view === "projects" ? "Projektnamn" : "Uppdragets namn"}
              <input
                name={view === "projects" ? "name" : "title"}
                required
                maxLength={160}
              />
            </label>
            <label>
              Beskrivning
              <textarea name="description" maxLength={3000} />
            </label>
            {view === "tasks" && (
              <>
                <label>
                  Projekt (valfritt)
                  <select name="projectId">
                    <option value="">Direkt under verksamheten</option>
                    {projects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check-row">
                  <input type="checkbox" name="requiresApproval" />
                  Kräver mitt godkännande innan planering
                </label>
              </>
            )}
            <footer className="dialog-footer">
              <button
                className="button"
                type="button"
                onClick={() => setCreating(false)}
              >
                Avbryt
              </button>
              <button className="button primary" disabled={busy}>
                Skapa
              </button>
            </footer>
          </form>
        </Dialog>
      )}
    </section>
  );
}
