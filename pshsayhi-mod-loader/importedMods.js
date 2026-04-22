const idb = require("./idb");

const textDecoder = new TextDecoder("utf-8", { fatal: false });

function normalizePath(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
}

function findFile(record, path) {
  const p = normalizePath(path);
  return (record.files || []).find((f) => normalizePath(f.path) === p) || null;
}

function whitelistRequireFactory() {
  const StellarAPI = (() => {
    try {
      // eslint-disable-next-line global-require
      return require("@interstellar/StellarAPI");
    } catch {
      return null;
    }
  })();

  return (name) => {
    if (name === "@interstellar/StellarAPI") {
      if (!StellarAPI) throw new Error("StellarAPI is not available in this runtime");
      return StellarAPI;
    }
    throw new Error(`require not supported in imported mods: ${name}`);
  };
}

function evalCjsModule(jsText) {
  const exportsObj = {};
  const moduleObj = { exports: exportsObj };
  const require = whitelistRequireFactory();
  // eslint-disable-next-line no-new-func
  new Function("require", "exports", "module", `${jsText}\n;return module.exports;`)(
    require,
    exportsObj,
    moduleObj,
  );
  return moduleObj.exports?.default ?? moduleObj.exports;
}

function instantiateFromRecord(rec) {
  const meta = rec?.metadata || {};
  const id = String(meta.id || rec?.id || "");
  const entry = normalizePath(meta.entryPoint || "");
  if (!id || !entry) return null;
  const f = findFile(rec, entry);
  if (!f || typeof f.text !== "string") return null;
  const ModClass = evalCjsModule(f.text);
  if (typeof ModClass !== "function") return null;
  return { id, meta, instance: new ModClass(), record: rec };
}

async function loadImportedPackages() {
  const records = await idb.getAllImports();
  return Array.isArray(records) ? records : [];
}

async function loadImportedMetas() {
  const records = await loadImportedPackages();
  return records
    .map((r) => r.metadata)
    .filter(Boolean)
    .map((m) => Object.assign({}, m, { source: "imported" }));
}

async function instantiateImportedMods() {
  const records = await loadImportedPackages();
  const out = [];

  for (const rec of records) {
    try {
      const inst = instantiateFromRecord(rec);
      if (!inst) continue;
      out.push(inst);
    } catch (e) {
      // Skip broken imports, but keep them persisted for later inspection
      console.warn(`[Pshsayhi's Loader] Imported mod failed to load:`, e?.message || e);
    }
  }

  return out;
}

async function getImportedFileBlob(modId, path) {
  const rec = await idb.getImport(String(modId));
  if (!rec) return null;
  const f = findFile(rec, path);
  return f ? f.blob : null;
}

async function getImportedFileText(modId, path) {
  const rec = await idb.getImport(String(modId));
  if (!rec) return null;
  const f = findFile(rec, path);
  if (!f) return null;
  if (typeof f.text === "string") return f.text;
  if (f.blob) {
    const buf = await f.blob.arrayBuffer();
    return textDecoder.decode(new Uint8Array(buf));
  }
  return null;
}

exports.loadImportedPackages = loadImportedPackages;
exports.loadImportedMetas = loadImportedMetas;
exports.instantiateImportedMods = instantiateImportedMods;
exports.instantiateFromRecord = instantiateFromRecord;
exports.getImportedFileBlob = getImportedFileBlob;
exports.getImportedFileText = getImportedFileText;
