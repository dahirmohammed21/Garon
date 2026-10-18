import { fail, text, statuses, id, now } from "../core/validation.js";
export function register(app, store) {
  const { all, get, put, remove, settings, saveSettings, activity } = store;
  app.post("/api/tasks", (req, res) => {
    const title = text(req.body.title, "Uppdragets namn", 160);
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim().slice(0, 3000)
        : "";
    const priority = req.body.priority || "normal";
    if (!["low", "normal", "high"].includes(priority))
      fail("Ogiltig prioritet.");
    if (req.body.agentId) get("agent", req.body.agentId);
    if (req.body.businessId) get("business", req.body.businessId);
    if (req.body.projectId) {
      const project = get("project", req.body.projectId);
      if (project.businessId !== req.body.businessId)
        fail("Projektet tillhör en annan verksamhet.");
    }
    const task = put("task", {
      id: id(),
      title,
      description,
      priority,
      agentId: req.body.agentId || null,
      businessId: req.body.businessId || null,
      projectId: req.body.projectId || null,
      status: req.body.requiresApproval ? "approval" : "pending",
      createdAt: now(),
      updatedAt: now(),
    });
    activity(
      "Nytt uppdrag",
      title,
      task.status === "approval" ? "warning" : "info",
    );
    res.status(201).json(task);
  });
  app.patch("/api/tasks/:id", (req, res) => {
    const task = get("task", req.params.id);
    if (req.body.status !== undefined) {
      if (!statuses.includes(req.body.status) || req.body.status === "approval")
        fail("Ogiltig uppdragsstatus.");
      if (task.status === "approval")
        fail("Uppdraget måste godkännas eller avslås först.");
      task.status = req.body.status;
    }
    if (req.body.title !== undefined)
      task.title = text(req.body.title, "Uppdragets namn", 160);
    if (req.body.description !== undefined) {
      if (
        typeof req.body.description !== "string" ||
        req.body.description.length > 3000
      )
        fail("Beskrivningen får innehålla högst 3 000 tecken.");
      task.description = req.body.description.trim();
    }
    task.updatedAt = now();
    put("task", task);
    activity(
      "Uppdrag uppdaterat",
      task.title,
      task.status === "done" ? "success" : "info",
    );
    res.json(task);
  });
  app.post("/api/tasks/:id/decision", (req, res) => {
    const task = get("task", req.params.id);
    if (task.status !== "approval")
      fail("Uppdraget väntar inte på godkännande.", 409);
    if (!["approve", "reject"].includes(req.body.decision))
      fail("Välj godkänn eller avslå.");
    task.status = req.body.decision === "approve" ? "pending" : "cancelled";
    task.updatedAt = now();
    put("task", task);
    activity(
      req.body.decision === "approve" ? "Uppdrag godkänt" : "Uppdrag avslaget",
      task.title,
      req.body.decision === "approve" ? "success" : "warning",
    );
    res.json(task);
  });
  app.delete("/api/tasks/:id", (req, res) => {
    const task = get("task", req.params.id);
    remove(task.id);
    activity("Uppdrag borttaget", task.title);
    res.json({ ok: true });
  });
}
