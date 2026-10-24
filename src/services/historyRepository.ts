import { storageInvoke } from "./storage";
import { addDays } from "../lib/time";
import type { TimelineBucket } from "../types/monitoring";

/**
 * A saved sitting session. Fields mirror the `session` table in the technical
 * design (§11.1) in camelCase; `deviationCount` and `breaksTaken` are proposed
 * additional columns.
 */
export interface SessionRecord {
  id: number;
  startTime: number;
  endTime: number | null;
  durationSeconds: number;
  goodPostureSeconds: number;
  /** Proposed new column `slouch_posture_seconds`. */
  slouchPostureSeconds: number;
  poorPostureSeconds: number;
  alertCount: number;
  deviationCount: number;
  breaksTaken: number;
}

/** Totals for one calendar day (local time), summed over its sessions. */
export interface DayTotals {
  /** Local midnight of the day. */
  dayStart: number;
  goodMs: number;
  slouchMs: number;
  poorMs: number;
  deviations: number;
  breaksTaken: number;
}

/** One page of sessions plus the total count (for pagination). */
export interface SessionPage {
  sessions: SessionRecord[];
  /** Total number of saved sessions across all pages. */
  total: number;
}

/** Storage interface the History screen reads from. */
export interface HistoryRepository {
  /**
   * One page of sessions, most recent first. Load only the requested page
   * (SQL `LIMIT ? OFFSET ?`) so long histories stay fast.
   */
  listSessions(options: { limit: number; offset: number }): Promise<SessionPage>;
  /** Good/slouching/poor time per 30-minute slot for the day starting at `dayStart`. */
  getTimeline(dayStart: number): Promise<TimelineBucket[]>;
  /**
   * Per-day totals for every day from `fromDay` to `toDay` (both local
   * midnights, inclusive) that has data. Days without data are omitted.
   */
  getDailyTotals(fromDay: number, toDay: number): Promise<DayTotals[]>;

}

interface RangeTotals {
  start: number; goodMs: number; slouchMs: number; poorMs: number;
  deviations: number; breaksTaken: number;
}

/** Rust records samples and updates sessions atomically; the UI only reads history. */
export const historyRepository: HistoryRepository = {
  listSessions(options) {
    return storageInvoke<SessionPage>("history_sessions", options);
  },
  async getTimeline(dayStart) {
    const end = addDays(dayStart, 1);
    const ranges = [];
    for (let start = dayStart; start < end; start += 30 * 60_000) {
      ranges.push({ start, end: Math.min(start + 30 * 60_000, end) });
    }
    const totals = await storageInvoke<RangeTotals[]>("history_totals", { ranges });
    return totals.map(t => ({ start: t.start, goodMs: t.goodMs, slouchMs: t.slouchMs, poorMs: t.poorMs }));
  },
  async getDailyTotals(fromDay, toDay) {
    const ranges = [];
    for (let day = fromDay; day <= toDay; day = addDays(day, 1)) {
      if (ranges.length >= 3700) throw new Error("Select a history range within 10 years.");
      ranges.push({ start: day, end: addDays(day, 1) });
    }
    const totals = await storageInvoke<RangeTotals[]>("history_totals", { ranges });
    return totals.map(t => ({ dayStart: t.start, goodMs: t.goodMs, slouchMs: t.slouchMs,
      poorMs: t.poorMs, deviations: t.deviations, breaksTaken: t.breaksTaken }));
  },
};
