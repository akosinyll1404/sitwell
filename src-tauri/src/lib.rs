mod database;
mod model;

use database::{Database, DatabaseInfo, RangeTotals, SessionPage, TimeRange};
use model::DeviceStatus;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::Manager;

#[tauri::command]
async fn sitwell_status(client: tauri::State<'_, reqwest::Client>, db: tauri::State<'_, Database>) -> Result<DeviceStatus, String> {
    let result = async {
        let status = client.get("http://192.168.4.1/status").send().await
            .map_err(|e| format!("Cannot reach SitWell. Join SitWell-Setup Wi-Fi. {e}"))?
            .error_for_status().map_err(|e| e.to_string())?
            .json::<DeviceStatus>().await.map_err(|e| format!("Invalid device payload: {e}"))?;
        status.validate()?;
        Ok::<DeviceStatus, String>(status)
    }.await;
    match result {
        Ok(mut status) => {
            let at = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|e| e.to_string())?.as_millis() as i64;
            // Never trust a storage_error field supplied by a device.
            status.storage_error = db.ingest(&status, at).err();
            Ok(status) // A storage failure must not hide live sensor readings.
        }
        Err(error) => { db.mark_gap(); Err(error) }
    }
}

#[tauri::command]
async fn sitwell_calibrate(client: tauri::State<'_, reqwest::Client>, db: tauri::State<'_, Database>, cancel: bool) -> Result<(), String> {
    let path = if cancel { "cancel" } else { "start" };
    let response = client.post(format!("http://192.168.4.1/calibrate/{path}"))
        .send().await.map_err(|e| e.to_string())?;
    let code = response.status();
    let body = response.text().await.map_err(|e| e.to_string())?;
    if !code.is_success() { return Err(format!("Calibration request failed ({code}): {body}")); }
    let result: serde_json::Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    if result["ok"] != true { return Err("Device did not acknowledge calibration".into()); }
    db.mark_gap();
    Ok(())
}

#[tauri::command]
fn history_sessions(db: tauri::State<'_, Database>, limit: i64, offset: i64) -> Result<SessionPage, String> {
    db.list_sessions(limit, offset)
}
#[tauri::command]
fn history_totals(db: tauri::State<'_, Database>, ranges: Vec<TimeRange>) -> Result<Vec<RangeTotals>, String> {
    db.totals(&ranges)
}
#[tauri::command]
fn database_info(db: tauri::State<'_, Database>) -> Result<DatabaseInfo, String> { db.info() }
#[tauri::command]
fn settings_load(db: tauri::State<'_, Database>) -> Result<Option<serde_json::Value>, String> { db.load_settings() }
#[tauri::command]
fn settings_save(db: tauri::State<'_, Database>, settings: serde_json::Value) -> Result<(), String> { db.save_settings(&settings) }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let client = reqwest::Client::builder().timeout(Duration::from_secs(3))
        .no_proxy().redirect(reqwest::redirect::Policy::none()).build().expect("HTTP client");
    let app = tauri::Builder::default()
        .manage(client)
        .setup(|app| {
            let path = app.path().app_data_dir()?.join("sitwell.db");
            let db = Database::open(&path).map_err(std::io::Error::other)?;
            println!("SitWell SQLite: {}", path.display());
            app.manage(db);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![sitwell_status, sitwell_calibrate,
            history_sessions, history_totals, database_info, settings_load, settings_save])
        .build(tauri::generate_context!())
        .expect("error while building SitWell (check database access and other open instances)");
    app.run(|handle, event| {
        if let tauri::RunEvent::Exit = event {
            if let Err(error) = handle.state::<Database>().finish() { eprintln!("Session close failed: {error}"); }
        }
    });
}
