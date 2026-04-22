const { unzip } = require("./vendor/fflate");
const idb = require("./idb");

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
    case "json": return "application/json";
    case "js":
    case "mjs":
    case "cjs": return "text/javascript";
    case "css": return "text/css";
    case "html":
    case "htm": return "text/html";
    case "svg": return "image/svg+xml";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "ico": return "image/x-icon";
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "ttf": return "font/ttf";
    case "otf": return "font/otf";
    case "woff": return "font/woff";
    case "woff2": return "font/woff2";
    default: return isTextExt(ext) ? "text/plain" : "application/octet-stream";
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

function minifyJs(text) {
  // Extremely conservative: keep content as-is except BOM + trailing whitespace
  try {
    let t = text.replace(/^\uFEFF/, "");
    // do not remove comments or collapse newlines (risk)
    return t.trimEnd();
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
    throw new Error(`Imported metadata.js attempted to require '${name}', which is not supported`);
  };
  // eslint-disable-next-line no-new-func
  new Function("require", "exports", "module", `${code}\n;return module.exports;`)(
    require,
    exportsObj,
    moduleObj,
  );
  return moduleObj.exports?.default || moduleObj.exports;
}

async function estimateQuotaOk(approxBytes) {
  if (!navigator?.storage?.estimate) return { ok: true, reason: null };
  try {
    const { quota, usage } = await navigator.storage.estimate();
    if (typeof quota !== "number" || typeof usage !== "number") return { ok: true, reason: null };
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
  const { existingIds = new Set(), onDuplicate } = opts;
  if (!file) throw new Error("No file provided");
  const name = file.name || "";
  if (!name.toLowerCase().endsWith(".zip")) throw new Error("Only .zip files are supported");

  const buf = await file.arrayBuffer();
  const zipBytes = new Uint8Array(buf);
  const entries = await unzip(zipBytes);

  const paths = Object.keys(entries).map(normalizeZipPath).filter(Boolean);
  const metadataPath = paths.find((p) => p === "metadata.js");
  if (!metadataPath) throw new Error("Zip must contain metadata.js at the root");

  const metaCode = textDecoder.decode(entries[metadataPath]);
  const meta = evalMetadataJs(metaCode);
  if (!meta || typeof meta !== "object") throw new Error("metadata.js did not export a metadata object");
  if (!meta.id) throw new Error("metadata.js missing required field: id");
  if (!meta.entryPoint) throw new Error("metadata.js missing required field: entryPoint");

  const modId = String(meta.id);
  const entry = normalizeZipPath(meta.entryPoint);
  if (!paths.includes(entry)) throw new Error(`Entry point not found in zip: ${entry}`);

  if (existingIds.has(modId)) {
    const decision = typeof onDuplicate === "function" ? await onDuplicate(meta) : "cancel";
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
      if (ext === "json") text = minifyJson(rawText);
      else if (ext === "css") text = minifyCss(rawText);
      else if (ext === "js" || ext === "mjs" || ext === "cjs") text = minifyJs(rawText);
      else text = rawText;
    }
    files.push({ path, mimeType, blob, text });
  }

  const quotaCheck = await estimateQuotaOk(approxBytes);
  if (!quotaCheck.ok) throw new Error(quotaCheck.reason || "Storage quota likely exceeded");

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
