import { Check, CircleHelp, TriangleAlert } from "lucide-react";
import { PHASE_COPY, POSTURE_COPY } from "../../config/posture";
import type { MonitoringPhase, PostureStatus } from "../../types/monitoring";
import { Card } from "../ui/Card";
import { PostureIllustration } from "./PostureIllustration";

interface CurrentPostureCardProps {
  phase: MonitoringPhase;
  posture: PostureStatus;
}

export function CurrentPostureCard({ phase, posture }: CurrentPostureCardProps) {
  const copy =
    phase === "running" && posture !== "no_data"
      ? POSTURE_COPY[posture]
      : PHASE_COPY[phase === "running" ? "awaiting_data" : phase];

  const icon =
    posture === "good" ? (
      <Check className="h-7 w-7 text-good-accent" strokeWidth={2.5} />
    ) : posture === "poor" ? (
      <TriangleAlert className="h-7 w-7 text-poor-accent" strokeWidth={2.25} />
    ) : (
      <CircleHelp className="h-7 w-7 text-slate-400" strokeWidth={2.25} />
    );

  return (
    <Card title="Current Posture" className="flex flex-col">
      <div className="flex min-h-56 flex-1 items-center justify-center rounded-xl bg-canvas p-4">
        <PostureIllustration posture={posture} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="font-semibold text-ink">{copy.headline}</p>
          <p className="text-sm text-muted">{copy.detail}</p>
        </div>
      </div>
    </Card>
  );
}
