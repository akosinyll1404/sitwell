import { useEffect, useState } from "react";
import { sampleSessionPage } from "../dev/sampleHistory";
import { startOfDay } from "../lib/time";
import { historyRepository, type SessionPage } from "../services/historyRepository";

/**
 * Loads one page of saved sessions for the Session History table.
 * `page` is 1-based. The previous page stays on screen while the next loads,
 * so the table doesn't flicker.
 */
export function useSessionPage(useSampleData: boolean, page: number, pageSize: number): SessionPage {
  const [result, setResult] = useState<SessionPage>({ sessions: [], total: 0 });

  useEffect(() => {
    let cancelled = false;
    const offset = (page - 1) * pageSize;
    const load = async () => {
      const next = useSampleData
        ? sampleSessionPage(startOfDay(Date.now()), offset, pageSize)
        : await historyRepository.listSessions({ limit: pageSize, offset });
      if (!cancelled) setResult(next);
    };
    load().catch((error) => console.error("[history] Failed to load sessions", error));
    return () => {
      cancelled = true;
    };
  }, [useSampleData, page, pageSize]);

  return result;
}
