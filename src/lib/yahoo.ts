import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export type QuoteRow = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency: string | null;
};

export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type YahooQuoteLike = {
  symbol?: unknown;
  shortName?: unknown;
  longName?: unknown;
  regularMarketPrice?: unknown;
  regularMarketChange?: unknown;
  regularMarketChangePercent?: unknown;
  currency?: unknown;
};

type YahooChartQuoteLike = {
  date?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
  volume?: unknown;
};

const quoteCache = new Map<string, { at: number; data: QuoteRow[] }>();
const chartCache = new Map<string, { at: number; data: Candle[] }>();

function cacheGet<T>(cache: Map<string, { at: number; data: T }>, key: string, ttlMs: number) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) return null;
  return hit.data;
}

function cacheSet<T>(cache: Map<string, { at: number; data: T }>, key: string, data: T) {
  cache.set(key, { at: Date.now(), data });
}

export async function fetchQuotes(symbols: string[]) {
  const key = symbols.slice().sort().join(",");
  const cached = cacheGet(quoteCache, key, 15_000);
  if (cached) return cached;

  const result = await yahooFinance.quote(symbols);
  const rows = Array.isArray(result) ? result : [result];

  const out: QuoteRow[] = rows
    .filter(Boolean)
    .map((r0) => {
      const r = r0 as YahooQuoteLike;
      const sym = typeof r.symbol === "string" ? r.symbol : "";
      const name =
        typeof r.shortName === "string"
          ? r.shortName
          : typeof r.longName === "string"
            ? r.longName
            : sym;

      return {
        symbol: sym,
        name,
        price: typeof r.regularMarketPrice === "number" ? r.regularMarketPrice : null,
        change: typeof r.regularMarketChange === "number" ? r.regularMarketChange : null,
        changePct: typeof r.regularMarketChangePercent === "number" ? r.regularMarketChangePercent : null,
        currency: typeof r.currency === "string" ? r.currency : null,
      };
    })
    .filter((q) => q.symbol.length > 0);

  cacheSet(quoteCache, key, out);
  return out;
}

export async function fetchChart(symbol: string, range: string, interval: string) {
  const key = `${symbol}|${range}|${interval}`;
  const cached = cacheGet(chartCache, key, 60_000);
  if (cached) return cached;

  // yahoo-finance2 v3 expects period1/period2 (seconds). We keep the public API
  // of this helper as "range" strings, and translate them here.
  const nowSec = Math.floor(Date.now() / 1000);
  const rangeToSeconds: Record<string, number> = {
    "1d": 60 * 60 * 24,
    "5d": 60 * 60 * 24 * 5,
    "1mo": 60 * 60 * 24 * 31,
    "6mo": 60 * 60 * 24 * 31 * 6,
    "1y": 60 * 60 * 24 * 365,
    "5y": 60 * 60 * 24 * 365 * 5,
  };
  const back = rangeToSeconds[range] ?? rangeToSeconds["6mo"];
  const period1 = nowSec - back;
  const period2 = nowSec;

  const result = await yahooFinance.chart(symbol, { period1, period2, interval });
  const quotes = (result.quotes ?? []) as unknown[];

  const out: Candle[] = quotes
    .filter(
      (q0) => {
        const q = q0 as YahooChartQuoteLike;
        return (
          q?.date &&
          typeof q.open === "number" &&
          typeof q.high === "number" &&
          typeof q.low === "number" &&
          typeof q.close === "number"
        );
      },
    )
    .map((q0) => {
      const q = q0 as YahooChartQuoteLike;
      const date = q.date instanceof Date ? q.date : new Date(String(q.date));

      return {
        time: Math.floor(date.getTime() / 1000),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: typeof q.volume === "number" ? q.volume : undefined,
      };
    });

  cacheSet(chartCache, key, out);
  return out;
}

