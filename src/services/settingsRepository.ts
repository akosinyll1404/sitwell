import { DEFAULT_SETTINGS, type AppSettings, type FeedbackType } from "../types/settings";

const STORAGE_KEY = "sitwell.settings";
const FEEDBACK_TYPES: FeedbackType[] = ["visual", "sound", "both"];

/** Storage interface for user settings (FR-S4). */
export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

/**
 * PHASE 1: settings persist in the app's WebView localStorage so they survive
 * restarts today.
 *
 * TODO(database): move to the SQLite `settings` table (one key per field,
 * see docs/INTEGRATION.md → Database). Keep the same interface.
 */
export const settingsRepository: SettingsRepository = {
  async load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
    } catch (error) {
      console.warn("[settings] Could not load settings, using defaults", error);
      return { ...DEFAULT_SETTINGS };
    }
  },
  async save(settings) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("[settings] Could not save settings", error);
    }
  },
};

/** Merges stored values over defaults, dropping anything malformed. */
function sanitize(value: unknown): AppSettings {
  const result = { ...DEFAULT_SETTINGS };
  if (typeof value !== "object" || value === null) return result;
  const v = value as Record<string, unknown>;

  for (const key of ["postureAlerts", "breakReminders", "alertActivation", "alertRepetition"] as const) {
    if (typeof v[key] === "boolean") result[key] = v[key];
  }
  if (typeof v.alertDelaySeconds === "number" && v.alertDelaySeconds > 0) {
    result.alertDelaySeconds = v.alertDelaySeconds;
  }
  if (typeof v.breakIntervalMinutes === "number" && v.breakIntervalMinutes > 0) {
    result.breakIntervalMinutes = v.breakIntervalMinutes;
  }
  if (FEEDBACK_TYPES.includes(v.feedbackType as FeedbackType)) {
    result.feedbackType = v.feedbackType as FeedbackType;
  }
  return result;
}
