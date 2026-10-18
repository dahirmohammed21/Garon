import { mkdirSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
export function migrate(db, database) {
  const applied = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
    )
    .get();
  if (
    applied &&
    db.prepare("SELECT version FROM schema_migrations WHERE version=4").get()
  )
    return;
  if (
    database !== ":memory:" &&
    db.prepare("SELECT COUNT(*) AS n FROM entities").get().n > 0
  ) {
    const directory = join(dirname(database), "backups");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const file = join(directory, `before-v4-${Date.now()}.sqlite`);
    db.prepare("VACUUM INTO ?").run(file);
    chmodSync(file, 0o600);
  }
  db.exec(`BEGIN IMMEDIATE; CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS entities_kind ON entities(kind);
    INSERT INTO schema_migrations VALUES(4, datetime('now')); COMMIT;`);
}
