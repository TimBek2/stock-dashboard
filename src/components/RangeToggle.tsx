"use client";

export type RangeKey = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y";

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "1d", label: "1D" },
  { key: "5d", label: "5D" },
  { key: "1mo", label: "1M" },
  { key: "6mo", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

export function RangeToggle({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <div className="seg" role="tablist" aria-label="Range">
      {OPTIONS.map((o) => (
        <button key={o.key} data-active={value === o.key} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

