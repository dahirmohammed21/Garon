import { useState, type FormEvent } from "react";
import {
  ArrowDown,
  Plus,
  Pencil,
  Trash2,
  Network,
  Pause,
  Play,
} from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import { request } from "../../lib/api";
import type { Agent } from "../../types";
import { PageHeading } from "../v3/Pages";
import Dialog from "../v3/Dialog";
import Chat from "./Chat";
import { RoleLogo } from "./Brand";
export function OrganizationGraph({
  showAgents = false,
  onAgent,
}: {
  showAgents?: boolean;
  onAgent?: (agent: Agent) => void;
}) {
  const { state } = useGaron();
  return (
    <section className="organization-tree">
      <div className="org-node owner">
        <RoleLogo role="owner" />
        <span>Dahir</span>
        <small>Ägare · yttersta beslutanderätt</small>
      </div>
      <ArrowDown size={20} />
      <div className="org-node core">
        <RoleLogo role="garon" />
        <span>GARON</span>
        <small>VD · huvudassistent · samordning</small>
      </div>
      <ArrowDown size={20} />
      <div className="org-managers">
        {(["openai", "anthropic"] as const).map((manager) => (
          <div key={manager} className="manager-branch">
            <div className="org-node">
              <RoleLogo role={manager} />
              <span>{manager === "openai" ? "ChatGPT" : "Claude"}</span>
              <small>
                {manager === "openai"
                  ? "Strategi, ekonomi och analys"
                  : "Teknik, utveckling och automation"}
              </small>
            </div>
            {showAgents && (
              <div className="org-leaves">
                {state.agents
                  .filter((agent) => agent.manager === manager)
                  .map((agent) => (
                    <button key={agent.id} onClick={() => onAgent?.(agent)}>
                      <Network size={15} />
                      {agent.name}
                      <small>
                        {agent.enabled ? "Konfiguration" : "Inaktiverad"}
                      </small>
                    </button>
                  ))}
                {!state.agents.some((agent) => agent.manager === manager) && (
                  <p>Inga agentroller placerade här.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
function AgentDialog({
  agent,
  onClose,
}: {
  agent: Agent | null;
  onClose: () => void;
}) {
  const { state, mutate, busy } = useGaron();
  const [proposal, setProposal] = useState<any>(
    agent
      ? {
          ...agent,
          instruction: agent.instruction || agent.role,
          manager: agent.manager || "openai",
        }
      : null,
  );
  const [error, setError] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  async function propose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuggesting(true);
    try {
      setProposal(
        await request("/v4/agents/propose", {
          ...Object.fromEntries(new FormData(event.currentTarget)),
          assisted:
            (event.nativeEvent as SubmitEvent).submitter?.getAttribute(
              "value",
            ) === "true",
        }),
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSuggesting(false);
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      name: data.get("name"),
      role: data.get("role"),
      instruction: data.get("instruction"),
      manager: data.get("manager"),
      businessIds: data.getAll("businessId"),
      confirm: true,
    };
    if (
      await mutate(
        agent ? `/v4/agents/${agent.id}` : "/v4/agents",
        body,
        agent ? "PATCH" : "POST",
        "Agentkonfigurationen är sparad",
      )
    )
      onClose();
  }
  return (
    <Dialog
      title={agent ? "Redigera agent" : "Skapa agent"}
      busy={busy || suggesting}
      onClose={onClose}
    >
      {error && (
        <p role="alert" className="danger-text">
          {error}
        </p>
      )}
      {!proposal ? (
        <form onSubmit={propose}>
          <label>
            Namn
            <input name="name" required maxLength={80} />
          </label>
          <label>
            Arbetsuppgift eller roll
            <textarea name="role" required maxLength={500} rows={4} />
          </label>
          <p className="small-note">
            Standardförslaget använder tydliga regler. AI-förslag är valfritt
            och kräver ansluten AI.
          </p>
          <footer className="dialog-footer">
            <button className="button" type="button" onClick={onClose}>
              Avbryt
            </button>
            <button
              className="button"
              name="assist"
              value="true"
              disabled={suggesting || !state.v4.ai.enabled}
            >
              AI-förslag (API-kostnad)
            </button>
            <button className="button primary" disabled={suggesting}>
              Föreslå placering
            </button>
          </footer>
        </form>
      ) : (
        <form onSubmit={save}>
          <p className="subtle-notice">
            {proposal.reason || "Granska roll och placering."}{" "}
            {proposal.ambiguous
              ? "Rollen är blandad eller otydlig. Bekräfta valet."
              : ""}
          </p>
          <p className="small-note">
            {proposal.classification === "ai-assisted"
              ? "AI-assisterat förslag"
              : "Regelbaserad placering"}
            {proposal.tasks?.length ? ` · ${proposal.tasks.join("; ")}` : ""}
          </p>
          <label>
            Namn
            <input
              name="name"
              required
              maxLength={80}
              defaultValue={proposal.name}
            />
          </label>
          <label>
            Roll
            <textarea
              name="role"
              required
              maxLength={500}
              defaultValue={proposal.role}
            />
          </label>
          <label>
            Mellanchef
            <select name="manager" defaultValue={proposal.manager}>
              <option value="openai">ChatGPT</option>
              <option value="anthropic">Claude</option>
            </select>
          </label>
          <label>
            Grundinstruktion
            <textarea
              name="instruction"
              required
              maxLength={6000}
              rows={5}
              defaultValue={proposal.instruction}
            />
          </label>
          <fieldset className="business-sections">
            <legend>Kopplade verksamheter</legend>
            {state.businesses.map((business) => (
              <label className="check-row" key={business.id}>
                <input
                  type="checkbox"
                  name="businessId"
                  value={business.id}
                  defaultChecked={agent?.businessIds?.includes(business.id)}
                />
                {business.name}
              </label>
            ))}
            {!state.businesses.length && <p>Inga verksamheter finns ännu.</p>}
          </fieldset>
          <p className="small-note">
            Konfigurationen får inga externa verktyg och startar ingen autonom
            process.
          </p>
          <footer className="dialog-footer">
            <button className="button" type="button" onClick={onClose}>
              Avbryt
            </button>
            <button className="button primary" disabled={busy}>
              Godkänn och spara
            </button>
          </footer>
        </form>
      )}
    </Dialog>
  );
}
export function AgentNetwork() {
  const { state, mutate, busy } = useGaron();
  const [edit, setEdit] = useState<Agent | "new" | null>(null);
  return (
    <div className="standard-page">
      <PageHeading
        title="Agentnätverk"
        description="En gemensam organisation. Agentroller kan tillhöra flera verksamheter."
        action={
          <button className="button primary" onClick={() => setEdit("new")}>
            <Plus size={15} />
            Skapa agent
          </button>
        }
      />
      <OrganizationGraph showAgents onAgent={setEdit} />
      <div className="agent-directory">
        <h2>Alla agentkonfigurationer</h2>
        {state.agents.map((agent) => (
          <article key={agent.id}>
            <div>
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <small>
                Mellanchef:{" "}
                {agent.manager === "openai"
                  ? "ChatGPT"
                  : agent.manager === "anthropic"
                    ? "Claude"
                    : "Ej placerad"}{" "}
                · {agent.enabled ? "Konfigurerad" : "Inaktiverad"} · inga
                externa verktyg
              </small>
              <small>
                Verksamheter:{" "}
                {agent.businessIds
                  ?.map(
                    (id) =>
                      state.businesses.find((item) => item.id === id)?.name ||
                      "Borttagen verksamhet",
                  )
                  .join(", ") || "Ingen koppling"}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label={`Redigera ${agent.name}`}
              onClick={() => setEdit(agent)}
            >
              <Pencil size={16} />
            </button>
            <button
              className="icon-button"
              disabled={busy}
              aria-label={`${agent.enabled ? "Inaktivera" : "Aktivera"} ${agent.name}`}
              onClick={() =>
                mutate(
                  `/v4/agents/${agent.id}`,
                  { enabled: !agent.enabled },
                  "PATCH",
                )
              }
            >
              {agent.enabled ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button
              className="icon-button danger-text"
              aria-label={`Ta bort ${agent.name}`}
              disabled={busy}
              onClick={() => {
                if (confirm(`Ta bort agentkonfigurationen ”${agent.name}”?`))
                  void mutate(
                    `/v4/agents/${agent.id}`,
                    { confirm: true },
                    "DELETE",
                  );
              }}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
        {!state.agents.length && (
          <p className="quiet-empty">
            Inga specialiserade agenter har skapats.
          </p>
        )}
      </div>
      {edit && (
        <AgentDialog
          agent={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}
function DelegationDialog({ onClose }: { onClose: () => void }) {
  const { state, mutate, busy } = useGaron();
  const [manager, setManager] = useState("openai");
  return (
    <Dialog title="Förbered delegation" busy={busy} onClose={onClose}>
      <p className="subtle-notice">
        Skriv endast det underlag som får delas. Din privata GARON-historik
        följer inte med. Förslaget måste godkännas och köras separat.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const data = Object.fromEntries(new FormData(event.currentTarget));
          if (
            await mutate(
              "/v4/delegations",
              data,
              "POST",
              "Förslaget väntar på godkännande",
            )
          )
            onClose();
        }}
      >
        <label>
          Mellanchef
          <select
            name="manager"
            value={manager}
            onChange={(event) => setManager(event.target.value)}
          >
            <option value="openai">ChatGPT</option>
            <option value="anthropic">Claude</option>
          </select>
        </label>
        <label>
          Agentroll (valfri)
          <select name="agentId" key={manager}>
            <option value="">Mellanchefen direkt</option>
            {state.agents
              .filter((agent) => agent.enabled && agent.manager === manager)
              .map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Godkänt underlag
          <textarea name="prompt" required rows={6} maxLength={6000} />
        </label>
        <label>
          Verksamhet
          <select name="businessId">
            <option value="">Hela GARON</option>
            {state.businesses.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <footer className="dialog-footer">
          <button className="button" type="button" onClick={onClose}>
            Avbryt
          </button>
          <button className="button primary" disabled={busy}>
            Skapa beslutsförslag
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export default function Leadership() {
  const { state, go, mutate, busy } = useGaron();
  const [delegating, setDelegating] = useState(false);
  return (
    <div className="standard-page leadership-page">
      <PageHeading
        title="AI-ledning"
        description="Du är ägaren. GARON samordnar. Mellancheferna har varsin samtalskanal."
        action={
          <button className="button" onClick={() => setDelegating(true)}>
            Föreslå delegation
          </button>
        }
      />
      <OrganizationGraph />
      <div className="channels-grid">
        <Chat channel="openai" compact />
        <Chat channel="anthropic" compact />
      </div>
      <section className="delegation-list">
        <h2>Delegeringar</h2>
        {state.v4.delegations.length ? (
          state.v4.delegations.map((job) => (
            <article key={job.id}>
              <span className="status-label">
                {(
                  {
                    proposed: "Föreslagen",
                    running: "Pågår",
                    done: "Slutförd",
                    failed: "Misslyckad",
                    imported: "Importerad – ny prövning krävs",
                  } as Record<string, string>
                )[job.status] || job.status}
              </span>
              <h3>{job.manager === "openai" ? "ChatGPT" : "Claude"}</h3>
              <p>{job.prompt}</p>
              {job.result && (
                <details>
                  <summary>Visa resultat</summary>
                  <p>{job.result}</p>
                  <button
                    className="button"
                    disabled={busy || !state.v4.ai.enabled}
                    onClick={() =>
                      mutate(
                        "/v4/chat/garon",
                        {
                          message: `Sammanfatta detta delegerade resultat och föreslå nästa steg:\n${job.result?.slice(0, 5000)}`,
                        },
                        "POST",
                        "GARON har sammanfattat resultatet. Öppna Översikt.",
                      )
                    }
                  >
                    Sammanfatta med GARON (AI-anrop)
                  </button>
                </details>
              )}
              {job.status === "proposed" && (
                <button
                  className="text-link"
                  onClick={() => go({ page: "approvals" })}
                >
                  Granska godkännandet →
                </button>
              )}
              {job.error && <small className="danger-text">{job.error}</small>}
            </article>
          ))
        ) : (
          <p className="quiet-empty">
            Inga delegeringar ännu. Inga verktyg eller externa arbetsflöden körs
            automatiskt.
          </p>
        )}
      </section>
      {delegating && <DelegationDialog onClose={() => setDelegating(false)} />}
    </div>
  );
}
