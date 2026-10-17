import { Bluetooth, BluetoothOff, LoaderCircle, Wifi, WifiOff, type LucideIcon } from "lucide-react";
import { Checkbox, Select, SettingRow } from "../components/settings/SettingRow";
import { Card } from "../components/ui/Card";
import { OutlineButton } from "../components/ui/OutlineButton";
import { Tooltip } from "../components/ui/Tooltip";
import {
  DEVICE_HARDWARE,
  DEVICE_NAME,
  DEVICE_TRANSPORT,
  LAMP_NAME,
  LAMP_TRANSPORT,
} from "../config/monitoring";
import type { MonitoringActions } from "../hooks/useMonitoring";
import { formatClock, formatDate } from "../lib/time";
import type { CalibrationBaseline, ConnectionState, MonitoringSnapshot } from "../types/monitoring";
import type { AppSettings, FeedbackType } from "../types/settings";

interface SettingsPageProps {
  snapshot: MonitoringSnapshot;
  actions: MonitoringActions;
  settings: AppSettings;
  onChange: (changes: Partial<AppSettings>) => void;
  onRecalibrate: () => void;
}

const REMINDER_INTERVALS = [15, 30, 45, 60, 90].map((m) => ({ value: m, label: `${m} minutes` }));
const ALERT_DELAYS = [
  { value: 10, label: "10 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 120, label: "2 minutes" },
  { value: 300, label: "5 minutes" },
];
const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: "visual", label: "Visual" },
  { value: "sound", label: "Sound" },
  { value: "both", label: "Visual + sound" },
];

const CALIBRATION_STEPS = [
  "Sit in your preferred correct posture",
  "Keep your back straight",
  "Hold still while baseline is collected",
  "Confirm thresholds",
];

/** Settings (design screen 4; FR-S1–S4). Changes save automatically. */
export function SettingsPage({ snapshot, actions, settings, onChange, onRecalibrate }: SettingsPageProps) {
  const { device, lamp } = snapshot.connections;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-[28px] leading-tight font-bold text-ink">Settings</h1>
        <p className="text-sm text-muted">Manage your device, calibration, and notifications.</p>
      </header>

      <Card title="Device Connection">
        <div className="divide-y divide-line">
          <DeviceRow
            icon={device === "connected" ? Wifi : WifiOff}
            name={DEVICE_NAME}
            detail={`${DEVICE_HARDWARE} via ${DEVICE_TRANSPORT}`}
            state={device}
          />
          <DeviceRow
            icon={lamp === "connected" ? Bluetooth : BluetoothOff}
            name={LAMP_NAME}
            detail={
              device === "connected"
                ? `Paired to ${DEVICE_HARDWARE} via ${LAMP_TRANSPORT}`
                : `Connect the ${DEVICE_NAME} first`
            }
            state={lamp}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Tooltip
            content={device === "connected" ? "Already connected" : device === "connecting" ? "Scan in progress" : null}
            align="start"
            disabledTarget={device !== "disconnected"}
          >
            <button
              type="button"
              onClick={actions.connectDevice}
              disabled={device !== "disconnected"}
              className="cursor-pointer rounded-lg bg-brand px-5 py-2.5 text-[15px] text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {device === "connecting" ? "Scanning…" : "Scan for device"}
            </button>
          </Tooltip>
          <Tooltip
            content={device === "connecting" ? "Connection in progress" : null}
            disabledTarget={device === "connecting"}
          >
            <OutlineButton
              className="px-5 py-2.5 text-[15px]"
              onClick={actions.reconnectDevice}
              disabled={device === "connecting"}
            >
              Reconnect / Retry
            </OutlineButton>
          </Tooltip>
          <Tooltip
            content={
              device !== "connected"
                ? `Connect the ${DEVICE_NAME} first`
                : lamp === "connecting"
                  ? "Reconnecting to the lamp…"
                  : null
            }
            disabledTarget={device !== "connected" || lamp === "connecting"}
          >
            <OutlineButton
              className="px-5 py-2.5 text-[15px]"
              onClick={actions.reconnectLamp}
              disabled={device !== "connected" || lamp === "connecting"}
            >
              Reconnect lamp
            </OutlineButton>
          </Tooltip>
        </div>
      </Card>

      <Card title="Posture Calibration">
        <div className="grid grid-cols-2 gap-6">
          <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-ink">
            {CALIBRATION_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <CalibrationStatus baseline={snapshot.calibration} onRecalibrate={onRecalibrate} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Notification Settings">
          <SettingRow label="Posture alerts" description="Notify on sustained deviation" htmlFor="posture-alerts">
            <Checkbox
              id="posture-alerts"
              checked={settings.postureAlerts}
              onChange={(postureAlerts) => onChange({ postureAlerts })}
            />
          </SettingRow>
          <SettingRow label="Alert after" description="Poor posture must last this long" htmlFor="alert-delay">
            <Select
              id="alert-delay"
              value={settings.alertDelaySeconds}
              options={ALERT_DELAYS}
              disabled={!settings.postureAlerts}
              onChange={(alertDelaySeconds) => onChange({ alertDelaySeconds })}
            />
          </SettingRow>
          <SettingRow label="Break reminders" description="Remind me to take a break" htmlFor="break-reminders">
            <Checkbox
              id="break-reminders"
              checked={settings.breakReminders}
              onChange={(breakReminders) => onChange({ breakReminders })}
            />
          </SettingRow>
          <SettingRow label="Reminder interval" htmlFor="reminder-interval">
            <Select
              id="reminder-interval"
              value={settings.breakIntervalMinutes}
              options={REMINDER_INTERVALS}
              disabled={!settings.breakReminders}
              onChange={(breakIntervalMinutes) => onChange({ breakIntervalMinutes })}
            />
          </SettingRow>
        </Card>

        <Card title="Feedback Settings">
          <SettingRow
            label="Alert activation"
            description="Enable posture alerts on app and device"
            htmlFor="alert-activation"
          >
            <Checkbox
              id="alert-activation"
              checked={settings.alertActivation}
              onChange={(alertActivation) => onChange({ alertActivation })}
            />
          </SettingRow>
          <SettingRow
            label="Alert repetition"
            description="Repeat until posture is corrected"
            htmlFor="alert-repetition"
          >
            <Checkbox
              id="alert-repetition"
              checked={settings.alertRepetition}
              disabled={!settings.alertActivation}
              onChange={(alertRepetition) => onChange({ alertRepetition })}
            />
          </SettingRow>
          <SettingRow label="Feedback type" description="How alerts get your attention" htmlFor="feedback-type">
            <Select
              id="feedback-type"
              value={settings.feedbackType}
              options={FEEDBACK_TYPES}
              disabled={!settings.alertActivation}
              onChange={(feedbackType) => onChange({ feedbackType })}
            />
          </SettingRow>
        </Card>
      </div>

      <p className="text-center text-xs text-muted">Changes are saved automatically.</p>
    </div>
  );
}

function DeviceRow({
  icon: Icon,
  name,
  detail,
  state,
}: {
  icon: LucideIcon;
  name: string;
  detail: string;
  state: ConnectionState;
}) {
  const pill = {
    connected: { text: "Connected", cls: "bg-good-bg text-good-fg" },
    connecting: { text: "Connecting…", cls: "bg-poor-bg text-poor-fg" },
    disconnected: { text: "Offline", cls: "bg-idle-bg text-idle-fg" },
  }[state];
  const ShownIcon = state === "connecting" ? LoaderCircle : Icon;

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <ShownIcon
        className={`h-6 w-6 shrink-0 ${
          state === "connected" ? "text-brand" : state === "connecting" ? "animate-spin text-poor-accent" : "text-slate-400"
        }`}
        strokeWidth={2}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold text-ink">{name}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${pill.cls}`}>{pill.text}</span>
    </div>
  );
}

function CalibrationStatus({
  baseline,
  onRecalibrate,
}: {
  baseline: CalibrationBaseline | null;
  onRecalibrate: () => void;
}) {
  if (!baseline) {
    return (
      <div className="rounded-xl bg-idle-bg p-4">
        <p className="font-semibold text-idle-fg">Not calibrated yet</p>
        <p className="text-sm text-muted">Monitoring starts after your posture baseline is saved.</p>
        <button
          type="button"
          onClick={onRecalibrate}
          className="mt-3 cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
        >
          Calibrate now
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-good-bg p-4">
      <p className="text-lg font-semibold text-good-fg">Calibration completed</p>
      <p className="text-sm text-slate-600">
        Last calibrated: {formatDate(baseline.calibratedAt)}, {formatClock(baseline.calibratedAt)}
      </p>
      <OutlineButton className="mt-3" onClick={onRecalibrate}>
        Recalibrate
      </OutlineButton>
    </div>
  );
}
