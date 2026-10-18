import { fail, id, now, text } from "../core/validation.js";
function sections(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12)
    fail("En verksamhet behöver mellan 1 och 12 menyval.");
  const parsed = value.map((item) => {
    if (!item || typeof item !== "object") fail("Ogiltigt menyval.");
    const key = text(item.id, "Meny-id", 50);
    const view = text(item.view, "Sidtyp", 50);
    if (!/^[a-z][a-z0-9-]*$/.test(key) || !/^[a-z][a-z0-9-]*$/.test(view))
      fail("Ogiltigt meny-id eller sidtyp.");
    return { id: key, title: text(item.title, "Menynamn", 60), view };
  });
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length)
    fail("Menyval måste ha unika id:n.");
  return parsed;
}
export function register(app, store) {
  const { all, get, put, remove, activity } = store;
  const name = (value, currentId) => {
    const result = text(value, "Verksamhetens namn", 100);
    if (
      all("business").some(
        (item) =>
          item.id !== currentId &&
          item.name.toLocaleLowerCase("sv") === result.toLocaleLowerCase("sv"),
      )
    )
      fail("En verksamhet med det namnet finns redan.", 409);
    return result;
  };
  const description = (value) => {
    if (typeof value !== "string" || value.length > 3000)
      fail("Beskrivningen får vara högst 3 000 tecken.");
    return value.trim();
  };
  app.post("/api/businesses", (req, res) => {
    const item = {
      id: id(),
      name: name(req.body.name),
      description: description(req.body.description ?? ""),
      sections: [{ id: "overview", title: "Översikt", view: "overview" }],
      createdAt: now(),
      updatedAt: now(),
    };
    put("business", item);
    activity("Verksamhet skapad", item.name, "success");
    res.status(201).json(item);
  });
  app.patch("/api/businesses/:id", (req, res) => {
    const item = get("business", req.params.id);
    if (req.body.name !== undefined) item.name = name(req.body.name, item.id);
    if (req.body.description !== undefined)
      item.description = description(req.body.description);
    if (req.body.sections !== undefined)
      item.sections = sections(req.body.sections);
    item.updatedAt = now();
    put("business", item);
    activity("Verksamhet uppdaterad", item.name);
    res.json(item);
  });
  app.delete("/api/businesses/:id", (req, res) => {
    const item = get("business", req.params.id);
    if (req.body.confirm !== true)
      fail("Bekräfta att verksamheten ska tas bort.");
    remove(item.id);
    activity("Verksamhet borttagen", item.name);
    res.json({ ok: true });
  });
}
