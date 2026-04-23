const { unzip } = require("./vendor/fflate");
const idb = require("./idb");
const terser = require("./vendor/terser");

const textDecoder = new TextDecoder("utf-8", { fatal: false });
const textEncoder = new TextEncoder();

function extname(path) {
  const i = path.lastIndexOf(".");
  return i >= 0 ? path.slice(i + 1).toLowerCase() : "";
}

function isTextExt(ext) {
  return (
    ext === "js" ||
    ext === "mjs" ||
    ext === "cjs" ||
    ext === "css" ||
    ext === "json" ||
    ext === "txt" ||
    ext === "md" ||
    ext === "html" ||
    ext === "htm" ||
    ext === "svg" ||
    ext === "xml" ||
    ext === "csv"
  );
}

function guessMimeType(path) {
  const ext = extname(path);
  switch (ext) {
    case "json":
      return "application/json";
    case "js":
    case "mjs":
    case "cjs":
      return "text/javascript";
    case "css":
      return "text/css";
    case "html":
    case "htm":
      return "text/html";
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "ico":
      return "image/x-icon";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ttf":
      return "font/ttf";
    case "otf":
      return "font/otf";
    case "woff":
      return "font/woff";
    case "woff2":
      return "font/woff2";
    default:
      return isTextExt(ext) ? "text/plain" : "application/octet-stream";
  }
}

function minifyJson(text) {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text;
  }
}

function minifyCss(text) {
  try {
    // conservative: strip block comments + trim + collapse whitespace around common tokens
    let t = text.replace(/\/\*[\s\S]*?\*\//g, "");
    t = t.replace(/\s+/g, " ");
    t = t.replace(/\s*([{}:;,>])\s*/g, "$1");
    return t.trim();
  } catch {
    return text;
  }
}

async function minifyJs(text) {
  try {
    const r = await terser.minify(text, {
      compress: {
        passes: 3,
        unsafe: true,
        drop_console: true,
        drop_debugger: true,
      },
      mangle: {
        toplevel: true,
      },
      module: true,
    });
    return r.code || text;
  } catch {
    return text;
  }
}

function normalizeZipPath(p) {
  return String(p || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^\.\//, "");
}

function evalMetadataJs(code) {
  const exportsObj = {};
  const moduleObj = { exports: exportsObj };
  const require = (name) => {
    // Disallow arbitrary requires inside imported metadata
    throw new Error(
      `Imported metadata.js attempted to require '${name}', which is not supported`,
    );
  };
  // eslint-disable-next-line no-new-func
  new Function(
    "require",
    "exports",
    "module",
    `${code}\n;return module.exports;`,
  )(require, exportsObj, moduleObj);
  return moduleObj.exports?.default || moduleObj.exports;
}

function parseInterstellarJson(jsonText) {
  let raw;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new Error("interstellar.json is not valid JSON");
  }
  if (!raw || typeof raw !== "object")
    throw new Error("interstellar.json must be a JSON object");
  // Normalise field names to match the internal metadata format
  const meta = Object.assign({}, raw);
  if (meta.name !== undefined && meta.label === undefined) {
    meta.label = meta.name;
    delete meta.name;
  }
  if (meta.creator !== undefined && meta.author === undefined) {
    meta.author = meta.creator;
    delete meta.creator;
  }
  if (meta.entrypoint !== undefined && meta.entryPoint === undefined) {
    meta.entryPoint = meta.entrypoint;
    delete meta.entrypoint;
  }
  return meta;
}

async function estimateQuotaOk(approxBytes) {
  if (!navigator?.storage?.estimate) return { ok: true, reason: null };
  try {
    const { quota, usage } = await navigator.storage.estimate();
    if (typeof quota !== "number" || typeof usage !== "number")
      return { ok: true, reason: null };
    const remaining = quota - usage;
    // headroom: require 10% or 10MB free, whichever is larger
    const headroom = Math.max(quota * 0.1, 10 * 1024 * 1024);
    if (approxBytes + headroom > remaining) {
      return {
        ok: false,
        reason: `Not enough storage space. Need ~${Math.ceil(approxBytes / (1024 * 1024))}MB, but quota remaining is ~${Math.ceil(remaining / (1024 * 1024))}MB.`,
      };
    }
  } catch {
    return { ok: true, reason: null };
  }
  return { ok: true, reason: null };
}

async function importZipFile(file, opts = {}) {
  const { existingIds = new Set(), onDuplicate, defaultSection } = opts;
  if (!file) throw new Error("No file provided");
  const name = file.name || "";
  if (!name.toLowerCase().endsWith(".zip"))
    throw new Error("Only .zip files are supported");

  const buf = await file.arrayBuffer();
  const zipBytes = new Uint8Array(buf);
  const entries = await unzip(zipBytes);

  const paths = Object.keys(entries).map(normalizeZipPath).filter(Boolean);
  const metadataJsPath = paths.find((p) => p === "metadata.js");
  const interstellarJsonPath = paths.find((p) => p === "interstellar.json");
  if (!metadataJsPath && !interstellarJsonPath)
    throw new Error(
      "Zip must contain metadata.js or interstellar.json at the root",
    );

  let meta;
  if (metadataJsPath) {
    const metaCode = textDecoder.decode(entries[metadataJsPath]);
    meta = evalMetadataJs(metaCode);
    if (!meta || typeof meta !== "object")
      throw new Error("metadata.js did not export a metadata object");
    if (!meta.id) throw new Error("metadata.js missing required field: id");
    if (!meta.entryPoint)
      throw new Error("metadata.js missing required field: entryPoint");
  } else {
    const jsonText = textDecoder.decode(entries[interstellarJsonPath]);
    meta = parseInterstellarJson(jsonText);
    if (!meta.id)
      throw new Error("interstellar.json missing required field: id");
    if (!meta.entryPoint)
      throw new Error("interstellar.json missing required field: entrypoint");
  }

  // Apply default section if missing
  if (!meta.section && defaultSection) {
    meta.section = defaultSection;
  }

  const modId = String(meta.id);
  const entry = normalizeZipPath(meta.entryPoint);
  if (!paths.includes(entry))
    throw new Error(`Entry point not found in zip: ${entry}`);

  if (existingIds.has(modId)) {
    const decision =
      typeof onDuplicate === "function" ? await onDuplicate(meta) : "cancel";
    if (decision !== "overwrite") {
      throw new Error(`Import cancelled (duplicate mod id '${modId}')`);
    }
  }

  // Build file records
  let approxBytes = 0;
  const files = [];
  for (const path of paths) {
    const data = entries[path];
    if (!data || !data.length) continue;
    const mimeType = guessMimeType(path);
    const ext = extname(path);
    const blob = new Blob([data], { type: mimeType });
    approxBytes += blob.size;

    let text = null;
    if (isTextExt(ext)) {
      const rawText = textDecoder.decode(data);
      if (ext === "json") text = await minifyJson(rawText);
      else if (ext === "css") text = minifyCss(rawText);
      else if (ext === "js" || ext === "mjs" || ext === "cjs")
        text = await minifyJs(rawText);
      else text = rawText;
    }
    files.push({ path, mimeType, blob, text });
  }

  const quotaCheck = await estimateQuotaOk(approxBytes);
  if (!quotaCheck.ok)
    throw new Error(quotaCheck.reason || "Storage quota likely exceeded");

  const now = Date.now();
  const record = {
    id: modId,
    modName: meta.label || modId,
    version: meta.version || "1.0.0",
    source: "imported",
    createdAt: now,
    updatedAt: now,
    metadata: meta,
    filePaths: files.map((f) => f.path),
    files,
  };

  // Persist (atomic per mod record)
  await idb.putImport(record);
  return record;
}

exports.importZipFile = importZipFile;
exports.textEncoder = textEncoder;

async function importModpackZip(file, opts = {}) {
  const { existingIds = new Set(), onDuplicate, defaultSection } = opts;
  if (!file) throw new Error("No file provided");
  if (!String(file.name || "").toLowerCase().endsWith(".zip")) throw new Error("Only .zip files are supported");
  const buf = await file.arrayBuffer();
  const entries = await unzip(new Uint8Array(buf));
  const paths = Object.keys(entries).map(normalizeZipPath).filter(Boolean);
  const modpackJsonPath = paths.find((p) => p === "modpack.json");
  if (!modpackJsonPath) throw new Error("Zip must contain modpack.json at the root to be a modpack");
  let modpackMeta;
  try {
    modpackMeta = JSON.parse(textDecoder.decode(entries[modpackJsonPath]));
  } catch {
    throw new Error("modpack.json is not valid JSON");
  }
  if (!modpackMeta?.id) throw new Error("modpack.json missing required field: id");
  if (!modpackMeta?.name) throw new Error("modpack.json missing required field: name");
  const subdirs = [
    ...new Set(
      paths
        .filter((p) => p.includes("/"))
        .map((p) => p.split("/")[0])
        .filter(Boolean),
    ),
  ];
  if (subdirs.length === 0) throw new Error("Modpack contains no mod subfolders");
  const seenIds = new Set(existingIds);
  const records = [];
  for (const subdir of subdirs) {
    const prefix = `${subdir}/`;
    const subPaths = paths.filter((p) => p.startsWith(prefix));
    const localPaths = subPaths.map((p) => p.slice(prefix.length)).filter(Boolean);
    const hasMetaJs = localPaths.includes("metadata.js");
    const hasMetaJson = localPaths.includes("interstellar.json");
    if (!hasMetaJs && !hasMetaJson) {
      console.warn(`[Modpack] Skipping '${subdir}': no metadata.js or interstellar.json`);
      continue;
    }
    let meta;
    try {
      if (hasMetaJs) {
        const code = textDecoder.decode(entries[`${prefix}metadata.js`]);
        meta = evalMetadataJs(code);
      } else {
        const jsonText = textDecoder.decode(entries[`${prefix}interstellar.json`]);
        meta = parseInterstellarJson(jsonText);
      }
    } catch (e) {
      console.warn(`[Modpack] Skipping '${subdir}': metadata parse error — ${e?.message}`);
      continue;
    }
    if (!meta?.id || !meta?.entryPoint) {
      console.warn(`[Modpack] Skipping '${subdir}': missing id or entryPoint`);
      continue;
    }
    if (!meta.section && defaultSection) meta.section = defaultSection;
    const entry = normalizeZipPath(meta.entryPoint);
    if (!localPaths.includes(entry)) {
      console.warn(`[Modpack] Skipping '${subdir}': entry point '${entry}' not found`);
      continue;
    }
    const modId = String(meta.id);
    // Conflict Check (Includes built-in IDs if passed from UI)
    if (seenIds.has(modId)) {
      const decision = typeof onDuplicate === "function" ? await onDuplicate(meta) : "cancel";
      if (decision !== "overwrite") continue;
    }
    seenIds.add(modId);
    // Build file records
    let approxBytes = 0;
    const files = [];
    for (const localPath of localPaths) {
      const data = entries[`${prefix}${localPath}`];
      if (!data || !data.length) continue;
      const mimeType = guessMimeType(localPath);
      const ext = extname(localPath);
      const blob = new Blob([data], { type: mimeType });
      approxBytes += blob.size;
      let text = null;
      if (isTextExt(ext)) {
        const rawText = textDecoder.decode(data);
        if (ext === "json") text = await minifyJson(rawText);
        else if (ext === "css") text = minifyCss(rawText);
        else if (ext === "js" || ext === "mjs" || ext === "cjs") text = await minifyJs(rawText);
        else text = rawText;
      }
      files.push({ path: localPath, mimeType, blob, text });
    }
    const quotaCheck = await estimateQuotaOk(approxBytes);
    if (!quotaCheck.ok) throw new Error(quotaCheck.reason || "Storage quota likely exceeded");
    const now = Date.now();
    const record = {
      id: modId,
      modName: meta.label || modId,
      version: meta.version || "1.0.0",
      source: "modpack",
      modpackId: String(modpackMeta.id),
      createdAt: now,
      updatedAt: now,
      metadata: { ...meta, source: "modpack" },
      filePaths: files.map((f) => f.path),
      files,
    };
    await idb.putImport(record);
    records.push(record);
  }
  if (records.length === 0) throw new Error("No valid mods found in modpack");
  return { meta: modpackMeta, records };
}

exports.importModpackZip = importModpackZip;