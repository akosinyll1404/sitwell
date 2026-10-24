PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = FULL;
BEGIN IMMEDIATE;
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    start_time INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    end_time INTEGER,
    good_ms INTEGER NOT NULL DEFAULT 0 CHECK(good_ms >= 0),
    slouch_ms INTEGER NOT NULL DEFAULT 0 CHECK(slouch_ms >= 0),
    poor_ms INTEGER NOT NULL DEFAULT 0 CHECK(poor_ms >= 0),
    deviations INTEGER NOT NULL DEFAULT 0,
    breaks_taken INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS posture_samples (
    id INTEGER PRIMARY KEY,
    received_at INTEGER NOT NULL,
    session_id INTEGER REFERENCES sessions(id),
    seat REAL NOT NULL, back REAL NOT NULL, neck REAL NOT NULL,
    ref_seat REAL NOT NULL, ref_back REAL NOT NULL, ref_neck REAL NOT NULL,
    state INTEGER NOT NULL CHECK(state BETWEEN 0 AND 4),
    occupied INTEGER NOT NULL,
    good INTEGER NOT NULL,
    calibrated INTEGER NOT NULL,
    calibrating INTEGER NOT NULL,
    ble_connected INTEGER NOT NULL,
    elapsed_ms INTEGER NOT NULL, duration_ms INTEGER NOT NULL,
    samples INTEGER NOT NULL,
    message TEXT NOT NULL,
    deviation INTEGER NOT NULL DEFAULT 0,
    break_taken INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS samples_time ON posture_samples(received_at);
CREATE TABLE IF NOT EXISTS posture_intervals (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    start_ms INTEGER NOT NULL,
    end_ms INTEGER NOT NULL CHECK(end_ms > start_ms),
    class INTEGER NOT NULL CHECK(class BETWEEN 1 AND 3)
);
CREATE INDEX IF NOT EXISTS intervals_end ON posture_intervals(end_ms);
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
PRAGMA user_version = 1;
COMMIT;
