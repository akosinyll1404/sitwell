import type { PostureStatus } from "../../types/monitoring";

/**
 * Seated figure with a spine guide line. The upper body tilts forward a
 * little when slouching and further for poor posture; the figure fades when
 * there is no data.
 */
const FIGURE = {
  good: { lean: 0, guide: "#22a35a", shirt: "#74c493" },
  slouching: { lean: 12, guide: "#f97316", shirt: "#fdba74" },
  poor: { lean: 24, guide: "#dc2626", shirt: "#f87171" },
  no_data: { lean: 0, guide: "#22a35a", shirt: "#74c493" },
};

export function PostureIllustration({ posture }: { posture: PostureStatus }) {
  const { lean, guide: guideColor, shirt } = FIGURE[posture];

  return (
    <svg
      viewBox="0 0 240 160"
      className={`h-full w-full ${posture === "no_data" ? "opacity-40 grayscale" : ""}`}
      role="img"
      aria-label={`Illustration of ${posture === "good" || posture === "no_data" ? "upright" : "slouched"} sitting posture`}
    >
      {/* Floor */}
      <line x1="40" y1="150" x2="200" y2="150" stroke="#8a9bb8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Chair */}
      <rect x="66" y="58" width="9" height="62" rx="4" fill="#a9dcbb" stroke="#5aa877" strokeWidth="1.5" />
      <rect x="66" y="113" width="74" height="7" rx="3" fill="#a9dcbb" stroke="#5aa877" strokeWidth="1.5" />
      <rect x="80" y="120" width="5" height="30" fill="#8a9bb8" />
      <rect x="124" y="120" width="5" height="30" fill="#8a9bb8" />

      {/* Legs */}
      <rect x="92" y="103" width="66" height="15" rx="7.5" fill="#3b6fc4" />
      <rect x="148" y="106" width="13" height="42" rx="6" fill="#3b6fc4" />
      <ellipse cx="160" cy="148" rx="11" ry="4" fill="#1e293b" />

      {/* Upper body pivots at the hip */}
      <g transform={`rotate(${lean} 96 112)`} style={{ transition: "transform 300ms ease" }}>
        <rect x="83" y="60" width="26" height="56" rx="12" fill={shirt} />
        <path d="M100 76 L128 99" stroke={shirt} strokeWidth="11" strokeLinecap="round" />
        <circle cx="131" cy="100" r="5.5" fill="#f1bd94" />
        <circle cx="96" cy="46" r="12.5" fill="#f1bd94" />
        <path d="M83.5 45 A12.5 12.5 0 0 1 108.5 45 Q100 38 83.5 45 Z" fill="#2b2b3a" />
        <line
          x1="96"
          y1="26"
          x2="96"
          y2="114"
          stroke={guideColor}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </g>
    </svg>
  );
}
