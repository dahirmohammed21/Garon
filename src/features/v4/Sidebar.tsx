import { useState } from "react";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Network,
  PanelLeftClose,
  Plus,
  Settings,
  UsersRound,
} from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import { headquarters } from "../../lib/v3/navigation";
import { GaronMark } from "./Brand";
export default function Sidebar({ toggle }: { toggle: () => void }) {
  const { state, route, go, newBusiness, editBusiness, deleteBusiness } =
    useGaron();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<string | null>(null);
  return (
    <aside className="g-sidebar">
      <div className="sidebar-brand">
        <button
          className="brand-link"
          aria-label="GARON översikt"
          onClick={() => go({ page: "home" })}
        >
          <span className="garon-mark">
            <GaronMark />
          </span>
          <span>
            GARON<span className="brand-version">4.0</span>
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
        <div className="section-toggle section-label">HUVUDKONTOR</div>
        <nav aria-label="Huvudkontor">
          {headquarters.map((item) => (
            <button
              className={`nav-link ${route.page === item.page ? "active" : ""}`}
              key={item.page}
              onClick={() => go({ page: item.page })}
              aria-current={route.page === item.page ? "page" : undefined}
            >
              <item.icon size={17} />
              {item.title}
            </button>
          ))}
        </nav>
        <div className="sidebar-separator" />
        <div className="section-toggle section-label">ORGANISATION</div>
        <nav aria-label="Organisation">
          <button
            className={`nav-link ${route.page === "leadership" ? "active" : ""}`}
            onClick={() => go({ page: "leadership" })}
          >
            <UsersRound size={17} />
            AI-ledning
          </button>
          <button
            className={`nav-link ${route.page === "agents" ? "active" : ""}`}
            onClick={() => go({ page: "agents" })}
          >
            <Network size={17} />
            Agentnätverk
          </button>
        </nav>
        <div className="sidebar-separator" />
        <div className="folders-heading">
          <span className="section-toggle section-label">VERKSAMHETER</span>
          <button
            className="icon-button"
            aria-label="Skapa verksamhet"
            onClick={newBusiness}
          >
            <Plus size={16} />
          </button>
        </div>
        <nav aria-label="Verksamheter">
          {state.businesses.map((business) => (
            <div className="business-folder" key={business.id}>
              <div
                className={`folder-row ${route.businessId === business.id ? "current" : ""}`}
              >
                <button
                  className="folder-toggle"
                  aria-label={`Öppna ${business.name}`}
                  aria-expanded={Boolean(expanded[business.id])}
                  onClick={() => {
                    setExpanded((value) => ({
                      ...value,
                      [business.id]: !value[business.id],
                    }));
                    go({
                      page: "business",
                      businessId: business.id,
                      section: "overview",
                    });
                  }}
                >
                  {expanded[business.id] ? (
                    <FolderOpen size={17} />
                  ) : (
                    <Folder size={17} />
                  )}
                  <span>{business.name}</span>
                  <ChevronRight
                    className={expanded[business.id] ? "rotated" : ""}
                    size={12}
                  />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Hantera ${business.name}`}
                  onClick={() =>
                    setMenu((value) =>
                      value === business.id ? null : business.id,
                    )
                  }
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>
              {menu === business.id && (
                <div className="folder-menu">
                  <button
                    onClick={() => {
                      setMenu(null);
                      editBusiness(business);
                    }}
                  >
                    Redigera
                  </button>
                  <button
                    onClick={() => {
                      setMenu(null);
                      void deleteBusiness(business);
                    }}
                    className="danger-text"
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
                      onClick={() =>
                        go({
                          page: "business",
                          businessId: business.id,
                          section: section.id,
                        })
                      }
                      className={
                        route.businessId === business.id &&
                        route.section === section.id
                          ? "active"
                          : ""
                      }
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <div className="section-toggle section-label">SYSTEM</div>
        <button
          className={`nav-link ${route.page === "settings" ? "active" : ""}`}
          onClick={() => go({ page: "settings" })}
        >
          <Settings size={17} />
          Inställningar
        </button>
        <div className="private-caption">
          <span />
          Lokal, privat arbetsyta
          <span className="footer-version">GARON 4.0</span>
        </div>
      </div>
    </aside>
  );
}
