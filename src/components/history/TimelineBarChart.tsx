import { useState } from "react";
import { TIMELINE_BUCKET_MS } from "../../config/monitoring";
import { formatClock, formatDuration } from "../../lib/time";
import type { TimelineBucket } from "../../types/monitoring";
import { StackedBar, totalOf } from "./postureChart";

const HOUR = 3_600_000;
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

interface TimelineBarChartProps {
  buckets: TimelineBucket[];
  dayStart: number;
  /** Message shown when the day has no data. */
  emptyText?: string;
}

/**
 * "Posture throughout the day": one stacked bar per 30-minute slot. Bar
 * height is how much of the slot was monitored; green = good, orange =
 * slouching, red = poor.
 */
export function TimelineBarChart({
  buckets,
  dayStart,
  emptyText = "No posture data recorded on this day.",
}: TimelineBarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  // 8 AM–8 PM by default, widened to include any recorded slot.
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const b of buckets) {
    const hour = (b.start - dayStart) / HOUR;
    startHour = Math.min(startHour, Math.floor(hour));
    endHour = Math.max(endHour, Math.ceil(hour + TIMELINE_BUCKET_MS / HOUR));
  }

  const byStart = new Map(buckets.map((b) => [b.start, b]));
  const slots: TimelineBucket[] = [];
  for (let t = dayStart + startHour * HOUR; t < dayStart + endHour * HOUR; t += TIMELINE_BUCKET_MS) {
    slots.push(byStart.get(t) ?? { start: t, goodMs: 0, slouchMs: 0, poorMs: 0 });
  }
  const hasData = slots.some((s) => totalOf(s) > 0);

  const labels: { hour: number; pct: number }[] = [];
  for (let h = startHour; h <= endHour; h += 4) {
    labels.push({ hour: h, pct: ((h - startHour) / (endHour - startHour)) * 100 });
  }

  return (
    <div>
      <div className="relative flex h-40 items-end gap-1.5 border-b border-line">
        {slots.map((slot, i) => {
          const total = totalOf(slot);
          const breakdown = `Good ${formatDuration(slot.goodMs)} · Slouching ${formatDuration(slot.slouchMs)} · Poor ${formatDuration(slot.poorMs)}`;
          const label = `${formatClock(slot.start)} – ${formatClock(slot.start + TIMELINE_BUCKET_MS)}`;

          return (
            <div
              key={slot.start}
              className="relative flex h-full flex-1 flex-col justify-end outline-none focus-visible:ring-2 focus-visible:ring-brand"
              tabIndex={total > 0 ? 0 : -1}
              aria-label={`${label}: ${breakdown}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
            >
              {/* Height = share of the 30-minute slot that was monitored. */}
              <StackedBar times={slot} scaleMs={Math.max(TIMELINE_BUCKET_MS, total)} />

              {hovered === i && total > 0 && (
                <div
                  className={`pointer-events-none absolute bottom-full z-10 mb-2 rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg ${
                    i < 3 ? "left-0" : i > slots.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                  }`}
                >
                  <p className="font-semibold">{label}</p>
                  <p>{breakdown}</p>
                </div>
              )}
            </div>
          );
        })}

        {!hasData && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            {emptyText}
          </p>
        )}
      </div>

      <div className="relative mt-1.5 h-4 text-xs text-muted">
        {labels.map(({ hour, pct }, i) => (
          <span
            key={hour}
            className={`absolute whitespace-nowrap ${
              i === 0 ? "" : pct >= 100 ? "-translate-x-full" : "-translate-x-1/2"
            }`}
            style={{ left: `${pct}%` }}
          >
            {formatClock(dayStart + hour * HOUR).replace(":00", "")}
          </span>
        ))}
      </div>
    </div>
  );
}
