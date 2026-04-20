const script = require("@interstellar/InterstellarScriptingMod");
const LoaderUI = require("./ui").default;
const { MODS } = require("./mods/registry");

class PshsayhiLoader extends script.default {
  constructor() {
    super(...arguments);
    this.modsMap = {};
    // Initialize mods from registry
    MODS.forEach(item => {
      const meta = item.metadata;
      const ModClass = item.module.default || item.module;
      if (typeof ModClass === 'function') {
        this.modsMap[meta.id] = new ModClass();
        console.log(`[Pshsayhi's Loader] Initialized: ${meta.id}`);
      } else console.error(`[Pshsayhi's Loader] Failed to load mod class for: ${meta.id}`);
    });
    this.ui = new LoaderUI(this.handleModeChange.bind(this));
  }
  async load() {
    console.log("[Pshsayhi's Loader] Dynamic startup...");
    if (typeof document !== 'undefined') this.ui.create();
  }
  handleModeChange(type, value) {
    console.log(`[Pshsayhi's Loader] Change - Type: ${type}, Value:`, value);
    if (type === "outfit") {
      MODS.filter(m => m.metadata.section === "outfit").forEach(m => {
        const instance = this.modsMap[m.metadata.id];
        if (instance) instance.stop();
      });
      const activeInstance = this.modsMap[value];
      if (activeInstance) {
        console.log(`[Pshsayhi's Loader] Starting outfit mod: ${value}`);
        activeInstance.start();
      }
    } else if (type !== "config") {
      const { id, active } = value;
      const instance = this.modsMap[id];
      if (instance) {
        console.log(`[Pshsayhi's Loader] Toggling mod: ${id} -> ${active}`);
        if (active) instance.start();
        else instance.stop();
      } else {
        console.warn(`[Pshsayhi's Loader] No instance found for mod: ${id}`);
      }
    } else if (type === "config") {
      const { id, key, value: val } = value;
      const instance = this.modsMap[id];
      if (instance && key === "speed") {
        instance.speed = val;
        if (instance.interval || instance.rafId) instance.start();
      }
    }
  }
}

exports.default = PshsayhiLoader;
