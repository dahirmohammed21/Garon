import { useState } from "react";
import { useGaron } from "../../lib/v3/garon";
import { request } from "../../lib/api";
import Dialog from "../v3/Dialog";
const sections = {
  overview: { id: "overview", title: "Översikt", view: "overview" },
  tasks: { id: "tasks", title: "Uppdrag", view: "tasks" },
  agents: { id: "agents", title: "Agenter", view: "agents" },
  projects: { id: "projects", title: "Projekt", view: "projects" },
};
const templates = [
  { id: "general", title: "Generell verksamhet", keys: ["overview", "tasks"] },
  {
    id: "services",
    title: "Tjänsteföretag",
    keys: ["overview", "tasks", "agents"],
  },
  { id: "commerce", title: "E-handel", keys: ["overview", "tasks", "agents"] },
  {
    id: "project",
    title: "Projektbaserad verksamhet",
    keys: ["overview", "projects", "tasks"],
  },
];
export default function BusinessCreate({ onClose }: { onClose: () => void }) {
  const { state, mutate, busy } = useGaron();
  const [mode, setMode] = useState<"empty" | "template" | "ai">("empty");
  const [template, setTemplate] = useState("general");
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog title="Ny verksamhet" onClose={onClose} busy={busy || loading}>
      <div className="creation-modes">
        {[
          { id: "empty" as const, title: "Tom verksamhet" },
          { id: "template" as const, title: "Välj mall" },
          { id: "ai" as const, title: "Bygg med GARON" },
        ].map((item) => (
          <button
            key={item.id}
            className={mode === item.id ? "selected" : ""}
            onClick={() => {
              setMode(item.id);
              setProposal(null);
              setError("");
            }}
          >
            {item.title}
          </button>
        ))}
      </div>
      {error && (
        <p className="danger-text" role="alert">
          {error}
        </p>
      )}
      {mode === "ai" && !proposal ? (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            try {
              setProposal(
                await request(
                  "/v4/business-plan",
                  Object.fromEntries(new FormData(event.currentTarget)),
                ),
              );
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setLoading(false);
            }
          }}
        >
          <p className="small-note">
            Ett strukturerat förslag. Ingen verksamhet skapas förrän du har
            granskat och godkänt det. Kräver aktiverad AI och nyckel.
          </p>
          <label>
            Beskriv din idé
            <textarea name="idea" required rows={6} maxLength={3000} />
          </label>
          <button
            className="button primary"
            disabled={loading || !state.v4.ai.enabled}
          >
            Ta fram AI-förslag (API-kostnad)
          </button>
        </form>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(event.currentTarget));
            const keys =
              mode === "template"
                ? templates.find((item) => item.id === template)!.keys
                : ["overview"];
            const structure =
              proposal?.sections ||
              keys.map((key) => sections[key as keyof typeof sections]);
            if (
              await mutate(
                "/businesses",
                {
                  ...data,
                  sections: structure,
                  plan: proposal
                    ? {
                        workAreas: proposal.workAreas,
                        tasks: proposal.tasks,
                        agents: proposal.agents,
                        template: proposal.template,
                        visualStyle: proposal.visualStyle,
                      }
                    : undefined,
                },
                "POST",
                "Verksamheten är skapad",
              )
            )
              onClose();
          }}
        >
          {mode === "template" && (
            <label>
              Mall
              <select
                value={template}
                onChange={(event) => setTemplate(event.target.value)}
              >
                {templates.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Namn
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={proposal?.name || ""}
            />
          </label>
          <label>
            Beskrivning
            <textarea
              name="description"
              rows={3}
              maxLength={3000}
              defaultValue={proposal?.description || ""}
            />
          </label>
          {proposal && (
            <div className="subtle-notice">
              <strong>Förhandsgranskning</strong>
              <p>
                {proposal.sections.map((row: any) => row.title).join(" · ")}
              </p>
              {["workAreas", "tasks", "agents"].map(
                (key) =>
                  proposal[key]?.length > 0 && (
                    <div key={key}>
                      <strong>
                        {key === "workAreas"
                          ? "Arbetsområden"
                          : key === "tasks"
                            ? "Föreslagna uppdrag"
                            : "Föreslagna agentroller"}
                      </strong>
                      <ul>
                        {proposal[key].map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ),
              )}
              {proposal.visualStyle && (
                <p>Utformningsförslag: {proposal.visualStyle}</p>
              )}
              <p>
                Inga uppdrag eller agenter skapas automatiskt. Du kan lägga till
                dem senare.
              </p>
            </div>
          )}
          <footer className="dialog-footer">
            <button type="button" className="button" onClick={onClose}>
              Avbryt
            </button>
            <button className="button primary" disabled={busy}>
              {proposal ? "Godkänn och skapa" : "Skapa"}
            </button>
          </footer>
        </form>
      )}
    </Dialog>
  );
}
