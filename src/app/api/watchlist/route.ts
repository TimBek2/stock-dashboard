import { NextResponse } from "next/server";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@/lib/watchlist";

export const runtime = "nodejs";

function normalizeSymbol(s: unknown) {
  if (typeof s !== "string") return null;
  const sym = s.trim().toUpperCase();
  if (!/^[A-Z0-9.\-^=]{1,15}$/.test(sym)) return null;
  return sym;
}

export async function GET() {
  return NextResponse.json({ items: listWatchlist() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { symbol?: unknown };
  const sym = normalizeSymbol(body.symbol);
  if (!sym) return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });

  addToWatchlist(sym);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const sym = normalizeSymbol(searchParams.get("symbol"));
  if (!sym) return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });

  removeFromWatchlist(sym);
  return NextResponse.json({ ok: true });
}

