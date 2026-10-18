import { useEffect, useState } from "react";
import { DeviceSimulator } from "./components/dev/DeviceSimulator";
import { Sidebar } from "./components/layout/Sidebar";
import { useMonitoring } from "./hooks/useMonitoring";
import { useSettings } from "./hooks/useSettings";
import { CalibrationPage } from "./pages/CalibrationPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { deviceConnection } from "./services/deviceConnection";
import type { PageId, Route } from "./types/navigation";

function App() {
  // Calibration is the first screen on every launch until a saved baseline
  // can be loaded from the database.
  const [route, setRoute] = useState<Route>("calibration");
  // Where to go back to after recalibrating.
  const [returnTo, setReturnTo] = useState<PageId>("dashboard");
  const [onboarded, setOnboarded] = useState(false);
  const [sampleHistory, setSampleHistory] = useState(false);

  const [settings, updateSettings] = useSettings();
  // Lives at the top level so monitoring keeps running across screens.
  const [snapshot, actions] = useMonitoring({
    breakIntervalMs: settings.breakIntervalMinutes * 60_000,
    alertDelayMs: settings.alertDelaySeconds * 1000,
  });

  // Try to reach the device on startup. In phase 1 this times out → offline.
  useEffect(() => {
    deviceConnection.connect();
  }, []);

  // Keep the device's alert behavior in sync with Settings.
  const deviceConnected = snapshot.connections.device === "connected";
  useEffect(() => {
    if (!deviceConnected) return;
    deviceConnection.send({
      type: "command",
      action: "set_alerts",
      enabled: settings.alertActivation && settings.postureAlerts,
      repeat: settings.alertRepetition,
      delaySeconds: settings.alertDelaySeconds,
      feedback: settings.feedbackType,
    });
  }, [
    deviceConnected,
    settings.alertActivation,
    settings.postureAlerts,
    settings.alertRepetition,
    settings.alertDelaySeconds,
    settings.feedbackType,
  ]);

  const navigate = (next: Route) => {
    if (next === "calibration" && route !== "calibration") setReturnTo(route);
    setRoute(next);
  };

  const leaveCalibration = () => {
    setOnboarded(true);
    setRoute(onboarded ? returnTo : "dashboard");
  };

  return (
    <>
      {route === "calibration" ? (
        <main className="h-full overflow-y-auto">
          <CalibrationPage
            mode={onboarded ? "recalibrate" : "onboarding"}
            deviceState={snapshot.connections.device}
            existingBaseline={snapshot.calibration}
            onConnectDevice={actions.connectDevice}
            onCalibrated={actions.saveCalibration}
            onContinue={leaveCalibration}
            backLabel={returnTo === "settings" ? "Back to Settings" : "Back to Dashboard"}
          />
        </main>
      ) : (
        <div className="flex h-full">
          <Sidebar active={route} onNavigate={navigate} />
          <main className="flex-1 overflow-y-auto px-8 py-6">
            <div className="mx-auto max-w-6xl">
              {route === "dashboard" && (
                <DashboardPage
                  snapshot={snapshot}
                  actions={actions}
                  settings={settings}
                  onNavigate={navigate}
                />
              )}
              {route === "history" && <HistoryPage snapshot={snapshot} useSampleData={sampleHistory} />}
              {route === "settings" && (
                <SettingsPage
                  snapshot={snapshot}
                  actions={actions}
                  settings={settings}
                  onChange={updateSettings}
                  onRecalibrate={() => navigate("calibration")}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {import.meta.env.DEV && (
        <DeviceSimulator sampleHistory={sampleHistory} onSampleHistoryChange={setSampleHistory} />
      )}
    </>
  );
}

export default App;
