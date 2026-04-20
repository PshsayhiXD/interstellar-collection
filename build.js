#!/usr/bin/env node
/**
 * Usage
 *   npm run zip -- <folder-name>
 *   npm run pshsayhi-mod-loader
 *   npm run oneko
 *   npm run straight
 *   ... etc
 */

const fs       = require("fs");
const path     = require("path");
const archiver = require("archiver");
const target = process.argv[2];
if (!target) {
  console.error("\nNo folder specified.\n");
  console.error("  Usage:  npm run zip -- <folder-name>\n");
  process.exit(1);
}
const ROOT      = __dirname;
const srcDir    = path.join(ROOT, target);
const outFile   = path.join(ROOT, `${target}.zip`);
if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
  console.error(`\nFolder not found: "${target}"\n`);
  process.exit(1);
}
const output  = fs.createWriteStream(outFile);
const archive = archiver("zip", { zlib: { level: 9 } });
output.on("close", () => {
  const kb = (archive.pointer() / 1024).toFixed(1);
  console.log(`\nZipped "${target}"  ->  ${path.basename(outFile)}  (${kb} KB)\n`);
});
archive.on("warning", err => {
  if (err.code === "ENOENT") console.warn("Warning:", err.message);
  else throw err;
});
archive.on("error", err => { throw err; });
archive.pipe(output);
archive.directory(srcDir, false);
archive.finalize();
