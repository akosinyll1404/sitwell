import { percent } from "../../lib/time";

interface PostureDonutProps {
  goodMs: number;
  poorMs: number;
}

/** Good vs. poor share of the day, with a labelled legend. */
export function PostureDonut({ goodMs, poorMs }: PostureDonutProps) {
  const total = goodMs + poorMs;
  const good = percent(goodMs, total);
  const poor = total > 0 ? 100 - good : 0;
  // 1-unit surface gap between the two arcs when both are present.
  const gap = good > 0 && poor > 0 ? 1 : 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label={total > 0 ? `${good}% good posture, ${poor}% poor posture` : "No posture data"}>
        <g transform="rotate(-90 60 60)" fill="none" strokeWidth="16">
          <circle cx="60" cy="60" r="44" className="stroke-idle-bg" />
          {good > 0 && (
            <circle
              cx="60"
              cy="60"
              r="44"
              pathLength={100}
              className="stroke-good-accent"
              strokeDasharray={`${good - gap} ${100 - good + gap}`}
            />
          )}
          {poor > 0 && (
            <circle
              cx="60"
              cy="60"
              r="44"
              pathLength={100}
              className="stroke-warn-accent"
              strokeDasharray={`${poor - gap} ${100 - poor + gap}`}
              strokeDashoffset={-good}
            />
          )}
        </g>
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="fill-ink text-[22px] font-bold">
          {total > 0 ? `${good}%` : "—"}
        </text>
      </svg>

      <ul className="space-y-1 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-good-accent" aria-hidden />
          Good {good}%
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-warn-accent" aria-hidden />
          Poor {poor}%
        </li>
      </ul>
    </div>
  );
}
