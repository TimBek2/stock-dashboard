import { getDb } from "@/lib/db";

export type WatchItem = { symbol: string; createdAt: string };

export function listWatchlist(): WatchItem[] {
  const db = getDb();
  return db
    .prepare(`SELECT symbol, created_at as createdAt FROM watchlist_items ORDER BY created_at ASC`)
    .all() as WatchItem[];
}

export function addToWatchlist(symbol: string) {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO watchlist_items (symbol) VALUES (?)`).run(symbol);
}

export function removeFromWatchlist(symbol: string) {
  const db = getDb();
  db.prepare(`DELETE FROM watchlist_items WHERE symbol = ?`).run(symbol);
}

