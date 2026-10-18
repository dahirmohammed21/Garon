import { useEffect, useRef, useState } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import { GripHorizontal, Minus, Plus, X } from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import { request } from "../../lib/api";
import type { WidgetLayout } from "../../types";
import { relative, money } from "../../lib/format";
import Chat from "./Chat";
const Grid = WidthProvider(GridLayout);
const widgets = [
  { id: "approvals", title: "Godkännanden" },
  { id: "inbox", title: "Viktiga meddelanden" },
  { id: "activity", title: "Senaste aktivitet" },
  { id: "businesses", title: "Verksamheter" },
  { id: "budget", title: "AI-budget" },
  { id: "agents", title: "Agentkonfigurationer" },
];
export default function Home() {
  const { state, go } = useGaron();
  const [layout, setLayout] = useState<WidgetLayout[]>(state.v4.ui.layout);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const edited = useRef(false);
  useEffect(() => {
    let active = true;
    request("/v4/ui")
      .then((value) => {
        if (active && !edited.current) setLayout(value.layout);
      })
      .catch(() => setError("Widgetlayouten kunde inte läsas."));
    return () => {
      active = false;
    };
  }, []);
  async function save(next: WidgetLayout[]) {
    edited.current = true;
    setLayout(next);
    try {
      await request("/v4/ui", { layout: next }, "PATCH");
      setError("");
    } catch {
      setError(
        "Widgetlayouten kunde inte sparas. Försök flytta eller ändra igen.",
      );
    }
  }
  const pending =
    state.v4.approvals.filter((item) => item.status === "pending").length +
    state.tasks.filter((task) => task.status === "approval").length;
  function body(id: string) {
    switch (id) {
      case "approvals":
        return (
          <>
            <strong>
              {pending ? `${pending} beslut väntar` : "Inga beslut väntar"}
            </strong>
            <p>Du har sista ordet.</p>
            <button
              className="text-link"
              onClick={() => go({ page: "approvals" })}
            >
              Öppna godkännanden →
            </button>
          </>
        );
      case "inbox":
        return (
          <>
            {state.v4.inbox.filter((item) => !item.read).length ? (
              <strong>
                {state.v4.inbox.filter((item) => !item.read).length} olästa
                interna meddelanden
              </strong>
            ) : (
              <p>
                Inga nya interna meddelanden. Ingen extern inkorg är ansluten.
              </p>
            )}
            <button className="text-link" onClick={() => go({ page: "inbox" })}>
              Öppna inkorgen →
            </button>
          </>
        );
      case "activity":
        return (
          <>
            {state.activity.slice(0, 3).map((item) => (
              <div className="widget-event" key={item.id}>
                <span>{item.title}</span>
                <small>{relative(item.createdAt)}</small>
              </div>
            ))}
            {!state.activity.length && <p>Inga händelser ännu.</p>}
          </>
        );
      case "businesses":
        return (
          <>
            {state.businesses.length ? (
              state.businesses.map((item) => (
                <button
                  className="text-link"
                  key={item.id}
                  onClick={() =>
                    go({
                      page: "business",
                      businessId: item.id,
                      section: "overview",
                    })
                  }
                >
                  {item.name} →
                </button>
              ))
            ) : (
              <p>Inga verksamheter skapade.</p>
            )}
          </>
        );
      case "budget":
        return (
          <>
            <strong>{money(state.v4.ai.spent)} registrerat</strong>
            <p>
              Budget: {money(state.settings.budget)} per månad. Kostnader är
              uppskattningar.
            </p>
          </>
        );
      default:
        return (
          <>
            <strong>{state.agents.length} sparade agentroller</strong>
            <p>Ingen autonom körning eller externa verktyg är aktiva.</p>
            <button
              className="text-link"
              onClick={() => go({ page: "agents" })}
            >
              Visa nätverket →
            </button>
          </>
        );
    }
  }
  return (
    <div className="v4-home">
      <header className="desktop-heading">
        <div>
          <span className="eyebrow">GARON / HUVUDKONTOR</span>
          <h1>Översikt</h1>
        </div>
        <div className="widget-actions">
          <button
            className="icon-button"
            aria-label="Lägg till widget"
            aria-expanded={adding}
            onClick={() => setAdding((value) => !value)}
          >
            <Plus size={18} />
          </button>
          <button
            className={`icon-button ${editing ? "active" : ""}`}
            aria-label="Ta bort widgets"
            aria-pressed={editing}
            onClick={() => setEditing((value) => !value)}
          >
            <Minus size={18} />
          </button>
          {adding && (
            <div className="widget-menu">
              {widgets
                .filter((item) => !layout.some((row) => row.i === item.id))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      void save([
                        ...layout,
                        {
                          i: item.id,
                          x: 0,
                          y: Math.max(0, ...layout.map((row) => row.y + row.h)),
                          w: 4,
                          h: 4,
                        },
                      ]);
                      setAdding(false);
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              {layout.length === widgets.length && (
                <p>Alla widgets visas redan.</p>
              )}
            </div>
          )}
        </div>
      </header>
      <Chat />
      {error && (
        <p role="alert" className="danger-text">
          {error}
        </p>
      )}
      {editing && (
        <p className="small-note">
          Välj × för att ta bort en widget. Dra i handtaget för att ändra
          ordning och i hörnet för storlek.
        </p>
      )}
      <div className="widget-desktop">
        <Grid
          layout={
            layout.map((item) => ({ ...item, minW: 2, minH: 3 })) as Layout[]
          }
          cols={12}
          rowHeight={45}
          margin={[16, 16]}
          draggableHandle=".widget-drag"
          draggableCancel="button"
          onDragStop={(next) =>
            void save(next.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })))
          }
          onResizeStop={(next) =>
            void save(next.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })))
          }
          isResizable
          containerPadding={[0, 0]}
        >
          {layout.map((item) => (
            <section key={item.i} className="desktop-widget">
              <header className="widget-drag">
                <GripHorizontal size={14} />
                <h2>{widgets.find((widget) => widget.id === item.i)?.title}</h2>
                {editing && (
                  <button
                    aria-label={`Ta bort ${widgets.find((widget) => widget.id === item.i)?.title}`}
                    onClick={() =>
                      void save(layout.filter((row) => row.i !== item.i))
                    }
                  >
                    <X size={15} />
                  </button>
                )}
              </header>
              <div>{body(item.i)}</div>
            </section>
          ))}
        </Grid>
      </div>
      <div className="widget-mobile">
        {layout
          .slice()
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map((item) => (
            <section className="desktop-widget" key={item.i}>
              <header>
                <h2>{widgets.find((widget) => widget.id === item.i)?.title}</h2>
                {editing && (
                  <button
                    aria-label={`Ta bort ${widgets.find((widget) => widget.id === item.i)?.title}`}
                    onClick={() =>
                      void save(layout.filter((row) => row.i !== item.i))
                    }
                  >
                    <X size={15} />
                  </button>
                )}
              </header>
              <div>{body(item.i)}</div>
            </section>
          ))}
      </div>
    </div>
  );
}
