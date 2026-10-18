/**
 * Shared pieces for History charts: the three posture classes, a stacked bar,
 * a legend, and a percentage split. Colors match the BLE Lamp classification
 * (good / slouching / poor) and were checked for color-blind separation.
 */

export interface ClassTimes {
  goodMs: number;
  slouchMs: number;
  poorMs: number;
}

type ClassKey = keyof ClassTimes;

export const POSTURE_CLASSES: { key: ClassKey; label: string; bg: string; stroke: string }[] = [
  { key: "goodMs", label: "Good", bg: "bg-chart-good", stroke: "stroke-chart-good" },
  { key: "slouchMs", label: "Slouching", bg: "bg-chart-slouch", stroke: "stroke-chart-slouch" },
  { key: "poorMs", label: "Poor", bg: "bg-chart-poor", stroke: "stroke-chart-poor" },
];

export function totalOf(t: ClassTimes): number {
  return t.goodMs + t.slouchMs + t.poorMs;
}

/**
 * Whole-number percentages for each class that always add up to 100
 * (largest-remainder rounding). All zeros when there's no data.
 */
export function splitPercent(t: ClassTimes): Record<ClassKey, number> {
  const total = totalOf(t);
  if (total === 0) return { goodMs: 0, slouchMs: 0, poorMs: 0 };
  const raw = POSTURE_CLASSES.map(({ key }) => ({ key, exact: (t[key] / total) * 100 }));
  const result = { goodMs: 0, slouchMs: 0, poorMs: 0 };
  let used = 0;
  for (const r of raw) {
    result[r.key] = Math.floor(r.exact);
    used += result[r.key];
  }
  raw
    .sort((a, b) => (b.exact % 1) - (a.exact % 1))
    .slice(0, 100 - used)
    .forEach((r) => (result[r.key] += 1));
  return result;
}

/**
 * Vertical stacked bar: good at the bottom, then slouching, poor on top.
 * Segment heights are relative to `scaleMs`; a 2px gap separates segments.
 */
export function StackedBar({ times, scaleMs }: { times: ClassTimes; scaleMs: number }) {
  const segments = POSTURE_CLASSES.filter(({ key }) => times[key] > 0);
  if (segments.length === 0) return <div className="h-1 rounded-t-[2px] bg-idle-bg" />;

  // Render top-down: poor, slouching, good.
  const topDown = [...segments].reverse();
  return (
    <>
      {topDown.map(({ key, bg }, i) => (
        <div
          key={key}
          className={`${bg} ${i === 0 ? "rounded-t-[4px]" : ""} ${i < topDown.length - 1 ? "mb-[2px]" : ""}`}
          style={{ height: `${(times[key] / scaleMs) * 100}%` }}
        />
      ))}
    </>
  );
}

/** Legend with a swatch per class and optional percentages. */
export function ChartLegend({
  percents,
  vertical = false,
}: {
  percents?: Record<ClassKey, number>;
  vertical?: boolean;
}) {
  return (
    <ul className={`flex text-sm text-slate-600 ${vertical ? "flex-col gap-1" : "gap-4"}`}>
      {POSTURE_CLASSES.map(({ key, label, bg }) => (
        <li key={key} className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-sm ${bg}`} aria-hidden />
          {label}
          {percents && <span className="tabular-nums">{percents[key]}%</span>}
        </li>
      ))}
    </ul>
  );
}
