import { useEffect, useState } from "react";
import { sampleSessions, sampleTimeline } from "../dev/sampleHistory";
import { mergeTimelines } from "../lib/posture";
import { startOfDay } from "../lib/time";
import { historyRepository, type SessionRecord } from "../services/historyRepository";
import type { MonitoringSnapshot, TimelineBucket } from "../types/monitoring";

export interface DailySummary {
  dayStart: number;
  goodMs: number;
  poorMs: number;
  totalMs: number;
  deviations: number;
  breaksTaken: number;
}

export interface HistoryData {
  daily: DailySummary;
  timeline: TimelineBucket[];
  sessions: SessionRecord[];
}

/**
 * Combines saved history (repository, or sample data in dev) with the live
 * session from this app run.
 */
export function useHistory(snapshot: MonitoringSnapshot, useSampleData: boolean): HistoryData {
  const dayStart = startOfDay(Date.now());
  const [stored, setStored] = useState<{ sessions: SessionRecord[]; timeline: TimelineBucket[] }>({
    sessions: [],
    timeline: [],
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [sessions, timeline] = useSampleData
        ? [sampleSessions(dayStart), sampleTimeline(dayStart)]
        : await Promise.all([
            historyRepository.listSessions({ limit: 20 }),
            historyRepository.getTimeline(dayStart),
          ]);
      if (!cancelled) setStored({ sessions, timeline });
    };
    load().catch((error) => console.error("[history] Failed to load history", error));
    return () => {
      cancelled = true;
    };
  }, [useSampleData, dayStart]);

  const live = snapshot.session;
  const todaysSessions = stored.sessions.filter((s) => s.startTime >= dayStart);
  const goodMs = sum(todaysSessions, (s) => s.goodPostureSeconds * 1000) + live.goodMs;
  const poorMs = sum(todaysSessions, (s) => s.poorPostureSeconds * 1000) + live.poorMs;

  return {
    daily: {
      dayStart,
      goodMs,
      poorMs,
      totalMs: goodMs + poorMs,
      deviations: sum(todaysSessions, (s) => s.deviationCount) + live.deviations,
      breaksTaken: sum(todaysSessions, (s) => s.breaksTaken) + live.breaksTaken,
    },
    timeline: mergeTimelines(
      stored.timeline,
      snapshot.timeline.filter((b) => b.start >= dayStart),
    ),
    sessions: stored.sessions,
  };
}

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}
