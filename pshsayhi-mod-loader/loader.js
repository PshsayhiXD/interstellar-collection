const script = require("@interstellar/InterstellarScriptingMod");
const LoaderUI = require("./ui").default;
const { MODS } = require("./mods/registry");
const { getSections } = require("./sections");
const imported = require("./importedMods");
const checkForUpdates = require("./update").default;
require("./assets/b64/assetsMap");
class SandboxMod {
  constructor(code) {
    this.worker = new Worker("./sandbox.js");
    this.ready = false;
    this.worker.onmessage = e => {
      if (e.data?.type === "error")
        console.error("[SandboxMod]", e.data.error);
    };
    this.worker.postMessage({ type: "init", code });
    this.ready = true;
  }
  start() {
    if (!this.worker) return;
    this.worker.postMessage({ type: "start" });
  }
  stop() {
    if (!this.worker) return;
    this.worker.postMessage({ type: "stop" });
  }
  config(cfg) {
    if (!this.worker) return;
    this.worker.postMessage({ type: "config", payload: cfg });
  }
  destroy() {
    if (!this.worker) return;
    this.worker.terminate();
  }
}

function getEntryCode(record) {
  const entryPath = record.metadata.entryPoint;
  const file = record.files.find(f =>
    f.path === entryPath || f.path.endsWith("/" + entryPath)
  );
  if (!file || !file.text)
    throw new Error("Entry file not found or not readable");
  return file.text;
}
class PshsayhiLoader extends script.default {
  constructor() {
    super(...arguments);
    this.modsMap = {};
    this.allMods = Object.values(MODS).flat();
    this.allMods.forEach(item => {
      const meta = item.metadata;
      const ModClass = item.module.default || item.module;
      if (typeof ModClass !== "function") {
        console.error(`[Loader] Invalid mod class: ${meta.id}`);
        return;
      }
      try {
        this.modsMap[meta.id] = new ModClass();
      } catch (e) {
        console.error(`[Loader] Failed init: ${meta.id}`, e);
      }
    });
    this.ui = null;
  }

  async load() {
    if (typeof document === "undefined") return;
    const importedMetas = await imported.loadImportedMetas().catch(() => []);
    const sections = getSections(importedMetas);
    this.ui = new LoaderUI(
      this.handleModeChange.bind(this),
      sections,
      record => {
        const code = getEntryCode(record);
        this.modsMap[record.id] = new SandboxMod(code);
      },
      id => {
        delete this.modsMap[id];
      }
    );
    const importedRecords = await imported.loadImportedMetas().catch(() => []);
    importedRecords.forEach(record => {
      try {
        const code = getEntryCode(record);
        this.modsMap[record.id] = new SandboxMod(code);
      } catch (e) {
        console.error("[Loader] Failed to sandbox mod:", record.id, e);
      }
    });
    await this.ui.create();
    await checkForUpdates(this.ui, "pshsayhi-mod-loader");
  }

  handleModeChange(type, value) {
    if (type === "outfit") {
      this.allMods
        .filter(m => m.metadata.section === "outfit")
        .forEach(m => this.modsMap[m.metadata.id]?.stop?.());
      this.modsMap[value]?.start?.();
      return;
    }

    if (type === "config") {
      const { id, key, value: val } = value || {};
      const inst = this.modsMap[id];
      if (!inst) return;
    
      const numVal = Number(val);
      const parsedVal = isNaN(numVal) ? val : numVal;
      if (inst instanceof SandboxMod || typeof inst.config === "function") inst.config({ [key]: parsedVal });
      else inst[key] = parsedVal;
      return;
    }
    if (typeof value === "string") {
      this.modsMap[value]?.start?.();
      return;
    }
    const { id, active } = value || {};
    const inst = this.modsMap[id];
    if (!inst) return;
    if (active) inst.start?.();
    else inst.stop?.();
  }
}

exports.default = PshsayhiLoader;