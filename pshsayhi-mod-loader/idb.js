const DB_NAME = "pshsayhiModLoader";
const DB_VERSION = 1;

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB request failed"));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
  });
}

let _dbPromise = null;

function openDb() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("mods")) {
        db.createObjectStore("mods", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("favorites")) {
        db.createObjectStore("favorites", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("imports")) {
        db.createObjectStore("imports", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Failed to open IndexedDB"));
  });
  return _dbPromise;
}

async function withStore(storeName, mode, fn) {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const result = await fn(store);
  await txDone(tx);
  return result;
}

async function getSetting(key) {
  const row = await withStore("settings", "readonly", (s) => reqToPromise(s.get(key)));
  return row ? row.value : null;
}

async function setSetting(key, value) {
  await withStore("settings", "readwrite", (s) => reqToPromise(s.put({ key, value })));
}

async function getModState() {
  const row = await withStore("mods", "readonly", (s) => reqToPromise(s.get("state")));
  return row ? row.value : null;
}

async function setModState(value) {
  await withStore("mods", "readwrite", (s) => reqToPromise(s.put({ id: "state", value })));
}

async function getAllFavorites() {
  const rows = await withStore("favorites", "readonly", (s) => reqToPromise(s.getAll()));
  return Array.isArray(rows) ? rows.map((r) => r.id) : [];
}

async function setFavorite(id, isFav) {
  await withStore("favorites", "readwrite", (s) => {
    if (isFav) return reqToPromise(s.put({ id, updatedAt: Date.now() }));
    return reqToPromise(s.delete(id));
  });
}

async function putImport(modRecord) {
  await withStore("imports", "readwrite", (s) => reqToPromise(s.put(modRecord)));
}

async function getImport(id) {
  return await withStore("imports", "readonly", (s) => reqToPromise(s.get(id)));
}

async function getAllImports() {
  const rows = await withStore("imports", "readonly", (s) => reqToPromise(s.getAll()));
  return Array.isArray(rows) ? rows : [];
}

async function deleteImport(id) {
  await withStore("imports", "readwrite", (s) => reqToPromise(s.delete(id)));
}

exports.DB_NAME = DB_NAME;
exports.openDb = openDb;
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.getModState = getModState;
exports.setModState = setModState;
exports.getAllFavorites = getAllFavorites;
exports.setFavorite = setFavorite;
exports.putImport = putImport;
exports.getImport = getImport;
exports.getAllImports = getAllImports;
exports.deleteImport = deleteImport;
