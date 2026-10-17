import { Coffee } from "lucide-react";
import { BREAK_MIN_MS } from "../../config/monitoring";
import { formatHms } from "../../lib/time";
import { Card } from "../ui/Card";
import { OutlineButton } from "../ui/OutlineButton";
import { Tooltip } from "../ui/Tooltip";

const BREAK_INFO = `Counts down while you sit. Standing for ${BREAK_MIN_MS / 60_000}+ minutes counts as a break and restarts it.`;

interface BreakCardProps {
  remainingMs: number;
  /** The countdown only moves while the user is sitting and monitored. */
  running: boolean;
  /** Break reminders setting. */
  enabled: boolean;
  onReschedule: () => void;
  onOpenSettings: () => void;
}

export function BreakCard({ remainingMs, running, enabled, onReschedule, onOpenSettings }: BreakCardProps) {
  if (!enabled) {
    return (
      <Card title="Take a break in">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-idle-bg px-4 py-6 text-center">
          <p className="text-idle-fg">Break reminders are turned off.</p>
          <OutlineButton onClick={onOpenSettings}>Open Settings</OutlineButton>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Take a break in" info={BREAK_INFO}>
      <div className="flex flex-col items-center gap-3 rounded-xl bg-poor-bg px-4 py-4">
        <div className={`flex items-center gap-3 text-poor-fg ${running ? "" : "opacity-60"}`}>
          <Coffee className="h-6 w-6" strokeWidth={2} />
          <span className="text-base">Next break:</span>
          <span className="text-5xl leading-tight font-extrabold tabular-nums">
            {formatHms(remainingMs)}
          </span>
        </div>
        <Tooltip content={running ? null : "Available while monitoring is running"} disabledTarget={!running}>
          <OutlineButton onClick={onReschedule} disabled={!running}>
            Reschedule Break
          </OutlineButton>
        </Tooltip>
      </div>
    </Card>
  );
}
