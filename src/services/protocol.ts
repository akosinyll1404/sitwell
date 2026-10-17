import type { DeviceMessage } from "../types/device";

/**
 * Validates an incoming message (FR-M4): accepts a JSON string or an already
 * parsed object. Returns null for anything malformed or out of range, so bad
 * data is ignored instead of crashing the app.
 */
export function parseDeviceMessage(raw: unknown): DeviceMessage | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return reject("invalid JSON", raw);
    }
  }
  if (!isObject(data)) return reject("not an object", raw);

  if (data.type === "status") {
    if (typeof data.deviceId !== "string") return reject("status.deviceId missing", raw);
    if (typeof data.online !== "boolean") return reject("status.online missing", raw);
    if (typeof data.lampConnected !== "boolean") return reject("status.lampConnected missing", raw);
    return {
      type: "status",
      deviceId: data.deviceId,
      online: data.online,
      lampConnected: data.lampConnected,
      firmware: typeof data.firmware === "string" ? data.firmware : undefined,
      battery: isNumberInRange(data.battery, 0, 100) ? data.battery : undefined,
    };
  }

  if (data.type === "posture") {
    if (typeof data.deviceId !== "string") return reject("posture.deviceId missing", raw);
    if (!isNumberInRange(data.pitch, -180, 180)) return reject("posture.pitch out of range", raw);
    if (!isNumberInRange(data.roll, -180, 180)) return reject("posture.roll out of range", raw);
    if (typeof data.seated !== "boolean") return reject("posture.seated missing", raw);
    return {
      type: "posture",
      deviceId: data.deviceId,
      timestamp: typeof data.timestamp === "number" ? data.timestamp : undefined,
      pitch: data.pitch,
      roll: data.roll,
      seated: data.seated,
    };
  }

  return reject("unknown message type", raw);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function reject(reason: string, raw: unknown): null {
  console.warn(`[device] Ignored message: ${reason}`, raw);
  return null;
}
