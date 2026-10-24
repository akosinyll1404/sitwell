use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DeviceStatus {
    pub calibrated: bool,
    pub calibrating: bool,
    pub elapsed_ms: u32,
    pub duration_ms: u32,
    pub samples: u32,
    pub seat: f64,
    pub back: f64,
    pub neck: f64,
    pub ref_seat: f64,
    pub ref_back: f64,
    pub ref_neck: f64,
    pub occupied: bool,
    pub good: bool,
    pub state: u8,
    pub ble_connected: bool,
    pub message: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub storage_error: Option<String>,
}

impl DeviceStatus {
    pub fn validate(&self) -> Result<(), String> {
        if self.state > 4 || self.duration_ms == 0 ||
            [self.seat, self.back, self.neck, self.ref_seat, self.ref_back, self.ref_neck]
                .iter().any(|v| !v.is_finite()) {
            return Err("Invalid device state or readings".into());
        }
        Ok(())
    }
}
