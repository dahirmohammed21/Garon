import { fail, text, statuses, id, now } from "../core/validation.js";
export function register(app, store) {
  const { all, get, put, remove, settings, saveSettings, activity } = store;
  app.post("/api/notes", (req, res) => {
    const note = put("note", {
      id: id(),
      title: text(req.body.title, "Rubrik", 160),
      content: text(req.body.content, "Anteckning", 10000),
      createdAt: now(),
    });
    activity("Minne sparat", note.title, "success");
    res.status(201).json(note);
  });
  app.patch("/api/notes/:id", (req, res) => {
    const note = get("note", req.params.id);
    const updated = {
      ...note,
      title: text(req.body.title, "Rubrik", 160),
      content: text(req.body.content, "Anteckning", 10000),
      updatedAt: now(),
    };
    put("note", updated);
    activity("Anteckning uppdaterad", updated.title);
    res.json(updated);
  });
  app.delete("/api/notes/:id", (req, res) => {
    const note = get("note", req.params.id);
    remove(note.id);
    activity("Minne borttaget", note.title);
    res.json({ ok: true });
  });
}
