import { useCallback, useEffect, useRef, useState } from "react";
import { settingsRepository } from "../services/settingsRepository";
import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings";

/** Loads settings once, then saves every change (FR-S4). */
export function useSettings(): [AppSettings, (changes: Partial<AppSettings>) => void] {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    settingsRepository.load().then((stored) => {
      if (cancelled) return;
      loaded.current = true;
      setSettings(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Don't overwrite stored settings with defaults before they've loaded.
    if (loaded.current) settingsRepository.save(settings);
  }, [settings]);

  const update = useCallback((changes: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...changes }));
  }, []);

  return [settings, update];
}
