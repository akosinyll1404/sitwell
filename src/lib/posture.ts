import { PITCH_THRESHOLD_DEG, ROLL_THRESHOLD_DEG, TIMELINE_BUCKET_MS } from "../config/monitoring";
import type { CalibrationBaseline, TimelineBucket } from "../types/monitoring";
import { startOfDay } from "./time";

/**
 * Compares one reading with the user's baseline (FR-M2). Whether a deviation
 * counts as "slouching" or "poor" depends on how long it lasts, which
 * useMonitoring tracks.
 */
export function classifyPosture(
  reading: { pitch: number; roll: number },
  baseline: CalibrationBaseline,
): "good" | "deviated" {
  const pitchOff = Math.abs(reading.pitch - baseline.basePitch);
  const rollOff = Math.abs(reading.roll - baseline.baseRoll);
  return pitchOff > PITCH_THRESHOLD_DEG || rollOff > ROLL_THRESHOLD_DEG ? "deviated" : "good";
}

/** Start of the timeline slot that contains `ts`. */
export function bucketStart(ts: number): number {
  const day = startOfDay(ts);
  return day + Math.floor((ts - day) / TIMELINE_BUCKET_MS) * TIMELINE_BUCKET_MS;
}

export type TimeClass = "good" | "slouching" | "poor";

/** Returns a new timeline with `ms` of `status` time added at `ts`. */
export function addToTimeline(
  timeline: TimelineBucket[],
  ts: number,
  status: TimeClass,
  ms: number,
): TimelineBucket[] {
  const start = bucketStart(ts);
  const index = timeline.findIndex((b) => b.start === start);
  const bucket = index >= 0 ? timeline[index] : { start, goodMs: 0, slouchMs: 0, poorMs: 0 };
  const updated = {
    ...bucket,
    goodMs: bucket.goodMs + (status === "good" ? ms : 0),
    slouchMs: bucket.slouchMs + (status === "slouching" ? ms : 0),
    poorMs: bucket.poorMs + (status === "poor" ? ms : 0),
  };
  if (index < 0) return [...timeline, updated];
  const copy = timeline.slice();
  copy[index] = updated;
  return copy;
}

/** Sums two timelines slot by slot. */
export function mergeTimelines(a: TimelineBucket[], b: TimelineBucket[]): TimelineBucket[] {
  const byStart = new Map<number, TimelineBucket>();
  for (const bucket of [...a, ...b]) {
    const existing = byStart.get(bucket.start);
    byStart.set(
      bucket.start,
      existing
        ? {
            ...existing,
            goodMs: existing.goodMs + bucket.goodMs,
            slouchMs: existing.slouchMs + bucket.slouchMs,
            poorMs: existing.poorMs + bucket.poorMs,
          }
        : bucket,
    );
  }
  return [...byStart.values()].sort((x, y) => x.start - y.start);
}
