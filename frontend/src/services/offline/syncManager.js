import { apiClient } from "../../api/apiClient.js";
import {
  listOfflineOperations,
  removeOfflineOperation,
  updateOfflineOperation,
} from "./offlineQueueService.js";

const collectionEndpoints = {
  note: "/api/notes",
  task: "/api/tasks",
  habit: "/api/habits",
  inbox: "/api/inbox",
  timeBlock: "/api/time-blocks",
};

const collectionKeys = {
  note: "notes",
  task: "tasks",
  habit: "habits",
  inbox: "inboxItems",
  timeBlock: "timeBlocks",
};

function unwrapResponse(response) {
  return response?.data?.data || response?.data || {};
}

function isRetryable(error) {
  if (!error?.response) return true;
  const status = error.response.status;
  return status === 408 || status === 429 || status >= 500;
}

function isConflictCandidate(item) {
  return ["update", "complete", "archive", "restore"].includes(item.operation) && item.localSnapshot?.updatedAt;
}

async function getLatestServerItem(item) {
  const endpoint = collectionEndpoints[item.entityType];
  if (!endpoint || String(item.entityId).startsWith("local-")) return null;
  const result = unwrapResponse(await apiClient.get(endpoint));
  const key = collectionKeys[item.entityType];
  const collection = result[key] || result.items || [];
  return collection.find((entry) => (entry.id || entry._id) === item.entityId) || null;
}

function hasServerConflict(item, serverItem) {
  if (!serverItem?.updatedAt || !item.localSnapshot?.updatedAt) return false;
  return new Date(serverItem.updatedAt).getTime() > new Date(item.localSnapshot.updatedAt).getTime();
}

async function sendOperation(item) {
  const method = String(item.method || "POST").toLowerCase();
  if (method === "delete") return unwrapResponse(await apiClient.delete(item.endpoint));
  return unwrapResponse(await apiClient[method](item.endpoint, item.payload || {}));
}

export async function processOfflineQueue({ userId, onSynced, onConflict } = {}) {
  const allItems = await listOfflineOperations(userId);
  const items = allItems
    .filter((item) => ["queued", "failed"].includes(item.status))
    .sort((a, b) => {
      const order = { create: 0, update: 1, complete: 2, archive: 3, restore: 3, delete: 4 };
      return (order[a.operation] ?? 9) - (order[b.operation] ?? 9) || new Date(a.createdAt) - new Date(b.createdAt);
    });

  const results = { synced: 0, failed: 0, conflicts: 0 };

  for (const item of items) {
    try {
      await updateOfflineOperation(item.id, {
        status: "syncing",
        lastAttemptAt: new Date().toISOString(),
        error: "",
      });

      if (isConflictCandidate(item)) {
        const serverItem = await getLatestServerItem(item);
        if (hasServerConflict(item, serverItem)) {
          await updateOfflineOperation(item.id, {
            status: "conflict",
            conflict: true,
            serverSnapshot: serverItem,
            error: "Server item changed while this device was offline.",
          });
          onConflict?.({ ...item, status: "conflict", serverSnapshot: serverItem });
          results.conflicts += 1;
          continue;
        }
      }

      const response = await sendOperation(item);
      await updateOfflineOperation(item.id, { status: "synced", error: "", conflict: false });
      onSynced?.(item, response);
      await removeOfflineOperation(item.id);
      results.synced += 1;
    } catch (error) {
      const retryCount = (item.retryCount || 0) + 1;
      const retryable = isRetryable(error) && retryCount < 3;
      await updateOfflineOperation(item.id, {
        status: retryable ? "queued" : "failed",
        retryCount,
        error: error?.response?.data?.message || error.message || "Sync failed",
      });
      if (!retryable) results.failed += 1;
    }
  }

  return results;
}

export async function resolveOfflineConflict(item, choice, mergedPayload) {
  if (choice === "server") {
    await removeOfflineOperation(item.id);
    return { discarded: true };
  }

  const payload = choice === "merge" ? mergedPayload : item.payload;
  const response = await sendOperation({ ...item, payload });
  await removeOfflineOperation(item.id);
  return response;
}
