import {
  Bot,
  Folder,
  Network,
  Pause,
  Play,
  Plus,
  Search,
  Square,
} from "lucide-react";
import type { Agent, Task } from "../../types";
import { Badge, Empty } from "../../components/ui";

import { useWorkspace } from "../../lib/workspace";
export default function AgentsPage() {
  const { state, busy, mutate, setModal, listQuery, setListQuery } =
    useWorkspace();
  const matches = (value: string) =>
    value.toLocaleLowerCase("sv").includes(listQuery.toLocaleLowerCase("sv"));
  return (
    <>
      <div className="notice">
        <Network size={17} />
        Agentrollerna sparas som konfigurationer. Automatisk körning, verktyg
        och samarbete är inte implementerade i den här versionen.
      </div>
      <div className="inline-search standalone-search">
        <Search size={16} />
        <input
          aria-label="Sök agent"
          placeholder="Sök bland dina agenter…"
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
        />
      </div>
      {state.agents.length ? (
        <div className="agent-grid">
          {state.agents
            .filter((agent) => matches(`${agent.name} ${agent.role}`))
            .map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={i}
                tasks={state.tasks}
                busy={busy}
                onToggle={() =>
                  mutate(
                    `/agents/${agent.id}`,
                    { enabled: !agent.enabled },
                    "PATCH",
                  )
                }
              />
            ))}
        </div>
      ) : (
        <div className="panel">
          <Empty
            icon={Network}
            title="Ett nätverk som växer med dig"
            detail="Börja med att definiera en agents namn och roll. Du kan sedan koppla uppdrag till den."
            action={
              <button
                className="button primary"
                onClick={() => setModal("agent")}
              >
                <Plus size={16} />
                Skapa din första agentroll
              </button>
            }
          />
        </div>
      )}
    </>
  );
}
function AgentCard({
  agent,
  tasks,
  busy,
  onToggle,
  index,
}: {
  agent: Agent;
  tasks: Task[];
  busy: boolean;
  onToggle: () => void;
  index: number;
}) {
  const taskCount = tasks.filter(
    (task) =>
      task.agentId === agent.id && !["done", "cancelled"].includes(task.status),
  ).length;
  return (
    <article className="panel agent-card">
      <div className="agent-card-top">
        <span className={`agent-symbol color-${index % 3}`}>
          <Bot size={27} />
        </span>
        <Badge tone={agent.enabled ? "pending" : "cancelled"}>
          {agent.enabled ? "Konfigurerad" : "Pausad"}
        </Badge>
      </div>
      <h2>{agent.name}</h2>
      <p>{agent.role}</p>
      <div className="agent-meta">
        <span>
          <Folder size={14} />
          {taskCount} tilldelade uppdrag
        </span>
        <span>
          <Square size={12} />
          Ingen aktiv körning
        </span>
      </div>
      <div className="agent-card-footer">
        <small>Agentroll · sparad lokalt</small>
        <button className="button compact" disabled={busy} onClick={onToggle}>
          {agent.enabled ? <Pause size={14} /> : <Play size={14} />}
          {agent.enabled ? "Pausa" : "Aktivera"}
        </button>
      </div>
    </article>
  );
}
