import { NextResponse } from "next/server";
import { fetchChart } from "@/lib/yahoo";

export const runtime = "nodejs";

type RangeKey = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y";

const RANGE_TO_YAHOO: Record<RangeKey, { range: string; interval: string }> = {
  "1d": { range: "1d", interval: "5m" },
  "5d": { range: "5d", interval: "15m" },
  "1mo": { range: "1mo", interval: "1h" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "5y": { range: "5y", interval: "1wk" },
};

function normalizeSymbol(s: string | null) {
  const sym = (s ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9.\-^=]{1,15}$/.test(sym)) return null;
  return sym;
}

function normalizeRangeKey(s: string | null): RangeKey {
  if (s === "1d" || s === "5d" || s === "1mo" || s === "6mo" || s === "1y" || s === "5y") return s;
  return "6mo";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = normalizeSymbol(searchParams.get("symbol"));
  if (!symbol) return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });

  const rangeKey = normalizeRangeKey(searchParams.get("range"));
  const { range, interval } = RANGE_TO_YAHOO[rangeKey];

  try {
    const candles = await fetchChart(symbol, range, interval);
    return NextResponse.json({ symbol, range: rangeKey, candles });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Chart fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

