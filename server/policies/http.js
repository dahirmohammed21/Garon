import express from "express";
export function registerHttpPolicy(app) {
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    if (req.path.startsWith("/api") && !["GET", "HEAD"].includes(req.method)) {
      if (req.get("sec-fetch-site") === "cross-site")
        return res
          .status(403)
          .json({ error: "Begäran från en annan webbplats nekades." });
      const origin = req.get("origin");
      if (origin) {
        let host;
        try {
          host = new URL(origin).host;
        } catch {
          return res.status(403).json({ error: "Ogiltigt ursprung." });
        }
        const allowed = new Set([
          req.get("host"),
          "localhost:5173",
          "127.0.0.1:5173",
        ]);
        if (!allowed.has(host))
          return res
            .status(403)
            .json({ error: "Begäran från en annan webbplats nekades." });
      }
      if (!req.is("application/json"))
        return res.status(415).json({ error: "Begäran måste vara JSON." });
    }
    next();
  });
  app.use(express.json({ limit: "128kb" }));
}
