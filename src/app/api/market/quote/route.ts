import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/yahoo";

export const runtime = "nodejs";

function parseSymbols(url: string) {
  const { searchParams } = new URL(url);
  const raw = searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .filter((s) => /^[A-Z0-9.\-^=]{1,15}$/.test(s));
  return Array.from(new Set(symbols)).slice(0, 50);
}

export async function GET(req: Request) {
  const symbols = parseSymbols(req.url);
  if (symbols.length === 0) return NextResponse.json({ quotes: [] });

  try {
    const quotes = await fetchQuotes(symbols);
    return NextResponse.json({ quotes });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Quote fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

