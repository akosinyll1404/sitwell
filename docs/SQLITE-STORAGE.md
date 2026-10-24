# SitWell SQLite storage

## Start on Windows

1. Back up the current project. Extract this updated project and copy its contents into your repository, retaining your existing .git folder.
2. Keep the same src-tauri/tauri.conf.json identifier so the app uses the same data directory.
3. With internet access, run:

   npm ci
   npm run tauri dev

Rust downloads and compiles rusqlite with bundled SQLite on the first build. No separate SQLite server or Python process is required. Use the Tauri desktop window, not just the browser Vite preview.

The app automatically creates **sitwell.db** inside its per-user application data directory. Expand the **SQLite** status line in the live device panel to see its exact path, recorded reading count, and session count. The path also prints in the terminal at startup.

On Windows with this project's identifier, the directory is normally:
%APPDATA%\com.lenovo.sitwell

Database files are outside your source repository. They survive app restarts and replacing project source files as long as the application identifier and OS user stay the same. They are local to this computer/user.

## What is stored

- **posture_samples**: every successfully received and validated /status response, including its PC receive timestamp, transformed seat/back/neck values, reference values, firmware state, occupancy, good posture flag, calibration fields, lamp connection, message, and observed deviation/break markers. Readings are stored even while standing or calibrating.
- **sessions**: one monitoring session per application run, created lazily on the first calibrated, occupied sample with a seated firmware state. Includes seated duration by posture class, observed deviations, breaks, start time, last observation, and end time.
- **posture_intervals**: credited intervals between successive valid observations. These power accurate daily totals and half-hour timelines, including sessions crossing midnight.
- **settings**: the validated settings object. On the first SQLite load, existing localStorage settings are copied into SQLite only if no SQLite settings exist. Later loads use SQLite.

A session pauses while disconnected, standing, or calibrating and resumes within the same app run. A new application run starts a new session on its first seated reading. Normal exit closes the session at its last observation. After a crash, the next startup closes any interrupted session at its last observation; no closed-app time is added.

The ESP32 still stores the authoritative calibration baseline using Preferences. SQLite records the reference values supplied with each payload; it does not replace device calibration.

## Timing and classification

- Each /status response is saved before it is delivered to the frontend. Raw reading insert, interval insert, and session totals update form one SQLite transaction.
- The interval between two consecutive observations is credited to the earlier observation's posture. No interval is credited after an HTTP/JSON failure or when the gap exceeds 3 seconds.
- Calibration start/cancel breaks the credited interval chain. Calibrating and uncalibrated samples never establish a seated baseline for time credit.
- State 1 and state 4 count as good posture in the existing three-category history. State 2 is slouching/deviation; state 3 is sustained poor posture. All five original states remain in posture_samples and the live device panel.
- A deviation count is an observed transition from good to deviated posture, not an initial poor reading after reconnect. alertCount remains zero because notification delivery/acknowledgement is not implemented.
- A break requires at least 2 minutes of continuously observed standing followed by seated readings. Connection loss does not count as a break.
- Local date/half-hour boundaries come from the frontend. SQL splits intervals at those boundaries, rather than assigning an entire session to its starting date.
- History reads include the active saved session. They do not add frontend live statistics again. History refreshes every 5 seconds and can lag the live dashboard slightly.
- No readings are collected while the app is closed, asleep without polling, or disconnected. Gaps are never backfilled.

All samples remain in the database; there is no automatic retention/purge feature in this change.

## Storage failures and concurrent windows

If a transaction fails, SQLite rolls it back. The app keeps showing live sensor values and displays a storage error; the next valid poll retries recording. Failed samples are not queued or recovered later.

Settings and History errors are also visible in the storage status. Do not interpret an empty chart as proof that recording succeeded: check the saved-reading count and any storage warning.

An exclusive per-database lock prevents two desktop instances from writing competing sessions. Close the first app before opening another. The .lock file may remain after closing; the operating-system lock is released automatically, so no manual deletion is needed.

If the database cannot open at startup, the app reports a startup error. Check folder permissions, available space, and other open app instances.

## Verify without an ESP32

Frontend and mocked transport/settings tests:

   npm ci
   npm run build
   node --test tests/*.test.mjs

Real Rust/SQLite tests, without Tauri GUI prerequisites or hardware:

   cargo test --manifest-path storage-tests/Cargo.toml

The storage test crate directly compiles src-tauri/src/database.rs and model.rs. Tests create isolated temporary databases and cover:
- Persistence through close/reopen, session recovery, settings, and pagination.
- No credit for disconnected, uncalibrated/calibrating, or unoccupied intervals.
- Midnight/half-hour interval splitting and no duplicated totals.
- Continuously observed standing breaks.
- Invalid inputs and blocking a second writer.
- Transaction rollback on a simulated insert failure and recovery on the next write.

Test databases are temporary, separate from the app's real history. The existing angle simulator and sample-history preview do not insert synthetic readings into the real SQLite database.

## Verify with hardware

1. Start the desktop app, then join SitWell-Setup Wi-Fi.
2. Check /status in a browser and check the app's SQLite reading count is increasing.
3. Calibrate, sit for at least one minute, and change posture. Open History; wait up to 5 seconds for stored totals.
4. Stand or disconnect Wi-Fi. Saved seated duration must stop increasing after the last valid interval.
5. Close and reopen the app. Use Skip for now on the calibration screen, then open History. Previous sessions and daily totals must still appear even without the ESP32 connected.
6. Change a setting, restart, and confirm the value remains.
7. If a session spans midnight, view both dates; each should contain only its own portion.

## Back up or inspect

Close SitWell fully before copying sitwell.db to a backup location. If a sitwell.db-wal file remains, preserve it together with the database. Avoid copying an actively changing database as a plain file.

The database is compatible with standard SQLite viewers. Do not edit its tables while SitWell is running. Runtime *.db, *.db-wal, *.db-shm, and *.lock files are excluded by .gitignore; Cargo.lock remains tracked.

## Files changed

- src-tauri/src/database.rs, model.rs, schema.sql: database implementation and device model.
- src-tauri/src/lib.rs: app-data setup, recording, History/settings commands, session shutdown.
- src-tauri/Cargo.toml and Cargo.lock: SQLite, file-lock, and HTTP dependencies.
- src/services/historyRepository.ts: real History queries; the no-op saveSession function is removed because Rust records sessions atomically.
- src/services/settingsRepository.ts and src/hooks/useSettings.ts: SQLite settings and one-time migration.
- src/services/storage.ts and src/components/device/StorageStatus.tsx: storage status/error reporting.
- src/services/deviceConnection.ts and src/types/firmware.ts: display recording failures without hiding live readings.
- src/hooks/useHistory.ts, useSessionPage.ts, pages/HistoryPage.tsx, components/history/SessionHistoryTable.tsx: periodic saved-history queries and duplicate prevention.
- storage-tests/, tests/storage-ui.test.mjs: device-free validation.

This update does not implement desktop notifications, sound, firmware alert-setting commands, raw-reading export, or a cloud backup service.

## Validation of this update

Passed: frontend production build; four Node tests covering mocked transport, settings migration/write ordering, and history range queries; seven Rust tests compiling the actual production SQLite modules.

A full Tauri cargo check was attempted, but this Linux environment lacks the pkg-config/GTK/WebKit system dependencies. The Windows desktop build, GUI flow, and physical ESP32 connection still require verification on the target machine.
