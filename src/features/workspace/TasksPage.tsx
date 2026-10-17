import {
  Check,
  ChevronRight,
  Folder,
  Plus,
  Search,
  Shield,
} from "lucide-react";

import { Badge, Empty } from "../../components/ui";
import { date, statusLabels } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
export default function TasksPage() {
  const {
    state,
    setModal,
    listQuery,
    setListQuery,
    taskFilter,
    setTaskFilter,
  } = useWorkspace();
  const approvals = state.tasks.filter((t) => t.status === "approval");
  const totalDone = state.tasks.filter((t) => t.status === "done");
  const matches = (value: string) =>
    value.toLocaleLowerCase("sv").includes(listQuery.toLocaleLowerCase("sv"));
  const selectedTasks = state.tasks.filter(
    (t) =>
      (taskFilter === "all" || t.status === taskFilter) &&
      matches(`${t.title} ${t.description}`),
  );
  return (
    <>
      <div className="list-toolbar">
        <div className="filter-tabs">
          {[
            ["all", "Alla", state.tasks.length],
            [
              "pending",
              "Planerade",
              state.tasks.filter((t) => t.status === "pending").length,
            ],
            [
              "running",
              "Pågående",
              state.tasks.filter((t) => t.status === "running").length,
            ],
            ["done", "Slutförda", totalDone.length],
            ["approval", "Väntar på beslut", approvals.length],
            [
              "cancelled",
              "Avbrutna",
              state.tasks.filter((t) => t.status === "cancelled").length,
            ],
          ].map(([key, label, count]) => (
            <button
              key={key}
              className={taskFilter === key ? "selected" : ""}
              onClick={() => setTaskFilter(String(key))}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <div className="inline-search">
          <Search size={15} />
          <input
            aria-label="Sök uppdrag"
            placeholder="Sök uppdrag…"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="notice">
        <Shield size={16} />
        Uppdrag hanteras manuellt. Statusen ”Pågående” startar ingen AI-agent.
      </div>
      {selectedTasks.length ? (
        <div className="task-list panel">
          <div className="task-list-head">
            <span>UPPDRAG</span>
            <span>PRIORITET</span>
            <span>STATUS</span>
            <span>SKAPAT</span>
            <span />
          </div>
          {selectedTasks.map((task) => (
            <div className="task-row" key={task.id}>
              <button className="task-title" onClick={() => setModal(task)}>
                <span className={`task-symbol ${task.status}`}>
                  {task.status === "done" ? (
                    <Check size={17} />
                  ) : (
                    <Folder size={17} />
                  )}
                </span>
                <span>
                  <strong>{task.title}</strong>
                  <small>
                    {state.agents.find((a) => a.id === task.agentId)?.name ||
                      "Personligt uppdrag"}
                  </small>
                </span>
              </button>
              <span className={`priority ${task.priority}`}>
                <i />
                {task.priority === "high"
                  ? "Hög"
                  : task.priority === "low"
                    ? "Låg"
                    : "Normal"}
              </span>
              <Badge tone={task.status}>{statusLabels[task.status]}</Badge>
              <time>{date(task.createdAt, true)}</time>
              <button
                className="icon-button"
                aria-label={`Öppna ${task.title}`}
                onClick={() => setModal(task)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel">
          <Empty
            title={
              state.tasks.length
                ? "Inga uppdrag matchar"
                : "Ge din nästa idé ett uppdrag"
            }
            detail={
              state.tasks.length
                ? "Prova en annan sökning eller ett annat filter."
                : "Skapa ett uppdrag, välj prioritet och följ det hela vägen till mål."
            }
            action={
              <button
                className="button primary"
                onClick={() => setModal("task")}
              >
                <Plus size={16} />
                Skapa uppdrag
              </button>
            }
          />
        </div>
      )}
    </>
  );
}
