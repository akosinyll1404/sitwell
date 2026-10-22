/**
 * Posture state shown across the app (FR-D1). Matches the BLE Lamp colors:
 * - good:      within the calibrated range          → white light
 * - slouching: deviating, for less than "Alert after" → orange light
 * - poor:      deviating for "Alert after" or longer  → red light
 * - no_data:   not monitoring (offline, not seated, …) → lamp off
 */
export type PostureStatus = "good" | "slouching" | "poor" | "no_data";

/** Lifecycle of a single connection (FR-D4). */
export type ConnectionState = "connected" | "connecting" | "disconnected";

/**
 * The two links the dashboard tracks:
 * - `device`: desktop app ↔ SitWell device (ESP32-C3)
 * - `lamp`:   SitWell device ↔ BLE Lamp
 */
export type ConnectionId = "device" | "lamp";

/**
 * Why monitoring is or isn't running, in priority order. The session timer
 * only counts during "running".
 */
export type MonitoringPhase =
  | "offline" // app is not connected to the ESP32-C3
  | "uncalibrated" // no posture baseline saved yet
  | "awaiting_data" // connected, but no recent posture readings
  | "not_seated" // readings arriving, user is not sitting
  | "running";

export interface CalibrationBaseline {
  sensors?: { seat: number; back: number; neck: number };
  basePitch: number;
  baseRoll: number;
  calibratedAt: number;
}

export interface PostureReading {
  firmwareState?: number;
  pitch: number;
  roll: number;
  seated: boolean;
  /** App receive time (ms). */
  at: number;
}

export interface SessionStats {
  startedAt: number | null;
  elapsedMs: number;
  goodMs: number;
  slouchMs: number;
  poorMs: number;
  /** Number of times posture went from good to poor. */
  deviations: number;
  breaksTaken: number;
}

/** Good/slouching/poor time within one fixed time slot of the day. */
export interface TimelineBucket {
  start: number;
  goodMs: number;
  slouchMs: number;
  poorMs: number;
}

export interface DeviceInfo {
  deviceId: string;
  firmware?: string;
  battery?: number;
}

export interface MonitoringSnapshot {
  phase: MonitoringPhase;
  posture: PostureStatus;
  connections: Record<ConnectionId, ConnectionState>;
  deviceInfo: DeviceInfo | null;
  calibration: CalibrationBaseline | null;
  latestReading: PostureReading | null;
  session: SessionStats;
  timeline: TimelineBucket[];
  breakRemainingMs: number;
  breakIntervalMs: number;
}
