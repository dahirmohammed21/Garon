import { fail, text, id, now } from "./validation.js";
import { openai } from "../providers/openai.js";
import { anthropic } from "../providers/anthropic.js";
export function registerChat(app, store, { env, fetchImpl, allowAI = false }) {
  const { all, put, settings, activity } = store;
  const adapters = { openai, anthropic };
  const provider = env.OPENAI_API_KEY
    ? "openai"
    : env.ANTHROPIC_API_KEY
      ? "anthropic"
      : null;
  const defaultModel =
    provider === "openai" ? "gpt-4.1-mini" : "claude-sonnet-4-20250514";
  const model =
    (provider === "openai" ? env.OPENAI_MODEL : env.ANTHROPIC_MODEL) ||
    defaultModel;
  // Conservative reservation: known models only, one request at a time, monthly UTC budget.
  const rates = {
    "gpt-4.1-mini": [0.4, 1.6],
    "claude-sonnet-4-20250514": [3, 15],
  };
  const used = () =>
    all("usage")
      .filter((row) => row.createdAt.slice(0, 7) === now().slice(0, 7))
      .reduce((sum, row) => sum + row.cost, 0);
  let chatBusy = false;
  app.post("/api/chat", async (req, res) => {
    if (!allowAI)
      fail(
        "AI-anrop är spärrade i Fas 1. Aktivering kräver ett separat godkännande i Fas 3.",
        403,
      );
    const message = text(req.body.message, "Meddelandet", 6000);
    if (!provider)
      fail(
        "Ingen AI-modell är ansluten. Lägg till OPENAI_API_KEY eller ANTHROPIC_API_KEY i .env och starta om servern.",
        503,
      );
    if (!rates[model])
      fail(
        "Modellens pris saknas. Välj standardmodellen för att behålla budgetkontrollen.",
        400,
      );
    if (chatBusy) fail("GARON svarar redan. Vänta tills svaret är klart.", 409);
    const history = all("message")
      .reverse()
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));
    const system =
      "Du är GARON, Dahirs personliga AI-assistent. Svara på enkel svenska. Du kan diskutera och planera, men har inga verktyg för att utföra åtgärder. Påstå aldrig att du startat agenter, skapat uppdrag, läst minne eller ändrat data. Användaren gör det via gränssnittet. Ange tydligt dina begränsningar.";
    const messages = [...history, { role: "user", content: message }];
    const [inputRate, outputRate] = rates[model];
    // UTF-8 bytes upper-bound ordinary text tokens; reserve output plus protocol overhead.
    const inputBound = messages.reduce(
      (sum, item) => sum + Buffer.byteLength(item.content) + 100,
      Buffer.byteLength(system) + 1000,
    );
    const reserve = (inputBound * inputRate + 1024 * outputRate) / 1e6;
    if (used() + reserve > settings().budget)
      fail(
        "Månadsbudgeten räcker inte för ett nytt svar. Justera budgeten under Inställningar.",
        402,
      );
    chatBusy = true;
    const usage = put("usage", {
      id: id(),
      createdAt: now(),
      model,
      cost: reserve,
      estimated: true,
      inputTokens: 0,
      outputTokens: 0,
    });
    try {
      const { answer, inputTokens, outputTokens } = await adapters[provider]({
        model,
        messages,
        system,
        key: provider === "openai" ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY,
        fetchImpl,
      });
      if (Number.isFinite(inputTokens) && Number.isFinite(outputTokens))
        put("usage", {
          ...usage,
          inputTokens,
          outputTokens,
          cost: (inputTokens * inputRate + outputTokens * outputRate) / 1e6,
          estimated: false,
        });
      put("message", {
        id: id(),
        role: "user",
        content: message,
        createdAt: now(),
      });
      const reply = put("message", {
        id: id(),
        role: "assistant",
        content: answer,
        createdAt: now(),
      });
      activity("GARON har svarat", "Ett AI-svar har sparats.", "success");
      res.json(reply);
    } catch (error) {
      // Keep the reservation on uncertain failures: a timed-out provider may have billed us.
      if (error.status) throw error;
      fail(
        "Kunde inte nå AI-leverantören. Kontrollera nätverket. En kostnadsreservation sparades eftersom anropet kan ha debiterats.",
        502,
      );
    } finally {
      chatBusy = false;
    }
  });
  return {
    state: () => ({
      enabled: allowAI,
      provider,
      model: provider ? model : null,
      configured: Boolean(provider),
      pricingSupported: Boolean(rates[model]),
      spent: used(),
      busy: chatBusy,
    }),
  };
}
