import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function initSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS watchlist_items (
      symbol TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

declare global {
  var __stockDashboardDb: Database.Database | undefined;
}

export function getDb() {
  if (global.__stockDashboardDb) return global.__stockDashboardDb;

  const dataDir = path.join(process.cwd(), "data");
  ensureDir(dataDir);
  const dbPath = path.join(dataDir, "stock-dashboard.sqlite");

  const db = new Database(dbPath);
  initSchema(db);

  global.__stockDashboardDb = db;
  return db;
}

