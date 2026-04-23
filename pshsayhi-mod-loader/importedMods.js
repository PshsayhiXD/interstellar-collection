const idb = require("./idb");

const textDecoder = new TextDecoder("utf-8", { fatal: false });

function normalizePath(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/^\.\//, "");
}

function findFile(record, path) {
  const p = normalizePath(path);
  return (record.files || []).find((f) => normalizePath(f.path) === p) || null;
}

const StellarAPI = (() => {
  try {
    // eslint-disable-next-line global-require
    return require("@interstellar/StellarAPI");
  } catch {
    return null;
  }
})();

function resolveZipPath(fromPath, toPath) {
  // Get the directory of the requiring file
  const dir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
  const joined = dir ? `${dir}/${toPath}` : toPath;
  // Resolve . and .. segments
  const parts = joined.split("/");
  const resolved = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return resolved.join("/");
}

function resolveZipFile(record, path) {
  // Try exact path, then with .js extension, then as a directory index
  return (
    findFile(record, path) ||
    findFile(record, `${path}.js`) ||
    findFile(record, `${path}/index.js`) ||
    null
  );
}

function makeRequire(record, fromPath, cache) {
  return function zipRequire(name) {
    if (name === "@interstellar/StellarAPI") {
      if (!StellarAPI) throw new Error("StellarAPI is not available in this runtime");
      return StellarAPI;
    }

    // Only relative paths are allowed for zip-internal requires
    if (!name.startsWith(".")) {
      throw new Error(`require not supported in imported mods: ${name}`);
    }

    const resolved = resolveZipPath(fromPath, name);

    // Return cached module exports if already evaluated
    if (cache.has(resolved)) return cache.get(resolved);

    const f = resolveZipFile(record, resolved);
    if (!f || typeof f.text !== "string") {
      throw new Error(`Cannot find module '${name}' in zip (resolved: ${resolved})`);
    }

    // Seed cache before evaluating to handle circular requires
    const exportsObj = {};
    const moduleObj = { exports: exportsObj };
    cache.set(resolved, exportsObj);

    const childRequire = makeRequire(record, f.path, cache);
    // eslint-disable-next-line no-new-func
    new Function("require", "exports", "module", `${f.text}\n;return module.exports;`)(
      childRequire,
      exportsObj,
      moduleObj,
    );

    cache.set(resolved, moduleObj.exports);
    return moduleObj.exports;
  };
}

function evalEntryModule(record, entryPath) {
  const f = resolveZipFile(record, entryPath);
  if (!f || typeof f.text !== "string") return null;

  const cache = new Map();
  const exportsObj = {};
  const moduleObj = { exports: exportsObj };
  const req = makeRequire(record, f.path, cache);

  // eslint-disable-next-line no-new-func
  new Function("require", "exports", "module", `${f.text}\n;return module.exports;`)(
    req,
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
  const ModClass = evalEntryModule(rec, entry);
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