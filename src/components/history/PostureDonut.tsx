import { POSTURE_CLASSES, ChartLegend, splitPercent, totalOf, type ClassTimes } from "./postureChart";

/** Good / slouching / poor share of the day, with a labelled legend. */
export function PostureDonut({ times }: { times: ClassTimes }) {
  const total = totalOf(times);
  const percents = splitPercent(times);
  const present = POSTURE_CLASSES.filter(({ key }) => percents[key] > 0);
  // 1-unit surface gap between arcs when more than one class is present.
  const gap = present.length > 1 ? 1 : 0;

  let offset = 0;
  const arcs = present.map(({ key, stroke }) => {
    const arc = { key, stroke, length: percents[key], offset };
    offset += percents[key];
    return arc;
  });

  const label =
    total > 0
      ? `${percents.goodMs}% good, ${percents.slouchMs}% slouching, ${percents.poorMs}% poor posture`
      : "No posture data";

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label={label}>
        <g transform="rotate(-90 60 60)" fill="none" strokeWidth="16">
          <circle cx="60" cy="60" r="44" className="stroke-idle-bg" />
          {arcs.map(({ key, stroke, length, offset: start }) => (
            <circle
              key={key}
              cx="60"
              cy="60"
              r="44"
              pathLength={100}
              className={stroke}
              strokeDasharray={`${Math.max(length - gap, 0.5)} ${100 - length + gap}`}
              strokeDashoffset={-start}
            />
          ))}
        </g>
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="fill-ink text-[22px] font-bold">
          {total > 0 ? `${percents.goodMs}%` : "—"}
        </text>
      </svg>

      <ChartLegend percents={percents} vertical />
    </div>
  );
}
