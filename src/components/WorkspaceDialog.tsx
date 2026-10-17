import { Check, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import type { TaskStatus } from "../types";
import { formObject, date, statusLabels } from "../lib/format";
import { useWorkspace } from "../lib/workspace";
export default function WorkspaceDialog() {
  const { state, modal, setModal, busy, mutate, go, modalRef } = useWorkspace();
  if (!modal) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) setModal(null);
      }}
    >
      <div
        ref={modalRef}
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">GARON · ARBETSYTA</span>
            <h2 id="modal-title">
              {modal === "task"
                ? "Ett nytt uppdrag"
                : modal === "agent"
                  ? "Skapa en agentroll"
                  : modal === "note"
                    ? "Spara ett minne"
                    : "Uppdragsdetaljer"}
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Stäng dialog"
            onClick={() => setModal(null)}
          >
            <X size={20} />
          </button>
        </div>
        {modal === "task" && (
          <form
            onSubmit={(event) => {
              const data = formObject(event);
              mutate(
                "/tasks",
                { ...data, requiresApproval: data.requiresApproval === "on" },
                "POST",
                "Ditt nya uppdrag är sparat",
              );
            }}
          >
            <label>
              Vad vill du göra?
              <input
                autoFocus
                name="title"
                placeholder="Till exempel: Planera nästa projekt"
                maxLength={160}
                required
              />
            </label>
            <label>
              Beskrivning <span className="optional">Valfritt</span>
              <textarea
                name="description"
                placeholder="Ge uppdraget lite sammanhang…"
                maxLength={3000}
                rows={4}
              />
            </label>
            <div className="form-row">
              <label>
                Prioritet
                <select name="priority" defaultValue="normal">
                  <option value="low">Låg</option>
                  <option value="normal">Normal</option>
                  <option value="high">Hög</option>
                </select>
              </label>
              <label>
                Agentroll
                <select name="agentId">
                  <option value="">Personligt uppdrag</option>
                  {state.agents
                    .filter((agent) => agent.enabled)
                    .map((agent) => (
                      <option value={agent.id} key={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" name="requiresApproval" />
              <span>
                Kräver mitt godkännande
                <small>
                  Uppdraget inväntar ditt beslut innan det planeras.
                </small>
              </span>
            </label>
            <div className="modal-footer">
              <button
                type="button"
                className="button"
                onClick={() => setModal(null)}
              >
                Avbryt
              </button>
              <button className="button primary" disabled={busy} type="submit">
                <Plus size={16} />
                Skapa uppdrag
              </button>
            </div>
          </form>
        )}
        {modal === "agent" && (
          <form
            onSubmit={(event) => {
              const data = formObject(event);
              mutate("/agents", data, "POST", "Agentrollen är sparad");
            }}
          >
            <p className="modal-description">
              Definiera en roll för din framtida AI-arbetsstyrka. Detta skapar
              en konfiguration, ingen körande agent.
            </p>
            <label>
              Agentens namn
              <input
                name="name"
                placeholder="Till exempel: Research"
                maxLength={80}
                required
              />
            </label>
            <label>
              Roll och syfte
              <textarea
                name="role"
                placeholder="Vilken typ av arbete ska agenten hjälpa till med?"
                maxLength={500}
                rows={4}
                required
              />
            </label>
            <div className="modal-footer">
              <button
                type="button"
                className="button"
                onClick={() => setModal(null)}
              >
                Avbryt
              </button>
              <button className="button primary" disabled={busy} type="submit">
                <Plus size={16} />
                Skapa agentroll
              </button>
            </div>
          </form>
        )}
        {modal === "note" && (
          <form
            onSubmit={(event) => {
              const data = formObject(event);
              mutate("/notes", data, "POST", "Minnet är sparat");
            }}
          >
            <label>
              Rubrik
              <input
                name="title"
                placeholder="Vad vill du komma ihåg?"
                maxLength={160}
                required
              />
            </label>
            <label>
              Anteckning
              <textarea
                name="content"
                placeholder="En idé, ett mål eller något du har lärt dig…"
                maxLength={10000}
                rows={7}
                required
              />
            </label>
            <div className="modal-footer">
              <button
                type="button"
                className="button"
                onClick={() => setModal(null)}
              >
                Avbryt
              </button>
              <button className="button primary" disabled={busy} type="submit">
                <Check size={16} />
                Spara minne
              </button>
            </div>
          </form>
        )}
        {typeof modal === "object" && (
          <>
            <form
              onSubmit={(event) => {
                const data = formObject(event);
                mutate(`/tasks/${modal.id}`, data, "PATCH");
              }}
            >
              <label>
                Uppdrag
                <input
                  name="title"
                  defaultValue={modal.title}
                  required
                  maxLength={160}
                />
              </label>
              <label>
                Beskrivning
                <textarea
                  name="description"
                  defaultValue={modal.description}
                  rows={4}
                  maxLength={3000}
                />
              </label>
              {modal.status === "approval" ? (
                <div className="notice warning">
                  <ShieldCheck size={16} />
                  Det här uppdraget väntar på godkännande.
                </div>
              ) : (
                <label>
                  Status
                  <select name="status" defaultValue={modal.status}>
                    {(
                      [
                        "pending",
                        "running",
                        "done",
                        "cancelled",
                      ] as TaskStatus[]
                    ).map((status) => (
                      <option value={status} key={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="modal-footer">
                <button
                  type="button"
                  className="icon-button danger-hover"
                  disabled={busy}
                  aria-label="Ta bort uppdrag"
                  onClick={() => {
                    if (confirm(`Ta bort ”${modal.title}”?`))
                      mutate(
                        `/tasks/${modal.id}`,
                        {},
                        "DELETE",
                        "Uppdraget är borttaget",
                      );
                  }}
                >
                  <Trash2 size={18} />
                </button>
                {modal.status === "approval" && (
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setModal(null);
                      go("approvals");
                    }}
                  >
                    Granska beslut
                  </button>
                )}
                <button
                  className="button primary"
                  disabled={busy}
                  type="submit"
                >
                  <Check size={16} />
                  Spara ändringar
                </button>
              </div>
            </form>
            <small className="fine-print">
              Skapat {date(modal.createdAt, true)} · Manuell uppdragshantering
            </small>
          </>
        )}
      </div>
    </div>
  );
}
