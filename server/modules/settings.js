import { fail, text, statuses, id, now } from "../core/validation.js";
export function register(app, store) {
  const { all, get, put, remove, settings, saveSettings, activity } = store;
  app.patch("/api/settings", (req, res) => {
    const next = settings();
    if (req.body.budget !== undefined) {
      if (
        typeof req.body.budget !== "number" ||
        !Number.isFinite(req.body.budget) ||
        req.body.budget < 0 ||
        req.body.budget > 10000
      )
        fail("Budgeten måste vara mellan 0 och 10 000 USD.");
      next.budget = req.body.budget;
    }
    if (req.body.name !== undefined)
      next.name = text(req.body.name, "Ditt namn", 60);
    saveSettings(next);
    res.json(next);
  });
}
