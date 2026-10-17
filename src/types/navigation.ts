/** Screens reachable from the sidebar. */
export type PageId = "dashboard" | "history" | "settings";

/** Every screen, including the full-page calibration flow. */
export type Route = PageId | "calibration";
