# Changelog

## Unreleased

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
