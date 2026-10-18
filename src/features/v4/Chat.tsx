import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";
import { useGaron } from "../../lib/v3/garon";
import { request } from "../../lib/api";
import type { Channel } from "../../types";
import { RoleLogo } from "./Brand";
const draftCache = new Map<Channel, string>();
export default function Chat({
  channel = "garon",
  compact = false,
}: {
  channel?: Channel;
  compact?: boolean;
}) {
  const { state, mutate, busy, go } = useGaron();
  const [draft, setDraft] = useState(
    () =>
      draftCache.get(channel) ??
      state.v4.drafts.find((row) => row.channel === channel)?.content ??
      "",
  );
  const pending = useRef(draft);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveError, setSaveError] = useState("");
  const [businessId, setBusinessId] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const cfg = state.v4.ai;
  const provider = channel === "garon" ? cfg.garonProvider : channel;
  const configured = cfg.providers.find(
    (row) => row.id === provider,
  )?.configured;
  const messages = state.v4.chats[channel];
  const name =
    channel === "garon" ? "GARON" : channel === "openai" ? "ChatGPT" : "Claude";
  async function save(value: string) {
    try {
      await request(`/v4/drafts/${channel}`, { content: value });
      setSaveError("");
    } catch {
      setSaveError("Utkastet kunde inte sparas. Kontrollera servern.");
    }
  }
  function change(value: string) {
    draftCache.set(channel, value);
    setDraft(value);
    pending.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(value), 400);
  }
  useEffect(() => {
    const flush = () => {
      void fetch(`/api/v4/drafts/${channel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: pending.current }),
        keepalive: true,
      });
    };
    window.addEventListener("pagehide", flush);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      flush();
      window.removeEventListener("pagehide", flush);
    };
  }, [channel]);
  useEffect(() => {
    if (messages.length) end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy || !configured || !cfg.enabled) return;
    if (timer.current) clearTimeout(timer.current);
    if (
      await mutate(
        `/v4/chat/${channel}`,
        { message: draft, businessId: businessId || null },
        "POST",
        "",
      )
    ) {
      draftCache.set(channel, "");
      setDraft("");
      pending.current = "";
    }
  }
  return (
    <section
      className={`v4-chat ${compact ? "compact-chat" : ""}`}
      aria-label={`Chatt med ${name}`}
    >
      <header>
        <span className="chat-role-logo">
          <RoleLogo role={channel} />
        </span>
        <div>
          <strong>{name}</strong>
          <small>
            {channel === "garon"
              ? "VD · huvudassistent"
              : channel === "openai"
                ? "Strategi · analys · affärsutveckling"
                : "Teknik · utveckling · automation"}
          </small>
        </div>
        <span className="status-label">
          {!configured
            ? "Ej ansluten"
            : !cfg.enabled
              ? "AI avstängd"
              : "Konfigurerad"}
        </span>
      </header>
      <div className="v4-chat-history">
        {messages.length ? (
          messages.map((message) => (
            <article key={message.id} className={`g-message ${message.role}`}>
              <span className="message-avatar">
                {message.role === "assistant" ? (
                  <RoleLogo role={channel} />
                ) : (
                  <span>Du</span>
                )}
              </span>
              <div>
                <strong>{message.role === "assistant" ? name : "Du"}</strong>
                <p>{message.content}</p>
                {(message as any).failed && (
                  <small className="danger-text">
                    Anropet misslyckades. Inget AI-svar har lagts till.
                  </small>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="chat-start">
            <RoleLogo role={channel} />
            <h2>
              {channel === "garon"
                ? "Vad vill du ta vidare idag?"
                : `Ditt samtal med ${name}`}
            </h2>
            <p>
              {!configured
                ? "Lägg till en API-nyckel under Inställningar för riktiga svar."
                : "AI behöver vara aktiverad och ha budget för att kunna svara."}
            </p>
          </div>
        )}
        <div ref={end} />
      </div>
      {channel === "garon" && (
        <div className="chat-context">
          <select
            aria-label="Verksamhetskontext"
            value={businessId}
            onChange={(event) => setBusinessId(event.target.value)}
          >
            <option value="">Hela huvudkontoret</option>
            {state.businesses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            className="text-link"
            onClick={() =>
              change(
                "Sammanfatta mellanchefernas samtal och tydliggör nästa steg.",
              )
            }
          >
            Sammanfatta ledningens samtal
          </button>
        </div>
      )}
      <form className="composer" onSubmit={send}>
        <label className="sr-only" htmlFor={`chat-${channel}`}>
          Meddelande till {name}
        </label>
        <textarea
          id={`chat-${channel}`}
          rows={3}
          value={draft}
          onChange={(event) => change(event.target.value)}
          maxLength={6000}
          placeholder={`Skriv till ${name}…`}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="composer-toolbar">
          <span>{saveError || "Utkast och samtal sparas lokalt"}</span>
          <button
            className="send-button"
            aria-label={`Skicka till ${name}`}
            disabled={!cfg.enabled || !configured || !draft.trim() || busy}
          >
            {busy ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <ArrowUp size={19} />
            )}
          </button>
        </div>
      </form>
      <footer>
        {channel === "garon"
          ? "Privat kanal. Hela historiken delas inte med mellanchefer eller agenter."
          : "Separat historik. GARON kan hämta relevanta delar; privat GARON-historik skickas inte hit."}
        <button
          className="text-link"
          onClick={() => go({ page: "settings", section: "models" })}
        >
          AI-inställningar
        </button>
      </footer>
    </section>
  );
}
