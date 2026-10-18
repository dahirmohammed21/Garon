import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  Inbox,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import { relative } from "../../lib/format";
export default function Home() {
  const { state, go, mutate, busy } = useGaron();
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const connected = state.ai.enabled && state.ai.configured;
  const pending = state.tasks.filter((task) => task.status === "approval");
  useEffect(() => {
    if (state.messages.length)
      end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state.messages.length]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!connected || busy || !draft.trim()) return;
    if (await mutate("/chat", { message: draft }, "POST", "")) setDraft("");
  }
  return (
    <div className="home">
      <section
        className={`conversation ${state.messages.length ? "has-history" : ""}`}
        aria-label="GARON-chatt"
      >
        <div className="welcome">
          <span className="welcome-mark">
            <Sparkles size={26} />
          </span>
          <span className="eyebrow">DITT DIGITALA HUVUDKONTOR</span>
          <h1>Välkommen tillbaka</h1>
          <p>
            En tanke, en idé eller ett nästa steg.
            <br className="mobile-break" /> Här börjar samtalet.
          </p>
        </div>
        {state.messages.length > 0 && (
          <div className="message-history">
            {!connected && (
              <p className="history-caption">
                Tidigare konversation · inga nya AI-anrop är aktiverade
              </p>
            )}
            {state.messages.map((message) => (
              <article key={message.id} className={`g-message ${message.role}`}>
                <span className="message-avatar">
                  {message.role === "assistant" ? (
                    <Sparkles size={17} />
                  ) : (
                    <span>Du</span>
                  )}
                </span>
                <div>
                  <strong>
                    {message.role === "assistant" ? "GARON" : "Du"}
                  </strong>
                  <p>{message.content}</p>
                </div>
              </article>
            ))}
            <div ref={end} />
          </div>
        )}
        <form className="composer" onSubmit={send}>
          <label className="sr-only" htmlFor="garon-message">
            Meddelande till GARON
          </label>
          <textarea
            id="garon-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={6000}
            rows={3}
            placeholder="Vad vill du ta vidare idag?"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (connected) event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="composer-toolbar">
            <span>
              <span className={`status-dot ${connected ? "connected" : ""}`} />
              {connected ? state.ai.model : "AI är inte aktiverad"}
            </span>
            <button
              className="send-button"
              aria-label="Skicka meddelande"
              title={
                connected
                  ? "Skicka meddelande"
                  : "AI behöver aktiveras separat innan meddelanden kan skickas"
              }
              disabled={!connected || !draft.trim() || busy}
            >
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <ArrowUp size={19} />
              )}
            </button>
          </div>
        </form>
        <p className="composer-hint">
          {connected
            ? "GARON kan göra misstag. Granska viktiga uppgifter."
            : "Du kan skriva ett utkast. Inget skickas och inga AI-svar simuleras."}
          {!connected && (
            <button onClick={() => go({ page: "settings", section: "models" })}>
              Om AI-anslutning <ChevronRight size={12} />
            </button>
          )}
        </p>
      </section>
      <section className="home-information" aria-label="Viktig information">
        <div className="information-block">
          <header>
            <span>
              <ShieldCheck size={17} />
              Godkännanden
            </span>
            <button
              onClick={() => go({ page: "approvals" })}
              aria-label="Visa alla godkännanden"
            >
              <ArrowRight size={15} />
            </button>
          </header>
          {pending.length ? (
            <div className="brief-list">
              {pending.slice(0, 3).map((task) => (
                <button key={task.id} onClick={() => go({ page: "approvals" })}>
                  <span>{task.title}</span>
                  <small>Väntar på ditt beslut</small>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          ) : (
            <p>
              <Check size={15} />
              Inga beslut väntar på dig.
            </p>
          )}
        </div>
        <div className="information-block">
          <header>
            <span>
              <Inbox size={17} />
              Viktiga meddelanden
            </span>
            <button
              onClick={() => go({ page: "inbox" })}
              aria-label="Öppna inkorgen"
            >
              <ArrowRight size={15} />
            </button>
          </header>
          <p>Ingen inkorg är ansluten ännu.</p>
          <small>
            Här samlas viktig information när du ansluter en tjänst.
          </small>
        </div>
        <div className="information-block">
          <header>
            <span>
              <span className="activity-symbol" />
              Senaste aktivitet
            </span>
            <button
              onClick={() => go({ page: "activity" })}
              aria-label="Visa all aktivitet"
            >
              <ArrowRight size={15} />
            </button>
          </header>
          {state.activity.length ? (
            <div className="brief-activity">
              {state.activity.slice(0, 3).map((event) => (
                <div key={event.id}>
                  <span className={`event-dot ${event.type}`} />
                  <span>
                    <strong>{event.title}</strong>
                    <small>{event.detail}</small>
                  </span>
                  <time>{relative(event.createdAt)}</time>
                </div>
              ))}
            </div>
          ) : (
            <p>Inga händelser ännu. Här visas det som faktiskt händer.</p>
          )}
        </div>
      </section>
      <footer className="home-footer">
        <span className="mini-mark">
          <Sparkles size={12} />
        </span>
        En plats att tänka. En grund att växa från.
      </footer>
    </div>
  );
}
