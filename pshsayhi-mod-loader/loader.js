const script = require("@interstellar/InterstellarScriptingMod");
const LoaderUI = require("./ui").default;
const { MODS } = require("./mods/registry");
const { getSections } = require("./sections");
const imported = require("./importedMods");

const _VERSION = "1.1.5";

async function checkForUpdates(ui, modSlug, repoUser = "PshsayhiXD", repoName = "interstellar-collection") {
  try {
    console.log("[Updater] Checking for updates...");
    console.log("[Updater] Current version:", _VERSION);
    const releasesRes = await fetch(`https://api.github.com/repos/${repoUser}/${repoName}/releases?per_page=100&t=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" }
    });
    console.log("[Updater] Releases status:", releasesRes.status);
    if (!releasesRes.ok) throw new Error(`Failed to fetch releases (${releasesRes.status})`);
    const releases = await releasesRes.json();
    console.log("[Updater] Release count:", Array.isArray(releases) ? releases.length : "non-array");
    const slug = String(modSlug).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const extractVersion = (tag) => {
      const value = String(tag || "").trim();
      const patterns = [
        new RegExp(`^${slug}[-_]?v?(\\d+\\.\\d+\\.\\d+(?:[-+][^\\s]+)?)$`, "i"),
        /^v?(\d+\.\d+\.\d+(?:[-+][^\s]+)?)$/i,
        /^(\d+\.\d+\.\d+(?:[-+][^\s]+)?)$/i
      ];
      for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match) return match[1];
      }
      return null;
    };
    const isNewerVersion = (oldV, newV) => {
      const oldParts = String(oldV).replace(/^v/i, "").split("-")[0].split(".").map((n) => Number.parseInt(n, 10) || 0);
      const newParts = String(newV).replace(/^v/i, "").split("-")[0].split(".").map((n) => Number.parseInt(n, 10) || 0);
      for (let i = 0; i < Math.max(oldParts.length, newParts.length); i++) {
        const diff = (newParts[i] || 0) - (oldParts[i] || 0);
        if (diff > 0) return true;
        if (diff < 0) return false;
      }
      return false;
    };
    const matches = (Array.isArray(releases) ? releases : [])
      .map((release) => ({ release, version: extractVersion(release.tag_name) }))
      .filter(({ release, version }) => version && !release.draft && !release.prerelease)
      .sort((a, b) => new Date(b.release.published_at || 0) - new Date(a.release.published_at || 0));
    console.log("[Updater] Matching releases:", matches.map((m) => ({ tag: m.release.tag_name, version: m.version })));
    if (!matches.length) {
      console.log("[Updater] No matching releases found.");
      ui?._renderUpdateBanner?.(null);
      return;
    }
    const latestRelease = matches[0].release;
    const remoteVersion = String(matches[0].version).replace(/^v/i, "").trim();
    console.log("[Updater] Comparing:", { _VERSION, remoteVersion, tag: latestRelease.tag_name });
    if (isNewerVersion(_VERSION, remoteVersion)) {
      console.log("[Updater] Update available.");
      ui?._renderUpdateBanner?.({ release: latestRelease, newVer: remoteVersion, oldVer: _VERSION });
    } else {
      console.log("[Updater] No update available.");
      ui?._renderUpdateBanner?.(null);
    }
  } catch (error) {
    console.error("[Updater] Update check failed:", error);
  }
}

class PshsayhiLoader extends script.default {
  constructor() {
    super(...arguments);
    this.modsMap = {};
    // Initialize mods from registry
    MODS.forEach((item) => {
      const meta = item.metadata;
      const ModClass = item.module.default || item.module;
      if (typeof ModClass === "function") {
        this.modsMap[meta.id] = new ModClass();
        console.log(`[Pshsayhi's Loader] Initialized: ${meta.id}`);
      } else
        console.error(
          `[Pshsayhi's Loader] Failed to load mod class for: ${meta.id}`,
        );
    });
    this.ui = null;
  }
  async load() {
    console.log("[Pshsayhi's Loader] Dynamic startup...");
    if (typeof document !== "undefined") {
      const importedMetas = await imported.loadImportedMetas().catch(() => []);
      const sections = getSections(importedMetas);
      this.ui = new LoaderUI(
        this.handleModeChange.bind(this),
        sections,
        (record) => {
          const inst = imported.instantiateFromRecord(record);
          if (!inst) throw new Error("Imported mod could not be instantiated");
          this.modsMap[inst.id] = inst.instance;
          console.log(`[Pshsayhi's Loader] Registered imported mod runtime: ${inst.id}`);
        },
        (id) => {
          delete this.modsMap[id];
        }
      );

      // Instantiate imported mod runtime classes
      const importedInstances = await imported.instantiateImportedMods().catch(() => []);
      importedInstances.forEach((m) => {
        this.modsMap[m.id] = m.instance;
        console.log(`[Pshsayhi's Loader] Loaded imported mod: ${m.id}`);
      });

      await this.ui.create();
      await checkForUpdates(this.ui, "pshsayhi-mod-loader");
    }
  }
  handleModeChange(type, value) {
    console.log(`[Pshsayhi's Loader] Change - Type: ${type}, Value:`, value);
    if (type === "outfit") {
      MODS.filter((m) => m.metadata.section === "outfit").forEach((m) => {
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