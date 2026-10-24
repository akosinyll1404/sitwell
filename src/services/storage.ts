import { invoke, isTauri } from "@tauri-apps/api/core";

const errors = new Map<string, string>();
const listeners = new Set<() => void>();
export function setStorageError(source: string, error: unknown | null): void {
  if (error == null) errors.delete(source);
  else errors.set(source, String(error));
  listeners.forEach(listener => listener());
}
export function storageErrors(): string[] { return [...errors.values()]; }
export function onStorageChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export async function storageInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    const result = await invoke<T>(command, args);
    setStorageError(command, null);
    return result;
  } catch (error) {
    setStorageError(command, error);
    throw error;
  }
}
export const hasDesktopStorage = () => isTauri();
export interface DatabaseInfo {
  path: string; sampleCount: number; sessionCount: number; error: string | null;
}
