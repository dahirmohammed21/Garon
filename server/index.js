import { createApp } from "./app.js";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { execFile } from "node:child_process";
import { join } from "node:path";
const permanent =
  process.env.GARON_DATA_DIR ||
  (process.platform === "darwin"
    ? join(homedir(), "Library", "Application Support", "GARON")
    : join(
        process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"),
        "garon",
      ));
// Existing installations stay where their data already is. Fresh installs use a version-independent data directory.
const database =
  process.env.GARON_DB ||
  (!process.env.GARON_DATA_DIR && existsSync(".garon/garon.sqlite")
    ? ".garon/garon.sqlite"
    : join(permanent, "garon.sqlite"));
const { app, close, tick } = createApp({ database });
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "127.0.0.1";
const server = app.listen(port, host, () => {
  console.log(`GARON 4.0 är igång på ${host}:${port}\nDatabas: ${database}`);
  if (process.platform === "darwin" && process.env.GARON_OPEN_BROWSER === "1")
    execFile("open", [`http://127.0.0.1:${port}`], () => {});
});
tick();
const timer = setInterval(() => {
  try {
    tick();
  } catch {
    console.error("En intern schemalagd aktivitet kunde inte behandlas.");
  }
}, 30000);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    clearInterval(timer);
    server.close(() => {
      close();
      process.exit(0);
    });
  });
