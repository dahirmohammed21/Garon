import { parseBackupRows } from "./import.js";
import { id, now, text, fail } from "../core/validation.js";
import { createHash } from "node:crypto";
import { backup } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
export const defaultLayout = [
  { i: "approvals", x: 0, y: 0, w: 4, h: 4 },
  { i: "inbox", x: 4, y: 0, w: 4, h: 4 },
  { i: "activity", x: 8, y: 0, w: 4, h: 4 },
];
const widgetIds = [
  "approvals",
  "inbox",
  "activity",
  "businesses",
  "budget",
  "agents",
];
const fingerprint = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function classify(role) {
  const technical = (
    role.match(/kod|programmer|teknik|webb|system|automat|design|utveckl/gi) ||
    []
  ).length;
  const strategic = (
    role.match(
      /ekonomi|strateg|marknad|affär|analys|research|försälj|budget/gi,
    ) || []
  ).length;
  return {
    manager: technical > strategic ? "anthropic" : "openai",
    ambiguous: technical === strategic || (technical > 0 && strategic > 0),
    reason:
      technical > strategic
        ? "Teknik och utveckling väger tyngst i rollbeskrivningen."
        : strategic > technical
          ? "Analys och verksamhetsutveckling väger tyngst i rollbeskrivningen."
          : "Uppgiften är bred. Placeringen behöver granskas.",
    instruction: `Du är en specialiserad agent. Din roll: ${role}. Svara på svenska, redovisa källor och osäkerhet. Utför inga externa åtgärder utan uttryckliga verktygsbehörigheter och ägarens godkännande.`,
    tasks: [role],
  };
}
export function registerV4(app, store, ai, vault, { database, fetchImpl }) {
  const { all, get, put, remove, activity, db } = store;
  // A restarted process cannot safely retry a potentially billed request.
  for (const job of all("delegation").filter(
    (item) => item.status === "running",
  )) {
    put("delegation", {
      ...job,
      status: "failed",
      error:
        "Servern startades om under körningen. Kontrollera leverantörens användning innan du skapar ett nytt förslag.",
      updatedAt: now(),
    });
    activity(
      "AI-körning avbruten vid omstart",
      "Ingen automatisk omkörning gjordes.",
      "warning",
    );
  }
  const ui = () =>
    all("config").find((row) => row.id === "v4-ui") || {
      id: "v4-ui",
      layout: defaultLayout,
      preferences: {
        theme: "dark",
        accent: "#315099",
        density: "normal",
        confirmations: true,
      },
    };
  const persist = (kind, data) => put(kind, { ...data, updatedAt: now() });
  function saveUI(req, res) {
    const current = ui();
    if (req.body.layout !== undefined) {
      if (!Array.isArray(req.body.layout) || req.body.layout.length > 6)
        fail("Ogiltig widgetlayout.");
      const keys = new Set();
      current.layout = req.body.layout.map((item) => {
        if (
          !widgetIds.includes(item.i) ||
          keys.has(item.i) ||
          !["x", "y", "w", "h"].every((key) => Number.isInteger(item[key])) ||
          item.x < 0 ||
          item.y < 0 ||
          item.w < 2 ||
          item.w > 12 ||
          item.h < 3 ||
          item.h > 15 ||
          item.x + item.w > 12 ||
          item.y > 1000
        )
          fail("Ogiltig widgetplacering.");
        keys.add(item.i);
        return { i: item.i, x: item.x, y: item.y, w: item.w, h: item.h };
      });
    }
    if (req.body.preferences) {
      const p = req.body.preferences;
      if (
        !["dark", "light"].includes(p.theme) ||
        !["normal", "compact"].includes(p.density) ||
        !/^#[0-9a-f]{6}$/i.test(p.accent) ||
        typeof p.confirmations !== "boolean"
      )
        fail("Ogiltigt utseende.");
      current.preferences = {
        theme: p.theme,
        density: p.density,
        accent: p.accent,
        confirmations: p.confirmations,
      };
    }
    persist("config", current);
    activity(
      "Arbetsyta anpassad",
      req.body.layout
        ? "Widgetlayouten har sparats."
        : "Utseendeinställningarna har sparats.",
    );
    res.json(current);
  }
  app.get("/api/v4/ui", (_req, res) => res.json(ui()));
  app.patch("/api/v4/ui", saveUI);
  app.post("/api/v4/ui", saveUI);
  app.patch("/api/v4/ai", (req, res) => {
    const config = ai.config();
    if (req.body.enabled !== undefined) {
      if (
        typeof req.body.enabled !== "boolean" ||
        (req.body.enabled && req.body.acceptCosts !== true)
      )
        fail("Bekräfta att AI-anrop kan medföra kostnader.");
      config.enabled = req.body.enabled;
    }
    if (req.body.garonProvider !== undefined) {
      if (!["openai", "anthropic"].includes(req.body.garonProvider))
        fail("Ogiltig leverantör.");
      config.garonProvider = req.body.garonProvider;
    }
    if (req.body.models) {
      for (const [provider, model] of Object.entries(req.body.models)) {
        if (
          !["openai", "anthropic"].includes(provider) ||
          ![
            "gpt-4.1-mini",
            "gpt-4.1",
            "claude-sonnet-4-20250514",
            "claude-sonnet-4-5-20250929",
          ].includes(model) ||
          (provider === "openai" && !model.startsWith("gpt-")) ||
          (provider === "anthropic" && !model.startsWith("claude-"))
        )
          fail("Modellen saknar godkänt pris.");
        config.models[provider] = model;
      }
    }
    put("config", { ...config, id: "ai-config" });
    activity(
      "AI-inställningar ändrade",
      config.enabled
        ? "Ägaren har aktiverat AI-anrop inom budget."
        : "AI-anrop är avstängda.",
    );
    res.json(ai.state());
  });
  app.post("/api/v4/keys/:provider", (req, res) => {
    const p = req.params.provider;
    if (!["openai", "anthropic"].includes(p)) fail("Ogiltig leverantör.");
    const key = text(req.body.key, "API-nyckeln", 1000);
    if (/[\s\x00]/.test(key)) fail("Nyckeln får inte innehålla blanksteg.");
    vault.set(p, key);
    if (all("connection").some((item) => item.id === p)) remove(p);
    activity("API-nyckel sparad", p === "openai" ? "OpenAI" : "Anthropic");
    res.json({ ok: true });
  });
  app.post("/api/v4/connection/:provider", async (req, res) => {
    const p = req.params.provider;
    if (!["openai", "anthropic"].includes(p) || !ai.key(p))
      fail("Leverantörens nyckel saknas.");
    try {
      const response = await fetchImpl(
        p === "openai"
          ? "https://api.openai.com/v1/models"
          : "https://api.anthropic.com/v1/models",
        {
          headers:
            p === "openai"
              ? { Authorization: `Bearer ${ai.key(p)}` }
              : { "x-api-key": ai.key(p), "anthropic-version": "2023-06-01" },
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok)
        fail(`Leverantören svarade med fel ${response.status}.`, 502);
      put("connection", { id: p, verifiedAt: now() });
      res.json({ ok: true, verifiedAt: now() });
    } catch (error) {
      if (error.status) throw error;
      fail("Kunde inte kontrollera anslutningen.", 502);
    }
  });
  const channel = (value) => {
    if (!["garon", "openai", "anthropic"].includes(value))
      fail("Ogiltig chatt.");
    return value;
  };
  app.post("/api/v4/drafts/:channel", (req, res) => {
    const ch = channel(req.params.channel);
    if (typeof req.body.content !== "string" || req.body.content.length > 6000)
      fail("Utkastet är för långt.");
    put("draft", {
      id: `draft-${ch}`,
      channel: ch,
      content: req.body.content,
      updatedAt: now(),
    });
    res.json({ ok: true });
  });
  app.post("/api/v4/chat/:channel", async (req, res) => {
    const ch = channel(req.params.channel);
    const message = text(req.body.message, "Meddelandet", 6000);
    ai.ready(ch);
    if (ai.state().busy) fail("Ett AI-anrop pågår redan.", 409);
    if (req.body.businessId) get("business", req.body.businessId);
    const user = put("chatMessage", {
      id: id(),
      channel: ch,
      role: "user",
      content: message,
      createdAt: now(),
    });
    try {
      const answer = await ai.complete(ch, message, {
        businessId: req.body.businessId,
      });
      const reply = put("chatMessage", {
        id: id(),
        channel: ch,
        role: "assistant",
        content: answer,
        createdAt: now(),
      });
      remove(`draft-${ch}`);
      activity(
        "AI-svar sparat",
        ch === "garon" ? "GARON" : ch === "openai" ? "ChatGPT" : "Claude",
        "success",
      );
      res.json(reply);
    } catch (error) {
      put("chatMessage", { ...user, failed: true });
      throw error;
    }
  });
  app.post("/api/v4/agents/propose", async (req, res) => {
    const name = text(req.body.name, "Namn", 80);
    const role = text(req.body.role, "Rollbeskrivning", 500);
    const base = { name, role, ...classify(role), classification: "rules" };
    if (req.body.assisted !== true) return res.json(base);
    const answer = await ai.complete(
      "garon",
      `Föreslå agentplacering för ${JSON.stringify({ name, role })}. Svara endast JSON med manager (openai för strategi/analys eller anthropic för teknik), reason, instruction (max3000 tecken), tasks (max5 strängar). Bara ett förslag, inga verktyg eller behörigheter.`,
      { isolated: true, purpose: "agent-proposal" },
    );
    let data;
    try {
      data = JSON.parse(answer.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      fail("AI-förslaget kunde inte tolkas. Ingen agent har skapats.", 502);
    }
    if (!data || !["openai", "anthropic"].includes(data.manager))
      fail("Ogiltig AI-placering. Ingen agent har skapats.", 502);
    res.json({
      ...base,
      manager: data.manager,
      reason: text(data.reason, "Motivering", 1000),
      instruction: text(data.instruction, "Instruktion", 3000),
      tasks: Array.isArray(data.tasks)
        ? data.tasks.slice(0, 5).map((item) => text(item, "Uppgift", 300))
        : base.tasks,
      classification: "ai-assisted",
      ambiguous: true,
    });
  });
  app.post("/api/v4/agents", (req, res) => {
    if (req.body.confirm !== true) fail("Granska och godkänn förslaget först.");
    const role = text(req.body.role, "Rollbeskrivning", 500);
    const suggestion = classify(role);
    if (!["openai", "anthropic"].includes(req.body.manager))
      fail("Välj mellanchef.");
    const businessIds = req.body.businessIds || [];
    if (!Array.isArray(businessIds) || businessIds.length > 100)
      fail("Ogiltiga verksamheter.");
    for (const key of businessIds) get("business", key);
    const item = put("agent", {
      id: id(),
      name: text(req.body.name, "Namn", 80),
      role,
      manager: req.body.manager,
      instruction: text(
        req.body.instruction || suggestion.instruction,
        "Instruktion",
        6000,
      ),
      businessIds: [...new Set(businessIds)],
      enabled: true,
      tools: [],
      createdAt: now(),
    });
    activity("Agentkonfiguration skapad", item.name);
    res.status(201).json(item);
  });
  app.patch("/api/v4/agents/:id", (req, res) => {
    const item = get("agent", req.params.id);
    if (req.body.name !== undefined)
      item.name = text(req.body.name, "Namn", 80);
    if (req.body.role !== undefined)
      item.role = text(req.body.role, "Roll", 500);
    if (req.body.instruction !== undefined)
      item.instruction = text(req.body.instruction, "Instruktion", 6000);
    if (req.body.manager !== undefined) {
      if (!["openai", "anthropic"].includes(req.body.manager))
        fail("Välj mellanchef.");
      item.manager = req.body.manager;
    }
    if (req.body.enabled !== undefined) {
      if (typeof req.body.enabled !== "boolean") fail("Ogiltig status.");
      item.enabled = req.body.enabled;
    }
    if (req.body.businessIds !== undefined) {
      if (!Array.isArray(req.body.businessIds))
        fail("Ogiltig verksamhetslista.");
      for (const key of req.body.businessIds) get("business", key);
      item.businessIds = [...new Set(req.body.businessIds)];
    }
    item.tools = [];
    persist("agent", item);
    activity("Agentkonfiguration uppdaterad", item.name);
    res.json(item);
  });
  app.delete("/api/v4/agents/:id", (req, res) => {
    const item = get("agent", req.params.id);
    if (req.body.confirm !== true) fail("Bekräfta borttagning.");
    remove(item.id);
    activity("Agentkonfiguration borttagen", item.name);
    res.json({ ok: true });
  });
  app.post("/api/v4/memory", (req, res) => {
    const content = text(req.body.content, "Minnespost", 6000);
    if (!["private", "shared"].includes(req.body.visibility))
      fail("Välj åtkomst.");
    if (req.body.businessId) get("business", req.body.businessId);
    if (
      all("memory").some(
        (row) =>
          row.content.trim().toLocaleLowerCase("sv") ===
            content.toLocaleLowerCase("sv") &&
          (row.businessId || null) === (req.body.businessId || null),
      )
    )
      fail("Minnesposten finns redan.", 409);
    const item = put("memory", {
      id: id(),
      title: text(req.body.title, "Rubrik", 160),
      content,
      visibility: req.body.visibility,
      businessId: req.body.businessId || null,
      source: text(req.body.source || "Ägaren", "Källa", 300),
      verified: req.body.verified === true,
      createdAt: now(),
    });
    activity("Minnespost sparad", item.title);
    res.status(201).json(item);
  });
  app.patch("/api/v4/memory/:id", (req, res) => {
    const item = get("memory", req.params.id);
    const next = {
      ...item,
      title: text(req.body.title, "Rubrik", 160),
      content: text(req.body.content, "Minne", 6000),
      source: text(req.body.source, "Källa", 300),
      verified: req.body.verified === true,
    };
    if (!["private", "shared"].includes(req.body.visibility))
      fail("Välj åtkomst.");
    next.visibility = req.body.visibility;
    if (req.body.businessId) get("business", req.body.businessId);
    next.businessId = req.body.businessId || null;
    if (
      all("memory").some(
        (row) =>
          row.id !== next.id &&
          row.content.trim().toLocaleLowerCase("sv") ===
            next.content.toLocaleLowerCase("sv") &&
          (row.businessId || null) === next.businessId,
      )
    )
      fail("Minnesposten finns redan.", 409);
    persist("memory", next);
    activity("Minnespost uppdaterad", next.title);
    res.json(next);
  });
  app.delete("/api/v4/memory/:id", (req, res) => {
    const item = get("memory", req.params.id);
    if (req.body.confirm !== true) fail("Bekräfta borttagning.");
    remove(item.id);
    activity("Minnespost borttagen", item.title);
    res.json({ ok: true });
  });
  app.post("/api/v4/approvals", (req, res) => {
    if (req.body.businessId) get("business", req.body.businessId);
    const item = put("approval", {
      id: id(),
      title: text(req.body.title, "Åtgärd", 160),
      description: text(req.body.description, "Beskrivning", 6000),
      proposedBy: "Ägaren",
      businessId: req.body.businessId || null,
      risk: text(
        req.body.risk || "Ingen extern åtgärd har kopplats.",
        "Risk",
        1000,
      ),
      estimatedCost: 0,
      action: { type: "proposal" },
      status: "pending",
      createdAt: now(),
    });
    activity("Beslut föreslaget", item.title, "warning");
    res.status(201).json(item);
  });
  app.post("/api/v4/approvals/:id/decision", (req, res) => {
    const item = get("approval", req.params.id);
    if (item.status !== "pending") fail("Beslutet är redan behandlat.", 409);
    if (!["approve", "reject"].includes(req.body.decision))
      fail("Ogiltigt beslut.");
    persist("approval", {
      ...item,
      status: req.body.decision === "approve" ? "approved" : "rejected",
      decidedAt: now(),
    });
    activity(
      "Beslut behandlat",
      item.title,
      req.body.decision === "approve" ? "success" : "warning",
    );
    res.json({ ok: true });
  });
  app.post("/api/v4/delegations", (req, res) => {
    if (!["openai", "anthropic"].includes(req.body.manager))
      fail("Välj mellanchef.");
    const prompt = text(req.body.prompt, "Delegeringsunderlag", 6000);
    if (req.body.businessId) get("business", req.body.businessId);
    if (req.body.agentId) {
      const agent = get("agent", req.body.agentId);
      if (!agent.enabled || agent.manager !== req.body.manager)
        fail("Agentens status eller mellanchef stämmer inte.");
    }
    const job = put("delegation", {
      id: id(),
      prompt,
      manager: req.body.manager,
      businessId: req.body.businessId || null,
      agentId: req.body.agentId || null,
      agentHash: req.body.agentId
        ? fingerprint(get("agent", req.body.agentId))
        : null,
      status: "proposed",
      createdAt: now(),
    });
    const approval = put("approval", {
      id: id(),
      title: "Delegera AI-analys",
      description: prompt,
      proposedBy: "Ägaren via GARON",
      businessId: job.businessId,
      risk: "Ett betalt API-anrop med det granskade underlaget. Privat GARON-historik skickas inte med.",
      estimatedCost: null,
      status: "pending",
      action: {
        type: "delegation",
        resourceId: job.id,
        hash: fingerprint(job),
      },
      createdAt: now(),
    });
    put("delegation", { ...job, approvalId: approval.id });
    activity(
      "AI-delegering föreslagen",
      `Underlaget väntar på godkännande för ${req.body.manager === "openai" ? "ChatGPT" : "Claude"}.`,
      "warning",
    );
    res.status(201).json(job);
  });
  app.post("/api/v4/delegations/:id/run", async (req, res) => {
    const job = get("delegation", req.params.id);
    const approval = get("approval", job.approvalId);
    if (
      job.status !== "proposed" ||
      approval.status !== "approved" ||
      approval.action.type !== "delegation" ||
      approval.action.resourceId !== job.id
    )
      fail("Ett giltigt, oanvänt godkännande krävs.", 403);
    const { approvalId, ...original } = job;
    if (approval.action.hash !== fingerprint(original))
      fail("Underlaget har ändrats. Ett nytt godkännande krävs.", 403);
    if (job.agentId) {
      const agent = get("agent", job.agentId);
      if (
        !agent.enabled ||
        agent.manager !== job.manager ||
        fingerprint(agent) !== job.agentHash
      )
        fail("Agenten har ändrats. Skapa en ny delegering.", 409);
    }
    ai.ready(job.manager);
    if (ai.state().busy) fail("Ett AI-anrop pågår redan.", 409);
    put("delegation", { ...job, status: "running" });
    put("approval", { ...approval, status: "consumed", consumedAt: now() });
    try {
      const result = await ai.complete(job.manager, job.prompt, {
        isolated: true,
        agentId: job.agentId,
        purpose: "delegation",
      });
      persist("delegation", { ...job, status: "done", result });
      put("inbox", {
        id: id(),
        title: "Delegerad AI-analys är klar",
        content: result,
        source: job.agentId
          ? all("agent").find((agent) => agent.id === job.agentId)?.name ||
            "Tidigare agentroll"
          : job.manager === "openai"
            ? "ChatGPT"
            : "Claude",
        read: false,
        createdAt: now(),
      });
      put("chatMessage", {
        id: id(),
        channel: job.manager,
        role: "assistant",
        content: `Resultat från delegerat uppdrag:\n${result}`,
        createdAt: now(),
      });
      activity(
        "AI-delegering slutförd",
        job.manager === "openai" ? "ChatGPT" : "Claude",
        "success",
      );
      res.json({ result });
    } catch (error) {
      persist("delegation", {
        ...job,
        status: "failed",
        error: "Anropet misslyckades; se anslutning och budget.",
      });
      throw error;
    }
  });
  app.post("/api/v4/schedules", (req, res) => {
    const dueAt = new Date(req.body.dueAt);
    if (!Number.isFinite(dueAt.getTime()) || dueAt.getTime() <= Date.now())
      fail("Välj en framtida tidpunkt.");
    if (!["reminder", "task"].includes(req.body.type))
      fail("Välj intern påminnelse eller uppgift.");
    const item = put("schedule", {
      id: id(),
      title: text(req.body.title, "Rubrik", 160),
      dueAt: dueAt.toISOString(),
      type: req.body.type,
      status: "pending",
      createdAt: now(),
    });
    activity("Intern aktivitet schemalagd", item.title);
    res.status(201).json(item);
  });
  app.patch("/api/v4/schedules/:id", (req, res) => {
    const item = get("schedule", req.params.id);
    if (item.status !== "pending") fail("Objektet är redan behandlat.", 409);
    if (req.body.cancel === true) item.status = "cancelled";
    else {
      item.title = text(req.body.title, "Rubrik", 160);
      const date = new Date(req.body.dueAt);
      if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now())
        fail("Välj en framtida tid.");
      item.dueAt = date.toISOString();
    }
    persist("schedule", item);
    activity("Schemalagt objekt uppdaterat", item.title);
    res.json(item);
  });
  app.patch("/api/v4/inbox/:id", (req, res) => {
    const item = get("inbox", req.params.id);
    put("inbox", { ...item, read: true });
    res.json({ ok: true });
  });
  app.post("/api/v4/projects", (req, res) => {
    get("business", req.body.businessId);
    const item = put("project", {
      id: id(),
      businessId: req.body.businessId,
      name: text(req.body.name, "Projektnamn", 160),
      description:
        typeof req.body.description === "string"
          ? req.body.description.slice(0, 3000)
          : "",
      createdAt: now(),
    });
    activity("Projekt skapat", item.name);
    res.status(201).json(item);
  });
  app.post("/api/v4/business-plan", async (req, res) => {
    const idea = text(req.body.idea, "Affärsidé", 3000);
    const result = await ai.complete(
      "garon",
      `Föreslå en verksamhet för följande idé. Svara endast JSON med name (max100), description(max1500), sections (lista av id,title,view; tillåtna vyer overview,tasks,agents,projects), workAreas (max5 korta strängar), tasks (max5 föreslagna uppdrag), agents (max5 föreslagna roller), template (en av general,services,commerce,project), visualStyle (kort beskrivning). Skapa inget. Idé: ${idea}`,
      { purpose: "business-plan" },
    );
    let data;
    try {
      data = JSON.parse(result.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    } catch {
      fail(
        "AI-förslaget kunde inte tolkas. Ingen verksamhet har skapats.",
        502,
      );
    }
    const name = text(data.name, "Namn", 100);
    const description = text(data.description, "Beskrivning", 1500);
    const list = (key) =>
      Array.isArray(data[key])
        ? data[key]
            .filter((item) => typeof item === "string")
            .slice(0, 5)
            .map((item) => item.slice(0, 300))
        : [];
    res.json({
      name,
      description,
      workAreas: list("workAreas"),
      tasks: list("tasks"),
      agents: list("agents"),
      template: ["general", "services", "commerce", "project"].includes(
        data.template,
      )
        ? data.template
        : "general",
      visualStyle:
        typeof data.visualStyle === "string"
          ? data.visualStyle.slice(0, 500)
          : "",
      sections: [
        { id: "overview", title: "Översikt", view: "overview" },
        ...(Array.isArray(data.sections)
          ? data.sections
              .filter(
                (row, index, rows) =>
                  row &&
                  ["tasks", "agents", "projects"].includes(row.id) &&
                  row.id === row.view &&
                  rows.findIndex((other) => other?.id === row.id) === index,
              )
              .slice(0, 3)
              .map((row) => ({
                id: row.id,
                view: row.view,
                title:
                  row.id === "tasks"
                    ? "Uppdrag"
                    : row.id === "agents"
                      ? "Agenter"
                      : "Projekt",
              }))
          : []),
      ],
    });
  });
  app.get("/api/v4/export", (_req, res) => {
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="garon4-backup.json"',
    );
    res.json({
      format: "garon-backup-v1",
      exportedAt: now(),
      entities: db
        .prepare("SELECT id,kind,data FROM entities")
        .all()
        .filter((row) => row.id !== "ai-config")
        .map((row) => ({ ...row, data: JSON.parse(row.data) })),
      settings: store.settings(),
    });
  });
  app.post("/api/v4/import", (req, res) => {
    if (
      req.body.backup &&
      !req.body.backup.format &&
      Array.isArray(req.body.backup.tasks)
    ) {
      const old = req.body.backup;
      req.body.backup = {
        format: "garon-backup-v1",
        settings: old.settings,
        entities: Object.entries({
          business: "businesses",
          task: "tasks",
          agent: "agents",
          note: "notes",
          message: "messages",
          usage: "usage",
          activity: "activity",
        }).flatMap(([kind, key]) =>
          (Array.isArray(old[key]) ? old[key] : []).map((data) => ({
            id: data.id,
            kind,
            data,
          })),
        ),
      };
    }
    if (
      req.body.confirm !== true ||
      req.body.backup?.format !== "garon-backup-v1" ||
      !Array.isArray(req.body.backup.entities) ||
      req.body.backup.entities.length > 10000
    )
      fail("Välj en giltig GARON-säkerhetskopia och bekräfta importen.");
    const parsed = parseBackupRows(req.body.backup.entities);
    let count = 0;
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const row of parsed) {
        if (db.prepare("SELECT id FROM entities WHERE id=?").get(row.id))
          continue;
        put(row.kind, row.data);
        count++;
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    activity(
      "Säkerhetskopia importerad",
      `${count} nya poster. Befintliga poster skrevs inte över.`,
    );
    res.json({ imported: count });
  });
  app.post("/api/v4/backup", async (_req, res) => {
    if (database === ":memory:") fail("Filbaserad databas krävs.");
    const directory = join(dirname(database), "backups");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const name = `garon-${Date.now()}.sqlite`;
    await backup(db, join(directory, name));
    chmodSync(join(directory, name), 0o600);
    activity("Databasen säkerhetskopierad", name);
    res.json({ file: name });
  });
  const tick = () => {
    for (const item of all("schedule").filter(
      (row) =>
        row.status === "pending" && new Date(row.dueAt).getTime() <= Date.now(),
    )) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const current = get("schedule", item.id);
        if (current.status === "pending") {
          put("inbox", {
            id: `schedule-${item.id}`,
            title: item.title,
            content: "Din schemalagda interna aktivitet har förfallit.",
            source: "Intern schemaläggare",
            read: false,
            createdAt: now(),
          });
          if (item.type === "task")
            put("task", {
              id: `task-${item.id}`,
              title: item.title,
              description:
                "Skapad av den interna schemaläggaren. Ingen AI körs.",
              status: "pending",
              priority: "normal",
              agentId: null,
              createdAt: now(),
              updatedAt: now(),
            });
          put("schedule", { ...current, status: "done", completedAt: now() });
          activity("Intern påminnelse levererad", item.title);
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
  };
  return { ui, tick };
}
