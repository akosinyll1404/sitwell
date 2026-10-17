import { useEffect, useState, type ReactNode } from "react";
import { deviceConnection } from "../../services/deviceConnection";
import type { ConnectionState } from "../../types/monitoring";

const SIM_DEVICE_ID = "sitwell-sim";
const BASE_PITCH = 10;
const BASE_ROLL = -1.4;
const POOR_PITCH = 32;

interface DeviceSimulatorProps {
  sampleHistory: boolean;
  onSampleHistoryChange: (value: boolean) => void;
}

/**
 * DEVELOPMENT ONLY — never rendered in production builds (see App.tsx).
 *
 * Pretends to be the ESP32-C3: it sends the same JSON payloads the firmware
 * will send, through deviceConnection.receive(), so the whole pipeline
 * (validation → monitoring → UI) is exercised before hardware exists.
 */
export function DeviceSimulator({ sampleHistory, onSampleHistoryChange }: DeviceSimulatorProps) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<ConnectionState>(deviceConnection.getLinkState());
  const [lampPaired, setLampPaired] = useState(true);
  const [seated, setSeated] = useState(true);
  const [posture, setPosture] = useState<"good" | "poor">("good");

  useEffect(() => deviceConnection.onLinkStateChange(setLink), []);

  // React to commands the app sends, like the firmware would.
  useEffect(
    () =>
      deviceConnection.onCommand((command) => {
        console.debug("[simulator] received command", command);
        if (command.action === "lamp_reconnect") {
          window.setTimeout(() => setLampPaired(true), 1200);
        }
      }),
    [],
  );

  // Status message on connect and whenever the lamp link changes.
  useEffect(() => {
    if (link !== "connected") return;
    deviceConnection.receive(
      JSON.stringify({
        type: "status",
        deviceId: SIM_DEVICE_ID,
        online: true,
        lampConnected: lampPaired,
        firmware: "sim-1.0.0",
      }),
    );
  }, [link, lampPaired]);

  // Posture stream, about once per second.
  useEffect(() => {
    if (link !== "connected") return;
    const send = () => {
      const jitter = () => (Math.random() - 0.5) * 1.2;
      deviceConnection.receive(
        JSON.stringify({
          type: "posture",
          deviceId: SIM_DEVICE_ID,
          timestamp: Math.floor(Date.now() / 1000),
          pitch: round1((posture === "good" ? BASE_PITCH : POOR_PITCH) + jitter()),
          roll: round1(BASE_ROLL + jitter()),
          seated,
        }),
      );
    };
    send();
    const id = window.setInterval(send, 1000);
    return () => window.clearInterval(id);
  }, [link, seated, posture]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-50 cursor-pointer rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted uppercase shadow-lg"
      >
        Device simulator{link === "connected" ? " · on" : ""}
      </button>
    );
  }

  const connected = link === "connected";

  return (
    <div className="fixed right-4 bottom-4 z-50 w-64 rounded-xl border border-line bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold text-muted uppercase">Device simulator (dev)</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer px-1 text-muted hover:text-ink"
          aria-label="Close device simulator"
        >
          ✕
        </button>
      </div>

      <button
        type="button"
        onClick={() =>
          connected ? deviceConnection.disconnect() : deviceConnection.setLinkState("connected")
        }
        className={`mb-2 w-full cursor-pointer rounded-lg px-3 py-1.5 font-semibold ${
          connected ? "bg-red-50 text-red-700" : "bg-brand text-white"
        }`}
      >
        {connected ? "Disconnect ESP32" : "Connect simulated ESP32"}
      </button>

      <Toggle label="BLE Lamp paired" checked={lampPaired} onChange={setLampPaired} disabled={!connected} />
      <Toggle label="User seated" checked={seated} onChange={setSeated} disabled={!connected} />

      <label className="mb-2 flex items-center justify-between gap-2">
        <span className="text-slate-600">Posture</span>
        <select
          className="rounded border border-line p-1 disabled:opacity-50"
          value={posture}
          disabled={!connected}
          onChange={(e) => setPosture(e.target.value as "good" | "poor")}
        >
          <option value="good">Good (pitch ≈ {BASE_PITCH}°)</option>
          <option value="poor">Bad posture (pitch ≈ {POOR_PITCH}°)</option>
        </select>
      </label>

      <hr className="my-2 border-line" />
      <Toggle label="Sample history data" checked={sampleHistory} onChange={onSampleHistoryChange} />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}): ReactNode {
  return (
    <label className={`mb-2 flex items-center justify-between ${disabled ? "opacity-50" : ""}`}>
      <span className="text-slate-600">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
