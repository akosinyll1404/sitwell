import { PostureDonut } from "../components/history/PostureDonut";
import { SessionHistoryTable } from "../components/history/SessionHistoryTable";
import { StatTile } from "../components/history/StatTile";
import { TimelineBarChart } from "../components/history/TimelineBarChart";
import { Card } from "../components/ui/Card";
import { PHASE_COPY, POSTURE_LABEL, TONE_PANEL, postureTone } from "../config/posture";
import { useHistory } from "../hooks/useHistory";
import { formatDate, formatDuration, formatHms, percent } from "../lib/time";
import type { MonitoringSnapshot, PostureStatus } from "../types/monitoring";

interface HistoryPageProps {
  snapshot: MonitoringSnapshot;
  /** Dev only: show sample data instead of the (empty) repository. */
  useSampleData: boolean;
}

/** Posture Status & History (FR-H1–H4). */
export function HistoryPage({ snapshot, useSampleData }: HistoryPageProps) {
  const { daily, timeline, sessions } = useHistory(snapshot, useSampleData);
  const { session, posture, phase } = snapshot;
  const running = phase === "running";

  const otherStates = (Object.keys(POSTURE_LABEL) as PostureStatus[])
    .filter((p) => p !== posture)
    .map((p) => POSTURE_LABEL[p])
    .join(", ");

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-[28px] leading-tight font-bold text-ink">Posture Status &amp; History</h1>
        <p className="text-sm text-muted">Track your posture and build better habits.</p>
      </header>

      <Card title="Current Posture Status">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${TONE_PANEL[postureTone(posture)]}`}
          >
            {POSTURE_LABEL[posture]}
          </span>
          <span className="text-sm text-muted">Other states: {otherStates}</span>
        </div>
      </Card>

      <Card title="Current Session Statistics">
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Session duration"
            value={formatHms(session.elapsedMs)}
            sub={phase === "running" ? "Session in progress" : PHASE_COPY[phase].timer}
          />
          <StatTile
            label="Deviations detected"
            info="Times your posture went from good to poor during this session."
            value={String(session.deviations)}
            sub={`Total ${formatDuration(session.poorMs).replace("m", " min")}`}
          />
          <StatTile
            className="col-span-2"
            label="Acceptable posture"
            info="Share of sitting time within your calibrated posture range."
            value={session.elapsedMs > 0 ? `${percent(session.goodMs, session.elapsedMs)}%` : "—"}
            sub="Time in range"
          />
        </div>
      </Card>

      <Card title="Daily Progress Summary">
        <p className="-mt-2 mb-3 text-sm text-muted">{formatDate(daily.dayStart)}</p>
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Good posture"
            value={formatDuration(daily.goodMs)}
            sub={`${percent(daily.goodMs, daily.totalMs)}%`}
          />
          <StatTile
            label="Poor posture"
            value={formatDuration(daily.poorMs)}
            sub={`${daily.totalMs > 0 ? 100 - percent(daily.goodMs, daily.totalMs) : 0}%`}
          />
          <StatTile
            label="Total monitored"
            info="Sitting time recorded today while monitoring was running."
            value={formatDuration(daily.totalMs)}
            sub={`${daily.breaksTaken} ${daily.breaksTaken === 1 ? "break" : "breaks"} taken`}
          />
          <StatTile label="Deviations" value={String(daily.deviations)} />
        </div>

        <p className="mt-5 mb-2 text-sm text-slate-600">Posture throughout the day</p>
        <div className="flex items-end gap-8">
          <div className="min-w-0 flex-1">
            <TimelineBarChart buckets={timeline} dayStart={daily.dayStart} />
          </div>
          <PostureDonut goodMs={daily.goodMs} poorMs={daily.poorMs} />
        </div>
      </Card>

      <Card title="Session History">
        <SessionHistoryTable sessions={sessions} live={session} liveRunning={running} />
      </Card>
    </div>
  );
}
