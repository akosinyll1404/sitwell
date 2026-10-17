import {
  Bluetooth,
  BluetoothOff,
  LoaderCircle,
  type LucideIcon,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  DEVICE_HARDWARE,
  DEVICE_NAME,
  DEVICE_TRANSPORT,
  LAMP_NAME,
  LAMP_TRANSPORT,
} from "../../config/monitoring";
import type { ConnectionState, MonitoringPhase } from "../../types/monitoring";
import { Card } from "../ui/Card";
import { OutlineButton } from "../ui/OutlineButton";
import { Tooltip } from "../ui/Tooltip";

interface DeviceStatusCardProps {
  device: ConnectionState;
  lamp: ConnectionState;
  phase: MonitoringPhase;
  onConnectDevice: () => void;
  onReconnectDevice: () => void;
  onReconnectLamp: () => void;
}

/**
 * Two links: App ↔ SitWell device (ESP32-C3), and SitWell device ↔ BLE Lamp.
 * Both start offline and turn "connected" once the hardware reports in.
 */
export function DeviceStatusCard({
  device,
  lamp,
  phase,
  onConnectDevice,
  onReconnectDevice,
  onReconnectLamp,
}: DeviceStatusCardProps) {
  const deviceConnected = device === "connected";

  return (
    <Card title="Device Status">
      <div className="divide-y divide-line">
        <ConnectionRow
          state={device}
          icon={device === "connected" ? Wifi : WifiOff}
          title={{
            connected: `${DEVICE_NAME} connected via ${DEVICE_TRANSPORT}`,
            connecting: `Connecting to ${DEVICE_NAME}…`,
            disconnected: `${DEVICE_NAME} offline`,
          }}
          detail={{
            connected:
              phase === "awaiting_data"
                ? `${DEVICE_HARDWARE} · Waiting for sensor data`
                : `${DEVICE_HARDWARE} · Receiving valid sensor data`,
            connecting: `Looking for ${DEVICE_HARDWARE}`,
            disconnected: `${DEVICE_HARDWARE} · Not connected to the app`,
          }}
          buttonLabel={deviceConnected ? "Reconnect" : "Connect"}
          buttonDisabled={device === "connecting"}
          disabledReason="Connection in progress"
          onButton={deviceConnected ? onReconnectDevice : onConnectDevice}
          ariaName={DEVICE_NAME}
        />
        <ConnectionRow
          state={lamp}
          icon={lamp === "connected" ? Bluetooth : BluetoothOff}
          title={{
            connected: `${LAMP_NAME} connected via ${LAMP_TRANSPORT}`,
            connecting: `Reconnecting ${LAMP_NAME}…`,
            disconnected: `${LAMP_NAME} offline`,
          }}
          detail={{
            connected: `Paired with ${DEVICE_HARDWARE}`,
            connecting: `${DEVICE_HARDWARE} is searching for the lamp`,
            disconnected: deviceConnected
              ? `${DEVICE_HARDWARE} can't reach the lamp`
              : `Connect the ${DEVICE_NAME} first`,
          }}
          buttonLabel="Reconnect"
          buttonDisabled={!deviceConnected || lamp === "connecting"}
          disabledReason={!deviceConnected ? `Connect the ${DEVICE_NAME} first` : "Reconnecting to the lamp…"}
          onButton={onReconnectLamp}
          ariaName={LAMP_NAME}
        />
      </div>
    </Card>
  );
}

interface ConnectionRowProps {
  state: ConnectionState;
  icon: LucideIcon;
  title: Record<ConnectionState, string>;
  detail: Record<ConnectionState, string>;
  buttonLabel: string;
  buttonDisabled: boolean;
  /** Tooltip explaining why the button is disabled. */
  disabledReason: string;
  onButton: () => void;
  ariaName: string;
}

function ConnectionRow({
  state,
  icon,
  title,
  detail,
  buttonLabel,
  buttonDisabled,
  disabledReason,
  onButton,
  ariaName,
}: ConnectionRowProps) {
  const Icon = state === "connecting" ? LoaderCircle : icon;
  const iconColor = {
    connected: "text-brand",
    connecting: "text-poor-accent animate-spin",
    disconnected: "text-slate-400",
  }[state];
  const dot = {
    connected: "bg-good-accent",
    connecting: "bg-poor-accent animate-pulse",
    disconnected: "bg-slate-400",
  }[state];

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{title[state]}</p>
        <p className="flex items-center gap-1.5 truncate text-sm text-muted">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
          {detail[state]}
        </p>
      </div>
      <Tooltip content={buttonDisabled ? disabledReason : null} align="end" disabledTarget={buttonDisabled}>
        <OutlineButton onClick={onButton} disabled={buttonDisabled} aria-label={`${buttonLabel} ${ariaName}`}>
          {buttonLabel}
        </OutlineButton>
      </Tooltip>
    </div>
  );
}
