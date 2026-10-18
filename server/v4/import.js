import { fail, now } from "../core/validation.js";

// Validate the whole file before beginning the merge. Imported records cannot
// activate AI or carry an executable approval from another installation.
export function parseBackupRows(rows) {
  const seen = new Set();
  return rows.map((row) => {
    if (
      !row ||
      typeof row.id !== "string" ||
      !row.id ||
      row.id.length > 200 ||
      !row.data ||
      Array.isArray(row.data) ||
      row.data.id !== row.id ||
      seen.has(row.id) ||
      row.id === "ai-config" ||
      (["openai", "anthropic"].includes(row.id) && row.kind !== "connection") ||
      (row.id === "v4-ui" && row.kind !== "config") ||
      (row.id.startsWith("draft-") && row.kind !== "draft")
    )
      fail("Ogiltig post i säkerhetskopian.");
    seen.add(row.id);
    const data = { ...row.data };
    const string = (key, fallback, max = 12000) => {
      if (data[key] === undefined && fallback !== undefined)
        data[key] = fallback;
      if (typeof data[key] !== "string" || data[key].length > max)
        fail(`Ogiltigt fält i säkerhetskopian: ${key}.`);
    };
    const choice = (key, values, fallback) => {
      if (data[key] === undefined && fallback !== undefined)
        data[key] = fallback;
      if (!values.includes(data[key]))
        fail(`Ogiltigt fält i säkerhetskopian: ${key}.`);
    };
    const date = (key) => {
      string(key, now(), 80);
      if (!Number.isFinite(Date.parse(data[key])))
        fail("Ogiltig tidpunkt i säkerhetskopian.");
    };
    date("createdAt");
    switch (row.kind) {
      case "business":
        string("name");
        string("description", "");
        if (
          data.plan &&
          (typeof data.plan !== "object" ||
            ["workAreas", "tasks", "agents"].some(
              (key) =>
                !Array.isArray(data.plan[key]) ||
                data.plan[key].length > 5 ||
                data.plan[key].some(
                  (item) => typeof item !== "string" || item.length > 300,
                ),
            ) ||
            typeof data.plan.visualStyle !== "string")
        )
          fail("Ogiltigt verksamhetsförslag.");
        if (
          !Array.isArray(data.sections) ||
          !data.sections.length ||
          data.sections.length > 12 ||
          data.sections.some(
            (s) =>
              !s ||
              !/^[a-z][a-z0-9-]{0,49}$/.test(s.id) ||
              !/^[a-z][a-z0-9-]{0,49}$/.test(s.view) ||
              typeof s.title !== "string",
          ) ||
          new Set(data.sections.map((s) => s.id)).size !== data.sections.length
        )
          fail("Ogiltig verksamhetsstruktur.");
        break;
      case "task":
        string("title");
        string("description", "");
        choice("status", [
          "pending",
          "running",
          "done",
          "cancelled",
          "approval",
        ]);
        choice("priority", ["low", "normal", "high"], "normal");
        break;
      case "agent":
        string("name");
        string("role");
        string("instruction", data.role);
        choice("manager", ["openai", "anthropic"], "openai");
        if (
          typeof data.enabled !== "boolean" ||
          (data.businessIds !== undefined &&
            (!Array.isArray(data.businessIds) ||
              data.businessIds.some((id) => typeof id !== "string")))
        )
          fail("Ogiltig agent.");
        data.businessIds ??= [];
        data.tools = [];
        break;
      case "message":
      case "chatMessage":
      case "draft":
        string("content", "", 60000);
        if (row.kind !== "message")
          choice("channel", ["garon", "openai", "anthropic"]);
        if (row.kind !== "draft") choice("role", ["user", "assistant"]);
        else if (
          row.id !== `draft-${data.channel}` ||
          data.content.length > 6000
        )
          fail("Ogiltigt chattutkast.");
        break;
      case "usage":
        string("model");
        for (const key of ["cost", "inputTokens", "outputTokens"]) {
          data[key] ??= 0;
          if (!Number.isFinite(data[key]) || data[key] < 0)
            fail("Ogiltig användningskostnad.");
        }
        break;
      case "memory":
        string("title");
        string("content");
        string("source", "Importerad källa");
        choice("visibility", ["private", "shared"]);
        data.verified = data.verified === true;
        if (
          data.businessId !== null &&
          data.businessId !== undefined &&
          typeof data.businessId !== "string"
        )
          fail("Ogiltig minneskoppling.");
        break;
      case "approval":
        string("title");
        string("description", "");
        string("risk", "Importerad post. Ingen extern åtgärd.");
        string("proposedBy", "Importerad säkerhetskopia");
        data.status = "pending";
        data.action = { type: "proposal" };
        data.estimatedCost = null;
        break;
      case "delegation":
        string("prompt");
        choice("manager", ["openai", "anthropic"]);
        if (data.result !== undefined) string("result");
        data.status = "imported";
        break;
      case "schedule":
        string("title");
        date("dueAt");
        choice("type", ["reminder", "task"]);
        choice("status", ["pending", "done", "cancelled"]);
        break;
      case "inbox":
        string("title");
        string("content");
        string("source", "Importerad källa");
        data.read = data.read === true;
        break;
      case "project":
        string("name");
        string("description", "");
        string("businessId");
        break;
      case "note":
        string("title");
        string("content");
        break;
      case "activity":
        string("title");
        string("detail", "");
        choice("type", ["info", "success", "warning"], "info");
        break;
      case "connection":
        if (!["openai", "anthropic"].includes(row.id))
          fail("Ogiltig anslutningspost.");
        date("verifiedAt");
        break;
      case "config": {
        if (row.id !== "v4-ui") fail("Systembehörigheter får inte importeras.");
        const p = data.preferences;
        if (
          !p ||
          !["light", "dark"].includes(p.theme) ||
          !["normal", "compact"].includes(p.density) ||
          !/^#[0-9a-f]{6}$/i.test(p.accent) ||
          typeof p.confirmations !== "boolean" ||
          !Array.isArray(data.layout) ||
          data.layout.length > 6 ||
          new Set(data.layout.map((i) => i?.i)).size !== data.layout.length ||
          data.layout.some(
            (i) =>
              !i ||
              ![
                "approvals",
                "inbox",
                "activity",
                "budget",
                "agents",
                "businesses",
              ].includes(i.i) ||
              !["x", "y", "w", "h"].every((k) => Number.isInteger(i[k])) ||
              i.x < 0 ||
              i.y < 0 ||
              i.y > 1000 ||
              i.w < 2 ||
              i.w > 12 ||
              i.x + i.w > 12 ||
              i.h < 3 ||
              i.h > 15,
          )
        )
          fail("Ogiltig sparad arbetsyta.");
        break;
      }
      default:
        fail("Okänd posttyp i säkerhetskopian.");
    }
    return { id: row.id, kind: row.kind, data };
  });
}
