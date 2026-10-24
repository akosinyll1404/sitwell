// SQLite persistence is independent of Tauri; tested by storage-tests/Cargo.toml.
use crate::model::DeviceStatus;
use fs2::FileExt;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{fs::{File, OpenOptions}, path::Path, sync::Mutex, time::Duration};

const MAX_GAP_MS: i64 = 3_000;
const BREAK_MIN_MS: i64 = 120_000;

#[derive(Clone, Copy)]
struct Previous {
    at: i64,
    class: Option<i64>,
    standing: bool,
}
struct Store {
    connection: Connection,
    session: Option<i64>,
    previous: Option<Previous>,
    standing_since: Option<i64>,
    error: Option<String>,
}
pub struct Database {
    store: Mutex<Store>,
    path: String,
    // Exclusive process lock prevents a second app from closing this app's session.
    _lock: File,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecord {
    pub id: i64,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub duration_seconds: f64,
    pub good_posture_seconds: f64,
    pub slouch_posture_seconds: f64,
    pub poor_posture_seconds: f64,
    pub alert_count: i64,
    pub deviation_count: i64,
    pub breaks_taken: i64,
}
#[derive(Debug, Serialize)]
pub struct SessionPage {
    pub sessions: Vec<SessionRecord>,
    pub total: i64,
}
#[derive(Clone, Copy, Debug, Deserialize)]
pub struct TimeRange {
    pub start: i64,
    pub end: i64,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RangeTotals {
    pub start: i64,
    pub good_ms: i64,
    pub slouch_ms: i64,
    pub poor_ms: i64,
    pub deviations: i64,
    pub breaks_taken: i64,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseInfo {
    pub path: String,
    pub sample_count: i64,
    pub session_count: i64,
    pub error: Option<String>,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self, String> {
        if let Some(parent) = path.parent() { std::fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
        let lock = OpenOptions::new().read(true).write(true).create(true).truncate(false)
            .open(path.with_extension("lock")).map_err(|e| e.to_string())?;
        lock.try_lock_exclusive().map_err(|_| "SitWell database is already open in another app instance. Close it first.".to_string())?;
        let connection = Connection::open(path).map_err(|e| e.to_string())?;
        connection.busy_timeout(Duration::from_secs(3)).map_err(|e| e.to_string())?;
        let version: i64 = connection.query_row("PRAGMA user_version", [], |r| r.get(0)).map_err(|e| e.to_string())?;
        if version > 1 { return Err("Database was created by a newer SitWell version.".into()); }
        connection.execute_batch(include_str!("schema.sql")).map_err(|e| e.to_string())?;
        // Recover an interrupted app run without crediting any time while it was closed.
        connection.execute("UPDATE sessions SET end_time=last_seen WHERE end_time IS NULL", [])
            .map_err(|e| e.to_string())?;
        Ok(Self {
            store: Mutex::new(Store { connection, session: None, previous: None, standing_since: None, error: None }),
            path: path.to_string_lossy().into_owned(), _lock: lock,
        })
    }

    pub fn ingest(&self, sample: &DeviceStatus, at: i64) -> Result<(), String> {
        sample.validate()?;
        if at < 0 { return Err("Invalid receive timestamp".into()); }
        let mut store = self.store.lock().map_err(|e| e.to_string())?;
        let result = Self::write_sample(&mut store, sample, at);
        match &result {
            Ok(()) => store.error = None,
            Err(error) => {
                // Do not bridge a failed transaction on the next successful poll.
                store.previous = None;
                store.standing_since = None;
                store.error = Some(error.clone());
            }
        }
        result
    }

    fn write_sample(store: &mut Store, d: &DeviceStatus, at: i64) -> Result<(), String> {
        // A valid seated sample must also have a consistent firmware state.
        let class = if d.calibrated && !d.calibrating && d.occupied {
            match d.state { 1 | 4 => Some(1), 2 => Some(2), 3 => Some(3), _ => None }
        } else { None };
        let standing = d.calibrated && !d.calibrating && !d.occupied && d.state == 0;
        let previous = store.previous.filter(|p| at > p.at && at - p.at <= MAX_GAP_MS);
        let mut session = store.session;
        let mut standing_since = if previous.is_some() { store.standing_since } else { None };
        let tx = store.connection.transaction().map_err(|e| e.to_string())?;
        if session.is_none() && class.is_some() {
            tx.execute("INSERT INTO sessions(start_time,last_seen) VALUES (?1,?1)", [at]).map_err(|e| e.to_string())?;
            session = Some(tx.last_insert_rowid());
        }

        let mut deviation = 0i64;
        let mut break_taken = 0i64;
        if let Some(id) = session {
            if let Some(p) = previous {
                if let Some(prior_class) = p.class {
                    let elapsed = at - p.at;
                    tx.execute("INSERT INTO posture_intervals(session_id,start_ms,end_ms,class) VALUES (?1,?2,?3,?4)",
                        params![id, p.at, at, prior_class]).map_err(|e| e.to_string())?;
                    tx.execute("UPDATE sessions SET good_ms=good_ms+?2,slouch_ms=slouch_ms+?3,poor_ms=poor_ms+?4 WHERE id=?1",
                        params![id, if prior_class == 1 {elapsed} else {0},
                            if prior_class == 2 {elapsed} else {0}, if prior_class == 3 {elapsed} else {0}])
                        .map_err(|e| e.to_string())?;
                }
                // Count only an observed good -> deviated transition, not reconnection.
                deviation = i64::from(p.class == Some(1) && matches!(class, Some(2 | 3)));
                if class.is_some() && p.standing && standing_since.is_some_and(|start| at - start >= BREAK_MIN_MS) {
                    break_taken = 1;
                }
            }
            tx.execute("UPDATE sessions SET last_seen=MAX(last_seen,?2),deviations=deviations+?3,breaks_taken=breaks_taken+?4 WHERE id=?1",
                params![id, at, deviation, break_taken]).map_err(|e| e.to_string())?;
        }
        if standing {
            standing_since = Some(standing_since.unwrap_or(at));
        } else {
            standing_since = None;
        }
        tx.execute(
            "INSERT INTO posture_samples(received_at,session_id,seat,back,neck,ref_seat,ref_back,ref_neck,state,occupied,good,calibrated,calibrating,ble_connected,elapsed_ms,duration_ms,samples,message,deviation,break_taken)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20)",
            params![at,session,d.seat,d.back,d.neck,d.ref_seat,d.ref_back,d.ref_neck,d.state,
                d.occupied,d.good,d.calibrated,d.calibrating,d.ble_connected,d.elapsed_ms,d.duration_ms,d.samples,d.message,deviation,break_taken])
            .map_err(|e| e.to_string())?;
        tx.commit().map_err(|e| e.to_string())?;
        // Advance runtime state only after the entire transaction commits.
        store.session = session;
        store.previous = Some(Previous { at, class, standing });
        store.standing_since = standing_since;
        Ok(())
    }

    pub fn mark_gap(&self) {
        if let Ok(mut store) = self.store.lock() {
            store.previous = None;
            store.standing_since = None;
        }
    }

    pub fn finish(&self) -> Result<(), String> {
        let mut store = self.store.lock().map_err(|e| e.to_string())?;
        if let Some(id) = store.session {
            store.connection.execute("UPDATE sessions SET end_time=last_seen WHERE id=?1", [id]).map_err(|e| e.to_string())?;
        }
        store.session = None;
        store.previous = None;
        store.standing_since = None;
        Ok(())
    }

    pub fn list_sessions(&self, limit: i64, offset: i64) -> Result<SessionPage, String> {
        if !(1..=100).contains(&limit) || offset < 0 { return Err("Invalid history page".into()); }
        let store = self.store.lock().map_err(|e| e.to_string())?;
        let total = store.connection.query_row("SELECT COUNT(*) FROM sessions", [], |r| r.get(0)).map_err(|e| e.to_string())?;
        let mut stmt = store.connection.prepare(
            "SELECT id,start_time,end_time,good_ms,slouch_ms,poor_ms,deviations,breaks_taken
             FROM sessions ORDER BY start_time DESC,id DESC LIMIT ?1 OFFSET ?2").map_err(|e| e.to_string())?;
        let sessions = stmt.query_map(params![limit,offset], |r| {
            let good: i64 = r.get(3)?; let slouch: i64 = r.get(4)?; let poor: i64 = r.get(5)?;
            Ok(SessionRecord {
                id:r.get(0)?, start_time:r.get(1)?, end_time:r.get(2)?,
                duration_seconds:(good+slouch+poor) as f64 / 1000.0,
                good_posture_seconds:good as f64 / 1000.0,
                slouch_posture_seconds:slouch as f64 / 1000.0,
                poor_posture_seconds:poor as f64 / 1000.0,
                alert_count:0, deviation_count:r.get(6)?, breaks_taken:r.get(7)?,
            })
        }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>,_>>().map_err(|e| e.to_string())?;
        Ok(SessionPage { sessions, total })
    }

    // Client sends local-midnight/half-hour UTC boundaries, preserving local dates and DST.
    pub fn totals(&self, ranges: &[TimeRange]) -> Result<Vec<RangeTotals>, String> {
        if ranges.len() > 3700 || ranges.iter().any(|r| r.start < 0 || r.end <= r.start || r.end - r.start > 90_000_000) {
            return Err("Invalid history date range".into());
        }
        let store = self.store.lock().map_err(|e| e.to_string())?;
        let mut duration = store.connection.prepare(
            "SELECT COALESCE(SUM(CASE WHEN class=1 THEN MIN(end_ms,?2)-MAX(start_ms,?1) ELSE 0 END),0),
                    COALESCE(SUM(CASE WHEN class=2 THEN MIN(end_ms,?2)-MAX(start_ms,?1) ELSE 0 END),0),
                    COALESCE(SUM(CASE WHEN class=3 THEN MIN(end_ms,?2)-MAX(start_ms,?1) ELSE 0 END),0)
             FROM posture_intervals WHERE end_ms>?1 AND start_ms<?2").map_err(|e| e.to_string())?;
        let mut events = store.connection.prepare(
            "SELECT COALESCE(SUM(deviation),0),COALESCE(SUM(break_taken),0)
             FROM posture_samples WHERE received_at>=?1 AND received_at<?2").map_err(|e| e.to_string())?;
        ranges.iter().map(|range| {
            let (good_ms,slouch_ms,poor_ms) = duration.query_row(params![range.start,range.end], |r| Ok((r.get(0)?,r.get(1)?,r.get(2)?))).map_err(|e| e.to_string())?;
            let (deviations,breaks_taken) = events.query_row(params![range.start,range.end], |r| Ok((r.get(0)?,r.get(1)?))).map_err(|e| e.to_string())?;
            Ok(RangeTotals { start:range.start,good_ms,slouch_ms,poor_ms,deviations,breaks_taken })
        }).collect()
    }

    pub fn load_settings(&self) -> Result<Option<serde_json::Value>, String> {
        let store = self.store.lock().map_err(|e| e.to_string())?;
        let json: Option<String> = store.connection.query_row("SELECT value FROM settings WHERE key='app'", [], |r| r.get(0))
            .optional().map_err(|e| e.to_string())?;
        json.map(|s| serde_json::from_str(&s).map_err(|e| e.to_string())).transpose()
    }
    pub fn save_settings(&self, value: &serde_json::Value) -> Result<(), String> {
        let json = serde_json::to_string(value).map_err(|e| e.to_string())?;
        if !value.is_object() || json.len() > 65536 { return Err("Invalid settings".into()); }
        let store = self.store.lock().map_err(|e| e.to_string())?;
        store.connection.execute("INSERT INTO settings(key,value) VALUES ('app',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            [json]).map_err(|e| e.to_string())?;
        Ok(())
    }
    pub fn info(&self) -> Result<DatabaseInfo, String> {
        let store = self.store.lock().map_err(|e| e.to_string())?;
        Ok(DatabaseInfo {
            path:self.path.clone(),
            sample_count:store.connection.query_row("SELECT COUNT(*) FROM posture_samples", [], |r| r.get(0)).map_err(|e| e.to_string())?,
            session_count:store.connection.query_row("SELECT COUNT(*) FROM sessions", [], |r| r.get(0)).map_err(|e| e.to_string())?,
            error:store.error.clone(),
        })
    }
}
