const idb = require("./idb");
const { 
  evalMetadataJs, 
  parseInterstellarJson, 
  guessMimeType, 
  isTextExt, 
  extname, 
  minifyJson, 
  minifyCss, 
  minifyJs, 
  estimateQuotaOk 
} = require("./importZip");

async function importFolder(directoryHandle, opts = {}) {
  const { existingIds = new Set(), onDuplicate, defaultSection } = opts;
  if (!directoryHandle || directoryHandle.kind !== 'directory') throw new Error("Invalid directory handle provided");
  let metaFileHandle = null;
  let isJs = true;
  try {
    metaFileHandle = await directoryHandle.getFileHandle("metadata.js");
  } catch {
    try {
      metaFileHandle = await directoryHandle.getFileHandle("interstellar.json");
      isJs = false;
    } catch {
      throw new Error("Folder must contain metadata.js or interstellar.json at the root");
    }
  }

  const metaFile = await metaFileHandle.getFile();
  const metaText = await metaFile.text();
  let meta = isJs ? evalMetadataJs(metaText) : parseInterstellarJson(metaText);
  if (!meta?.id || !meta?.entryPoint) throw new Error("Metadata missing required fields (id or entryPoint)");
  if (!meta.section && defaultSection) meta.section = defaultSection;
  const modId = String(meta.id);

  if (existingIds.has(modId)) {
    const decision = typeof onDuplicate === "function" ? await onDuplicate(meta) : "cancel";
    if (decision !== "overwrite") throw new Error(`Import cancelled (duplicate mod id '${modId}')`);
  }

  const files = [];
  let approxBytes = 0;
  async function scan(handle, currentPath = "") {
    for await (const entry of handle.values()) {
      const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.kind === 'directory') await scan(entry, fullPath);
      else {
        const file = await entry.getFile();
        const ext = extname(fullPath);
        const mimeType = guessMimeType(fullPath);
        approxBytes += file.size;
        let text = null;
        if (isTextExt(ext)) {
          const rawText = await file.text();
          if (ext === "json") text = await minifyJson(rawText);
          else if (ext === "css") text = minifyCss(rawText);
          else if (ext === "js" || ext === "mjs" || ext === "cjs") text = await minifyJs(rawText);
          else text = rawText;
        }
        files.push({
          path: fullPath,
          mimeType,
          blob: file,
          text
        });
      }
    }
  }

  await scan(directoryHandle);
  const quotaCheck = await estimateQuotaOk(approxBytes);
  if (!quotaCheck.ok) throw new Error(quotaCheck.reason || "Storage quota exceeded");

  const now = Date.now();
  const record = {
    id: modId,
    modName: meta.label || modId,
    version: meta.version || "1.0.0",
    source: "imported",
    createdAt: now,
    updatedAt: now,
    metadata: meta,
    filePaths: files.map(f => f.path),
    files
  };

  await idb.putImport(record);
  return record;
}

exports.importFolder = importFolder;