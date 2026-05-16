"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";
import type { RangeKey } from "@/components/RangeToggle";

type QuoteRow = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency: string | null;
};

type Candle = { time: number; open: number; high: number; low: number; close: number; volume?: number };

function formatNum(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function ChartCard({
  symbol,
  quote,
  range,
  chartType,
  onRemove,
}: {
  symbol: string;
  quote?: QuoteRow;
  range: RangeKey;
  chartType: "candles" | "line";
  onRemove: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(null);
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [loading, setLoading] = useState(false);

  const chgClass =
    quote?.changePct == null ? "" : quote.changePct > 0 ? "up" : quote.changePct < 0 ? "down" : "";

  const headerName = useMemo(
    () => (quote?.name && quote.name !== symbol ? quote.name : null),
    [quote?.name, symbol],
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/market/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("chart fetch failed");
        const data = (await r.json()) as { candles: Candle[] };
        if (mounted) setCandles(data.candles);
      })
      .catch(() => {
        if (mounted) setCandles([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [symbol, range]);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const rect = el.getBoundingClientRect();

    const chart = createChart(el, {
      width: Math.floor(rect.width),
      height: 220,
      layout: { background: { color: "transparent" }, textColor: "rgba(231, 236, 255, 0.85)" },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.10)" },
      timeScale: { borderColor: "rgba(255,255,255,0.10)" },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      chart.applyOptions({ width: Math.floor(cr.width) });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    if (chartType === "candles") {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: "#2bd576",
        downColor: "#ff5c6c",
        borderUpColor: "#2bd576",
        borderDownColor: "#ff5c6c",
        wickUpColor: "#2bd576",
        wickDownColor: "#ff5c6c",
      });
      seriesRef.current = s;
    } else {
      const s = chart.addSeries(LineSeries, {
        color: "#60a5fa",
        lineWidth: 2,
      });
      seriesRef.current = s;
    }
  }, [chartType]);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || !candles) return;

    if (chartType === "candles") {
      const data: CandlestickData[] = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      (series as unknown as ISeriesApi<"Candlestick">).setData(data);
    } else {
      const data: LineData[] = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.close,
      }));
      (series as unknown as ISeriesApi<"Line">).setData(data);
    }
    chart.timeScale().fitContent();
  }, [candles, chartType]);

  return (
    <div className="panel">
      <div className="cardHeader">
        <div>
          <div className="symbol">{symbol}</div>
          {headerName ? <div className="muted">{headerName}</div> : null}
        </div>
        <div className="priceRow">
          <div className="price">{quote?.price == null ? "—" : formatNum(quote.price)}</div>
          <div className={`chg ${chgClass}`}>
            {quote?.changePct == null ? "" : `${quote.changePct >= 0 ? "+" : ""}${quote.changePct.toFixed(2)}%`}
          </div>
          <button className="xbtn" onClick={onRemove} aria-label={`Remove ${symbol}`}>
            Remove
          </button>
        </div>
      </div>

      <div ref={containerRef} style={{ width: "100%" }} />

      <div className="muted" style={{ marginTop: 10 }}>
        {loading ? "Loading…" : candles && candles.length === 0 ? "No data" : " "}
      </div>
    </div>
  );
}

