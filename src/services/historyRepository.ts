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
  poorPostureSeconds: number;
  alertCount: number;
  deviationCount: number;
  breaksTaken: number;
}

/** Storage interface the History screen reads from. */
export interface HistoryRepository {
  /** Most recent sessions first. */
  listSessions(options?: { limit?: number }): Promise<SessionRecord[]>;
  /** Good/poor time per 30-minute slot for the day starting at `dayStart`. */
  getTimeline(dayStart: number): Promise<TimelineBucket[]>;
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
    return [];
  },
  async getTimeline() {
    return [];
  },
  async saveSession() {
    // Not persisted in phase 1.
  },
};
