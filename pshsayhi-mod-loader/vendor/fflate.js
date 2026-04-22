// Lightweight unzip helper (fflate-compatible surface for this project).
// We intentionally expose only what we need: `unzip(data: Uint8Array) -> Promise<Record<string, Uint8Array>>`.

function u16(dv, o) { return dv.getUint16(o, true); }
function u32(dv, o) { return dv.getUint32(o, true); }

function findEocd(bytes) {
  // EOCD signature: 0x06054b50
  // Search last 64KB + comment length (per spec).
  const maxBack = Math.min(bytes.length, 22 + 0xFFFF);
  for (let i = bytes.length - 22; i >= bytes.length - maxBack; i--) {
    if (i < 0) break;
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) return i;
  }
  return -1;
}

async function inflateRaw(data) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Zip contains deflated entries, but DecompressionStream is not available");
  }
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([data]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

async function unzip(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new Error("unzip: expected Uint8Array");
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const eocdOff = findEocd(bytes);
  if (eocdOff < 0) throw new Error("Invalid zip: EOCD not found");

  const cdSize = u32(dv, eocdOff + 12);
  const cdOff = u32(dv, eocdOff + 16);

  let ptr = cdOff;
  const out = Object.create(null);

  while (ptr < cdOff + cdSize) {
    // Central directory file header signature 0x02014b50
    if (u32(dv, ptr) !== 0x02014b50) throw new Error("Invalid zip: bad central directory header");
    const compMethod = u16(dv, ptr + 10);
    const compSize = u32(dv, ptr + 20);
    const uncompSize = u32(dv, ptr + 24);
    const nameLen = u16(dv, ptr + 28);
    const extraLen = u16(dv, ptr + 30);
    const commentLen = u16(dv, ptr + 32);
    const localOff = u32(dv, ptr + 42);
    const nameBytes = bytes.subarray(ptr + 46, ptr + 46 + nameLen);
    const name = new TextDecoder().decode(nameBytes);
    ptr = ptr + 46 + nameLen + extraLen + commentLen;

    // Skip directories
    if (!name || name.endsWith("/")) continue;

    // Local file header signature 0x04034b50
    if (u32(dv, localOff) !== 0x04034b50) throw new Error("Invalid zip: bad local file header");
    const lfNameLen = u16(dv, localOff + 26);
    const lfExtraLen = u16(dv, localOff + 28);
    const dataOff = localOff + 30 + lfNameLen + lfExtraLen;
    const compData = bytes.subarray(dataOff, dataOff + compSize);

    let fileData;
    if (compMethod === 0) {
      fileData = compData;
    } else if (compMethod === 8) {
      fileData = await inflateRaw(compData);
      if (uncompSize && fileData.length !== uncompSize) {
        // best-effort; some zips omit sizes or use data descriptors
      }
    } else {
      throw new Error(`Unsupported zip compression method: ${compMethod}`);
    }

    // Copy to detach from backing buffer slices
    const copy = new Uint8Array(fileData.length);
    copy.set(fileData);
    out[name] = copy;
  }

  return out;
}

exports.unzip = unzip;
