import { Check } from "lucide-react";
import { DEVICE_HARDWARE } from "../config/monitoring";
import { useCalibration, type CalibrationProgress } from "../hooks/useCalibration";
import { formatClock, formatDate } from "../lib/time";
import type { CalibrationBaseline, ConnectionState } from "../types/monitoring";
import { OutlineButton } from "../components/ui/OutlineButton";
import { Tooltip } from "../components/ui/Tooltip";

interface CalibrationPageProps {
  /** "onboarding" on first launch; "recalibrate" when opened from the app. */
  mode: "onboarding" | "recalibrate";
  deviceState: ConnectionState;
  existingBaseline: CalibrationBaseline | null;
  onConnectDevice: () => void;
  onCalibrated: (baseline: CalibrationBaseline) => void;
  onContinue: () => void;
  /** Label for the secondary button in recalibrate mode. */
  backLabel?: string;
}

const STEPS = [
  "Sit in your preferred correct posture",
  "Keep your back straight and shoulders relaxed",
  "Hold still while baseline readings are collected",
  "Confirm to save your posture thresholds",
];

/** Posture baseline setup. Shown first, before the dashboard (FR-C1–C4). */
export function CalibrationPage({
  mode,
  deviceState,
  existingBaseline,
  onConnectDevice,
  onCalibrated,
  onContinue,
  backLabel = "Back to Dashboard",
}: CalibrationPageProps) {
  const [progress, startCalibration] = useCalibration(onCalibrated);
  const connected = deviceState === "connected";
  const collecting = progress.status === "collecting";
  const calibrated = progress.status === "success" || existingBaseline !== null;
  const continueLocked = mode === "onboarding" && !calibrated;

  const startLabel =
    progress.status === "failed" ? "Try again" : calibrated ? "Recalibrate" : "Start calibration";

  return (
    <div className="min-h-full bg-canvas px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-10 w-10 rounded-full bg-brand" aria-hidden />
          <span className="text-xl font-bold text-ink">Sitwell Pro</span>
        </div>

        <h1 className="mb-5 text-[28px] leading-tight font-bold text-ink">
          {mode === "onboarding"
            ? "Welcome: let's set up your posture baseline"
            : "Recalibrate your posture baseline"}
        </h1>

        <Stepper calibrated={calibrated} />

        <section className="mt-5 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">Calibrate your posture</h2>
          <p className="mt-1 text-muted">
            SitWell needs your preferred correct sitting posture to set the baseline for detection.
            Make sure your device is connected first.
          </p>

          <DeviceBadge state={deviceState} onConnect={onConnectDevice} />

          <div className="mt-5 grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <ol className="list-decimal space-y-2 pl-5 text-[17px] text-ink">
                {STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <div className="mt-6 flex gap-3">
                <Tooltip
                  content={!connected ? "Connect the SitWell device first" : collecting ? "Calibration in progress" : null}
                  align="start"
                  disabledTarget={!connected || collecting}
                >
                  <button
                    type="button"
                    onClick={startCalibration}
                    disabled={!connected || collecting}
                    className="cursor-pointer rounded-lg bg-brand px-5 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {collecting ? "Calibrating…" : startLabel}
                  </button>
                </Tooltip>
                <Tooltip
                  content={continueLocked ? "Finish calibration first, or choose Skip for now" : null}
                  disabledTarget={continueLocked}
                >
                  <OutlineButton className="px-5 py-3 text-base" onClick={onContinue} disabled={continueLocked}>
                    {mode === "onboarding" ? "Continue to Dashboard" : backLabel}
                  </OutlineButton>
                </Tooltip>
              </div>

              <p className="mt-4 text-sm text-muted">
                You can recalibrate anytime from Settings.
                {mode === "onboarding" && !calibrated && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={onContinue}
                      className="cursor-pointer text-brand underline-offset-2 hover:underline"
                    >
                      Skip for now
                    </button>
                  </>
                )}
              </p>
            </div>

            <ProgressPanel progress={progress} existingBaseline={existingBaseline} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stepper({ calibrated }: { calibrated: boolean }) {
  return (
    <ol className="flex items-center gap-4">
      <li className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-semibold text-white">
          {calibrated ? <Check className="h-5 w-5" strokeWidth={3} /> : 1}
        </span>
        <span className="text-lg font-semibold text-ink">Calibrate posture</span>
      </li>
      <li aria-hidden className="h-0.5 w-14 rounded bg-line" />
      <li className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full font-semibold ${
            calibrated ? "bg-brand text-white" : "bg-sidebar text-slate-600"
          }`}
        >
          2
        </span>
        <span className={`text-lg font-semibold ${calibrated ? "text-ink" : "text-slate-600"}`}>
          Start monitoring
        </span>
      </li>
    </ol>
  );
}

function DeviceBadge({ state, onConnect }: { state: ConnectionState; onConnect: () => void }) {
  const badge = {
    connected: { text: "Device connected", cls: "bg-good-bg text-good-fg" },
    connecting: { text: "Connecting…", cls: "bg-warn-bg text-warn-fg" },
    disconnected: { text: "Device not connected", cls: "bg-white text-slate-600 border border-line" },
  }[state];

  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl bg-canvas px-4 py-3.5">
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${badge.cls}`}>{badge.text}</span>
      <span className="text-muted">{DEVICE_HARDWARE}</span>
      {state === "disconnected" && (
        <OutlineButton className="ml-auto" onClick={onConnect}>
          Connect
        </OutlineButton>
      )}
    </div>
  );
}

function ProgressPanel({
  progress,
  existingBaseline,
}: {
  progress: CalibrationProgress;
  existingBaseline: CalibrationBaseline | null;
}) {
  const { status, collected, required, latest, message, baseline } = progress;
  const shownBaseline = baseline ?? (status === "idle" ? existingBaseline : null);

  let title = "Collecting baseline readings";
  let titleCls = "text-ink";
  let barCls = "bg-brand";
  let fill = 0;
  let body: string;

  if (status === "collecting") {
    fill = collected / required;
    body = message ?? `Collecting ${collected} of ${required} readings… Hold still.`;
  } else if (status === "failed") {
    title = "Calibration failed";
    titleCls = "text-red-700";
    barCls = "bg-red-500";
    fill = collected / required;
    body = message ?? "Something went wrong. Try again.";
  } else if (shownBaseline) {
    title = "Calibration completed";
    titleCls = "text-good-fg";
    barCls = "bg-good-accent";
    fill = 1;
    body = `Baseline saved: pitch ${shownBaseline.basePitch.toFixed(1)}°, roll ${shownBaseline.baseRoll.toFixed(1)}°. Last calibrated: ${formatDate(shownBaseline.calibratedAt)}, ${formatClock(shownBaseline.calibratedAt)}.`;
  } else {
    body = "Not started: readings appear here once calibration begins.";
  }

  return (
    <div
      className={`self-start rounded-xl p-5 ${status === "success" || (shownBaseline && status === "idle") ? "bg-good-bg" : "bg-canvas"}`}
      aria-live="polite"
    >
      <h3 className={`text-lg font-semibold ${titleCls}`}>{title}</h3>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand-soft/50"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={required}
        aria-valuenow={Math.round(fill * required)}
      >
        <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width: `${fill * 100}%` }} />
      </div>
      <p className="mt-3 text-muted">{body}</p>
      {status === "collecting" && latest && (
        <p className="mt-1 text-sm text-muted tabular-nums">
          Pitch {latest.pitch.toFixed(1)}° · Roll {latest.roll.toFixed(1)}°
        </p>
      )}
    </div>
  );
}
