import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";

async function fixture(options = {}) {
  const { app, close } = createApp({
    database: ":memory:",
    env: {},
    ...options,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    async call(
      path,
      data,
      method = data === undefined ? "GET" : "POST",
      headers = {},
    ) {
      const response = await fetch(`${base}/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
      return { status: response.status, data: await response.json() };
    },
    async close() {
      await new Promise((resolve) => server.close(resolve));
      close();
    },
  };
}

test("uppdrag, beslut, agentroll och minne fungerar tillsammans", async (t) => {
  const f = await fixture();
  t.after(() => f.close());
  assert.equal((await f.call("/state")).data.tasks.length, 0);
  const agent = await f.call("/agents", {
    name: "Research",
    role: "Undersöka idéer",
  });
  assert.equal(agent.status, 201);
  const created = await f.call("/tasks", {
    title: "Undersök en idé",
    description: "Skriv en plan",
    agentId: agent.data.id,
    requiresApproval: true,
  });
  assert.equal(created.data.status, "approval");
  assert.equal(
    (await f.call(`/tasks/${created.data.id}`, { status: "running" }, "PATCH"))
      .status,
    400,
  );
  assert.equal(
    (
      await f.call(`/tasks/${created.data.id}/decision`, {
        decision: "approve",
      })
    ).data.status,
    "pending",
  );
  assert.equal(
    (
      await f.call(`/tasks/${created.data.id}/decision`, {
        decision: "approve",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await f.call(
        `/tasks/${created.data.id}`,
        { status: "done", description: "" },
        "PATCH",
      )
    ).data.status,
    "done",
  );
  const rejected = await f.call("/tasks", {
    title: "Avslå detta",
    requiresApproval: true,
  });
  assert.equal(
    (
      await f.call(`/tasks/${rejected.data.id}/decision`, {
        decision: "reject",
      })
    ).data.status,
    "cancelled",
  );
  const note = await f.call("/notes", {
    title: "Projektidé",
    content: "Kunskap som ska finnas kvar.",
  });
  assert.equal(note.status, 201);
  assert.equal(
    (await f.call("/state")).data.notes[0].content,
    "Kunskap som ska finnas kvar.",
  );
  assert.equal(
    (await f.call(`/agents/${agent.data.id}`, { enabled: false }, "PATCH")).data
      .enabled,
    false,
  );
  const exported = await f.call("/export");
  assert.equal(exported.data.tasks.length, 2);
  assert.ok(exported.data.activity.length >= 6);
  assert.equal(
    (await f.call(`/notes/${note.data.id}`, {}, "DELETE")).status,
    200,
  );
  assert.equal(
    (await f.call(`/tasks/${created.data.id}`, {}, "DELETE")).status,
    200,
  );
});

test("validering och främmande webbplatser blockeras", async (t) => {
  const f = await fixture();
  t.after(() => f.close());
  assert.equal((await f.call("/tasks", { title: "   " })).status, 400);
  assert.equal(
    (await f.call("/tasks", { title: "Test", priority: "root" })).status,
    400,
  );
  assert.equal(
    (await f.call("/tasks", { title: "Test", agentId: "missing" })).status,
    404,
  );
  assert.equal(
    (await f.call("/settings", { budget: -1 }, "PATCH")).status,
    400,
  );
  assert.equal(
    (await f.call("/settings", { budget: "100" }, "PATCH")).status,
    400,
  );
  assert.equal(
    (
      await f.call("/tasks", { title: "Främmande" }, "POST", {
        Origin: "https://evil.example",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await f.call("/tasks", { title: "Främmande" }, "POST", {
        "Sec-Fetch-Site": "cross-site",
      })
    ).status,
    403,
  );
  assert.equal((await f.call("/chat", { message: "Hej" })).status, 403);
});

test("SQLite-data finns kvar efter omstart", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "garon-test-"));
  const database = join(dir, "test.sqlite");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const first = await fixture({ database });
  await first.call("/tasks", { title: "Beständigt uppdrag" });
  await first.call("/settings", { budget: 4, name: "Dahir" }, "PATCH");
  await first.close();
  const second = await fixture({ database });
  t.after(() => second.close());
  const state = (await second.call("/state")).data;
  assert.equal(state.tasks[0].title, "Beständigt uppdrag");
  assert.equal(state.settings.budget, 4);
});

test("simulerade leverantörssvar sparas och budgeten spärrar nästa anrop", async (t) => {
  let calls = 0;
  const f = await fixture({
    allowAI: true,
    env: { OPENAI_API_KEY: "test-only" },
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, "https://api.openai.com/v1/chat/completions");
      const body = JSON.parse(options.body);
      assert.equal(body.messages.at(-1).content, "Hej GARON");
      return Response.json({
        choices: [{ message: { content: "Hej Dahir! Vad vill du planera?" } }],
        usage: { prompt_tokens: 100, completion_tokens: 20 },
      });
    },
  });
  t.after(() => f.close());
  assert.equal((await f.call("/chat", { message: "Hej GARON" })).status, 200);
  const state = (await f.call("/state")).data;
  assert.equal(state.messages.length, 2);
  assert.equal(state.messages[1].role, "assistant");
  assert.equal(state.usage[0].estimated, false);
  assert.ok(Math.abs(state.ai.spent - 0.000072) < 1e-12);
  await f.call("/settings", { budget: 0 }, "PATCH");
  assert.equal(
    (await f.call("/chat", { message: "Får inte skickas" })).status,
    402,
  );
  assert.equal(calls, 1);
  assert.ok(!JSON.stringify(state).includes("test-only"));
});

test("Anthropic-format och nätverksfel verifieras med simulerad transport", async (t) => {
  let options;
  const f = await fixture({
    allowAI: true,
    env: { ANTHROPIC_API_KEY: "test-only" },
    fetchImpl: async (_url, config) => {
      options = JSON.parse(config.body);
      return Response.json({
        content: [{ type: "text", text: "En riktig testrespons" }],
        usage: { input_tokens: 80, output_tokens: 20 },
      });
    },
  });
  t.after(() => f.close());
  assert.equal(
    (await f.call("/chat", { message: "Hej" })).data.content,
    "En riktig testrespons",
  );
  assert.equal(options.model, "claude-sonnet-4-20250514");
  assert.ok(options.system.includes("inga verktyg"));
  const broken = await fixture({
    allowAI: true,
    env: { OPENAI_API_KEY: "test-only" },
    fetchImpl: async () => {
      throw new Error("Network");
    },
  });
  t.after(() => broken.close());
  assert.equal((await broken.call("/chat", { message: "Hej" })).status, 502);
  const state = (await broken.call("/state")).data;
  assert.equal(state.messages.length, 0);
  assert.equal(state.usage[0].estimated, true);
  assert.ok(state.ai.spent > 0);
});

test("Fas 1 spärrar AI på servern även med nyckel och manipulerad begäran", async (t) => {
  let calls = 0;
  const f = await fixture({
    env: { OPENAI_API_KEY: "test-only", GARON_AI_ENABLED: "true" },
    fetchImpl: async () => {
      calls++;
      throw new Error("Must never call");
    },
  });
  t.after(() => f.close());
  const before = (await f.call("/state")).data;
  assert.equal(before.ai.configured, true);
  assert.equal(before.ai.enabled, false);
  const response = await f.call("/chat", {
    message: "Skicka inte",
    allowAI: true,
    enabled: true,
  });
  assert.equal(response.status, 403);
  assert.match(response.data.error, /spärrade/);
  const after = (await f.call("/state")).data;
  assert.equal(calls, 0);
  assert.deepEqual(after.messages, before.messages);
  assert.deepEqual(after.usage, before.usage);
  assert.deepEqual(after.activity, before.activity);
});

test("Fas 1 läser tidigare databasformat utan att skriva om poster eller schema", async (t) => {
  const { DatabaseSync } = await import("node:sqlite");
  const dir = mkdtempSync(join(tmpdir(), "garon-legacy-"));
  const database = join(dir, "old.sqlite");
  const legacy = new DatabaseSync(database);
  legacy.exec(
    `CREATE TABLE entities (id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL); CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);`,
  );
  legacy
    .prepare("INSERT INTO settings VALUES (1,?)")
    .run(JSON.stringify({ name: "Dahir", budget: 7 }));
  const rows = [
    [
      "task",
      {
        id: "t1",
        title: "Bevarat uppdrag",
        description: "Original",
        status: "approval",
        priority: "high",
        agentId: "a1",
        createdAt: "2026-10-17T10:00:00Z",
        updatedAt: "2026-10-17T10:00:00Z",
      },
    ],
    [
      "agent",
      {
        id: "a1",
        name: "Research",
        role: "Analys",
        enabled: true,
        createdAt: "2026-10-17T10:00:00Z",
      },
    ],
    [
      "note",
      {
        id: "n1",
        title: "Gammalt minne",
        content: "Ska bevaras",
        createdAt: "2026-10-17T10:00:00Z",
      },
    ],
    [
      "message",
      {
        id: "m1",
        role: "assistant",
        content: "Tidigare svar",
        createdAt: "2026-10-17T10:00:00Z",
      },
    ],
    [
      "usage",
      {
        id: "u1",
        model: "gpt-4.1-mini",
        cost: 0.01,
        estimated: false,
        inputTokens: 20,
        outputTokens: 10,
        createdAt: "2026-10-17T10:00:00Z",
      },
    ],
    [
      "activity",
      {
        id: "e1",
        title: "Tidigare aktivitet",
        detail: "Bevaras",
        type: "info",
        createdAt: "2026-10-17T10:00:00Z",
      },
    ],
  ];
  for (const [kind, row] of rows)
    legacy
      .prepare("INSERT INTO entities VALUES (?,?,?)")
      .run(row.id, kind, JSON.stringify(row));
  const snapshot = legacy.prepare("SELECT * FROM entities ORDER BY id").all();
  const schema = legacy
    .prepare(
      "SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name",
    )
    .all();
  legacy.close();
  const f = await fixture({ database });
  try {
    const state = (await f.call("/state")).data;
    assert.equal(state.tasks[0].id, "t1");
    assert.equal(state.tasks[0].status, "approval");
    assert.equal(state.messages[0].content, "Tidigare svar");
    assert.equal(state.settings.budget, 7);
    const exported = (await f.call("/export")).data;
    assert.equal(exported.notes[0].content, "Ska bevaras");
    assert.equal(exported.agents[0].id, "a1");
  } finally {
    await f.close();
  }
  const check = new DatabaseSync(database, { readOnly: true });
  assert.deepEqual(
    check.prepare("SELECT * FROM entities ORDER BY id").all(),
    snapshot,
  );
  assert.deepEqual(
    check
      .prepare(
        "SELECT name,sql FROM sqlite_master WHERE type='table' AND name!='schema_migrations' ORDER BY name",
      )
      .all(),
    schema,
  );
  check.close();
  rmSync(dir, { recursive: true, force: true });
});

test("verksamheter skapas tomt, kan redigeras och tas bara bort efter bekräftelse", async (t) => {
  const f = await fixture();
  t.after(() => f.close());
  assert.deepEqual((await f.call("/state")).data.businesses, []);
  const task = (await f.call("/tasks", { title: "Befintligt uppdrag" })).data;
  const created = await f.call("/businesses", {
    name: " Min studio ",
    description: " Kreativt arbete ",
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.name, "Min studio");
  assert.deepEqual(created.data.sections, [
    { id: "overview", title: "Översikt", view: "overview" },
  ]);
  const update = await f.call(
    `/businesses/${created.data.id}`,
    {
      name: "Studio Nova",
      description: "",
      sections: [
        { id: "overview", title: "Översikt", view: "overview" },
        { id: "research", title: "Min research", view: "future-research" },
      ],
    },
    "PATCH",
  );
  assert.equal(update.status, 200);
  assert.equal(update.data.sections[1].title, "Min research");
  assert.equal(
    (await f.call("/businesses", { name: "studio nova" })).status,
    409,
  );
  assert.equal((await f.call("/businesses", { name: " " })).status, 400);
  assert.equal(
    (
      await f.call(
        `/businesses/${created.data.id}`,
        {
          sections: [
            { id: "x", title: "A", view: "overview" },
            { id: "x", title: "B", view: "overview" },
          ],
        },
        "PATCH",
      )
    ).status,
    400,
  );
  assert.equal(
    (await f.call(`/businesses/${created.data.id}`, {}, "DELETE")).status,
    400,
  );
  assert.equal((await f.call("/state")).data.businesses.length, 1);
  assert.equal(
    (
      await f.call(
        `/businesses/${created.data.id}`,
        { confirm: true },
        "DELETE",
      )
    ).status,
    200,
  );
  const state = (await f.call("/state")).data;
  assert.equal(state.businesses.length, 0);
  assert.equal(state.tasks[0].id, task.id);
  assert.ok(
    state.activity.some((event) => event.title === "Verksamhet borttagen"),
  );
});

test("verksamhetsmetadata och manuella anteckningar överlever en serveromstart", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "garon3-persist-"));
  const database = join(dir, "data.sqlite");
  const first = await fixture({ database });
  const business = (
    await first.call("/businesses", {
      name: "Ateljén",
      description: "Mitt arbete",
    })
  ).data;
  const note = (
    await first.call("/notes", {
      title: "Ett mål",
      content: "Bygg långsiktigt.",
    })
  ).data;
  assert.equal(
    (
      await first.call(
        `/notes/${note.id}`,
        { title: "Ett uppdaterat mål", content: "Ta ett steg i taget." },
        "PATCH",
      )
    ).status,
    200,
  );
  await first.close();
  const second = await fixture({ database });
  try {
    const state = (await second.call("/state")).data;
    assert.equal(state.businesses[0].id, business.id);
    assert.equal(state.businesses[0].description, "Mitt arbete");
    assert.equal(state.notes[0].content, "Ta ett steg i taget.");
    assert.equal(state.ai.enabled, false);
    const exported = (await second.call("/export")).data;
    assert.equal(exported.businesses[0].name, "Ateljén");
    assert.equal(exported.notes[0].title, "Ett uppdaterat mål");
  } finally {
    await second.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("leverantörsstatus visar båda konfigurationerna utan att exponera nycklar", async (t) => {
  const f = await fixture({
    env: {
      OPENAI_API_KEY: "fake-openai-value",
      ANTHROPIC_API_KEY: "fake-anthropic-value",
    },
  });
  t.after(() => f.close());
  const state = (await f.call("/state")).data;
  assert.equal(state.ai.providers.length, 2);
  assert.ok(state.ai.providers.every((provider) => provider.configured));
  assert.equal(state.ai.enabled, false);
  assert.ok(!JSON.stringify(state).includes("fake-openai-value"));
  assert.ok(!JSON.stringify(state).includes("fake-anthropic-value"));
});
