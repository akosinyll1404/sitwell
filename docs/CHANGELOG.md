# Changelog

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
- Settings screen (currently a placeholder).
- OS notifications (FR-N1–N4) and sound feedback (FR-S3).
- Calibration persistence across restarts (needs the database).
