use std::time::Duration;
use serde::{Deserialize, Serialize};

#[derive(Clone, Deserialize, Serialize)]
struct DeviceStatus {
    calibrated: bool, calibrating: bool,
    elapsed_ms: u32, duration_ms: u32, samples: u32,
    seat: f64, back: f64, neck: f64,
    ref_seat: f64, ref_back: f64, ref_neck: f64,
    occupied: bool, good: bool, state: u8,
    ble_connected: bool, message: String,
}

#[tauri::command]
async fn sitwell_status(client: tauri::State<'_, reqwest::Client>) -> Result<DeviceStatus, String> {
    let status = client.get("http://192.168.4.1/status").send().await
        .map_err(|e| format!("Cannot reach SitWell. Join SitWell-Setup Wi-Fi. {e}"))?
        .error_for_status().map_err(|e| e.to_string())?
        .json::<DeviceStatus>().await.map_err(|e| format!("Invalid device payload: {e}"))?;
    if status.state > 4 || status.duration_ms == 0 ||
        [status.seat, status.back, status.neck, status.ref_seat, status.ref_back, status.ref_neck]
            .iter().any(|v| !v.is_finite()) {
        return Err("Invalid device state or readings".into());
    }
    Ok(status)
}

#[tauri::command]
async fn sitwell_calibrate(client: tauri::State<'_, reqwest::Client>, cancel: bool) -> Result<(), String> {
    let path = if cancel { "cancel" } else { "start" };
    let response = client.post(format!("http://192.168.4.1/calibrate/{path}"))
        .send().await.map_err(|e| e.to_string())?;
    let code = response.status();
    let body = response.text().await.map_err(|e| e.to_string())?;
    if !code.is_success() { return Err(format!("Calibration request failed ({code}): {body}")); }
    let result: serde_json::Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    if result["ok"] != true { return Err("Device did not acknowledge calibration".into()); }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let client = reqwest::Client::builder().timeout(Duration::from_secs(3))
        .no_proxy().redirect(reqwest::redirect::Policy::none()).build().expect("HTTP client");
    tauri::Builder::default()
        .manage(client)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![sitwell_status, sitwell_calibrate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
