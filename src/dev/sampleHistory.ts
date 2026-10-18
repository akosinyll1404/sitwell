import { TIMELINE_BUCKET_MS } from "../config/monitoring";
import { addDays, startOfDay } from "../lib/time";
import type { DayTotals, SessionPage, SessionRecord } from "../services/historyRepository";
import type { TimelineBucket } from "../types/monitoring";

/**
 * Deterministic sample data for previewing the History screen before the
 * database exists. Only used when "Sample history data" is enabled in the dev
 * simulator. Each day's sessions, timeline, and totals agree with each other.
 */

const HOUR = 3_600_000;
const MINUTE = 60_000;
const DAY_MS = 24 * HOUR;
const SLOTS_PER_DAY = 24; // 8 AM – 8 PM in 30-minute slots

/** Small seeded PRNG so every day looks different but stable across renders. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(dayStart: number): number {
  return Math.round(dayStart / DAY_MS);
}

/** One day without data (4 days ago) so empty days can be previewed. */
function isRestDay(dayStart: number): boolean {
  return dayStart === addDays(startOfDay(Date.now()), -4);
}

export function sampleTimeline(dayStart: number): TimelineBucket[] {
  if (isRestDay(dayStart)) return [];
  const random = rng(seedFor(dayStart));
  const basePoor = 0.04 + random() * 0.12;
  const buckets: TimelineBucket[] = [];
  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    const monitored = (20 + Math.floor(random() * 10)) * MINUTE;
    const offShare = random() < 0.15 ? 0.45 + random() * 0.25 : basePoor * random() * 1.5;
    // Long deviations become poor posture; short ones stay slouching.
    const poorPart = offShare > 0.3 ? 0.6 : 0.25;
    const offMs = monitored * offShare;
    buckets.push({
      start: dayStart + 8 * HOUR + i * TIMELINE_BUCKET_MS,
      goodMs: Math.round(monitored - offMs),
      slouchMs: Math.round(offMs * (1 - poorPart)),
      poorMs: Math.round(offMs * poorPart),
    });
  }
  return buckets;
}

/** Morning (8 AM–2 PM) and afternoon (2 PM–8 PM) sessions built from the timeline. */
function sessionsForDay(dayStart: number): SessionRecord[] {
  const timeline = sampleTimeline(dayStart);
  if (timeline.length === 0) return [];
  const random = rng(seedFor(dayStart) + 7);
  const halves = [timeline.slice(0, 12), timeline.slice(12)];

  return halves
    .map((slots, k) => {
      const goodMs = slots.reduce((t, b) => t + b.goodMs, 0);
      const slouchMs = slots.reduce((t, b) => t + b.slouchMs, 0);
      const poorMs = slots.reduce((t, b) => t + b.poorMs, 0);
      const startTime = slots[0].start;
      const durationSeconds = Math.round((goodMs + slouchMs + poorMs) / 1000);
      const deviations = 1 + Math.floor(random() * 4);
      return {
        id: seedFor(dayStart) * 10 + k,
        startTime,
        endTime: slots[slots.length - 1].start + TIMELINE_BUCKET_MS,
        durationSeconds,
        goodPostureSeconds: Math.round(goodMs / 1000),
        slouchPostureSeconds: Math.round(slouchMs / 1000),
        poorPostureSeconds: Math.round(poorMs / 1000),
        alertCount: deviations,
        deviationCount: deviations,
        breaksTaken: 1 + Math.floor(random() * 3),
      };
    })
    .reverse(); // newest first
}

const SAMPLE_DAYS = 30;

/** Sessions from the last `days` days, newest first. */
export function sampleSessions(today: number, days = SAMPLE_DAYS): SessionRecord[] {
  const sessions: SessionRecord[] = [];
  for (let i = 0; i < days; i++) sessions.push(...sessionsForDay(addDays(today, -i)));
  return sessions;
}

/** One page of the sample sessions (mirrors historyRepository.listSessions). */
export function sampleSessionPage(today: number, offset: number, limit: number): SessionPage {
  const all = sampleSessions(today);
  return { sessions: all.slice(offset, offset + limit), total: all.length };
}

export function sampleDailyTotals(fromDay: number, toDay: number): DayTotals[] {
  const totals: DayTotals[] = [];
  for (let day = fromDay; day <= toDay; day = addDays(day, 1)) {
    const sessions = sessionsForDay(day);
    if (sessions.length === 0) continue;
    totals.push({
      dayStart: day,
      goodMs: sessions.reduce((t, s) => t + s.goodPostureSeconds * 1000, 0),
      slouchMs: sessions.reduce((t, s) => t + s.slouchPostureSeconds * 1000, 0),
      poorMs: sessions.reduce((t, s) => t + s.poorPostureSeconds * 1000, 0),
      deviations: sessions.reduce((t, s) => t + s.deviationCount, 0),
      breaksTaken: sessions.reduce((t, s) => t + s.breaksTaken, 0),
    });
  }
  return totals;
}
