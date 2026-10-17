import { InfoTip } from "../ui/Tooltip";

interface StatTileProps {
  label: string;
  /** Optional explanation shown in an ⓘ tooltip next to the label. */
  info?: string;
  value: string;
  sub?: string;
  className?: string;
}

/** Bordered metric tile used on the History screen. */
export function StatTile({ label, info, value, sub, className = "" }: StatTileProps) {
  return (
    <div className={`rounded-xl border border-line px-4 py-3.5 ${className}`}>
      <p className="flex items-center gap-1.5 text-sm text-slate-600">
        {label}
        {info && <InfoTip content={info} align="start" />}
      </p>
      <p className="text-[26px] leading-tight font-bold text-ink tabular-nums">{value}</p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}
