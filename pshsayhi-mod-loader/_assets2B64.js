//      INTERNAL FILE
// ONLY RUN NODEJS ON THIS

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "./assets/img");
const out = path.resolve(__dirname, "./assets/b64/assetsMap.js");

const files = fs.readdirSync(root);

const map = {};

files.forEach(f => {
  const p = path.join(root, f);
  const ext = path.extname(f).slice(1);
  const mime = ext === "png" ? "image/png" : "application/octet-stream";
  const data = fs.readFileSync(p).toString("base64");
  map[f] = `data:${mime};base64,${data}`;
});

fs.writeFileSync(out, "window.__pModLoaderAssetMap = " + JSON.stringify(map, null, 2));