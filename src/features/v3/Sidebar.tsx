import { useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import type { Business } from "../../types";
import { useGaron } from "../../lib/v3/garon";
import { headquarters } from "../../lib/v3/navigation";
function initialExpansion(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("garon.v3.folders") || "{}");
  } catch {
    return {};
  }
}
export default function Sidebar({ toggle }: { toggle: () => void }) {
  const { state, route, go, newBusiness, editBusiness, deleteBusiness } =
    useGaron();
  const [expanded, setExpanded] = useState(initialExpansion);
  const [menu, setMenu] = useState<string | null>(null);
  const [hq, setHq] = useState(true);
  const [folders, setFolders] = useState(true);
  function expand(id: string) {
    setExpanded((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem("garon.v3.folders", JSON.stringify(next));
      } catch {}
      return next;
    });
  }
  function open(business: Business) {
    go({
      page: "business",
      businessId: business.id,
      section: business.sections[0]?.id || "overview",
    });
    setMenu(null);
  }
  return (
    <aside className="g-sidebar">
      <div className="sidebar-brand">
        <button
          onClick={() => go({ page: "home" })}
          className="brand-link"
          aria-label="GARON översikt"
        >
          <span className="garon-mark">
            <Sparkles size={19} />
          </span>
          <span>
            GARON<span className="brand-version">3.0</span>
          </span>
        </button>
        <button
          className="icon-button"
          onClick={toggle}
          aria-label="Dölj sidopanel"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>
      <div className="sidebar-scroll">
        <button
          className="section-toggle"
          aria-expanded={hq}
          onClick={() => setHq((value) => !value)}
        >
          Huvudkontor
          <ChevronDown size={13} className={!hq ? "turned" : ""} />
        </button>
        {hq && (
          <nav aria-label="Huvudkontor">
            {headquarters.map((item) => (
              <button
                className={`nav-link ${route.page === item.page ? "active" : ""}`}
                key={item.page}
                onClick={() => go({ page: item.page })}
                aria-current={route.page === item.page ? "page" : undefined}
              >
                <item.icon size={17} />
                <span>{item.title}</span>
                {item.page === "approvals" &&
                  state.tasks.some((task) => task.status === "approval") && (
                    <span className="nav-number">
                      {
                        state.tasks.filter((task) => task.status === "approval")
                          .length
                      }
                    </span>
                  )}
              </button>
            ))}
          </nav>
        )}
        <div className="sidebar-separator" />
        <button
          className={`nav-link ${route.page === "businesses" ? "active" : ""}`}
          onClick={() => go({ page: "businesses" })}
          aria-current={route.page === "businesses" ? "page" : undefined}
        >
          <Building2 size={17} />
          <span>Verksamheter</span>
        </button>
        <div className="folders-heading">
          <button
            className="section-toggle"
            aria-expanded={folders}
            onClick={() => setFolders((value) => !value)}
          >
            Mina verksamheter
            <ChevronDown size={13} className={!folders ? "turned" : ""} />
          </button>
          <button
            className="icon-button"
            aria-label="Skapa verksamhet"
            title="Skapa verksamhet"
            onClick={newBusiness}
          >
            <Plus size={16} />
          </button>
        </div>
        {folders && (
          <nav className="business-folders" aria-label="Mina verksamheter">
            {state.businesses.length ? (
              state.businesses.map((business) => (
                <div className="business-folder" key={business.id}>
                  <div
                    className={`folder-row ${route.businessId === business.id ? "current" : ""}`}
                  >
                    <button
                      className="folder-toggle"
                      onClick={() => expand(business.id)}
                      aria-expanded={Boolean(expanded[business.id])}
                      aria-label={`${expanded[business.id] ? "Fäll ihop" : "Visa meny för"} ${business.name}`}
                    >
                      {expanded[business.id] ? (
                        <FolderOpen size={17} />
                      ) : (
                        <Folder size={17} />
                      )}
                      <span title={business.name}>{business.name}</span>
                      <ChevronRight
                        size={12}
                        className={expanded[business.id] ? "rotated" : ""}
                      />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Hantera ${business.name}`}
                      aria-expanded={menu === business.id}
                      onClick={() =>
                        setMenu((value) =>
                          value === business.id ? null : business.id,
                        )
                      }
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  {menu === business.id && (
                    <div className="folder-menu">
                      <button onClick={() => open(business)}>Öppna</button>
                      <button
                        onClick={() => {
                          setMenu(null);
                          editBusiness(business);
                        }}
                      >
                        Byt namn / redigera
                      </button>
                      <button
                        className="danger-text"
                        onClick={() => {
                          setMenu(null);
                          void deleteBusiness(business);
                        }}
                      >
                        Ta bort
                      </button>
                    </div>
                  )}
                  {expanded[business.id] && (
                    <div className="folder-children">
                      {business.sections.map((section) => (
                        <button
                          key={section.id}
                          className={
                            route.businessId === business.id &&
                            route.section === section.id
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            go({
                              page: "business",
                              businessId: business.id,
                              section: section.id,
                            })
                          }
                          aria-current={
                            route.businessId === business.id &&
                            route.section === section.id
                              ? "page"
                              : undefined
                          }
                        >
                          <span className="child-dot" />
                          {section.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="sidebar-empty">
                Dina verksamheter dyker upp här.
                <br />
                Börja när du är redo.
              </p>
            )}
          </nav>
        )}
      </div>
      <div className="sidebar-footer">
        <button
          className={`nav-link ${route.page === "settings" ? "active" : ""}`}
          onClick={() => go({ page: "settings" })}
          aria-current={route.page === "settings" ? "page" : undefined}
        >
          <Settings size={17} />
          <span>Inställningar</span>
        </button>
        <div className="private-caption">
          <span />
          Privat arbetsyta<span className="footer-version">GARON 3.0</span>
        </div>
      </div>
    </aside>
  );
}
