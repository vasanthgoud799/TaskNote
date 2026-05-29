import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearSyncedOperations,
  listOfflineOperations,
  OFFLINE_QUEUE_EVENT,
  retryFailedOperations,
} from "../services/offline/offlineQueueService.js";
import { processOfflineQueue, resolveOfflineConflict } from "../services/offline/syncManager.js";

export function useOfflineSync({ userId, onSynced, onConflict } = {}) {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [isSyncing, setIsSyncing] = useState(false);
  const [queue, setQueue] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const syncingRef = useRef(false);
  const callbacksRef = useRef({ onSynced, onConflict });

  useEffect(() => {
    callbacksRef.current = { onSynced, onConflict };
  }, [onSynced, onConflict]);

  const refreshQueue = useCallback(async () => {
    if (!userId) {
      setQueue([]);
      return [];
    }
    try {
      const items = await listOfflineOperations(userId);
      setQueue(items);
      return items;
    } catch {
      setQueue([]);
      return [];
    }
  }, [userId]);

  const triggerSync = useCallback(async () => {
    if (!userId || syncingRef.current || (typeof navigator !== "undefined" && !navigator.onLine)) return null;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await processOfflineQueue({
        userId,
        onSynced: (...args) => callbacksRef.current.onSynced?.(...args),
        onConflict: (...args) => callbacksRef.current.onConflict?.(...args),
      });
      setLastSyncedAt(new Date().toISOString());
      await refreshQueue();
      return result;
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshQueue, userId]);

  useEffect(() => {
    const syncState = () => setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    const handleOnline = () => {
      syncState();
      window.setTimeout(() => triggerSync(), 250);
    };
    const handleOffline = () => syncState();
    const handleQueueChange = () => refreshQueue();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(OFFLINE_QUEUE_EVENT, handleQueueChange);
    refreshQueue();
    if (typeof navigator !== "undefined" && navigator.onLine) triggerSync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(OFFLINE_QUEUE_EVENT, handleQueueChange);
    };
  }, [refreshQueue, triggerSync]);

  const counts = useMemo(() => ({
    queuedCount: queue.filter((item) => item.status === "queued").length,
    failedCount: queue.filter((item) => item.status === "failed").length,
    conflictCount: queue.filter((item) => item.status === "conflict").length,
    syncingCount: queue.filter((item) => item.status === "syncing").length,
  }), [queue]);

  const retryFailed = useCallback(async () => {
    await retryFailedOperations(userId);
    await refreshQueue();
    return triggerSync();
  }, [refreshQueue, triggerSync, userId]);

  const clearSynced = useCallback(async () => {
    await clearSyncedOperations();
    return refreshQueue();
  }, [refreshQueue]);

  const resolveConflict = useCallback(async (item, choice, mergedPayload) => {
    const result = await resolveOfflineConflict(item, choice, mergedPayload);
    await refreshQueue();
    if (!result?.discarded) callbacksRef.current.onSynced?.(item, result);
    return result;
  }, [refreshQueue]);

  return {
    isOnline,
    isSyncing,
    queue,
    lastSyncedAt,
    triggerSync,
    refreshQueue,
    retryFailed,
    clearSynced,
    resolveConflict,
    ...counts,
  };
}
