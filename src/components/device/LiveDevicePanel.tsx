import { useEffect, useState } from "react";
import { deviceConnection } from "../../services/deviceConnection";
import type { FirmwareStatus } from "../../types/firmware";

const STATES = ["Not sitting", "Good posture", "Posture deviation", "Sustained poor posture", "Prolonged sitting"];
export function LiveDevicePanel() {
  const [status, setStatus] = useState<FirmwareStatus | null>(deviceConnection.latestFirmware);
  useEffect(() => {
    const off = deviceConnection.onFirmware(setStatus);
    const offLink = deviceConnection.onLinkStateChange(s => { if (s !== "connected") setStatus(null); });
    return () => { off(); offLink(); };
  }, []);
  return <section className="mb-4 rounded-xl border border-line bg-white p-4" aria-live="polite">
    <p className="font-semibold text-ink">{status ? status.calibrating ? "Calibrating — hold neutral posture" : STATES[status.state] ?? "Unknown state" : "Waiting for SitWell device"}</p>
    <p className="text-sm text-muted">Join SitWell-Setup Wi-Fi · Device: 192.168.4.1</p>
    {status && <>
      <p className="mt-2 text-sm text-ink tabular-nums">Seat: {status.seat.toFixed(2)} · Back: {status.back.toFixed(2)} · Neck: {status.neck.toFixed(2)}</p>
      <p className="text-sm text-muted">Occupied: {status.occupied ? "Yes" : "No"} · Lamp: {status.ble_connected ? "Connected" : "Disconnected / scanning"}</p>
      <p className="text-sm text-muted">{status.message}</p>
      {status.state === 4 && <p className="font-semibold text-brand">Consider taking a movement break.</p>}
    </>}
    <p className="mt-2 text-xs text-muted">The ESP32 controls posture thresholds and lamp feedback. Lamp reconnect is automatic. App alert preferences do not change firmware behavior. History groups prolonged sitting with good posture; the device status above shows all five states.</p>
  </section>;
}
