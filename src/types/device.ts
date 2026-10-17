/**
 * Wire protocol between the SitWell device (ESP32-C3) and the desktop app.
 * Every message is a small JSON object with a `type` field.
 *
 * Full documentation and examples: docs/INTEGRATION.md
 */

/* ---------- Device → App ---------- */

/**
 * Sent when the device comes online, whenever its BLE Lamp link changes,
 * and as a heartbeat (recommended every ~5 s).
 */
export interface StatusMessage {
  type: "status";
  deviceId: string;
  online: boolean;
  /** Whether the ESP32-C3 currently has a BLE connection to the lamp. */
  lampConnected: boolean;
  firmware?: string;
  /** Battery percentage, if the hardware can measure it. */
  battery?: number;
}

/** Sent about once per second while the device is running. */
export interface PostureMessage {
  type: "posture";
  deviceId: string;
  /** Device time in Unix seconds (optional; the app stamps its own receive time). */
  timestamp?: number;
  /** Forward/backward tilt in degrees. */
  pitch: number;
  /** Left/right tilt in degrees. */
  roll: number;
  /** Whether the user is detected as sitting. The session timer only runs while true. */
  seated: boolean;
}

export type DeviceMessage = StatusMessage | PostureMessage;

/* ---------- App → Device ---------- */

export type LampState = "good" | "poor" | "off";

export type AppCommand =
  /** Ask the ESP32-C3 to re-establish its BLE link to the lamp. */
  | { type: "command"; action: "lamp_reconnect" }
  /** Tell the lamp which feedback state to show. Sent whenever posture changes. */
  | { type: "command"; action: "set_lamp"; state: LampState }
  /** Alert preferences from Settings. Sent on connect and whenever they change. */
  | {
      type: "command";
      action: "set_alerts";
      enabled: boolean;
      repeat: boolean;
      delaySeconds: number;
      feedback: "visual" | "sound" | "both";
    };
