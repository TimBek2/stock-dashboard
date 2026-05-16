"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartCard } from "@/components/ChartCard";
import { ChartTypeToggle } from "@/components/ChartTypeToggle";
import { RangeToggle, type RangeKey } from "@/components/RangeToggle";

type WatchItem = { symbol: string; createdAt: string };
type QuoteRow = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency: string | null;
};

const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "SPY", "VOO", "QQQ"];

export default function HomePage() {
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteRow>>({});
  const [symbolInput, setSymbolInput] = useState("");
  const [chartType, setChartType] = useState<"candles" | "line">("candles");
  const [range, setRange] = useState<RangeKey>("6mo");
  const [isBusy, setIsBusy] = useState(false);

  const symbols = useMemo(() => watchlist.map((w) => w.symbol).filter(Boolean), [watchlist]);

  async function refreshWatchlist() {
    const res = await fetch("/api/watchlist", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load watchlist");
    const data = (await res.json()) as { items: WatchItem[] };
    setWatchlist(data.items);
  }

  async function refreshQuotes(nextSymbols: string[]) {
    if (nextSymbols.length === 0) return;
    const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(nextSymbols.join(","))}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { quotes: QuoteRow[] };
    const map: Record<string, QuoteRow> = {};
    for (const q of data.quotes) map[q.symbol] = q;
    setQuotes(map);
  }

  async function ensureDefaultsIfEmpty() {
    const res = await fetch("/api/watchlist", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: WatchItem[] };
    if (data.items.length > 0) {
      setWatchlist(data.items);
      return;
    }
    for (const s of DEFAULT_WATCHLIST) {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol: s }),
      });
    }
    await refreshWatchlist();
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("chartType");
    if (saved === "candles" || saved === "line") setChartType(saved);
    ensureDefaultsIfEmpty().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshQuotes(symbols).catch(() => {});
  }, [symbols]);

  async function onAddSymbol() {
    const sym = symbolInput.trim().toUpperCase();
    if (!sym) return;
    setIsBusy(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      if (res.ok) {
        setSymbolInput("");
        await refreshWatchlist();
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function onRemoveSymbol(sym: string) {
    setIsBusy(true);
    try {
      await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, { method: "DELETE" });
      await refreshWatchlist();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <div className="title">Stock Dashboard</div>
          <div className="subtitle">Yahoo Finance data • SQLite watchlist • Candles/Line toggle</div>
        </div>
        <div className="muted">{symbols.length} symbols</div>
      </div>

      <div className="panel">
        <div className="controls">
          <input
            className="input"
            placeholder="Add symbol (e.g. AAPL, SPY, VOO)"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAddSymbol();
            }}
          />
          <button className="btn" disabled={isBusy} onClick={onAddSymbol}>
            Add
          </button>

          <RangeToggle value={range} onChange={setRange} />

          <ChartTypeToggle
            value={chartType}
            onChange={(v) => {
              setChartType(v);
              window.localStorage.setItem("chartType", v);
            }}
          />
        </div>
      </div>

      <div className="grid">
        {symbols.map((sym) => (
          <ChartCard
            key={sym}
            symbol={sym}
            quote={quotes[sym]}
            range={range}
            chartType={chartType}
            onRemove={() => onRemoveSymbol(sym)}
          />
        ))}
      </div>
    </main>
  );
}
