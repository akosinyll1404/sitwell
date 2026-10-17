import { BreakCard } from "../components/dashboard/BreakCard";
import { CurrentPostureCard } from "../components/dashboard/CurrentPostureCard";
import { DeviceStatusCard } from "../components/dashboard/DeviceStatusCard";
import { FeedbackCard } from "../components/dashboard/FeedbackCard";
import { PostureBanner } from "../components/dashboard/PostureBanner";
import { QuickActions } from "../components/dashboard/QuickActions";
import { SittingDurationCard } from "../components/dashboard/SittingDurationCard";
import type { MonitoringActions } from "../hooks/useMonitoring";
import type { MonitoringSnapshot } from "../types/monitoring";
import type { AppSettings } from "../types/settings";
import type { Route } from "../types/navigation";

interface DashboardPageProps {
  snapshot: MonitoringSnapshot;
  actions: MonitoringActions;
  settings: AppSettings;
  onNavigate: (route: Route) => void;
}

export function DashboardPage({ snapshot, actions, settings, onNavigate }: DashboardPageProps) {
  const running = snapshot.phase === "running";

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-[28px] leading-tight font-bold text-ink">Current Posture</h1>
        <p className="text-sm text-muted">Live overview of your sitting session.</p>
      </header>

      <PostureBanner posture={snapshot.posture} />

      <div className="grid grid-cols-2 gap-4">
        <CurrentPostureCard phase={snapshot.phase} posture={snapshot.posture} />
        <div className="flex flex-col gap-4">
          <DeviceStatusCard
            device={snapshot.connections.device}
            lamp={snapshot.connections.lamp}
            phase={snapshot.phase}
            onConnectDevice={actions.connectDevice}
            onReconnectDevice={actions.reconnectDevice}
            onReconnectLamp={actions.reconnectLamp}
          />
          <SittingDurationCard elapsedMs={snapshot.session.elapsedMs} phase={snapshot.phase} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FeedbackCard
          phase={snapshot.phase}
          posture={snapshot.posture}
          breakDue={settings.breakReminders && snapshot.breakRemainingMs === 0}
        />
        <BreakCard
          remainingMs={snapshot.breakRemainingMs}
          running={running}
          enabled={settings.breakReminders}
          onReschedule={actions.rescheduleBreak}
          onOpenSettings={() => onNavigate("settings")}
        />
      </div>

      <QuickActions onNavigate={onNavigate} />
    </div>
  );
}
