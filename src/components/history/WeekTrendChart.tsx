import type { DailySummary } from "../../hooks/useHistory";
import { formatDuration, formatShortDate, formatWeekday, percent } from "../../lib/time";
import { Tooltip } from "../ui/Tooltip";
import { ChartLegend, StackedBar } from "./postureChart";

const HOUR = 3_600_000;

interface WeekTrendChartProps {
  /** Seven days, oldest first. */
  days: DailySummary[];
  today: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

/**
 * "Last 7 Days": one stacked bar per day (good, slouching, poor), scaled to
 * the busiest day. Clicking a day shows it in the Daily Progress Summary.
 */
export function WeekTrendChart({ days, today, selectedDay, onSelectDay }: WeekTrendChartProps) {
  // At least 1 hour so a light day doesn't fill the whole height.
  const maxMs = Math.max(HOUR, ...days.map((d) => d.totalMs));
  const hasData = days.some((d) => d.totalMs > 0);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <ChartLegend />
      </div>

      <div className="relative grid grid-cols-7 gap-2">
        {days.map((day) => {
          const selected = day.dayStart === selectedDay;
          const isToday = day.dayStart === today;
          const goodShare = percent(day.goodMs, day.totalMs);
          const label = `${formatShortDate(day.dayStart)}: ${
            day.totalMs > 0
              ? `Good ${formatDuration(day.goodMs)} · Slouching ${formatDuration(day.slouchMs)} · Poor ${formatDuration(day.poorMs)} · ${goodShare}% good`
              : "No data"
          }`;

          return (
            <Tooltip key={day.dayStart} content={label} className="w-full">
              <button
                type="button"
                onClick={() => onSelectDay(day.dayStart)}
                aria-pressed={selected}
                aria-label={label}
                className={`flex w-full cursor-pointer flex-col items-center rounded-xl px-1 pt-2 pb-2.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  selected ? "bg-sidebar ring-2 ring-brand" : "hover:bg-canvas"
                }`}
              >
                <div className="flex h-32 w-full max-w-12 flex-col justify-end">
                  <StackedBar times={day} scaleMs={maxMs} />
                </div>
                <span className={`mt-2 text-sm ${selected ? "font-semibold text-brand" : "font-medium text-ink"}`}>
                  {isToday ? "Today" : formatWeekday(day.dayStart)}
                </span>
                <span className="text-xs text-muted">{formatShortDate(day.dayStart)}</span>
                <span className="mt-0.5 text-xs font-semibold text-slate-600 tabular-nums">
                  {day.totalMs > 0 ? `${goodShare}%` : "—"}
                </span>
              </button>
            </Tooltip>
          );
        })}

        {!hasData && (
          <p className="pointer-events-none absolute inset-x-0 top-12 text-center text-sm text-muted">
            No posture data in the last 7 days yet.
          </p>
        )}
      </div>
    </div>
  );
}
