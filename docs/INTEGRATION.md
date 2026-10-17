# SitWell Integration Guide

This guide explains how to connect real hardware and storage to the Phase 1 UI.
The UI is finished and already reacts to live data. What's left is to supply
that data through **three integration points**:

| # | What | File | Status |
|---|------|------|--------|
| 1 | App ↔ ESP32-C3 connection (transport) | `src/services/deviceConnection.ts` | Stub. Always offline |
| 2 | ESP32-C3 firmware that sends the payloads below | firmware repo | Not started |
| 3 | SQLite history storage | `src/services/historyRepository.ts` | Stub. Returns nothing |
| 4 | SQLite settings storage | `src/services/settingsRepository.ts` | Uses localStorage for now (works, but move it to SQLite) |

Search the code for `TODO(integration)` and `TODO(database)` to find the exact places.

---

## 1. How data flows

```
ESP32-C3 ──(JSON)──► transport ──► deviceConnection.receive(raw)
                                         │  validates (src/services/protocol.ts)
                                         ▼
                                   useMonitoring()   ← classifies posture, runs timers
                                         │
                       ┌─────────────────┼─────────────────┐
                   Dashboard        Calibration         History
```

- Every screen reads from **`useMonitoring()`** (`src/hooks/useMonitoring.ts`).
- The hook only listens to `deviceConnection`, so **the UI never talks to
  hardware directly**. Once the transport feeds `deviceConnection`, every
  screen works with no further changes.
- Invalid messages are dropped and logged (`[device] Ignored message: …`). They
  never crash the app (FR-M4).

---

## 2. Connecting the ESP32-C3 (`deviceConnection.ts`)

The transport needs to do four things:

| When | Call |
|------|------|
| Starting to connect | `deviceConnection.setLinkState("connecting")` (already done in `connect()`) |
| Connection established | `deviceConnection.setLinkState("connected")` |
| Each incoming message (string or object) | `deviceConnection.receive(raw)` |
| Connection lost | `deviceConnection.setLinkState("disconnected")` |

Outgoing commands go through `send(command)`. Write
`JSON.stringify(command)` to the transport at the `TODO(integration)` in
`send()`.

### Option A: WebSocket from the frontend (fastest)

Inside `connect()`, replacing the phase-1 timeout:

```ts
const socket = new WebSocket(`ws://${deviceAddress}:81/`);
socket.onopen = () => this.setLinkState("connected");
socket.onmessage = (e) => this.receive(e.data);
socket.onclose = () => this.setLinkState("disconnected");
this.socket = socket;
```

You'll also need:

- **CSP:** add `connect-src ws://*` (or the device host) in `src-tauri/tauri.conf.json`.
- **Auto-retry:** on `onclose`, call `connect()` again after a short backoff.

### Option B: Rust backend (more robust in the background)

1. Open the socket (WebSocket or BLE) in Rust.
2. Emit Tauri events, e.g. `device://message` and `device://link`.
3. In `deviceConnection`, use `listen()` from `@tauri-apps/api/event` to call
   `receive()` and `setLinkState()`.

The UI is the same either way.

### Where the device address comes from

There is no Settings screen yet. Hard-code the address for now. Once Settings
exists, it should save the address under the `device_address` key (§11.3 of the
technical design).

---

## 3. Payloads (firmware contract)

The TypeScript definitions are in `src/types/device.ts`. The validation rules
are in `src/services/protocol.ts`.

### Device → App

**`status`** must be sent:
- on connect,
- whenever the BLE Lamp link changes,
- and as a heartbeat every ~5 s.

```json
{
  "type": "status",
  "deviceId": "sitwell-001",
  "online": true,
  "lampConnected": true,
  "firmware": "1.0.0",
  "battery": 87
}
```

| Field | Type | Required | Drives |
|-------|------|----------|--------|
| `deviceId` | string | ✅ | Device identity |
| `online` | boolean | ✅ | (reserved) |
| `lampConnected` | boolean | ✅ | **BLE Lamp row** in Device Status (Connected / Offline) |
| `firmware` | string | — | (reserved) |
| `battery` | number 0–100 | — | (reserved; omit if the board can't measure it) |

**`posture`** is sent about once per second.

```json
{
  "type": "posture",
  "deviceId": "sitwell-001",
  "timestamp": 1760400000,
  "pitch": 12.5,
  "roll": -3.2,
  "seated": true
}
```

| Field | Type | Required | Drives |
|-------|------|----------|--------|
| `pitch` | number −180…180 (degrees) | ✅ | Posture classification, calibration |
| `roll` | number −180…180 (degrees) | ✅ | Posture classification, calibration |
| `seated` | boolean | ✅ | **Session timer starts/pauses**, break detection |
| `timestamp` | Unix seconds | — | Not used. The app stamps its own receive time, because the ESP32 has no RTC unless it syncs NTP |

> ⚠️ **Changed from the technical design document (§10.5):**
> - **Added `seated`.** The timer must only run while the user is sitting, so
>   the device has to report this. It can come from a pressure or distance
>   sensor, or be inferred from the IMU.
> - **Dropped `status`** (`"good"`/`"slouching"`). The **app** classifies
>   posture against the calibration baseline (FR-M2). The device only sends
>   raw angles.
> - **Added `lampConnected`** to the `status` message, for the BLE Lamp row.

### App → Device

```json
{ "type": "command", "action": "set_lamp", "state": "good" }
```
- Sent whenever the posture changes.
- `state` is `"good"`, `"poor"` or `"off"`. `"off"` means no data.
- The firmware should forward it to the BLE Lamp, for example green/amber/off.

```json
{ "type": "command", "action": "lamp_reconnect" }
```
- Sent when the user clicks **Reconnect** on the BLE Lamp row.
- The firmware should retry its BLE link and then send a `status` message with
  the new `lampConnected` value.
- The app shows "Reconnecting…" for up to 8 s.

```json
{ "type": "command", "action": "set_alerts", "enabled": true, "repeat": false, "delaySeconds": 30, "feedback": "both" }
```
- Sent on connect and whenever the Settings change.
- `enabled` is *Alert activation* AND *Posture alerts*.
- `repeat` is *Alert repetition*.
- `delaySeconds` is *Alert after*. It can replace the firmware's hard-coded `SUSTAIN_TIME`.
- `feedback` is `"visual"`, `"sound"` or `"both"`. It controls whether the lamp lights up, buzzes, or both.

---

## 4. What each screen needs

| UI element | Source | Needs |
|------------|--------|-------|
| SitWell device row | link state | Transport calls `setLinkState()` |
| BLE Lamp row | `status.lampConnected` | `status` messages |
| Posture banner, figure, feedback | `posture.pitch/roll` + calibration | `posture` messages + a completed calibration |
| Sitting duration timer | `posture.seated` | Runs only when **connected + calibrated + seated + data fresh (<5 s)** |
| Break countdown | sitting time | Counts down only while the timer runs. Standing ≥2 min counts as a break and resets it |
| Calibration page | `posture` messages | 8 seated samples. Fails if the readings are unsteady (std dev >3°), no data arrives within 20 s, or the device disconnects |
| History: current session | live session | Nothing extra |
| History: daily summary, chart, sessions | repository + live session | Database (section 6) |

### Monitoring phases (`MonitoringPhase`)

The dashboard shows exactly one reason at a time, checked in this order:

1. `offline`: "Device not connected"
2. `uncalibrated`: "Calibrate to start monitoring"
3. `awaiting_data`: "Waiting for sensor data" (no `posture` message for 5 s)
4. `not_seated`: "Waiting for you to sit down"
5. `running`: the timer counts and posture is shown

---

## 5. Tuning

All thresholds are in `src/config/monitoring.ts`:

| Constant | Default | Meaning |
|----------|---------|---------|
| `PITCH_THRESHOLD_DEG` | 15 | Pitch deviation from baseline that counts as poor posture |
| `ROLL_THRESHOLD_DEG` | 10 | Roll deviation from baseline that counts as poor posture |
| `STALE_DATA_MS` | 5000 | No data for this long → "no data" |
| `BREAK_MIN_MS` | 2 min | Standing time that counts as a break |
| `CALIBRATION_SAMPLES` | 8 | Readings collected per calibration |
| `CALIBRATION_MAX_STD_DEG` | 3 | Allowed movement while calibrating |
| `DEVICE_TRANSPORT` | "Wi-Fi" | Label in Device Status. Change it if the app ↔ ESP32 link is BLE |

Tune the thresholds once real sensor data is available.

---

## 6. Database (`historyRepository.ts`)

Implement the `HistoryRepository` interface using SQLite (`tauri-plugin-sql`,
or Tauri commands backed by `rusqlite`):

| Method | Used by |
|--------|---------|
| `listSessions({ limit })` | Session History table, daily summary |
| `getTimeline(dayStart)` | "Posture throughout the day" chart (30-min slots) |
| `saveSession(session)` | **Not called yet.** Call it periodically (e.g. every 30 s) and when a session ends, from `useMonitoring` |

### Proposed schema changes (vs. technical design §11)

- **`session`:**
  - add `deviation_count INTEGER` and `breaks_taken INTEGER`. The History
    screen shows both.
- **New `timeline` table:** `(day_start INTEGER, slot_start INTEGER,
  good_ms INTEGER, poor_ms INTEGER)`. This is cheaper for the chart than
  aggregating raw `posture_record` rows.
- **`settings` keys to add:**
  - `calibration_baseline` (JSON `{ basePitch, baseRoll, calibratedAt }`),
  - `device_address`,
  - `onboarding_complete`.
- **Timestamps:** store them as INTEGER Unix milliseconds. SQLite has no real
  DATETIME type.
- **Write settings:** enable WAL mode, and batch `posture_record` inserts
  (one transaction every 5–10 s).

### Settings persistence

`settingsRepository.ts` saves the Settings screen to the WebView's localStorage,
so settings already survive restarts (FR-S4). When moving it to SQLite:
- store each field as one row in `settings`: `alert_delay`,
  `break_interval_minutes`, `posture_alerts_enabled`, and so on;
- keep the `load()`/`save()` interface so the UI doesn't change.

### Calibration persistence

Right now the baseline lives only in memory, so the calibration screen appears
on every launch. Once settings are stored:

1. In `App.tsx`, load `calibration_baseline` on startup.
2. If it exists, call `actions.saveCalibration(baseline)` and start on
   `"dashboard"` instead of `"calibration"`.
3. Save it from `useMonitoring`'s `saveCalibration` action.

### Session boundaries

There is currently one session per app run: it starts at the first seated
reading after calibration. Decide the rule for ending a session before adding
the database, for example "not seated for more than 10 min ends the session".

---

## 7. Testing without hardware

In `npm run tauri dev`, click **Device simulator** (bottom-right). It's
dev-only and never included in production builds.

- **Connect simulated ESP32**, toggle **BLE Lamp paired** and **User seated**,
  and switch posture between Good and Slouching.
- It sends the **exact JSON payloads above** through `deviceConnection.receive()`,
  so it also checks the validation and monitoring logic.
- **Sample history data** fills the History screen with sample sessions so you
  can see the layout.

When the real transport is ready, test it against the same flow:
1. Connect.
2. Calibrate.
3. Sit, then slouch.
4. Stand up.
5. Disconnect.
