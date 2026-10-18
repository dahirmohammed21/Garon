import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fail, id, now } from "../core/validation.js";
import { migrate } from "./migrations.js";
export function createStore(database) {
  if (database !== ":memory:")
    mkdirSync(dirname(resolve(database)), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(database);
  if (database !== ":memory:")
    for (const file of [database, database + "-wal", database + "-shm"])
      if (existsSync(file)) chmodSync(file, 0o600);
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
    INSERT OR IGNORE INTO settings VALUES (1, '{"budget":10,"name":"Dahir"}');`);
  migrate(db, database);
  const all = (kind) =>
    db
      .prepare("SELECT data FROM entities WHERE kind=? ORDER BY rowid DESC")
      .all(kind)
      .map((row) => JSON.parse(row.data));
  const get = (kind, key) =>
    all(kind).find((row) => row.id === key) ||
    fail("Posten finns inte längre.", 404);
  const put = (kind, item) => {
    db.prepare(
      "INSERT INTO entities VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
    ).run(item.id, kind, JSON.stringify(item));
    return item;
  };
  const remove = (key) =>
    db.prepare("DELETE FROM entities WHERE id=?").run(key);
  const settings = () =>
    JSON.parse(db.prepare("SELECT data FROM settings WHERE id=1").get().data);
  const saveSettings = (value) =>
    db
      .prepare("UPDATE settings SET data=? WHERE id=1")
      .run(JSON.stringify(value));
  const activity = (title, detail, type = "info") =>
    put("activity", { id: id(), title, detail, type, createdAt: now() });
  return {
    db,
    all,
    get,
    put,
    remove,
    settings,
    saveSettings,
    activity,
    close: () => db.close(),
  };
}
