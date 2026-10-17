import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  ChevronRight,
  LoaderCircle,
  Menu,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Page, State, Task } from "./types";
import { pages } from "./lib/navigation";
import { WorkspaceProvider } from "./lib/workspace";
import { request } from "./lib/api";
import Sidebar from "./components/Sidebar";
import WorkspaceDialog from "./components/WorkspaceDialog";
import HeadquartersPage from "./features/headquarters/HeadquartersPage";
import {
  BusinessesPage,
  ProjectsPage,
  IntegrationsPage,
} from "./features/workspace/PlannedPages";
import LeadershipPage from "./features/organization/LeadershipPage";
import TasksPage from "./features/workspace/TasksPage";
import AgentsPage from "./features/workspace/AgentsPage";
import ActivityPage from "./features/workspace/ActivityPage";
import ApprovalsPage from "./features/workspace/ApprovalsPage";
import FinancePage from "./features/workspace/FinancePage";
import MemoryPage from "./features/workspace/MemoryPage";
import PartnerPage from "./features/partner/PartnerPage";
import SettingsPage from "./features/workspace/SettingsPage";

export default function App() {
  const [lastVisit] = useState(() => localStorage.getItem("garon.lastVisit"));
  useEffect(() => {
    localStorage.setItem("garon.lastVisit", new Date().toISOString());
  }, []);
  const [state, setState] = useState<State | null>(null);
  const [page, setPage] = useState<Page>(() => {
    const key = location.hash.slice(1);
    return pages.some((item) => item.id === key) ? (key as Page) : "overview";
  });
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("garon.sidebar") === "closed",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<"task" | "agent" | "note" | Task | null>(
    null,
  );
  const [notifications, setNotifications] = useState(false);
  const [demo, setDemo] = useState(false);
  const [taskFilter, setTaskFilter] = useState("all");
  const [listQuery, setListQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  async function load() {
    const response = await fetch("/api/state");
    if (!response.ok) throw new Error("Kunde inte läsa data från GARON.");
    const data = await response.json();
    setState(data);
    setError("");
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
    const timer = setInterval(() => {
      load().catch((e) => setError(e.message));
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const listener = () => {
      const key = location.hash.slice(1);
      if (pages.some((item) => item.id === key)) {
        setPage(key as Page);
        setListQuery("");
      }
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setModal(null);
        setNotifications(false);
        setQuery("");
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.messages.length, sending, page]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    const root = modalRef.current;
    root?.querySelector<HTMLElement>("input, button")?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !root) return;
      const elements = [
        ...root.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, textarea, select, a[href]",
        ),
      ];
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modal]);
  function go(next: Page) {
    setPage(next);
    location.hash = next;
    setMobileOpen(false);
    setQuery("");
    setListQuery("");
    setNotifications(false);
  }
  function toggleSidebar() {
    if (window.innerWidth < 900) setMobileOpen((value) => !value);
    else
      setCollapsed((value) => {
        localStorage.setItem("garon.sidebar", value ? "open" : "closed");
        return !value;
      });
  }
  async function mutate(
    path: string,
    body?: unknown,
    method = "POST",
    message = "Ändringen är sparad",
  ) {
    if (busy) return;
    setBusy(true);
    try {
      await request(path, body, method);
      await load();
      setModal(null);
      setToast(message);
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function sendChat(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || sending || !state?.ai.enabled) return;
    setSending(true);
    try {
      await request("/chat", { message: draft });
      setDraft("");
      await load();
    } catch (e) {
      setToast((e as Error).message);
      await load().catch(() => {});
    } finally {
      setSending(false);
    }
  }
  if (!state)
    return (
      <main className="boot">
        <div className="brand-orb" />
        <h1>GARON</h1>
        <p>{error || "Ansluter till din kontrollcentral…"}</p>
        {error ? (
          <button
            className="button"
            onClick={() => load().catch((e) => setError(e.message))}
          >
            Försök igen
          </button>
        ) : (
          <LoaderCircle className="spin" />
        )}
      </main>
    );

  const approvals = state.tasks.filter((task) => task.status === "approval");
  const matches = (value: string, q = listQuery) =>
    value.toLocaleLowerCase("sv").includes(q.toLocaleLowerCase("sv"));
  const searchResults = query.trim()
    ? [
        ...state.tasks
          .filter((task) => matches(`${task.title} ${task.description}`, query))
          .map((task) => ({
            id: task.id,
            title: task.title,
            type: "Uppdrag",
            page: "tasks" as Page,
            task,
          })),
        ...state.agents
          .filter((agent) => matches(`${agent.name} ${agent.role}`, query))
          .map((agent) => ({
            id: agent.id,
            title: agent.name,
            type: "Agent",
            page: "agents" as Page,
            task: null,
          })),
        ...state.notes
          .filter((note) => matches(`${note.title} ${note.content}`, query))
          .map((note) => ({
            id: note.id,
            title: note.title,
            type: "Minne",
            page: "memory" as Page,
            task: null,
          })),
      ].slice(0, 7)
    : [];
  const pageInfo = pages.find((item) => item.id === page)!;

  const workspace = {
    state,
    page,
    collapsed,
    mobileOpen,
    toggleSidebar,
    go,
    busy,
    mutate,
    modal,
    setModal,
    modalRef,
    listQuery,
    setListQuery,
    taskFilter,
    setTaskFilter,
    draft,
    setDraft,
    sending,
    sendChat,
    chatEnd,
    demo,
    setDemo,
    lastVisit,
  };
  return (
    <WorkspaceProvider value={workspace}>
      <div
        className={`app-shell ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        {mobileOpen && (
          <button
            className="mobile-backdrop"
            aria-label="Stäng navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <Sidebar />

        <div className="main-shell">
          <header className="topbar">
            <button
              className="icon-button open-sidebar"
              onClick={toggleSidebar}
              aria-label="Öppna navigation"
            >
              <Menu size={20} />
            </button>
            <div className="global-search">
              <Search size={16} />
              <input
                ref={searchRef}
                aria-label="Global sökning"
                placeholder="Sök efter uppdrag, agenter eller insikter…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
              {query && (
                <div className="search-results">
                  <div className="search-caption">SÖKRESULTAT</div>
                  {searchResults.length ? (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          go(result.page);
                          if (result.task) setModal(result.task);
                          else setListQuery(result.title);
                        }}
                      >
                        <span>{result.title}</span>
                        <small>{result.type}</small>
                        <ArrowUpRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p>Inga resultat för ”{query}”.</p>
                  )}
                </div>
              )}
            </div>
            <div className="topbar-right">
              <span className={`online-pill ${error ? "offline" : ""}`}>
                <span className="green-dot" />
                {error ? "Anslutning saknas" : "Systemet online"}
              </span>
              <span className="topbar-divider" />
              <button
                className={`notification-button icon-button ${approvals.length ? "has-notification" : ""}`}
                aria-label="Visa aviseringar"
                aria-expanded={notifications}
                onClick={() => setNotifications((value) => !value)}
              >
                <Bell size={18} />
              </button>
            </div>
            {notifications && (
              <div className="notification-popover">
                <h3>Aviseringar</h3>
                {approvals.length ? (
                  <button onClick={() => go("approvals")}>
                    <ShieldCheck size={20} />
                    <span>
                      <strong>
                        {approvals.length} uppdrag väntar på beslut
                      </strong>
                      <small>Öppna Godkännanden för att granska.</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <div className="notification-empty">
                    <CheckCheck size={24} />
                    <p>Du är uppdaterad.</p>
                    <small>Inga väntande godkännanden.</small>
                  </div>
                )}
              </div>
            )}
          </header>

          <main className="content" id="main-content">
            {error && (
              <div className="notice warning">
                {error}{" "}
                <button
                  onClick={() => load().catch((e) => setError(e.message))}
                >
                  Försök igen
                </button>
              </div>
            )}
            <div
              className={`page-heading ${page === "overview" ? "overview-heading" : ""}`}
            >
              <div>
                <div className="eyebrow">
                  {page === "overview"
                    ? `VÄLKOMMEN TILLBAKA, ${state.settings.name.toLocaleUpperCase("sv")}`
                    : "GARON · HUVUDKONTOR"}
                </div>
                <h1>
                  {page === "tasks" ? "Fristående uppdrag" : pageInfo.title}
                  <span className="heading-dot">.</span>
                </h1>
                <p>{pageInfo.description}</p>
              </div>
              <div className="heading-right">
                {page === "overview" ? (
                  <>
                    <span className="today-date">
                      {new Date().toLocaleDateString("sv-SE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "Europe/Stockholm",
                      })}
                    </span>
                    <button
                      className="button primary"
                      onClick={() => go("chat")}
                    >
                      <MessageSquare size={16} />
                      Prata med GARON
                    </button>
                  </>
                ) : page === "tasks" ? (
                  <button
                    className="button primary"
                    onClick={() => setModal("task")}
                  >
                    <Plus size={16} />
                    Nytt uppdrag
                  </button>
                ) : page === "agents" ? (
                  <button
                    className="button primary"
                    onClick={() => setModal("agent")}
                  >
                    <Plus size={16} />
                    Skapa agent
                  </button>
                ) : page === "memory" ? (
                  <button
                    className="button primary"
                    onClick={() => setModal("note")}
                  >
                    <Plus size={16} />
                    Nytt minne
                  </button>
                ) : null}
              </div>
              {page === "overview" && (
                <div className="planet" aria-hidden="true">
                  <div />
                  <i />
                  <b />
                </div>
              )}
            </div>

            {page === "overview" && <HeadquartersPage />}

            {page === "businesses" && <BusinessesPage />}
            {page === "projects" && <ProjectsPage />}
            {page === "leadership" && <LeadershipPage />}
            {page === "integrations" && <IntegrationsPage />}

            {page === "tasks" && <TasksPage />}

            {page === "agents" && <AgentsPage />}

            {page === "activity" && <ActivityPage />}

            {page === "approvals" && <ApprovalsPage />}

            {page === "finance" && <FinancePage />}

            {page === "memory" && <MemoryPage />}

            {page === "chat" && <PartnerPage />}

            {page === "settings" && <SettingsPage />}
          </main>
        </div>

        <WorkspaceDialog />
        {toast && (
          <div className="toast" role="status">
            <span>{toast}</span>
            <button
              className="icon-button"
              aria-label="Stäng meddelande"
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </WorkspaceProvider>
  );
}
