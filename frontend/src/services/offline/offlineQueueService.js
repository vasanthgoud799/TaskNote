import {
  addQueueItem,
  clearSyncedQueueItems,
  getQueueItems,
  removeQueueItem,
  updateQueueItem,
} from "./indexedDbQueue.js";

export const OFFLINE_QUEUE_EVENT = "tasknote:offline-queue-changed";
const activeStatuses = new Set(["queued", "syncing", "failed", "conflict"]);

function emitQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT));
  }
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `offline-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function mergeCreatePayload(existing, operation) {
  return {
    ...existing,
    payload: {
      ...(existing.payload || {}),
      ...(operation.payload || {}),
      ...(operation.localSnapshot || {}),
    },
    localSnapshot: operation.localSnapshot || existing.localSnapshot,
    updatedAt: new Date().toISOString(),
    status: "queued",
    error: "",
  };
}

export async function enqueueOfflineOperation(operation) {
  const now = new Date().toISOString();
  const items = await getQueueItems();
  const related = items
    .filter((item) => (
      activeStatuses.has(item.status)
      && item.userId === operation.userId
      && item.entityType === operation.entityType
      && item.entityId === operation.entityId
    ))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const pendingCreate = related.find((item) => item.operation === "create");
  if (pendingCreate && ["update", "complete", "archive", "restore"].includes(operation.operation)) {
    const updated = mergeCreatePayload(pendingCreate, operation);
    await addQueueItem(updated);
    emitQueueChanged();
    return updated;
  }

  if (pendingCreate && operation.operation === "delete") {
    await removeQueueItem(pendingCreate.id);
    emitQueueChanged();
    return { ...pendingCreate, status: "synced", skipped: true };
  }

  const queuedUpdate = related.find((item) => item.operation === "update" && operation.operation === "update");
  if (queuedUpdate) {
    const updated = {
      ...queuedUpdate,
      payload: { ...(queuedUpdate.payload || {}), ...(operation.payload || {}) },
      localSnapshot: operation.localSnapshot || queuedUpdate.localSnapshot,
      updatedAt: now,
      status: "queued",
      error: "",
    };
    await addQueueItem(updated);
    emitQueueChanged();
    return updated;
  }

  const item = {
    id: operation.id || newId(),
    userId: operation.userId,
    entityType: operation.entityType,
    entityId: operation.entityId,
    operation: operation.operation,
    method: operation.method,
    endpoint: operation.endpoint,
    payload: operation.payload || null,
    localSnapshot: operation.localSnapshot || null,
    serverSnapshot: null,
    collectionKey: operation.collectionKey,
    responseKey: operation.responseKey,
    status: "queued",
    retryCount: 0,
    error: "",
    conflict: false,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: "",
  };

  await addQueueItem(item);
  emitQueueChanged();
  return item;
}

export async function listOfflineOperations(userId) {
  const items = await getQueueItems();
  return items
    .filter((item) => !userId || item.userId === userId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function updateOfflineOperation(id, patch) {
  const updated = await updateQueueItem(id, patch);
  emitQueueChanged();
  return updated;
}

export async function removeOfflineOperation(id) {
  await removeQueueItem(id);
  emitQueueChanged();
}

export async function retryFailedOperations(userId) {
  const items = await listOfflineOperations(userId);
  await Promise.all(
    items
      .filter((item) => item.status === "failed")
      .map((item) => updateQueueItem(item.id, { status: "queued", error: "", conflict: false })),
  );
  emitQueueChanged();
}

export async function clearSyncedOperations() {
  await clearSyncedQueueItems();
  emitQueueChanged();
}
