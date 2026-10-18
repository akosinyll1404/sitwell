import { useState } from "react";
import { DayPicker } from "../components/history/DayPicker";
import { PostureDonut } from "../components/history/PostureDonut";
import { SessionHistoryTable } from "../components/history/SessionHistoryTable";
import { StatTile } from "../components/history/StatTile";
import { TimelineBarChart } from "../components/history/TimelineBarChart";
import { WeekTrendChart } from "../components/history/WeekTrendChart";
import { splitPercent } from "../components/history/postureChart";
import { Card } from "../components/ui/Card";
import { PHASE_COPY, POSTURE_LABEL, TONE_PANEL, postureTone } from "../config/posture";
import { useHistory } from "../hooks/useHistory";
import { formatDuration, formatHms, percent, startOfDay } from "../lib/time";
import type { MonitoringSnapshot, PostureStatus } from "../types/monitoring";

interface HistoryPageProps {
  snapshot: MonitoringSnapshot;
  /** Dev only: show sample data instead of the (empty) repository. */
  useSampleData: boolean;
}

/** Posture Status & History (FR-H1–H4). */
export function HistoryPage({ snapshot, useSampleData }: HistoryPageProps) {
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(Date.now()));
  const { today, week, selected: daily, timeline, sessions } = useHistory(snapshot, useSampleData, selectedDay);
  const viewingToday = selectedDay === today;
  const dayPercents = splitPercent(daily);
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
            sub={`Total ${formatDuration(session.slouchMs + session.poorMs).replace("m", " min")}`}
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

      <Card
        title="Last 7 Days"
        info="Good and poor posture time per day. Click a day to see its details below."
      >
        <WeekTrendChart days={week} today={today} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      </Card>

      <Card
        title="Daily Progress Summary"
        actions={<DayPicker day={selectedDay} today={today} onChange={setSelectedDay} />}
      >
        <div className="grid grid-cols-6 gap-3">
          <StatTile
            className="col-span-2"
            label="Good posture"
            swatch="bg-chart-good"
            value={formatDuration(daily.goodMs)}
            sub={`${dayPercents.goodMs}%`}
          />
          <StatTile
            className="col-span-2"
            label="Slouching"
            swatch="bg-chart-slouch"
            info="Out of your calibrated range for less than your 'Alert after' time (lamp: orange)."
            value={formatDuration(daily.slouchMs)}
            sub={`${dayPercents.slouchMs}%`}
          />
          <StatTile
            className="col-span-2"
            label="Poor posture"
            swatch="bg-chart-poor"
            info="Slouching that lasted longer than your 'Alert after' time (lamp: red)."
            value={formatDuration(daily.poorMs)}
            sub={`${dayPercents.poorMs}%`}
          />
          <StatTile
            className="col-span-3"
            label="Total monitored"
            info="Sitting time recorded on this day while monitoring was running."
            value={formatDuration(daily.totalMs)}
            sub={`${daily.breaksTaken} ${daily.breaksTaken === 1 ? "break" : "breaks"} taken`}
          />
          <StatTile
            className="col-span-3"
            label="Deviations"
            info="Times your posture went from good to poor across all sessions on this day."
            value={String(daily.deviations)}
          />
        </div>

        <p className="mt-5 mb-2 text-sm text-slate-600">Posture throughout the day</p>
        <div className="flex items-end gap-8">
          <div className="min-w-0 flex-1">
            <TimelineBarChart
              buckets={timeline}
              dayStart={daily.dayStart}
              emptyText={viewingToday ? "No posture data recorded today yet." : "No posture data recorded on this day."}
            />
          </div>
          <PostureDonut times={daily} />
        </div>
      </Card>

      <Card title="Session History">
        <SessionHistoryTable sessions={sessions} live={session} liveRunning={running} />
      </Card>
    </div>
  );
}
