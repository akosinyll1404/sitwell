import type { SessionRecord } from "../services/historyRepository";
import type { TimelineBucket } from "../types/monitoring";
import { TIMELINE_BUCKET_MS } from "../config/monitoring";

/**
 * Deterministic sample data for previewing the History screen before the
 * database exists. Only used when "Sample history" is enabled in the dev panel.
 */

const HOUR = 3_600_000;
const MINUTE = 60_000;
// Slots (from 8 AM) with mostly poor posture, roughly matching the design.
const POOR_SLOTS = new Set([13, 14, 19, 20]);

export function sampleTimeline(dayStart: number): TimelineBucket[] {
  const buckets: TimelineBucket[] = [];
  for (let i = 0; i < 24; i++) {
    const monitored = (22 + ((i * 7) % 8)) * MINUTE;
    const poorShare = POOR_SLOTS.has(i) ? 0.55 : ((i * 3) % 5) * 0.02;
    buckets.push({
      start: dayStart + 8 * HOUR + i * TIMELINE_BUCKET_MS,
      goodMs: Math.round(monitored * (1 - poorShare)),
      poorMs: Math.round(monitored * poorShare),
    });
  }
  return buckets;
}

export function sampleSessions(dayStart: number): SessionRecord[] {
  const specs = [
    { dayOffset: 0, startHour: 13.5, minutes: 205, goodPct: 0.84, deviations: 3, breaks: 2 },
    { dayOffset: 0, startHour: 8, minutes: 290, goodPct: 0.9, deviations: 3, breaks: 3 },
    { dayOffset: -1, startHour: 15, minutes: 140, goodPct: 0.78, deviations: 5, breaks: 1 },
    { dayOffset: -1, startHour: 9, minutes: 230, goodPct: 0.88, deviations: 2, breaks: 2 },
    { dayOffset: -2, startHour: 10, minutes: 175, goodPct: 0.81, deviations: 4, breaks: 2 },
  ];
  return specs.map((s, i) => {
    const startTime = dayStart + s.dayOffset * 24 * HOUR + s.startHour * HOUR;
    const durationSeconds = s.minutes * 60;
    const goodPostureSeconds = Math.round(durationSeconds * s.goodPct);
    return {
      id: specs.length - i,
      startTime,
      endTime: startTime + durationSeconds * 1000,
      durationSeconds,
      goodPostureSeconds,
      poorPostureSeconds: durationSeconds - goodPostureSeconds,
      alertCount: s.deviations,
      deviationCount: s.deviations,
      breaksTaken: s.breaks,
    };
  });
}
