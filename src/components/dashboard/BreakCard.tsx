import { Coffee } from "lucide-react";
import { formatHms } from "../../lib/time";
import { Card } from "../ui/Card";
import { OutlineButton } from "../ui/OutlineButton";

interface BreakCardProps {
  remainingMs: number;
  /** The countdown only moves while the user is sitting and monitored. */
  running: boolean;
  onReschedule: () => void;
}

export function BreakCard({ remainingMs, running, onReschedule }: BreakCardProps) {
  return (
    <Card title="Take a break in">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-poor-bg px-4 py-4">
        <div className={`flex items-center gap-3 text-poor-fg ${running ? "" : "opacity-60"}`}>
          <Coffee className="h-6 w-6" strokeWidth={2} />
          <span className="text-base">Next break:</span>
          <span className="text-5xl leading-tight font-extrabold tabular-nums">
            {formatHms(remainingMs)}
          </span>
        </div>
        <OutlineButton onClick={onReschedule} disabled={!running}>
          Reschedule Break
        </OutlineButton>
      </div>
    </Card>
  );
}
