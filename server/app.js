import express from "express";
import { resolve } from "node:path";
import { createStore } from "./storage/store.js";
import { now } from "./core/validation.js";
import { registerChat } from "./core/chat.js";
import { registerHttpPolicy } from "./policies/http.js";
import { register as registerTasks } from "./modules/tasks.js";
import { register as registerAgents } from "./modules/agents.js";
import { register as registerMemory } from "./modules/memory.js";
import { register as registerSettings } from "./modules/settings.js";

// Runtime AI is disabled by default, independently of credentials or frontend controls.
// allowAI is an internal test seam, never sourced from environment or request data.
export function createApp({
  database = ".garon/garon.sqlite",
  env = process.env,
  fetchImpl = fetch,
  allowAI = false,
} = {}) {
  const store = createStore(database);
  const { all, settings } = store;
  const app = express();
  registerHttpPolicy(app);
  const chat = registerChat(app, store, { env, fetchImpl, allowAI });
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, storage: "sqlite" }),
  );
  app.get("/api/state", (_req, res) =>
    res.json({
      tasks: all("task"),
      agents: all("agent"),
      notes: all("note"),
      activity: all("activity").slice(0, 200),
      messages: all("message").reverse(),
      usage: all("usage"),
      settings: settings(),
      ai: chat.state(),
    }),
  );
  registerTasks(app, store);
  registerAgents(app, store);
  registerMemory(app, store);
  registerSettings(app, store);
  app.get("/api/export", (_req, res) => {
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="garon-export.json"',
    );
    res.json({
      exportedAt: now(),
      tasks: all("task"),
      agents: all("agent"),
      notes: all("note"),
      messages: all("message").reverse(),
      activity: all("activity"),
      usage: all("usage"),
      settings: settings(),
    });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API-sökvägen finns inte." }),
  );
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (_req, res, next) =>
    res.sendFile(resolve("dist/index.html"), (error) => error && next(error)),
  );
  app.use((error, _req, res, _next) =>
    res
      .status(error.status || 500)
      .json({
        error: error.status ? error.message : "Ett oväntat serverfel uppstod.",
      }),
  );
  return { app, close: store.close };
}
