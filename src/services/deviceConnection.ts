import { CONNECT_TIMEOUT_MS } from "../config/monitoring";
import type { AppCommand, DeviceMessage } from "../types/device";
import type { ConnectionState } from "../types/monitoring";
import { parseDeviceMessage } from "./protocol";

type MessageListener = (message: DeviceMessage, receivedAt: number) => void;
type LinkListener = (state: ConnectionState) => void;
type CommandListener = (command: AppCommand) => void;

/**
 * Single entry point for the App ↔ ESP32-C3 link.
 *
 * PHASE 1: there is no transport yet, so `connect()` times out and the app
 * stays offline. To integrate the real device, implement the three
 * `TODO(integration)` spots below — see docs/INTEGRATION.md. Nothing in the
 * UI needs to change: it only reacts to `setLinkState()` and `receive()`.
 */
class DeviceConnection {
  private messageListeners = new Set<MessageListener>();
  private linkListeners = new Set<LinkListener>();
  private commandListeners = new Set<CommandListener>();
  private linkState: ConnectionState = "disconnected";
  private connectTimer: number | undefined;

  getLinkState(): ConnectionState {
    return this.linkState;
  }

  /** Opens the connection to the ESP32-C3. */
  connect(): void {
    if (this.linkState !== "disconnected") return;
    this.setLinkState("connecting");

    // TODO(integration): open the real transport here (e.g. invoke a Tauri
    // command or open a WebSocket to the saved device address). On success
    // call setLinkState("connected"); for each incoming frame call receive().

    // Phase 1: no transport, so the attempt fails after a timeout.
    this.connectTimer = window.setTimeout(() => {
      if (this.linkState === "connecting") this.setLinkState("disconnected");
    }, CONNECT_TIMEOUT_MS);
  }

  disconnect(): void {
    // TODO(integration): close the real transport here.
    this.setLinkState("disconnected");
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /** Sends a command to the ESP32-C3. Ignored while not connected. */
  send(command: AppCommand): void {
    if (this.linkState !== "connected") return;
    // TODO(integration): serialize and write to the transport:
    //   transport.send(JSON.stringify(command))
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
    if (state !== "connecting") window.clearTimeout(this.connectTimer);
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
