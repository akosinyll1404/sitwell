import { useCallback, useEffect, useRef, useState } from "react";
import { deviceConnection } from "../services/deviceConnection";
import type { CalibrationBaseline } from "../types/monitoring";
export type CalibrationStatus = "idle" | "collecting" | "success" | "failed";
export interface CalibrationProgress {
  status: CalibrationStatus; collected: number; required: number;
  latest: { pitch: number; roll: number } | null;
  message: string | null; baseline: CalibrationBaseline | null;
}
const INITIAL: CalibrationProgress = { status: "idle", collected: 0, required: 20000, latest: null, message: null, baseline: null };
export function useCalibration(onComplete: (baseline: CalibrationBaseline) => void): [CalibrationProgress, () => void, () => void] {
  const [progress, setProgress] = useState(INITIAL);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const active = useRef(false);
  const observed = useRef(false);
  const startedAt = useRef(0);
  useEffect(() => {
    const off = deviceConnection.onFirmware(d => {
      if (!active.current) return;
      if (d.calibrating) observed.current = true;
      if (!observed.current && !d.calibrating) return;
      if (d.calibrating) {
        setProgress({ ...INITIAL, status: "collecting", collected: Math.min(d.elapsed_ms, d.duration_ms), required: d.duration_ms,
          message: `Hold neutral posture: ${(d.elapsed_ms / 1000).toFixed(1)} / ${d.duration_ms / 1000} seconds (${d.samples} samples).` });
      } else {
        active.current = false;
        if (d.calibrated && d.message === "Calibration saved successfully") {
          const baseline = { basePitch: 0, baseRoll: 0, calibratedAt: Date.now(),
            sensors: { seat: d.ref_seat, back: d.ref_back, neck: d.ref_neck } };
          setProgress({ ...INITIAL, status: "success", collected: d.duration_ms, required: d.duration_ms, baseline, message: d.message });
          callback.current(baseline);
        } else setProgress({ ...INITIAL, status: "failed", message: d.message });
      }
    });
    const offLink = deviceConnection.onLinkStateChange(state => {
      if (active.current && state !== "connected") {
        active.current = false;
        setProgress({ ...INITIAL, status: "failed", message: "Connection lost. Device calibration may continue; reconnect to check." });
      }
    });
    const timer = window.setInterval(() => {
      if (active.current && Date.now() - startedAt.current > 40000) {
        active.current = false;
        setProgress({ ...INITIAL, status: "failed", message: "Calibration result timed out. Reconnect to check the device." });
      }
    }, 1000);
    return () => { off(); offLink(); window.clearInterval(timer); };
  }, []);
  const start = useCallback(() => {
    if (active.current) return;
    if (deviceConnection.getLinkState() !== "connected") {
      setProgress({ ...INITIAL, status: "failed", message: "Connect to SitWell-Setup Wi-Fi and click Connect first." }); return;
    }
    active.current = true; observed.current = false; startedAt.current = Date.now();
    setProgress({ ...INITIAL, status: "collecting", message: "Starting 20-second device calibration…" });
    void deviceConnection.calibrate().catch(error => {
      active.current = false;
      setProgress({ ...INITIAL, status: "failed", message: String(error) });
    });
  }, []);
  const cancel = useCallback(() => {
    void deviceConnection.calibrate(true).then(() => {
      active.current = false;
      setProgress({ ...INITIAL, message: "Calibration cancelled; previous device baseline retained." });
    }).catch(error => setProgress(p => ({ ...p, message: String(error) })));
  }, []);
  return [progress, start, cancel];
}
