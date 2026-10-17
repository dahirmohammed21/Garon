import { useState } from "react";
import {
  ArrowUpRight,
  Command,
  MessageSquare,
  Shield,
  Sparkles,
} from "lucide-react";
import { Badge } from "../../components/ui";
import { date } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
export default function PartnerPage() {
  const { state, draft, setDraft, sendChat, chatEnd } = useWorkspace();
  const [mode, setMode] = useState<"strategy" | "operations">("strategy");
  const [example, setExample] = useState(false);
  const prompts =
    mode === "strategy"
      ? [
          "Utvärdera min affärsidé och ifrågasätt mina antaganden",
          "Hur kan Sitely hitta rätt kundsegment?",
          "Hjälp mig jämföra två prioriteringar",
        ]
      : [
          "Förbered en plan för en ny verksamhet",
          "Bryt ner ett projekt i tydliga arbetssteg",
          "Vilket beslutsunderlag behöver jag inför nästa satsning?",
        ];
  return (
    <>
      <div className="notice">
        <Shield size={17} />
        Samtalsvyn är förberedd. AI-anrop och operativa åtgärder är spärrade i
        Fas 1. Tidigare samtal finns kvar.
      </div>
      <div
        className="partner-modes"
        role="group"
        aria-label="Samtalets inriktning"
      >
        <button
          className={mode === "strategy" ? "selected" : ""}
          onClick={() => setMode("strategy")}
        >
          Strategiska samtal<small>Idéer, analys & vägval</small>
        </button>
        <button
          className={mode === "operations" ? "selected" : ""}
          onClick={() => setMode("operations")}
        >
          Operativa instruktioner<small>Planering, arbete & uppföljning</small>
        </button>
      </div>
      <section className="panel chat-panel">
        <div className="chat-panel-header">
          <span className="core-mini">
            <Sparkles size={20} />
          </span>
          <div>
            <strong>GARON · Min affärspartner</strong>
            <span>
              {mode === "strategy"
                ? "Strategiskt samtal"
                : "Operativ planering"}{" "}
              · aktivering i Fas 3
            </span>
          </div>
          <Badge>AI pausad</Badge>
        </div>
        <div className="chat-messages">
          {!state.messages.length && (
            <div className="chat-welcome">
              <div className="chat-orb">
                <Sparkles size={32} />
              </div>
              <div className="eyebrow">EN CENTRAL KONTAKTPUNKT</div>
              <h2>Vad vill du utveckla, {state.settings.name}?</h2>
              <p>
                Här ska du kunna diskutera riktning, pröva idéer och ge GARON
                uppdrag. I Fas 1 kan du förbereda ett meddelande och utforska
                upplägget utan att något skickas.
              </p>
              <div className="prompt-suggestions">
                {prompts.map((prompt) => (
                  <button key={prompt} onClick={() => setDraft(prompt)}>
                    <MessageSquare size={15} />
                    {prompt}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {state.messages.map((message) => (
            <article
              className={`chat-message ${message.role}`}
              key={message.id}
            >
              <span className="message-marker">
                {message.role === "assistant" ? (
                  <Sparkles size={17} />
                ) : (
                  <Command size={17} />
                )}
              </span>
              <div>
                <strong>
                  {message.role === "assistant"
                    ? "GARON · tidigare svar"
                    : "Du"}
                  <time>{date(message.createdAt)}</time>
                </strong>
                <p>{message.content}</p>
              </div>
            </article>
          ))}
          <div className="partner-example">
            <button
              className="text-button"
              onClick={() => setExample((value) => !value)}
            >
              {example ? "Dölj" : "Visa"} ett märkt exempel på framtida svar{" "}
              <ArrowUpRight size={13} />
            </button>
            {example && (
              <article className="example-response">
                <Badge>Demo · inte ett AI-genererat svar</Badge>
                <h3>Så kan ett framtida beslutsunderlag se ut</h3>
                <p>
                  <strong>Fakta:</strong> Inget underlag har analyserats i det
                  här exemplet.
                </p>
                <p>
                  <strong>Antagande:</strong> Kundsegmentets behov behöver
                  undersökas.
                </p>
                <p>
                  <strong>Rekommendation:</strong> Samla konkreta kundbehov
                  innan du väljer erbjudande.
                </p>
                <p>
                  <strong>Nästa steg:</strong> Diskutera avgränsning och vilket
                  underlag som behövs. Ingen research eller delegering har
                  startats.
                </p>
              </article>
            )}
          </div>
          <div ref={chatEnd} />
        </div>
        <form className="chat-form" onSubmit={sendChat}>
          <label className="sr-only" htmlFor="chat-input">
            Meddelande till GARON
          </label>
          <textarea
            id="chat-input"
            placeholder="Förbered din fråga eller instruktion…"
            value={draft}
            maxLength={6000}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
          />
          <button
            className="send-button"
            type="submit"
            disabled
            aria-label="Skicka meddelande"
            title="Aktiveras först efter godkännande i Fas 3"
          >
            <ArrowUpRight size={22} />
          </button>
        </form>
        <div className="chat-disclaimer">
          <Shield size={12} />
          Utkastet stannar i den öppna sessionen och försvinner vid omladdning.
          Inga meddelanden skickas i Fas 1.
        </div>
      </section>
    </>
  );
}
