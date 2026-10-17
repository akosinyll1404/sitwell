import { PHASE_COPY } from "../../config/posture";
import { formatHms } from "../../lib/time";
import type { MonitoringPhase } from "../../types/monitoring";
import { Card } from "../ui/Card";

interface SittingDurationCardProps {
  elapsedMs: number;
  phase: MonitoringPhase;
}

/** Session timer. Only counts while calibrated, connected, and seated. */
export function SittingDurationCard({ elapsedMs, phase }: SittingDurationCardProps) {
  const running = phase === "running";
  const caption =
    running ? "Monitoring in progress" : elapsedMs > 0 ? `Paused · ${PHASE_COPY[phase].timer}` : PHASE_COPY[phase].timer;

  return (
    <Card
      title="Sitting Duration Tracking"
      info="Counts only while the device is connected, you're calibrated, and you're sitting."
      className="flex-1"
    >
      <div
        className={`flex flex-col items-center rounded-xl px-4 py-4 ${
          running ? "bg-good-bg" : "bg-idle-bg"
        }`}
      >
        <span className="text-sm text-muted">Current session</span>
        <span
          className={`text-5xl leading-tight font-extrabold tabular-nums ${
            running ? "text-good-fg" : "text-idle-fg"
          }`}
        >
          {formatHms(elapsedMs)}
        </span>
        <span className="text-sm text-muted">{caption}</span>
      </div>
    </Card>
  );
}
