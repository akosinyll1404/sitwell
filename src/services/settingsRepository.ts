import { hasDesktopStorage, storageInvoke } from "./storage";
import { DEFAULT_SETTINGS, type AppSettings, type FeedbackType } from "../types/settings";

const STORAGE_KEY = "sitwell.settings";
const FEEDBACK_TYPES: FeedbackType[] = ["visual", "sound", "both"];

/** Storage interface for user settings (FR-S4). */
export interface SettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
}

/** SQLite is authoritative in the desktop app; browser previews use localStorage. */
let writes: Promise<void> = Promise.resolve();
export const settingsRepository: SettingsRepository = {
  async load() {
    if (!hasDesktopStorage()) {
      try { const raw = window.localStorage.getItem(STORAGE_KEY); return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_SETTINGS }; }
      catch { return { ...DEFAULT_SETTINGS }; }
    }
    const stored = await storageInvoke<unknown>("settings_load");
    if (stored !== null) return sanitize(stored);
    // One-time migration. Keep the old copy as a fallback until SQLite succeeds.
    let legacy: unknown = null;
    try { const raw = window.localStorage.getItem(STORAGE_KEY); if (raw) legacy = JSON.parse(raw); }
    catch { /* An invalid legacy value becomes validated defaults. */ }
    const settings = sanitize(legacy);
    await storageInvoke<void>("settings_save", { settings });
    return settings;
  },
  save(settings) {
    if (!hasDesktopStorage()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return Promise.resolve();
    }
    // Serialize rapid changes so an older write cannot overwrite a newer preference.
    const next = writes.catch(() => {}).then(() => storageInvoke<void>("settings_save", { settings: sanitize(settings) }));
    writes = next;
    return next;
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
  if (typeof v.alertDelaySeconds === "number" && Number.isFinite(v.alertDelaySeconds) && v.alertDelaySeconds > 0) {
    result.alertDelaySeconds = v.alertDelaySeconds;
  }
  if (typeof v.breakIntervalMinutes === "number" && Number.isFinite(v.breakIntervalMinutes) && v.breakIntervalMinutes > 0) {
    result.breakIntervalMinutes = v.breakIntervalMinutes;
  }
  if (FEEDBACK_TYPES.includes(v.feedbackType as FeedbackType)) {
    result.feedbackType = v.feedbackType as FeedbackType;
  }
  return result;
}
