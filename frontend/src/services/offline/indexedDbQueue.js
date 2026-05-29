const DB_NAME = "tasknote-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "operations";

function hasIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openQueueDb() {
  if (!hasIndexedDb()) {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("entity", ["userId", "entityType", "entityId"], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open offline queue."));
  });
}

async function withStore(mode, callback) {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let result;

    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Offline queue transaction failed."));
    };

    result = callback(store);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

export async function addQueueItem(item) {
  await withStore("readwrite", (store) => store.put(item));
  return item;
}

export async function getQueueItems() {
  return withStore("readonly", (store) => requestToPromise(store.getAll()));
}

export async function updateQueueItem(id, patch) {
  const existing = await withStore("readonly", (store) => requestToPromise(store.get(id)));
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await addQueueItem(updated);
  return updated;
}

export async function removeQueueItem(id) {
  await withStore("readwrite", (store) => store.delete(id));
}

export async function clearSyncedQueueItems() {
  const items = await getQueueItems();
  await Promise.all(items.filter((item) => item.status === "synced").map((item) => removeQueueItem(item.id)));
}

export async function clearQueueForUser(userId) {
  const items = await getQueueItems();
  await Promise.all(items.filter((item) => item.userId === userId).map((item) => removeQueueItem(item.id)));
}
