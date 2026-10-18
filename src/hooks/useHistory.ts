import { useEffect, useState } from "react";
import { sampleDailyTotals, sampleTimeline } from "../dev/sampleHistory";
import { mergeTimelines } from "../lib/posture";
import { addDays, startOfDay } from "../lib/time";
import { historyRepository, type DayTotals } from "../services/historyRepository";
import type { MonitoringSnapshot, TimelineBucket } from "../types/monitoring";

export interface DailySummary extends DayTotals {
  totalMs: number;
}

export interface HistoryData {
  /** Local midnight today. */
  today: number;
  /** The last 7 days, oldest first (days without data have zero totals). */
  week: DailySummary[];
  /** Totals for the day being viewed in the Daily Progress Summary. */
  selected: DailySummary;
  /** Timeline slots for the day being viewed. */
  timeline: TimelineBucket[];
}

const WEEK_DAYS = 7;

interface Stored {
  totals: DayTotals[];
  timeline: TimelineBucket[];
  /** Which day `timeline` belongs to (avoids showing a stale day while loading). */
  timelineDay: number | null;
}

/**
 * Combines saved history (repository, or sample data in dev) with the live
 * session from this app run.
 *
 * NOTE for the database work: once saveSession() persists the *active*
 * session, exclude it from the repository results (or skip the live merge
 * below) so today isn't counted twice.
 */
export function useHistory(
  snapshot: MonitoringSnapshot,
  useSampleData: boolean,
  selectedDay: number,
): HistoryData {
  const today = startOfDay(Date.now());
  const weekStart = addDays(today, -(WEEK_DAYS - 1));
  const rangeStart = Math.min(weekStart, selectedDay);

  const [stored, setStored] = useState<Stored>({
    totals: [],
    timeline: [],
    timelineDay: null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [totals, timeline] = useSampleData
        ? [sampleDailyTotals(rangeStart, today), sampleTimeline(selectedDay)]
        : await Promise.all([
            historyRepository.getDailyTotals(rangeStart, today),
            historyRepository.getTimeline(selectedDay),
          ]);
      if (!cancelled) setStored({ totals, timeline, timelineDay: selectedDay });
    };
    load().catch((error) => console.error("[history] Failed to load history", error));
    return () => {
      cancelled = true;
    };
  }, [useSampleData, today, rangeStart, selectedDay]);

  const live = snapshot.session;

  const totalsFor = (day: number): DailySummary => {
    const saved = stored.totals.find((t) => t.dayStart === day);
    const isToday = day === today;
    const goodMs = (saved?.goodMs ?? 0) + (isToday ? live.goodMs : 0);
    const slouchMs = (saved?.slouchMs ?? 0) + (isToday ? live.slouchMs : 0);
    const poorMs = (saved?.poorMs ?? 0) + (isToday ? live.poorMs : 0);
    return {
      dayStart: day,
      goodMs,
      slouchMs,
      poorMs,
      totalMs: goodMs + slouchMs + poorMs,
      deviations: (saved?.deviations ?? 0) + (isToday ? live.deviations : 0),
      breaksTaken: (saved?.breaksTaken ?? 0) + (isToday ? live.breaksTaken : 0),
    };
  };

  const week: DailySummary[] = [];
  for (let i = 0; i < WEEK_DAYS; i++) week.push(totalsFor(addDays(weekStart, i)));

  const savedTimeline = stored.timelineDay === selectedDay ? stored.timeline : [];
  const liveTimeline = snapshot.timeline.filter(
    (b) => b.start >= selectedDay && b.start < addDays(selectedDay, 1),
  );

  return {
    today,
    week,
    selected: totalsFor(selectedDay),
    timeline: mergeTimelines(savedTimeline, liveTimeline),
  };
}
