import { PITCH_THRESHOLD_DEG, ROLL_THRESHOLD_DEG, TIMELINE_BUCKET_MS } from "../config/monitoring";
import type { CalibrationBaseline, TimelineBucket } from "../types/monitoring";
import { startOfDay } from "./time";

/** Classifies a reading against the user's baseline (FR-M2). */
export function classifyPosture(
  reading: { pitch: number; roll: number },
  baseline: CalibrationBaseline,
): "good" | "poor" {
  const pitchOff = Math.abs(reading.pitch - baseline.basePitch);
  const rollOff = Math.abs(reading.roll - baseline.baseRoll);
  return pitchOff > PITCH_THRESHOLD_DEG || rollOff > ROLL_THRESHOLD_DEG ? "poor" : "good";
}

/** Start of the timeline slot that contains `ts`. */
export function bucketStart(ts: number): number {
  const day = startOfDay(ts);
  return day + Math.floor((ts - day) / TIMELINE_BUCKET_MS) * TIMELINE_BUCKET_MS;
}

/** Returns a new timeline with `ms` of `status` time added at `ts`. */
export function addToTimeline(
  timeline: TimelineBucket[],
  ts: number,
  status: "good" | "poor",
  ms: number,
): TimelineBucket[] {
  const start = bucketStart(ts);
  const index = timeline.findIndex((b) => b.start === start);
  const bucket = index >= 0 ? timeline[index] : { start, goodMs: 0, poorMs: 0 };
  const updated = {
    ...bucket,
    goodMs: bucket.goodMs + (status === "good" ? ms : 0),
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
        ? { ...existing, goodMs: existing.goodMs + bucket.goodMs, poorMs: existing.poorMs + bucket.poorMs }
        : bucket,
    );
  }
  return [...byStart.values()].sort((x, y) => x.start - y.start);
}
