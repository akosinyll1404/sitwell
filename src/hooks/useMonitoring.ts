import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  BREAK_INTERVAL_MS,
  BREAK_MIN_MS,
  LAMP_RECONNECT_TIMEOUT_MS,
  MAX_SAMPLE_GAP_MS,
  STALE_DATA_MS,
} from "../config/monitoring";
import { addToTimeline, classifyPosture } from "../lib/posture";
import { deviceConnection } from "../services/deviceConnection";
import type { PostureMessage, StatusMessage } from "../types/device";
import type {
  CalibrationBaseline,
  ConnectionState,
  DeviceInfo,
  MonitoringPhase,
  MonitoringSnapshot,
  PostureReading,
  PostureStatus,
  SessionStats,
  TimelineBucket,
} from "../types/monitoring";
import { useNow } from "./useNow";

/**
 * Turns device messages into everything the dashboard and history show.
 *
 * Data flow: transport → deviceConnection.receive() → this hook → UI.
 *
 * Time is credited per sample: the interval between two posture messages is
 * attributed to the earlier reading, and only while the user is calibrated,
 * connected, and seated. Durations come from timestamps rather than counting
 * ticks, so they stay accurate if the window is minimized.
 */

interface State {
  link: ConnectionState;
  lampConnected: boolean;
  lampReconnecting: boolean;
  deviceInfo: DeviceInfo | null;
  calibration: CalibrationBaseline | null;
  lastReading: PostureReading | null;
  lastPosture: "good" | "poor" | null;
  session: SessionStats;
  timeline: TimelineBucket[];
  /** session.elapsedMs at the last break (or reschedule). */
  breakAnchorMs: number;
  notSeatedSince: number | null;
}

type Action =
  | { type: "link"; state: ConnectionState }
  | { type: "status"; message: StatusMessage }
  | { type: "posture"; message: PostureMessage; at: number }
  | { type: "calibrated"; baseline: CalibrationBaseline }
  | { type: "lampReconnecting"; active: boolean }
  | { type: "rescheduleBreak"; elapsedMs: number };

const EMPTY_SESSION: SessionStats = {
  startedAt: null,
  elapsedMs: 0,
  goodMs: 0,
  poorMs: 0,
  deviations: 0,
  breaksTaken: 0,
};

function initialState(): State {
  return {
    link: deviceConnection.getLinkState(),
    lampConnected: false,
    lampReconnecting: false,
    deviceInfo: null,
    calibration: null,
    lastReading: null,
    lastPosture: null,
    session: EMPTY_SESSION,
    timeline: [],
    breakAnchorMs: 0,
    notSeatedSince: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "link": {
      const connected = action.state === "connected";
      return {
        ...state,
        link: action.state,
        // Never credit time across a disconnect.
        lastReading: connected ? state.lastReading : null,
        lastPosture: connected ? state.lastPosture : null,
        lampConnected: connected ? state.lampConnected : false,
        lampReconnecting: false,
      };
    }
    case "status":
      return {
        ...state,
        deviceInfo: {
          deviceId: action.message.deviceId,
          firmware: action.message.firmware,
          battery: action.message.battery,
        },
        lampConnected: action.message.lampConnected,
        lampReconnecting: action.message.lampConnected ? false : state.lampReconnecting,
      };
    case "posture":
      return applyPosture(state, action.message, action.at);
    case "calibrated":
      return { ...state, calibration: action.baseline, lastPosture: null };
    case "lampReconnecting":
      return { ...state, lampReconnecting: action.active };
    case "rescheduleBreak":
      return { ...state, breakAnchorMs: action.elapsedMs };
  }
}

function applyPosture(state: State, message: PostureMessage, at: number): State {
  const prev = state.lastReading;
  let { session, timeline, breakAnchorMs, notSeatedSince } = state;

  // Credit the interval since the previous reading.
  if (prev && prev.seated && state.calibration && state.link === "connected") {
    const dt = Math.min(Math.max(at - prev.at, 0), MAX_SAMPLE_GAP_MS);
    if (dt > 0) {
      const status = classifyPosture(prev, state.calibration);
      session = {
        ...session,
        startedAt: session.startedAt ?? prev.at,
        elapsedMs: session.elapsedMs + dt,
        goodMs: session.goodMs + (status === "good" ? dt : 0),
        poorMs: session.poorMs + (status === "poor" ? dt : 0),
      };
      timeline = addToTimeline(timeline, prev.at, status, dt);
    }
  }

  const current =
    state.calibration && message.seated ? classifyPosture(message, state.calibration) : null;
  if (current === "poor" && state.lastPosture !== "poor") {
    session = { ...session, deviations: session.deviations + 1 };
  }

  // Standing up long enough counts as a break and restarts the countdown.
  if (!message.seated) {
    notSeatedSince = notSeatedSince ?? at;
  } else {
    if (notSeatedSince !== null && at - notSeatedSince >= BREAK_MIN_MS && session.startedAt !== null) {
      session = { ...session, breaksTaken: session.breaksTaken + 1 };
      breakAnchorMs = session.elapsedMs;
    }
    notSeatedSince = null;
  }

  return {
    ...state,
    session,
    timeline,
    breakAnchorMs,
    notSeatedSince,
    lastPosture: current,
    lastReading: { pitch: message.pitch, roll: message.roll, seated: message.seated, at },
  };
}

function derivePhase(state: State, now: number): MonitoringPhase {
  if (state.link !== "connected") return "offline";
  if (!state.calibration) return "uncalibrated";
  const reading = state.lastReading;
  if (!reading || now - reading.at > STALE_DATA_MS) return "awaiting_data";
  if (!reading.seated) return "not_seated";
  return "running";
}

function deriveSnapshot(state: State, now: number): MonitoringSnapshot {
  const phase = derivePhase(state, now);
  let posture: PostureStatus = "no_data";
  let session = state.session;

  if (phase === "running" && state.lastReading && state.calibration) {
    posture = classifyPosture(state.lastReading, state.calibration);
    // Extend the session smoothly between samples.
    const live = Math.min(Math.max(now - state.lastReading.at, 0), MAX_SAMPLE_GAP_MS);
    session = {
      ...session,
      startedAt: session.startedAt ?? state.lastReading.at,
      elapsedMs: session.elapsedMs + live,
      goodMs: session.goodMs + (posture === "good" ? live : 0),
      poorMs: session.poorMs + (posture === "poor" ? live : 0),
    };
  }

  const lamp: ConnectionState =
    state.link !== "connected"
      ? "disconnected"
      : state.lampReconnecting
        ? "connecting"
        : state.lampConnected
          ? "connected"
          : "disconnected";

  return {
    phase,
    posture,
    connections: { device: state.link, lamp },
    deviceInfo: state.link === "connected" ? state.deviceInfo : null,
    calibration: state.calibration,
    latestReading: state.lastReading,
    session,
    timeline: state.timeline,
    breakRemainingMs: Math.max(0, BREAK_INTERVAL_MS - (session.elapsedMs - state.breakAnchorMs)),
    breakIntervalMs: BREAK_INTERVAL_MS,
  };
}

export interface MonitoringActions {
  connectDevice: () => void;
  reconnectDevice: () => void;
  reconnectLamp: () => void;
  saveCalibration: (baseline: CalibrationBaseline) => void;
  rescheduleBreak: () => void;
}

export function useMonitoring(): [MonitoringSnapshot, MonitoringActions] {
  const now = useNow(1000);
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    const offLink = deviceConnection.onLinkStateChange((linkState) =>
      dispatch({ type: "link", state: linkState }),
    );
    const offMessage = deviceConnection.onMessage((message, at) => {
      if (message.type === "status") dispatch({ type: "status", message });
      else dispatch({ type: "posture", message, at });
    });
    dispatch({ type: "link", state: deviceConnection.getLinkState() });
    return () => {
      offLink();
      offMessage();
    };
  }, []);

  const snapshot = deriveSnapshot(state, now);
  const snapshotRef = useRef(snapshot);
  useEffect(() => {
    snapshotRef.current = snapshot;
  });

  // Mirror posture on the BLE Lamp whenever it changes.
  useEffect(() => {
    deviceConnection.send({
      type: "command",
      action: "set_lamp",
      state: snapshot.posture === "no_data" ? "off" : snapshot.posture,
    });
  }, [snapshot.posture, state.link]);

  const lampTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(lampTimer.current), []);

  const reconnectLamp = useCallback(() => {
    if (deviceConnection.getLinkState() !== "connected") return;
    dispatch({ type: "lampReconnecting", active: true });
    deviceConnection.send({ type: "command", action: "lamp_reconnect" });
    window.clearTimeout(lampTimer.current);
    lampTimer.current = window.setTimeout(
      () => dispatch({ type: "lampReconnecting", active: false }),
      LAMP_RECONNECT_TIMEOUT_MS,
    );
  }, []);

  const actions: MonitoringActions = {
    connectDevice: useCallback(() => deviceConnection.connect(), []),
    reconnectDevice: useCallback(() => deviceConnection.reconnect(), []),
    reconnectLamp,
    saveCalibration: useCallback(
      (baseline: CalibrationBaseline) => dispatch({ type: "calibrated", baseline }),
      [],
    ),
    rescheduleBreak: useCallback(
      () => dispatch({ type: "rescheduleBreak", elapsedMs: snapshotRef.current.session.elapsedMs }),
      [],
    ),
  };

  return [snapshot, actions];
}
