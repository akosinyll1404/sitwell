# Connect the existing SitWell app to the ESP32

## Run on Windows
1. Extract this ZIP into a separate folder and open that folder in VS Code.
2. Run `npm ci` with internet access.
3. Run `npm run tauri dev` (first run downloads the new Rust reqwest dependency).
4. Connect Windows Wi-Fi to **SitWell-Setup** using the firmware's configured password.
5. Verify http://192.168.4.1/status returns JSON in your browser.
6. The app connects automatically and retries after failed requests. Use Reconnect if needed.

Use the desktop Tauri window. `npm run dev` alone cannot call the Rust backend.
No Python process is required. No firmware changes are included.

## Verify with hardware
- Device connected and live seat/back/neck match /status.
- Lamp status matches ble_connected independently of the desktop Wi-Fi connection.
- Stored baseline loads without recalibration.
- Start calibration: hold neutral posture for 20 seconds. Progress uses device elapsed_ms.
- Success is accepted only after the firmware reports "Calibration saved successfully".
- Cancel: previous baseline remains on the ESP32.
- Disconnect Wi-Fi: live panel clears and dashboard goes offline; restore Wi-Fi to reconnect.
- Check states 0–4 against the live panel, including the prolonged-sitting reminder.
- Restart the ESP32/app and check that the saved baseline loads.
- Run `npm run tauri build` for a Windows installer after hardware checks pass.

## Integration details and limits
Rust performs HTTP with a 3-second timeout, no proxy, and no redirects. The frontend invokes one status request at a time, then waits 700 ms. Requests target only 192.168.4.1.
Start/cancel are POST requests with HTTP and JSON acknowledgement checks.
The firmware performs calibration, persistence, posture classification, and BLE lamp control.
Sensor outputs are transformed readings, not pitch/roll or raw ADC. Legacy angle fields are internal compatibility placeholders only; the physical-device UI displays sensor baselines instead.
State 1 and state 4 count as good posture in the existing three-category history. State 2 maps to slouching and state 3 to poor. The live panel displays all five firmware states.
The firmware has no commands for lamp reconnect, lamp colors, or alert settings. Lamp retry is automatic. Saved app preferences do not alter firmware thresholds or feedback.
The firmware does not provide the calibration save date; loaded baselines display that fact.
The development simulator is opt-in via VITE_ENABLE_SIMULATOR=true; leave it off with hardware.
Calibration continues on the ESP32 if this window closes or you navigate away. Reopen calibration to check the stored result.
Old docs/INTEGRATION.md describes the prior proposed angle protocol; this document supersedes it for this firmware.
The firmware's transformed sensor units and saved references need hardware validation (particularly the neck/reference mismatch). This patch does not change those equations.

## Validation performed
- Frontend production build (TypeScript + Vite).
- Automated mocked transport test: payload forwarding, error recovery, calibration commands, and stale in-flight results after disconnect.
- The production SQLite modules compile and their Rust integration tests pass without an ESP32. The full Windows desktop build and live device checks still need to run on Windows.
Cargo.lock now includes reqwest and the SQLite dependencies. See SQLITE-STORAGE.md for the current storage implementation and tests.
