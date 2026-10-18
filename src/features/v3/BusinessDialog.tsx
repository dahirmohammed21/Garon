import type { FormEvent } from "react";
import type { Business } from "../../types";
import { useGaron } from "../../lib/v3/garon";
import Dialog from "./Dialog";
export default function BusinessDialog({
  business,
  onClose,
}: {
  business: Business | null;
  onClose: () => void;
}) {
  const { mutate, busy } = useGaron();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const body: Record<string, unknown> = {
      name: data.name,
      description: data.description,
    };
    if (business) {
      body.sections = [
        { id: "overview", title: "Översikt", view: "overview" },
        ...(data.tasks
          ? [{ id: "tasks", title: "Uppdrag", view: "tasks" }]
          : []),
        ...(data.agents
          ? [{ id: "agents", title: "Agenter", view: "agents" }]
          : []),
        ...business.sections.filter(
          (section) => !["overview", "tasks", "agents"].includes(section.id),
        ),
      ];
    }
    if (
      await mutate(
        business ? `/businesses/${business.id}` : "/businesses",
        body,
        business ? "PATCH" : "POST",
        business ? "Verksamheten är uppdaterad" : "Verksamheten är skapad",
      )
    )
      onClose();
  }
  return (
    <Dialog
      title={business ? "Redigera verksamhet" : "En ny verksamhet"}
      onClose={onClose}
      busy={busy}
    >
      <p className="dialog-description">
        En egen plats för det du vill utveckla. Du kan forma arbetsytan över
        tid.
      </p>
      <form onSubmit={submit}>
        <label>
          Namn
          <input
            name="name"
            autoFocus
            required
            maxLength={100}
            defaultValue={business?.name || ""}
            placeholder="Vad heter din verksamhet?"
          />
        </label>
        <label>
          Beskrivning <span className="optional">Valfritt</span>
          <textarea
            name="description"
            rows={3}
            maxLength={3000}
            defaultValue={business?.description || ""}
            placeholder="En kort beskrivning av vad du vill göra…"
          />
        </label>
        {business && (
          <fieldset className="business-sections">
            <legend>Verksamhetens meny</legend>
            <p>
              Översikt finns alltid. Lägg vid behov till platser för framtida
              funktioner.
            </p>
            <label className="check-row">
              <input
                type="checkbox"
                name="tasks"
                defaultChecked={business.sections.some(
                  (section) => section.id === "tasks",
                )}
              />
              Visa Uppdrag <span>Förberedd vy</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                name="agents"
                defaultChecked={business.sections.some(
                  (section) => section.id === "agents",
                )}
              />
              Visa Agenter <span>Förberedd vy</span>
            </label>
          </fieldset>
        )}
        <footer className="dialog-footer">
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button className="button primary" disabled={busy} type="submit">
            {busy ? "Sparar…" : business ? "Spara ändringar" : "Skapa"}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
