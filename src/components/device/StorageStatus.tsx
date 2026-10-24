import { useEffect, useState } from "react";
import { hasDesktopStorage, onStorageChange, storageErrors, storageInvoke, type DatabaseInfo } from "../../services/storage";

export function StorageStatus() {
  const [errors, setErrors] = useState(storageErrors);
  const [info, setInfo] = useState<DatabaseInfo | null>(null);
  useEffect(() => {
    const off = onStorageChange(() => setErrors(storageErrors()));
    let cancelled = false;
    let timer: number | undefined;
    const refresh = async () => {
      try {
        const next = await storageInvoke<DatabaseInfo>("database_info");
        if (!cancelled) setInfo(next);
      } catch { /* storageInvoke reports errors to the visible status. */ }
      finally { if (!cancelled) timer = window.setTimeout(refresh, 5000); }
    };
    if (hasDesktopStorage()) void refresh();
    return () => { cancelled = true; off(); window.clearTimeout(timer); };
  }, []);
  return <div className="mt-2 text-xs text-muted">
    {!hasDesktopStorage() ? <p>Browser preview: SQLite recording requires the Tauri desktop app.</p> :
      info ? <details><summary>SQLite: {info.sampleCount.toLocaleString()} readings · {info.sessionCount} sessions saved</summary>
        <p className="mt-1 break-all">Database: {info.path}</p>
        <p>History refreshes every 5 seconds. Only readings received while the app is running are recorded.</p>
      </details> : <p>Opening local SQLite storage…</p>}
    {(errors.length > 0 || info?.error) && <p role="alert" className="mt-1 text-red-700">
      Storage problem: {[...new Set([...errors, ...(info?.error ? [info.error] : [])])].join("; ")}. Recent data may not be saved.
    </p>}
  </div>;
}
