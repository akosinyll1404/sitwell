/** Posture classification shown across the app. */
export type PostureStatus = "good" | "poor" | "no_data";

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
  basePitch: number;
  baseRoll: number;
  calibratedAt: number;
}

export interface PostureReading {
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
  poorMs: number;
  /** Number of times posture went from good to poor. */
  deviations: number;
  breaksTaken: number;
}

/** Good/poor time within one fixed time slot of the day. */
export interface TimelineBucket {
  start: number;
  goodMs: number;
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
