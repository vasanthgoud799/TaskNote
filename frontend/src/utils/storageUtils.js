const dbName = "tasknote-offline";
const version = 1;

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const txStore = async (storeName, mode = "readonly") => {
  const db = await openDb();
  return db.transaction(storeName, mode).objectStore(storeName);
};

export const saveCachedNotes = async (notes) => {
  const store = await txStore("notes", "readwrite");
  await Promise.all(notes.map((note) => new Promise((resolve, reject) => {
    const request = store.put(note);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  })));
};

export const readCachedNotes = async () => {
  const store = await txStore("notes");
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const addOfflineMutation = async (mutation) => {
  const store = await txStore("queue", "readwrite");
  return new Promise((resolve, reject) => {
    const request = store.put({ ...mutation, id: mutation.id || crypto.randomUUID(), createdAt: new Date().toISOString() });
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
};

export const readOfflineMutations = async () => {
  const store = await txStore("queue");
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const clearOfflineMutation = async (id) => {
  const store = await txStore("queue", "readwrite");
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
};
