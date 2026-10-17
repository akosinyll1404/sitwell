interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}

/** Bordered metric tile used on the History screen. */
export function StatTile({ label, value, sub, className = "" }: StatTileProps) {
  return (
    <div className={`rounded-xl border border-line px-4 py-3.5 ${className}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-[26px] leading-tight font-bold text-ink tabular-nums">{value}</p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}
