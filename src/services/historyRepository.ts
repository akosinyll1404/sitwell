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
  /** Insert or update a session (call periodically and when a session ends). */
  saveSession(session: SessionRecord): Promise<void>;
}

/**
 * PHASE 1 placeholder: no database yet, so nothing is stored or returned and
 * History only shows the live session from the current app run.
 *
 * TODO(database): replace with a SQLite implementation (tauri-plugin-sql or
 * Tauri commands backed by rusqlite). See docs/INTEGRATION.md → Database.
 */
export const historyRepository: HistoryRepository = {
  async listSessions() {
    return { sessions: [], total: 0 };
  },
  async getTimeline() {
    return [];
  },
  async getDailyTotals() {
    return [];
  },
  async saveSession() {
    // Not persisted in phase 1.
  },
};
