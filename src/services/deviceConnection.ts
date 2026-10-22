import { invoke } from "@tauri-apps/api/core";
import type { FirmwareStatus } from "../types/firmware";
import type { AppCommand, DeviceMessage } from "../types/device";
import type { ConnectionState } from "../types/monitoring";
import { parseDeviceMessage } from "./protocol";

type MessageListener = (message: DeviceMessage, receivedAt: number) => void;
type LinkListener = (state: ConnectionState) => void;
type CommandListener = (command: AppCommand) => void;

/** Rust HTTP transport for the uploaded ESP32 firmware. */
class DeviceConnection {
  private messageListeners = new Set<MessageListener>();
  private linkListeners = new Set<LinkListener>();
  private commandListeners = new Set<CommandListener>();
  private linkState: ConnectionState = "disconnected";
  private generation = 0;
  private active = false;
  private firmwareListeners = new Set<(status: FirmwareStatus) => void>();
  latestFirmware: FirmwareStatus | null = null;
  onFirmware(listener: (status: FirmwareStatus) => void): () => void {
    this.firmwareListeners.add(listener);
    return () => { this.firmwareListeners.delete(listener); };
  }
  calibrate(cancel = false): Promise<void> {
    return invoke("sitwell_calibrate", { cancel });
  }

  getLinkState(): ConnectionState {
    return this.linkState;
  }

  /** Opens the connection to the ESP32-C3. */
  connect(): void {
    if (this.active) return;
    this.active = true;
    const generation = ++this.generation;
    this.setLinkState("connecting");
    const poll = async () => {
      try {
        const d = await invoke<FirmwareStatus>("sitwell_status");
        if (generation !== this.generation) return;
        this.latestFirmware = d;
        this.setLinkState("connected");
        this.firmwareListeners.forEach(l => l(d));
        const at = Date.now();
        this.messageListeners.forEach(l => l({
          type: "status", deviceId: "SitWell-C3", online: true,
          lampConnected: d.ble_connected,
        }, at));
        this.messageListeners.forEach(l => l({
          type: "posture", deviceId: "SitWell-C3", pitch: 0, roll: 0,
          seated: d.occupied && !d.calibrating, firmwareState: d.state,
        }, at));
      } catch (error) {
        if (generation !== this.generation) return;
        this.latestFirmware = null;
        this.setLinkState("disconnected");
        console.warn("[SitWell]", error);
      }
      if (generation === this.generation) window.setTimeout(poll, 700);
    };
    void poll();
  }

  disconnect(): void {
    this.active = false;
    ++this.generation;
    this.latestFirmware = null;
    this.setLinkState("disconnected");
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /** Sends a command to the ESP32-C3. Ignored while not connected. */
  send(command: AppCommand): void {
    if (this.linkState !== "connected") return;
    // Firmware owns lamp feedback; these legacy commands are simulator-only.
    this.commandListeners.forEach((l) => l(command));
  }

  /** Feed raw data from the transport. Invalid messages are dropped. */
  receive(raw: unknown): void {
    const message = parseDeviceMessage(raw);
    if (!message) return;
    const receivedAt = Date.now();
    this.messageListeners.forEach((l) => l(message, receivedAt));
  }

  /** Called by the transport when the link opens, drops, or retries. */
  setLinkState(state: ConnectionState): void {

    if (state === this.linkState) return;
    this.linkState = state;
    this.linkListeners.forEach((l) => l(state));
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onLinkStateChange(listener: LinkListener): () => void {
    this.linkListeners.add(listener);
    return () => this.linkListeners.delete(listener);
  }

  /** Observe outgoing commands (used by the dev simulator and for logging). */
  onCommand(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }
}

export const deviceConnection = new DeviceConnection();
