import type { Route } from "../../types/navigation";
import { OutlineButton } from "../ui/OutlineButton";

/** Shortcut buttons along the bottom of the dashboard. */
export function QuickActions({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => onNavigate("calibration")}
        className="cursor-pointer rounded-lg bg-brand px-4 py-2.5 text-sm text-white transition-colors hover:bg-blue-700"
      >
        Calibrate
      </button>
      {/* No dedicated Monitoring screen exists yet; it opens Posture Status & History. */}
      <OutlineButton className="py-2.5" onClick={() => onNavigate("history")}>
        Monitoring
      </OutlineButton>
      <OutlineButton className="py-2.5" onClick={() => onNavigate("history")}>
        History
      </OutlineButton>
      <OutlineButton className="col-span-3 py-2.5" onClick={() => onNavigate("settings")}>
        Settings
      </OutlineButton>
    </div>
  );
}
