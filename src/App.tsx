import { useEffect, useState } from "react";
import { DeviceSimulator } from "./components/dev/DeviceSimulator";
import { Sidebar } from "./components/layout/Sidebar";
import { useMonitoring } from "./hooks/useMonitoring";
import { CalibrationPage } from "./pages/CalibrationPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { deviceConnection } from "./services/deviceConnection";
import type { Route } from "./types/navigation";

function App() {
  // Calibration is the first screen on every launch until a saved baseline
  // can be loaded from the database.
  const [route, setRoute] = useState<Route>("calibration");
  const [onboarded, setOnboarded] = useState(false);
  const [sampleHistory, setSampleHistory] = useState(false);
  // Lives at the top level so monitoring keeps running across screens.
  const [snapshot, actions] = useMonitoring();

  // Try to reach the device on startup. In phase 1 this times out → offline.
  useEffect(() => {
    deviceConnection.connect();
  }, []);

  const goToDashboard = () => {
    setOnboarded(true);
    setRoute("dashboard");
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
            onContinue={goToDashboard}
          />
        </main>
      ) : (
        <div className="flex h-full">
          <Sidebar active={route} onNavigate={setRoute} />
          <main className="flex-1 overflow-y-auto px-8 py-6">
            <div className="mx-auto max-w-6xl">
              {route === "dashboard" && (
                <DashboardPage snapshot={snapshot} actions={actions} onNavigate={setRoute} />
              )}
              {route === "history" && <HistoryPage snapshot={snapshot} useSampleData={sampleHistory} />}
              {route === "settings" && (
                <PlaceholderPage
                  title="Settings"
                  subtitle="Manage your device, calibration, and notifications."
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
