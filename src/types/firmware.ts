export interface FirmwareStatus {
  storage_error?: string;
  calibrated: boolean; calibrating: boolean;
  elapsed_ms: number; duration_ms: number; samples: number;
  seat: number; back: number; neck: number;
  ref_seat: number; ref_back: number; ref_neck: number;
  occupied: boolean; good: boolean; state: number;
  ble_connected: boolean; message: string;
}
