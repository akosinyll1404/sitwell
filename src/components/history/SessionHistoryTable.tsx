import { formatClock, formatDate, formatDuration, percent } from "../../lib/time";
import type { SessionRecord } from "../../services/historyRepository";
import type { SessionStats } from "../../types/monitoring";
import { POSTURE_CLASSES, type ClassTimes } from "./postureChart";

interface SessionHistoryTableProps {
  sessions: SessionRecord[];
  /** The session from this app run, shown first while it has data. */
  live: SessionStats;
  liveRunning: boolean;
}

interface Row {
  key: string;
  startTime: number;
  durationMs: number;
  times: ClassTimes;
  deviations: number;
  live: boolean;
}

/** Past sessions with date, duration, and posture summary (FR-H2). */
export function SessionHistoryTable({ sessions, live, liveRunning }: SessionHistoryTableProps) {
  const rows: Row[] = sessions.map((s) => ({
    key: String(s.id),
    startTime: s.startTime,
    durationMs: s.durationSeconds * 1000,
    times: {
      goodMs: s.goodPostureSeconds * 1000,
      slouchMs: s.slouchPostureSeconds * 1000,
      poorMs: s.poorPostureSeconds * 1000,
    },
    deviations: s.deviationCount,
    live: false,
  }));
  if (live.startedAt !== null) {
    rows.unshift({
      key: "live",
      startTime: live.startedAt,
      durationMs: live.elapsedMs,
      times: { goodMs: live.goodMs, slouchMs: live.slouchMs, poorMs: live.poorMs },
      deviations: live.deviations,
      live: true,
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-canvas px-4 py-6 text-center text-sm text-muted">
        No sessions yet. Past sessions will be listed here once monitoring has run and the
        database is connected.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-slate-600">
          <tr>
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 font-medium">Started</th>
            <th className="px-4 py-2.5 font-medium">Duration</th>
            <th className="px-4 py-2.5 font-medium">Good posture</th>
            <th className="px-4 py-2.5 font-medium">Deviations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => {
            const goodPct = percent(row.times.goodMs, row.durationMs);
            return (
              <tr key={row.key} className="text-ink">
                <td className="px-4 py-3">
                  {formatDate(row.startTime)}
                  {row.live && (
                    <span className="ml-2 rounded-full bg-good-bg px-2 py-0.5 text-xs font-semibold text-good-fg">
                      {liveRunning ? "In progress" : "Paused"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatClock(row.startTime)}</td>
                <td className="px-4 py-3 tabular-nums">{formatDuration(row.durationMs)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Good / slouching / poor share of the session. */}
                    <div className="flex h-1.5 w-24 gap-px overflow-hidden rounded-full bg-idle-bg">
                      {POSTURE_CLASSES.map(({ key, bg }) =>
                        row.times[key] > 0 ? (
                          <div
                            key={key}
                            className={`h-full ${bg}`}
                            style={{ width: `${percent(row.times[key], row.durationMs)}%` }}
                          />
                        ) : null,
                      )}
                    </div>
                    <span className="tabular-nums">{goodPct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{row.deviations}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
