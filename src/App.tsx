import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  LoaderCircle,
  Menu,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { Business, State } from "./types";
import { request } from "./lib/api";
import { useTheme } from "./lib/v3/theme";
import { GaronProvider } from "./lib/v3/garon";
import {
  headquarters,
  readRoute,
  routeHash,
  type Route,
} from "./lib/v3/navigation";
import Sidebar from "./features/v4/Sidebar";
import Home from "./features/v4/Home";
import Businesses, { BusinessDetail } from "./features/v3/Businesses";
import BusinessDialog from "./features/v3/BusinessDialog";
import BusinessCreate from "./features/v4/BusinessCreate";
import Leadership, { AgentNetwork } from "./features/v4/Organization";
import { Approvals, InboxPage, Scheduled } from "./features/v4/Operations";
import SettingsPage from "./features/v4/Settings";
import { ActivityPage } from "./features/v3/Pages";
function errorMessage(error: unknown) {
  return error instanceof TypeError
    ? "Kunde inte nå servern. Kontrollera att GARON är igång."
    : error instanceof Error
      ? error.message
      : "Något gick fel. Försök igen.";
}
function rememberedSidebar() {
  try {
    return localStorage.getItem("garon.v3.sidebar") === "closed";
  } catch {
    return false;
  }
}
export default function App() {
  const { preferences, storageError } = useTheme();
  const [state, setState] = useState<State | null>(null);
  const [route, setRoute] = useState<Route>(readRoute);
  const [collapsed, setCollapsed] = useState(rememberedSidebar);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => innerWidth < 900);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [businessDialog, setBusinessDialog] = useState<Business | "new" | null>(
    null,
  );
  const load = useCallback(async () => {
    const response = await fetch("/api/state");
    if (!response.ok)
      throw new Error("Kunde inte läsa dina sparade uppgifter.");
    const data = await response.json();
    setState(data);
    setError("");
  }, []);
  useEffect(() => {
    void load().catch((error) => setError(errorMessage(error)));
    const timer = setInterval(
      () => void load().catch((error) => setError(errorMessage(error))),
      15000,
    );
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    const handler = () => {
      setRoute(readRoute());
      setMobileOpen(false);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    const media = matchMedia("(max-width:899px)");
    const handler = () => {
      setIsMobile(media.matches);
      setMobileOpen(false);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  function go(next: Route) {
    setRoute(next);
    location.hash = routeHash(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function toggle() {
    if (isMobile) setMobileOpen((value) => !value);
    else
      setCollapsed((value) => {
        try {
          localStorage.setItem("garon.v3.sidebar", value ? "open" : "closed");
        } catch {}
        return !value;
      });
  }
  async function mutate(
    path: string,
    body: unknown,
    method = "POST",
    message = "Ändringen är sparad",
  ) {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      await request(path, body, method);
      await load();
      if (preferences.confirmations && message) setToast(message);
      return true;
    } catch (error) {
      setToast(errorMessage(error));
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function newBusiness() {
    setMobileOpen(false);
    setBusinessDialog("new");
  }
  function editBusiness(business: Business) {
    setMobileOpen(false);
    setBusinessDialog(business);
  }
  async function deleteBusiness(business: Business) {
    if (
      !confirm(
        `Ta bort verksamheten ”${business.name}”?\n\nVerksamhetens namn, beskrivning och meny tas bort. Tidigare uppdrag, anteckningar och historik påverkas inte.`,
      )
    )
      return;
    if (
      await mutate(
        `/businesses/${business.id}`,
        { confirm: true },
        "DELETE",
        "Verksamheten är borttagen",
      )
    ) {
      if (route.businessId === business.id) go({ page: "businesses" });
    }
  }
  const currentBusiness = state?.businesses.find(
    (business) => business.id === route.businessId,
  );
  const title =
    route.page === "home"
      ? "Ditt huvudkontor"
      : route.page === "business"
        ? currentBusiness?.name || "Verksamhet"
        : route.page === "leadership"
          ? "AI-ledning"
          : route.page === "agents"
            ? "Agentnätverk"
            : route.page === "businesses"
              ? "Verksamheter"
              : route.page === "settings"
                ? "Inställningar"
                : headquarters.find((item) => item.page === route.page)
                    ?.title || "GARON";
  useEffect(() => {
    document.title = `${title} · GARON`;
  }, [title]);
  if (!state)
    return (
      <div className="app-loading">
        <span className="garon-mark">
          <Sparkles size={24} />
        </span>
        <strong>GARON</strong>
        <p>{error || "Öppnar din arbetsyta…"}</p>
        {error ? (
          <button
            className="button"
            onClick={() =>
              void load().catch((error) => setError(errorMessage(error)))
            }
          >
            Försök igen
          </button>
        ) : (
          <LoaderCircle size={20} className="spin" />
        )}
      </div>
    );
  const hidden = isMobile ? !mobileOpen : collapsed;
  return (
    <GaronProvider
      value={{
        state,
        route,
        go,
        busy,
        mutate,
        newBusiness,
        editBusiness,
        deleteBusiness,
      }}
    >
      <div
        className={`g-shell ${collapsed ? "sidebar-hidden" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-holder" aria-hidden={hidden} inert={hidden}>
          <Sidebar toggle={toggle} />
        </div>
        {mobileOpen && (
          <button
            className="sidebar-overlay"
            aria-label="Stäng navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <div className="g-main" inert={mobileOpen}>
          <header className="g-topbar">
            <button
              className="icon-button open-navigation"
              onClick={toggle}
              aria-label="Öppna navigation"
            >
              {isMobile ? <Menu size={19} /> : <PanelLeftOpen size={19} />}
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-brand">GARON</span>
              <ChevronRight size={12} />
              <span>{title}</span>
            </div>
            <span className="private-label">
              <ShieldCheck size={13} />
              Privat arbetsyta
            </span>
          </header>
          <main id="main-content">
            {error && (
              <div className="connection-error" role="alert">
                {error}
                <button
                  onClick={() =>
                    void load().catch((error) => setError(errorMessage(error)))
                  }
                >
                  Försök igen
                </button>
              </div>
            )}
            {storageError && (
              <div className="connection-error" role="alert">
                Utseendet kunde inte sparas. Kontrollera den lokala servern och
                webbläsarens lagring.
              </div>
            )}
            {route.page === "home" ? (
              <Home />
            ) : route.page === "leadership" ? (
              <Leadership />
            ) : route.page === "agents" ? (
              <AgentNetwork />
            ) : route.page === "businesses" ? (
              <Businesses />
            ) : route.page === "business" ? (
              <BusinessDetail />
            ) : route.page === "settings" ? (
              <SettingsPage />
            ) : route.page === "approvals" ? (
              <Approvals />
            ) : route.page === "inbox" ? (
              <InboxPage />
            ) : route.page === "scheduled" ? (
              <Scheduled />
            ) : (
              <ActivityPage />
            )}
          </main>
        </div>
        {businessDialog === "new" ? (
          <BusinessCreate onClose={() => setBusinessDialog(null)} />
        ) : (
          businessDialog && (
            <BusinessDialog
              business={businessDialog}
              onClose={() => setBusinessDialog(null)}
            />
          )
        )}{" "}
        {toast && (
          <div className="g-toast" role="status">
            <span>{toast}</span>
            <button
              className="icon-button"
              aria-label="Stäng meddelande"
              onClick={() => setToast("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </GaronProvider>
  );
}
