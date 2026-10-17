import { POSTURE_LABEL, TONE_PANEL, postureTone } from "../../config/posture";
import type { PostureStatus } from "../../types/monitoring";

/** Full-width status strip at the top of the dashboard. */
export function PostureBanner({ posture }: { posture: PostureStatus }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl px-5 py-3.5 text-lg font-bold ${TONE_PANEL[postureTone(posture)]}`}
    >
      Current Posture: {POSTURE_LABEL[posture]}
    </div>
  );
}
