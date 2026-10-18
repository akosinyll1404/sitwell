import type { MonitoringPhase, PostureStatus } from "../types/monitoring";

/** Color tone of a panel. "break" is the amber used for break reminders. */
export type Tone = "good" | "slouching" | "poor" | "break" | "idle";

/** Labels for each posture state. */
export const POSTURE_LABEL: Record<PostureStatus, string> = {
  good: "Good Posture",
  slouching: "Slouching",
  poor: "Poor Posture",
  no_data: "No Data",
};

/** Copy while monitoring is running, by posture. */
export const POSTURE_COPY: Record<
  Exclude<PostureStatus, "no_data">,
  { headline: string; detail: string; feedback: string }
> = {
  good: {
    headline: "Posture is acceptable",
    detail: "No deviation detected. Data is up to date.",
    feedback: "Good posture, keep it up! Don't forget to take a break once in a while.",
  },
  slouching: {
    headline: "You're slouching",
    detail: "Deviation from your baseline detected.",
    feedback: "You're starting to slouch. Straighten your back and relax your shoulders.",
  },
  poor: {
    headline: "Poor posture",
    detail: "You've been slouching for too long.",
    feedback: "You've been slouching for a while. Sit up straight now and relax your shoulders.",
  },
};

/** Copy when monitoring is not running, by reason. */
export const PHASE_COPY: Record<
  Exclude<MonitoringPhase, "running">,
  { headline: string; detail: string; feedback: string; timer: string }
> = {
  offline: {
    headline: "Device not connected",
    detail: "Connect the SitWell device to start monitoring.",
    feedback: "The SitWell device is offline. Connect it from Device Status to start monitoring.",
    timer: "Device not connected",
  },
  uncalibrated: {
    headline: "Calibration needed",
    detail: "Calibrate your posture to start monitoring.",
    feedback: "Calibrate your posture so SitWell knows what good posture looks like for you.",
    timer: "Calibrate to start monitoring",
  },
  awaiting_data: {
    headline: "Waiting for sensor data",
    detail: "Connected, but no posture readings yet.",
    feedback: "Waiting for posture readings from the SitWell device.",
    timer: "Waiting for sensor data",
  },
  not_seated: {
    headline: "Not seated",
    detail: "Monitoring starts when you sit down.",
    feedback: "Monitoring will start automatically when you sit down.",
    timer: "Waiting for you to sit down",
  },
};

export function postureTone(posture: PostureStatus): Tone {
  return posture === "no_data" ? "idle" : posture;
}

/** Tailwind classes for each tone's soft panel (banner, feedback box, pill). */
export const TONE_PANEL: Record<Tone, string> = {
  good: "bg-good-bg text-good-fg",
  slouching: "bg-slouch-bg text-slouch-fg",
  poor: "bg-bad-bg text-bad-fg",
  break: "bg-warn-bg text-warn-fg",
  idle: "bg-idle-bg text-idle-fg",
};
