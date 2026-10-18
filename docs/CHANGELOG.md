# Changelog

## Unreleased

### Added

- **Pagination for Session History**:
  - 5 sessions per page by default, with a rows-per-page choice of 5, 10, 20 or 50.
  - "Showing 6–10 of 58 sessions", plus Previous / page numbers / Next controls
    (`1 … 4 5 6 … 12` once there are many pages).
  - The live session is pinned to the top of page 1.
- `historyRepository.listSessions({ limit, offset })` now returns one page plus
  the total count (`{ sessions, total }`), so the database only loads the rows
  being shown.
- Sample history data now covers 30 days, so pagination can be previewed.

## Phase 1.3: History by day (2026-10-18)

### Added

- **History by day** (FR-H3, FR-H4, technical design §6.2 "trends across days"):
  - **Last 7 Days** chart above the Daily Progress Summary: one bar per day
    (good vs poor time) with that day's good-posture %. Click a day to view it.
  - **Day picker** on the Daily Progress Summary: ‹ / › arrows, a calendar,
    and a **Today** button. The tiles, the "Posture throughout the day" chart and
    the donut all follow the selected day.
- **History colors follow the 3 posture classes:** Good (green), Slouching
  (orange) and Poor (red), matching the lamp.
  - Used in the Last 7 Days chart, "Posture throughout the day", the donut, and
    a new 3-color bar in the Session History table.
  - The Daily Progress Summary now has separate **Good posture / Slouching /
    Poor posture** tiles, each with a color swatch.
  - The palette was checked for color-blind separation.
  - Slouching and poor time are now tracked separately (`slouchMs`) in the
    session, timeline, daily totals and session records.
- `historyRepository.getDailyTotals(fromDay, toDay)` for per-day totals, plus a
  phase-1 stub.
- Sample history data now covers a full week (with one empty "rest day").

## Phase 1.2: Dashboard polish and posture states (2026-10-18)

### Changed

- **Posture now has 3 states, matching the BLE Lamp colors (FR-D1):**
  - **Good Posture** (lamp white, UI green)
  - **Slouching** (lamp orange, UI orange): deviating for less than *Alert after*
  - **Poor Posture** (lamp red, UI red): deviating for *Alert after* or longer
  - Each state has its own banner color, figure lean, icon and feedback message.
  - The `set_lamp` command now sends `"good"`, `"slouching"`, `"poor"` or `"off"`.
- The "Alert after" setting now controls when Slouching turns into Poor
  Posture.
- Renamed the amber color tokens from `poor-*` to `warn-*`. Amber is still used
  for break reminders, "connecting" states and poor time in charts.

### Added

- **Tooltips** (shown on hover and keyboard focus), using a reusable
  `Tooltip` / `InfoTip` component:
  - **Disabled buttons explain why they're disabled:** BLE Lamp Reconnect,
    Reschedule Break, Scan for device, Reconnect / Retry, Reconnect lamp,
    Start calibration, and Continue to Dashboard.
  - **ⓘ info icons** next to Sitting Duration Tracking, Take a break in,
    Deviations detected, Acceptable posture, Total monitored, and the daily
    Deviations tile.

### Removed

- The Calibrate / Monitoring / History / Settings buttons at the bottom of the
  Dashboard. The sidebar already covers navigation, and calibration is in
  Settings.

## Phase 1.1: Settings page (2026-10-17)

### Added

- **Settings (design screen 4)**, with changes saved automatically:
  - **Device Connection:**
    - both links (SitWell device and BLE Lamp), each with a status pill;
    - **Scan for device**, **Reconnect / Retry** and **Reconnect lamp** buttons.
  - **Posture Calibration:** the steps list, plus a status panel:
    - "Calibration completed · Last calibrated …" with **Recalibrate**, or
    - "Not calibrated yet" with **Calibrate now**.
    - Recalibrating returns you to Settings afterwards.
  - **Notification Settings:** Posture alerts, **Alert after** (new, FR-S2),
    Break reminders, Reminder interval (15–90 min).
  - **Feedback Settings:** Alert activation, Alert repetition, **Feedback type**
    (Visual / Sound / Visual + sound, FR-S3).
- **Settings take effect:**
  - The reminder interval drives the dashboard break countdown.
  - Turning off break reminders hides the countdown and the "time for a break"
    message.
- **Settings persist across restarts** (FR-S4). This uses localStorage until
  SQLite is added.
- New `set_alerts` command, so the device can mirror the alert settings
  (see INTEGRATION.md).

### Not done yet

- OS notifications and sound playback that use these settings (FR-N1–N4).

## Phase 1: UI shell (2026-10-17)

The front-end for the Dashboard, Calibration and History screens, built from
the *Sitwell Pro – Desktop App Design*. Hardware and database are not connected
yet. See [INTEGRATION.md](INTEGRATION.md) for what plugs in where.

### Added

- **Calibration page (design screen 1)**
  - Shown first on every launch, before the Dashboard.
  - Two-step progress (Calibrate posture → Start monitoring).
  - Device-connected badge with a Connect button.
  - Live progress of the baseline readings, plus success and failure messages.
  - "Continue to Dashboard" unlocks after calibration succeeds. "Skip for now"
    is available so the app can be used without hardware.
  - Opened again from the Dashboard's **Calibrate** button (recalibrate mode).
- **Dashboard (design screen 2)**
  - Posture banner, posture figure, Device Status, sitting timer, feedback,
    break countdown, and quick actions.
  - **Device Status shows two connections:**
    - App ↔ SitWell device (ESP32-C3)
    - SitWell device ↔ BLE Lamp
  - Both start **offline** and switch to **connected** only when the hardware
    reports in.
  - **The sitting timer only runs when the device is connected, calibration is
    done, and the user is detected sitting.** Otherwise the card says why it's
    waiting.
  - The break countdown runs on sitting time. Standing for 2+ minutes counts as
    a break.
- **Posture Status & History (design screen 3)**
  - Current posture status and current session statistics, computed live.
  - Daily progress summary, "Posture throughout the day" bar chart (with hover
    tooltips) and good/poor donut.
  - **Session History table** (FR-H2), which wasn't in the design.
  - Saved history comes from a placeholder repository until the database is
    built.
- **Integration layer**
  - `deviceConnection` service (the single entry point for hardware).
  - Typed JSON payloads with validation.
  - A `HistoryRepository` interface for SQLite.
- **Dev-only Device simulator**
  - Sends real payloads so every state can be tested without hardware.
  - Includes a sample-history toggle.
- **Styling**
  - TailwindCSS v4, `lucide-react` icons, and the Plus Jakarta Sans font
    (bundled so it works offline).

### Changed

- The window is titled "SitWell" and opens at 1280×880 (minimum 1100×720).
- The Tauri template's greet demo was removed from the frontend.

### Not done yet

- The real ESP32 connection, the firmware, and SQLite persistence.
- OS notifications (FR-N1–N4) and sound feedback (FR-S3).
- Calibration persistence across restarts (needs the database).
