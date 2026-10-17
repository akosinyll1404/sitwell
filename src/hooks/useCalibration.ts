import { useCallback, useEffect, useRef, useState } from "react";
import {
  CALIBRATION_MAX_STD_DEG,
  CALIBRATION_SAMPLES,
  CALIBRATION_TIMEOUT_MS,
} from "../config/monitoring";
import { deviceConnection } from "../services/deviceConnection";
import type { CalibrationBaseline } from "../types/monitoring";

export type CalibrationStatus = "idle" | "collecting" | "success" | "failed";

export interface CalibrationProgress {
  status: CalibrationStatus;
  collected: number;
  required: number;
  latest: { pitch: number; roll: number } | null;
  /** Hint or failure reason to show the user. */
  message: string | null;
  baseline: CalibrationBaseline | null;
}

const INITIAL: CalibrationProgress = {
  status: "idle",
  collected: 0,
  required: CALIBRATION_SAMPLES,
  latest: null,
  message: null,
  baseline: null,
};

/**
 * Collects baseline readings while the user holds a good posture (FR-C1–C4).
 * The baseline is the average pitch/roll; calibration fails if readings are
 * too unsteady, too few arrive in time, or the device disconnects.
 */
export function useCalibration(
  onComplete: (baseline: CalibrationBaseline) => void,
): [CalibrationProgress, () => void] {
  const [progress, setProgress] = useState<CalibrationProgress>(INITIAL);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (progress.status !== "collecting") return;

    const samples: { pitch: number; roll: number }[] = [];
    let done = false;
    const fail = (message: string) => {
      if (done) return;
      done = true;
      setProgress((p) => ({ ...p, status: "failed", message }));
    };

    const timeout = window.setTimeout(
      () => fail("Not enough readings arrived from the SitWell device. Check the connection and try again."),
      CALIBRATION_TIMEOUT_MS,
    );
    const offLink = deviceConnection.onLinkStateChange((state) => {
      if (state !== "connected") fail("The SitWell device disconnected during calibration.");
    });
    const offMessage = deviceConnection.onMessage((message) => {
      if (done || message.type !== "posture") return;
      if (!message.seated) {
        setProgress((p) => ({ ...p, message: "Sit down in your preferred posture to continue." }));
        return;
      }

      samples.push({ pitch: message.pitch, roll: message.roll });
      const latest = { pitch: message.pitch, roll: message.roll };
      if (samples.length < CALIBRATION_SAMPLES) {
        setProgress((p) => ({ ...p, collected: samples.length, latest, message: null }));
        return;
      }

      const pitch = meanAndStd(samples.map((s) => s.pitch));
      const roll = meanAndStd(samples.map((s) => s.roll));
      if (pitch.std > CALIBRATION_MAX_STD_DEG || roll.std > CALIBRATION_MAX_STD_DEG) {
        fail("You moved too much while readings were collected. Hold still and try again.");
        return;
      }

      done = true;
      const baseline: CalibrationBaseline = {
        basePitch: round1(pitch.mean),
        baseRoll: round1(roll.mean),
        calibratedAt: Date.now(),
      };
      setProgress((p) => ({ ...p, status: "success", collected: samples.length, latest, baseline, message: null }));
      onCompleteRef.current(baseline);
    });

    return () => {
      done = true;
      window.clearTimeout(timeout);
      offLink();
      offMessage();
    };
  }, [progress.status]);

  const start = useCallback(() => {
    if (deviceConnection.getLinkState() !== "connected") {
      setProgress({ ...INITIAL, status: "failed", message: "Connect the SitWell device before calibrating." });
      return;
    }
    setProgress({ ...INITIAL, status: "collecting" });
  }, []);

  return [progress, start];
}

function meanAndStd(values: number[]): { mean: number; std: number } {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
