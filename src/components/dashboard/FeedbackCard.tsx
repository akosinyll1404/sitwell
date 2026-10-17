import { PHASE_COPY, POSTURE_COPY, TONE_PANEL, type Tone } from "../../config/posture";
import type { MonitoringPhase, PostureStatus } from "../../types/monitoring";
import { Card } from "../ui/Card";

interface FeedbackCardProps {
  phase: MonitoringPhase;
  posture: PostureStatus;
  breakDue: boolean;
}

export function FeedbackCard({ phase, posture, breakDue }: FeedbackCardProps) {
  let message: string;
  let tone: Tone;

  if (phase === "running" && breakDue) {
    // A due break takes priority over routine posture feedback.
    message = "Time for a break! Stand up, stretch, and rest your eyes for a few minutes.";
    tone = "poor";
  } else if (phase === "running" && posture !== "no_data") {
    message = POSTURE_COPY[posture].feedback;
    tone = posture;
  } else {
    message = PHASE_COPY[phase === "running" ? "awaiting_data" : phase].feedback;
    tone = "idle";
  }

  return (
    <Card title="Posture Feedback and Alerts">
      <p aria-live="polite" className={`rounded-xl px-4 py-3.5 text-base ${TONE_PANEL[tone]}`}>
        {message}
      </p>
    </Card>
  );
}
