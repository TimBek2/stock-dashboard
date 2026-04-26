"use client";

export function ChartTypeToggle({
  value,
  onChange,
}: {
  value: "candles" | "line";
  onChange: (v: "candles" | "line") => void;
}) {
  return (
    <div className="seg" role="tablist" aria-label="Chart type">
      <button data-active={value === "candles"} onClick={() => onChange("candles")}>
        Candles
      </button>
      <button data-active={value === "line"} onClick={() => onChange("line")}>
        Line
      </button>
    </div>
  );
}

