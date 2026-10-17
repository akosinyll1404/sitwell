/** Tunable monitoring constants. Adjust once real sensor data is available. */

// Display labels for the two connections.
export const DEVICE_NAME = "SitWell device";
export const DEVICE_HARDWARE = "ESP32-C3";
/** How the app reaches the ESP32-C3. Change if the transport changes. */
export const DEVICE_TRANSPORT = "Wi-Fi";
export const LAMP_NAME = "BLE Lamp";
export const LAMP_TRANSPORT = "BLE";

// Posture classification: deviation from the calibrated baseline, in degrees.
export const PITCH_THRESHOLD_DEG = 15;
export const ROLL_THRESHOLD_DEG = 10;

// Data freshness.
/** No posture message for this long → treat as "no data". */
export const STALE_DATA_MS = 5_000;
/** Max time credited between two samples (guards against gaps). */
export const MAX_SAMPLE_GAP_MS = 3_000;

// Connection timing.
export const CONNECT_TIMEOUT_MS = 4_000;
export const LAMP_RECONNECT_TIMEOUT_MS = 8_000;

// Breaks. (The reminder interval itself is a user setting.)
/** Standing up for at least this long counts as a break and resets the countdown. */
export const BREAK_MIN_MS = 2 * 60 * 1000;

// Calibration.
export const CALIBRATION_SAMPLES = 8;
export const CALIBRATION_TIMEOUT_MS = 20_000;
/** Max standard deviation allowed while holding still. */
export const CALIBRATION_MAX_STD_DEG = 3;

// History.
export const TIMELINE_BUCKET_MS = 30 * 60 * 1000;
