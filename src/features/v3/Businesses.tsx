import { useRef, useState, type PointerEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Folder,
  GitBranch,
  LayoutList,
  Minus,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import { date } from "../../lib/format";
import { BlankState, PageHeading } from "./Pages";
function BusinessNetwork() {
  const { state, go } = useGaron();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const count = state.businesses.length;
  const columns = Math.min(3, Math.max(1, count));
  const width = Math.max(600, columns * 245);
  const height = Math.max(400, Math.ceil(count / 3) * 155 + 230);
  const center = width / 2;
  const nodes = state.businesses.map((business, index) => ({
    business,
    x: ((index % 3) + 0.5) * (width / columns),
    y: 255 + Math.floor(index / 3) * 155,
  }));
  function start(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button") || event.button !== 0)
      return;
    drag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setPan({
      x: drag.current.px + event.clientX - drag.current.x,
      y: drag.current.py + event.clientY - drag.current.y,
    });
  }
  return (
    <div className="network-container">
      <div className="network-toolbar">
        <span>
          <span className="status-dot" />
          Organisation · ingen aktiv agentkörning
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="Zooma ut"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.15))}
          >
            <Minus size={16} />
          </button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button
            className="icon-button"
            aria-label="Zooma in"
            disabled={zoom >= 1.6}
            onClick={() => setZoom((value) => Math.min(1.6, value + 0.15))}
          >
            <Plus size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Återställ nätverksvy"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      <div
        className="network-viewport"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        style={{ height: Math.min(630, height) }}
      >
        <div
          className="network-world"
          style={{
            width,
            height,
            left: "50%",
            marginLeft: -width / 2,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg
            className="network-lines"
            width={width}
            height={height}
            aria-hidden="true"
          >
            {nodes.map(({ business, x, y }) => (
              <path
                key={business.id}
                d={`M${center} 147 C${center} ${190 + Math.min(80, y / 8)},${x} ${y - 70},${x} ${y - 35}`}
                fill="none"
              />
            ))}
          </svg>
          <div className="core-node" style={{ left: center - 96, top: 65 }}>
            <span className="node-mark">
              <Sparkles size={23} />
            </span>
            <strong>GARON Core</strong>
            <small>AI inte aktiverad</small>
          </div>
          {nodes.map(({ business, x, y }) => (
            <button
              className="business-node"
              key={business.id}
              style={{ left: x - 100, top: y - 35 }}
              onClick={() =>
                go({
                  page: "business",
                  businessId: business.id,
                  section: business.sections[0]?.id || "overview",
                })
              }
            >
              <Building2 size={17} />
              <span>
                <strong>{business.name}</strong>
                <small>Verksamhet</small>
              </span>
              <ChevronRight size={13} />
            </button>
          ))}
        </div>
        {!count && (
          <div className="network-empty">
            <h2>Din organisation börjar här</h2>
            <p>
              När du skapar en verksamhet får den en plats i nätverket.
              <br />
              Inga verksamheter eller agenter har lagts till åt dig.
            </p>
          </div>
        )}
      </div>
      <div className="network-caption">
        <span>Dra i bakgrunden för att panorera.</span>
        <span>
          {count} {count === 1 ? "verksamhet" : "verksamheter"} · endast
          verkliga poster
        </span>
      </div>
    </div>
  );
}
function BusinessList() {
  const { state, go, editBusiness, deleteBusiness, newBusiness } = useGaron();
  return state.businesses.length ? (
    <div className="business-list">
      {state.businesses.map((business) => (
        <article key={business.id}>
          <button
            className="business-open"
            onClick={() =>
              go({
                page: "business",
                businessId: business.id,
                section: business.sections[0]?.id || "overview",
              })
            }
          >
            <span className="business-icon">
              <Building2 size={20} />
            </span>
            <span>
              <strong>{business.name}</strong>
              <small>{business.description || "Ingen beskrivning ännu."}</small>
            </span>
            <ArrowUpRight size={16} />
          </button>
          <button
            className="icon-button"
            aria-label={`Redigera ${business.name}`}
            onClick={() => editBusiness(business)}
          >
            <Settings2 size={16} />
          </button>
          <button
            className="icon-button danger-text"
            aria-label={`Ta bort ${business.name}`}
            onClick={() => void deleteBusiness(business)}
          >
            <Trash2 size={15} />
          </button>
        </article>
      ))}
    </div>
  ) : (
    <BlankState
      icon={Building2}
      title="Plats för det du vill bygga"
      description="Du har inga verksamheter ännu. Skapa din första när du vill ge en idé en egen arbetsyta."
    >
      <button className="button primary" onClick={newBusiness}>
        <Plus size={16} />
        Skapa verksamhet
      </button>
    </BlankState>
  );
}
export default function Businesses() {
  const { newBusiness } = useGaron();
  const [mode, setMode] = useState<"network" | "list">(() => {
    try {
      return localStorage.getItem("garon.v3.businessView") === "list"
        ? "list"
        : "network";
    } catch {
      return "network";
    }
  });
  function change(value: "network" | "list") {
    setMode(value);
    try {
      localStorage.setItem("garon.v3.businessView", value);
    } catch {}
  }
  return (
    <div className="standard-page businesses-page">
      <PageHeading
        title="Verksamheter"
        description="Dina idéer. Dina arbetsytor. En gemensam riktning."
        action={
          <button className="button primary" onClick={newBusiness}>
            <Plus size={16} />
            Ny verksamhet
          </button>
        }
      />
      <div className="view-toolbar">
        <div className="segmented" role="group" aria-label="Visningsläge">
          <button
            className={mode === "network" ? "selected" : ""}
            aria-pressed={mode === "network"}
            onClick={() => change("network")}
          >
            <GitBranch size={15} />
            Nätverksvy
          </button>
          <button
            className={mode === "list" ? "selected" : ""}
            aria-pressed={mode === "list"}
            onClick={() => change("list")}
          >
            <LayoutList size={15} />
            Listvy
          </button>
        </div>
        <span className="quiet-label">Din organisation, i din takt</span>
      </div>
      {mode === "network" ? <BusinessNetwork /> : <BusinessList />}
    </div>
  );
}
export function BusinessDetail() {
  const { state, route, go, editBusiness, deleteBusiness } = useGaron();
  const business = state.businesses.find(
    (item) => item.id === route.businessId,
  );
  if (!business)
    return (
      <div className="standard-page">
        <BlankState
          icon={Folder}
          title="Verksamheten finns inte"
          description="Den kan ha tagits bort, eller så är länken inte längre aktuell."
        >
          <button className="button" onClick={() => go({ page: "businesses" })}>
            Till verksamheter
          </button>
        </BlankState>
      </div>
    );
  const section =
    business.sections.find((item) => item.id === route.section) ||
    business.sections[0];
  return (
    <div className="standard-page business-detail">
      <button className="back-link" onClick={() => go({ page: "businesses" })}>
        <ArrowLeft size={14} />
        Alla verksamheter
      </button>
      <PageHeading
        title={business.name}
        description={
          business.description || "En egen arbetsyta för din verksamhet."
        }
        action={
          <div className="heading-actions">
            <button className="button" onClick={() => editBusiness(business)}>
              <Settings2 size={15} />
              Redigera
            </button>
            <button
              className="icon-button danger-text"
              aria-label={`Ta bort ${business.name}`}
              onClick={() => void deleteBusiness(business)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        }
      />
      <div
        className="business-tabs"
        role="group"
        aria-label="Verksamhetens sidor"
      >
        {business.sections.map((item) => (
          <button
            key={item.id}
            className={item.id === section.id ? "active" : ""}
            aria-pressed={item.id === section.id}
            onClick={() =>
              go({
                page: "business",
                businessId: business.id,
                section: item.id,
              })
            }
          >
            {item.title}
          </button>
        ))}
      </div>
      {section.view === "overview" ? (
        <section className="business-overview">
          <div className="business-overview-icon">
            <Building2 size={28} />
          </div>
          <h2>En början, med plats att växa.</h2>
          <p>
            Verksamheten är sparad lokalt. Här kan du samla din organisation och
            ditt arbete när fler funktioner ansluts.
          </p>
          <div className="business-facts">
            <div>
              <span>Skapad</span>
              <strong>{date(business.createdAt, true)}</strong>
            </div>
            <div>
              <span>AI-organisation</span>
              <strong>Inte aktiverad</strong>
            </div>
            <div>
              <span>Arbetsyta</span>
              <strong>Lokalt sparad</strong>
            </div>
          </div>
          <p className="small-note">
            Via Redigera kan du byta namn, ändra beskrivningen och välja vilka
            förberedda sidor som visas.
          </p>
        </section>
      ) : (
        <BlankState
          icon={section.view === "agents" ? UsersRound : Folder}
          title={
            section.view === "agents"
              ? "Inga agenter är anslutna"
              : `${section.title} är förberett`
          }
          description={
            section.view === "agents"
              ? "Agenter kan kopplas till verksamheten i en framtida version. Inga agentkörningar sker."
              : "Den här sidan är en plats för framtida funktionalitet. Inga uppdrag har skapats eller flyttats hit automatiskt."
          }
        />
      )}
    </div>
  );
}
