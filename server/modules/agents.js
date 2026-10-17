import { fail, text, statuses, id, now } from "../core/validation.js";
export function register(app, store) {
  const { all, get, put, remove, settings, saveSettings, activity } = store;
  app.post("/api/agents", (req, res) => {
    const agent = put("agent", {
      id: id(),
      name: text(req.body.name, "Agentens namn", 80),
      role: text(req.body.role, "Agentens roll", 500),
      enabled: true,
      createdAt: now(),
    });
    activity("Agentkonfiguration skapad", agent.name);
    res.status(201).json(agent);
  });
  app.patch("/api/agents/:id", (req, res) => {
    const agent = get("agent", req.params.id);
    if (typeof req.body.enabled !== "boolean")
      fail("Ange om agenten är aktiverad.");
    agent.enabled = req.body.enabled;
    put("agent", agent);
    activity(
      agent.enabled
        ? "Agentkonfiguration aktiverad"
        : "Agentkonfiguration pausad",
      agent.name,
    );
    res.json(agent);
  });
}
