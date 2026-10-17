import { ChevronLeft, Shield } from "lucide-react";
import { groups } from "../lib/navigation";
import { useWorkspace } from "../lib/workspace";
export default function Sidebar() {
  const { state, page, go, toggleSidebar } = useWorkspace();
  const pending = state.tasks.filter(
    (task) => task.status === "approval",
  ).length;
  return (
    <aside className="sidebar">
      <div className="brand">
        <button
          className="brand-home"
          onClick={() => go("overview")}
          aria-label="GARON översikt"
        >
          <span className="brand-orb" />
          <span>GARON</span>
        </button>
        <button
          className="icon-button sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Fäll in sidopanel"
        >
          <ChevronLeft size={15} />
        </button>
      </div>
      <div className="sidebar-navigation">
        {groups.map((group) => (
          <div className="navigation-group" key={group.title}>
            <div className="sidebar-caption">{group.title}</div>
            <nav
              aria-label={
                group.title === "HUVUDKONTOR"
                  ? "Huvudkontor"
                  : group.title === "ORGANISATION"
                    ? "Organisation"
                    : "System"
              }
            >
              {group.items.map(({ id, title, icon: Icon }) => (
                <button
                  key={id}
                  className={`nav-item ${page === id || (id === "projects" && page === "tasks") ? "active" : ""}`}
                  onClick={() => go(id)}
                  aria-current={
                    page === id || (id === "projects" && page === "tasks")
                      ? "page"
                      : undefined
                  }
                >
                  <Icon size={17} />
                  <span>{title}</span>
                  {id === "approvals" && pending > 0 && (
                    <span className="nav-count">{pending}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="sidebar-bottom">
        <div className="private-panel">
          <Shield size={16} />
          <div>
            <strong>Ditt privata huvudkontor</strong>
            <span>Lokalt sparat. Under din kontroll.</span>
          </div>
        </div>
        <div className="version">
          <span className="green-dot" /> GARON 2.0 <span>FAS 1</span>
        </div>
      </div>
    </aside>
  );
}
