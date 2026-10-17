/** How alerts are delivered (FR-S3). */
export type FeedbackType = "visual" | "sound" | "both";

/** User preferences shown on the Settings screen. */
export interface AppSettings {
  /** Notify when poor posture is sustained (FR-N1). */
  postureAlerts: boolean;
  /** How long poor posture must last before alerting, in seconds. */
  alertDelaySeconds: number;
  /** Remind the user to take breaks (FR-N2). */
  breakReminders: boolean;
  breakIntervalMinutes: number;
  /** Enable posture alerts on both the app and the device/lamp. */
  alertActivation: boolean;
  /** Keep repeating the alert until posture is corrected. */
  alertRepetition: boolean;
  feedbackType: FeedbackType;
}

export const DEFAULT_SETTINGS: AppSettings = {
  postureAlerts: true,
  alertDelaySeconds: 30,
  breakReminders: true,
  breakIntervalMinutes: 30,
  alertActivation: true,
  alertRepetition: false,
  feedbackType: "both",
};
