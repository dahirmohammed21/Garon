import { Check, Plus, ShieldCheck, X } from "lucide-react";

import { Badge, Empty } from "../../components/ui";
import { date } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
export default function ApprovalsPage() {
  const { state, busy, mutate, setModal } = useWorkspace();
  const approvals = state.tasks.filter((t) => t.status === "approval");
  return (
    <>
      {approvals.length ? (
        <div className="approval-list">
          {approvals.map((task) => (
            <section className="panel approval-card" key={task.id}>
              <div className="approval-heading">
                <span className="icon-box orange">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <Badge tone="approval">Väntar på ditt beslut</Badge>
                  <h2>{task.title}</h2>
                </div>
                <time>{date(task.createdAt, true)}</time>
              </div>
              <p className="approval-description">
                {task.description ||
                  "Ingen beskrivning angiven. Granska uppdragets namn innan du fattar beslut."}
              </p>
              <div className="approval-facts">
                <div>
                  <small>VAD GODKÄNNER DU?</small>
                  <p>Att flytta uppdraget till planerade uppdrag.</p>
                </div>
                <div>
                  <small>KONSEKVENS</small>
                  <p>Inga externa åtgärder utförs. Ingen AI startas.</p>
                </div>
              </div>
              <div className="approval-actions">
                <button
                  className="button"
                  disabled={busy}
                  onClick={() =>
                    mutate(
                      `/tasks/${task.id}/decision`,
                      { decision: "reject" },
                      "POST",
                      "Uppdraget har avslagits",
                    )
                  }
                >
                  <X size={16} />
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
                  <Check size={16} />
                  Godkänn
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="panel">
          <Empty
            icon={ShieldCheck}
            title="Allt är under kontroll"
            detail="Inga uppdrag väntar på godkännande. Markera ”Kräver mitt godkännande” när du skapar ett uppdrag för att granska det här."
            action={
              <button className="button" onClick={() => setModal("task")}>
                <Plus size={16} />
                Nytt uppdrag
              </button>
            }
          />
        </div>
      )}
    </>
  );
}
