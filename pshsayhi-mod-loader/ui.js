const { SECTIONS } = require("./sections");
const { STYLES } = require("./styles");
const { buildPanel } = require("./panel");
const idb = require("./idb");
const imported = require("./importedMods");
const { importZipFile, importModpackZip } = require("./importZip");
const { importFolder } = require("./importFolder");
const { getSections } = require("./sections");
const { MODS } = require("./mods/registry");
const api = require("@interstellar/StellarAPI");

function parsePx(val) {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val.replace(/px$/i, ""));
    return Number.isNaN(n) ? null : n;
  }
  return null;
}
function pickFolder() {
  if ("showDirectoryPicker" in window) return window.showDirectoryPicker();
  return new Promise((res) => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.multiple = true;
    input.onchange = () => res(input.files);
    input.click();
  });
}
const loadImageFromBase64 = src =>
  new Promise(res => {
    if (!src) return res(null);
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
async function loadAssets() {
  if (window.__pModLoaderLoadedAssets) return window.__pModLoaderLoadedAssets;
  const map = window.__pModLoaderAssetMap || {};
  const entries = [
    ["body", "player.png"],
    ["leg", "player_leg.png"],
    ["head", "player_head.png"],
    ["hair", "player_hair.png"],
    ["foot", "player_foot.png"],
    ["face", "player_face.png"],
    ["arm", "player_arm.png"],
    ["hand", "player_hand.png"]
  ];
  const loaded = await Promise.all(entries.map(async ([key, file]) => [key, await loadImageFromBase64(map[file])]));
  const assets = Object.fromEntries(loaded.filter(([, img]) => img));
  window.__pModLoaderLoadedAssets = assets;
  return assets;
}

class LoaderUI {
  constructor(
    onModeChange,
    sections = SECTIONS,
    onImportedMod,
    onDeleteImportedMod,
  ) {
    this.onModeChange = onModeChange;
    this.sections = sections;
    this.onImportedMod =
      typeof onImportedMod === "function" ? onImportedMod : null;
    this.container = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.activeSectionIdx = 0;
    this.isCollapsed = false;
    this.isHidden = false;
    this.devMode = false;
    this.favorites = new Set();
    this.importedCount = 0;
    this._layoutSaveTimer = null;
    this._layoutObserver = null;
    this._onDocKeydown = null;
    this._heightPxBeforeCollapse = null;
    this._persistSaveTimer = null;
    this._stateSaveTimer = null;
    this.panelSurface = "glass";
    this.updateBannerData = null;
    this.onDeleteImportedMod =
      typeof onDeleteImportedMod === "function" ? onDeleteImportedMod : null;
    this.selectedModId = null;
    // state[sectionKey] = active mod id        (exclusive)
    // state[modId]      = boolean              (toggle)
    // configState[modId][key] = value
    this.state = {};
    this.configState = {};

    this.sections.forEach((sec) => {
      if (sec.type === "exclusive") {
        this.state[sec.key] = sec.mods[sec.mods.length - 1].id;
        // default = last (off)
      }
      sec.mods.forEach((mod) => {
        if (sec.type === "toggle") this.state[mod.id] = false;
        this.configState[mod.id] = {};
        (mod.config || []).forEach((cfg) => {
          this.configState[mod.id][cfg.key] = cfg.default;
        });
      });
    });
  }

  _injectStyles() {
    if (document.querySelector("#ML-styles")) return;
    const s = document.createElement("style");
    s.id = "ML-styles";
    s.innerHTML = STYLES;
    document.head.appendChild(s);
  }

  _showToast(kind, msg, duration = 3500) {
    if (!msg) return;
    let host = this.container.querySelector("#ML-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "ML-toast-host";
      this.container.appendChild(host);
    }
    const toast = document.createElement("div");
    toast.className = `ML-toast ML-toast-${kind || "info"}`;
    const content = document.createElement("div");
    content.className = "ML-toast-content";
    content.textContent = msg;
    toast.appendChild(content);
    host.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add("ML-toast-show"));
    });
    const removeToast = () => {
      if (!toast.isConnected) return;
      toast.classList.remove("ML-toast-show");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
      setTimeout(() => toast.remove(), 500);
    };
    setTimeout(removeToast, duration);
  }

  async create() {
    if (this.container) return;
    this._injectStyles();
    await this._restorePersistedState();
    this.container = buildPanel(this.sections, this.configState);
    this.container.dataset.panelSurface = this.panelSurface;
    document.body.appendChild(this.container);
    this._setupEvents();
    this._applyPersistedUiToDom();
    this._updateUI();
    this._loadIcons();
    this._setGreetText();
    this._injectOpenButton();
    this._renderFavorites();
    this._renderDevMode();
    this._initDevCard();
    this._applySearchFilter();
    this._updateStatsBar();
    this._applyPersistedModRuntime();
    this._renderUpdateBanner(this.updateBannerData);
  }

  _applyPersistedModRuntime() {
    try {
      this.sections.forEach((sec) => {
        if (sec.type === "exclusive") {
          const selected = this.state[sec.key];
          if (selected) this.onModeChange(sec.key, selected);
        } else if (sec.type === "toggle") {
          sec.mods.forEach((m) => {
            if (!m?.id || m.id === "off") return;
            const active = !!this.state[m.id];
            if (active) this.onModeChange(sec.key, { id: m.id, active: true });
          });
        }
      });
    } catch (e) {}
  }

  async _rebuildWithSections(sections) {
    if (!sections || !Array.isArray(sections)) return;
    if (!this.container) return;

    const display = this.container.style.display;
    const left = this.container.style.left;
    const top = this.container.style.top;
    const right = this.container.style.right;
    const width = this.container.style.width;
    const height = this.container.style.height;

    this.sections = sections;
    const old = this.container;
    old.remove();
    this.container = buildPanel(this.sections, this.configState);
    this.container.style.display = display;
    this.container.dataset.panelSurface = this.panelSurface;
    if (left) this.container.style.left = left;
    if (top) this.container.style.top = top;
    if (right) this.container.style.right = right;
    if (width) this.container.style.width = width;
    if (height) this.container.style.height = height;
    document.body.appendChild(this.container);
    this._setupEvents();
    await this._applyPersistedUiToDom();
    this._updateUI();
    this._loadIcons();
    this._renderFavorites();
    this._renderDevMode();
    this._initDevCard();
    this._applySearchFilter();
    this._updateStatsBar();
    this._setGreetText();
    this._setSelectedRow(null);
    this._renderUpdateBanner(this.updateBannerData);
  }

  _parseUpdateMarkdown(md) {
    if (!md) return "";
    return String(md)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/### (.*)/g, "<h3>$1</h3>")
      .replace(/## (.*)/g, "<h2>$1</h2>")
      .replace(/# (.*)/g, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(?!\*)(.*?)\*(?!\*)/g, "<em>$1</em>")
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
      )
      .replace(/\n/g, "<br>");
  }

  _renderUpdateBanner(data) {
    this.updateBannerData = data || null;
    const banner = this.container?.querySelector("#p-update-banner");
    if (!banner) return;
    if (!data) {
      banner.style.display = "none";
      return;
    }
    const { release, newVer, oldVer } = data;
    const asset = release?.assets?.find((a) =>
      String(a?.name || "").endsWith(".zip"),
    );
    banner.style.display = "block";
    banner.style.marginTop = "10px";
    banner.style.padding = "10px 12px 12px";
    banner.style.background =
      "linear-gradient(165deg, rgba(124, 92, 12, 0.94), rgba(87, 62, 8, 0.94))";
    banner.style.borderTop = "1px solid rgba(250, 204, 21, 0.34)";
    banner.style.color = "rgba(255,255,255,0.96)";
    const title = banner.querySelector(".p-banner-title");
    const versionEl = banner.querySelector("#p-update-version");
    const changelogEl = banner.querySelector("#p-changelog");
    const downloadBtn = banner.querySelector("#p-update-download");
    if (title)
      title.innerHTML =
        '<i class="fas fa-triangle-exclamation"></i> Update available';
    if (versionEl) versionEl.textContent = newVer || "";
    if (changelogEl) {
      const header = `<div style="margin-bottom:8px;font-size:14px;font-weight:800;color:rgba(255,255,255,0.92);">${oldVer || "0.0.0"} → ${newVer || "0.0.0"}</div>`;
      changelogEl.innerHTML =
        header + this._parseUpdateMarkdown(release?.body || "");
    }
    if (downloadBtn) {
      downloadBtn.style.display = asset ? "inline-flex" : "none";
      downloadBtn.textContent = asset ? "Download .zip" : "No .zip asset";
      downloadBtn.onclick = asset
        ? () => window.open(asset.browser_download_url, "_blank")
        : null;
    }
  }
  _getStats() {
    const allRows = Array.from(
      this.container?.querySelectorAll(".p-mod-row") || [],
    );
    const total = allRows.filter((r) => r.dataset.modId !== "off").length;
    const enabled = allRows.filter(
      (r) => r.dataset.modId !== "off" && r.classList.contains("p-row-active"),
    ).length;
    const favs = this.favorites.size;
    const imports = allRows.filter(
      (r) => r.dataset.source === "imported",
    ).length;
    return { total, enabled, favs, imports };
  }

  _updateStatsBar() {
    if (!this.container) return;
    const stats = this._getStats();
    const set = (k, label, v) => {
      const el = this.container.querySelector(`.p-stat[data-k="${k}"]`);
      if (!el) return;
      el.textContent = `${label} ${v}`;
    };
    set("total", "mods", stats.total);
    set("enabled", "on", stats.enabled);
    set("favs", "fav", stats.favs);
    set("imports", "imp", stats.imports);
  }

  async _promptDuplicate(meta) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "p-modal";
      overlay.innerHTML = `
        <div class="p-modal-card">
          <div class="p-modal-title">Duplicate mod</div>
          <div class="p-modal-body">
            A mod with id <strong>${String(meta.id)}</strong> already exists. Overwrite it?
          </div>
          <div class="p-modal-actions">
            <button class="p-modal-btn" data-act="cancel">Cancel</button>
            <button class="p-modal-btn p-primary" data-act="overwrite">Overwrite</button>
          </div>
        </div>
      `;
      const done = (v) => {
        overlay.remove();
        resolve(v);
      };
      overlay.addEventListener("click", (e) => {
        const btn = e.target.closest(".p-modal-btn");
        if (!btn) return;
        done(btn.dataset.act);
      });
      this.container.appendChild(overlay);
    });
  }
  _setGreetText() {
    const el = this.container?.querySelector("#p-greet");
    if (!el) return;
    let name = "Player";
    setTimeout(() => {
      try {
        name = api?.default?.playerName?.() || "Player";
      } catch {}
      el.textContent = `Hi, ${name}`;
    }, 5000);
  }

  _getBuiltInIds() {
    return new Set(
      MODS.map((m) => String(m?.metadata?.id || "")).filter(Boolean),
    );
  }

  _getSelectedRow() {
    if (!this.container || !this.selectedModId) return null;
    return this.container.querySelector(
      `.p-mod-row[data-mod-id="${this.selectedModId}"]`,
    );
  }

  _setSelectedRow(id) {
    this.selectedModId = id || null;
    this.container?.querySelectorAll(".p-mod-row").forEach((row) => {
      row.classList.toggle(
        "p-row-selected",
        row.dataset.modId === this.selectedModId,
      );
    });
  }

  async _deleteSelectedImportedMod() {
    if (!this.selectedModId || this.selectedModId === "off") return;
    const row = this._getSelectedRow();
    if (!row) return;
    if (row.dataset.source === "built-in") {
      this._showToast("err", "Built-in mods cannot be deleted");
      return;
    }

    const ok = await new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "p-modal";
      overlay.innerHTML = `
        <div class="p-modal-card">
          <div class="p-modal-title">Delete imported mod</div>
          <div class="p-modal-body">Delete <strong>${this.selectedModId}</strong> from imported mods?</div>
          <div class="p-modal-actions">
            <button class="p-modal-btn" data-act="cancel">Cancel</button>
            <button class="p-modal-btn p-primary" data-act="delete">Delete</button>
          </div>
        </div>
      `;
      overlay.addEventListener("click", (e) => {
        const btn = e.target.closest(".p-modal-btn");
        if (!btn) return;
        const act = btn.dataset.act;
        overlay.remove();
        resolve(act === "delete");
      });
      this.container.appendChild(overlay);
    });

    if (!ok) return;

    if (this.onDeleteImportedMod) {
      try {
        await this.onDeleteImportedMod(this.selectedModId);
      } catch (e) {
        this._showToast("err", e?.message || "Delete failed");
        return;
      }
    }

    await idb.deleteImport(this.selectedModId);
    delete this.state[this.selectedModId];
    delete this.configState[this.selectedModId];
    this.selectedModId = null;

    const metas = await imported.loadImportedMetas().catch(() => []);
    await this._rebuildWithSections(getSections(metas));
    this._showToast("ok", "Imported mod deleted");
  }
  _defaultUiState() {
    return {
      collapsed: false,
      ghost: false,
      activeTab: 0,
      search: "",
      devMode: false,
      position: { top: 60, right: 20, left: null },
      size: { width: 360, height: null },
    };
  }

  async _restorePersistedState() {
    // UI
    let ui = null;
    try {
      ui = await idb.getSetting("ui");
    } catch (e) {
      ui = null;
    }
    const state = Object.assign(this._defaultUiState(), ui || {});
    this.panelSurface = state.panelSurface || "glass";
    this.isCollapsed = !!state.collapsed;
    this.isHidden = !!state.ghost;
    this.activeSectionIdx = Number.isFinite(state.activeTab)
      ? state.activeTab
      : 0;
    this.devMode = !!state.devMode;

    // favorites
    try {
      const favs = await idb.getAllFavorites();
      this.favorites = new Set(favs);
    } catch (e) {
      this.favorites = new Set();
    }

    // mod state + config
    try {
      const persisted = await idb.getModState();
      if (persisted && typeof persisted === "object") {
        if (persisted.state && typeof persisted.state === "object") {
          Object.assign(this.state, persisted.state);
        }
        if (
          persisted.configState &&
          typeof persisted.configState === "object"
        ) {
          for (const [modId, cfg] of Object.entries(persisted.configState)) {
            if (!this.configState[modId]) this.configState[modId] = {};
            Object.assign(this.configState[modId], cfg || {});
          }
        }
      }
    } catch {}
  }

  async _saveUiStateNow() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const left = parsePx(this.container.style.left);
    const top = parsePx(this.container.style.top);
    const width = rect.width;
    const height = rect.height;

    const payload = {
      collapsed: !!this.isCollapsed,
      ghost: !!this.isHidden,
      activeTab: this.activeSectionIdx,
      search: this.container.querySelector("#p-search")?.value || "",
      devMode: !!this.devMode,
      position: {
        left: left != null ? left : rect.left,
        top: top != null ? top : rect.top,
      },
      size: {
        width,
        height: this.isCollapsed ? null : height,
      },
      panelSurface: this.container?.dataset.panelSurface || "glass",
    };

    await idb.setSetting("ui", payload);
  }

  _scheduleUiSave() {
    clearTimeout(this._persistSaveTimer);
    this._persistSaveTimer = setTimeout(() => {
      this._saveUiStateNow().catch(() => {});
    }, 300);
  }

  async _saveModStateNow() {
    const payload = {
      state: this.state,
      configState: this.configState,
      updatedAt: Date.now(),
    };
    await idb.setModState(payload);
  }

  _scheduleModStateSave() {
    clearTimeout(this._stateSaveTimer);
    this._stateSaveTimer = setTimeout(() => {
      this._saveModStateNow().catch(() => {});
    }, 300);
  }

  async _loadIcons() {
    const images = this.container.querySelectorAll(".p-mod-img");
    for (const img of images) {
      const { path, modId, source } = img.dataset;
      try {
        let blob = null;
        if (source === "imported") {
          blob = await imported.getImportedFileBlob(modId, path);
          if (!blob) throw new Error("Missing imported icon blob");
        } else {
          const row = img.closest(".p-mod-row");
          const section = row ? row.dataset.sectionKey : "extras";
          const fullPath = `./mods/${section}/${modId}/${path}`;
          const resp = await fetch(fullPath);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          blob = await resp.blob();
        }
        img.src = URL.createObjectURL(blob);
        img.style.display = "block";
      } catch (e) {
        console.warn(
          `[Mod Loader] Failed to load icon for mod '${modId}' at '${path}':`,
          e.message,
        );
      }
    }
  }

  _clampPosition() {
    if (!this.container) return;
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    const rect = this.container.getBoundingClientRect();
    let x = rect.left;
    let y = rect.top;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    if (x !== rect.left || y !== rect.top) {
      this.container.style.left = x + "px";
      this.container.style.top = y + "px";
      this.container.style.right = "auto";
    }
  }

  async _applyPersistedUiToDom() {
    if (!this.container) return;
    let ui = null;
    try {
      ui = await idb.getSetting("ui");
    } catch (e) {
      ui = null;
    }
    const data = Object.assign(this._defaultUiState(), ui || {});

    // size
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.9;
    const width = parsePx(data.size?.width);
    const height = parsePx(data.size?.height);
    if (width != null && width >= 300) {
      this.container.style.width = Math.min(width, maxW) + "px";
    }
    if (height != null && height > 0) {
      this.container.style.height = Math.min(height, maxH) + "px";
    }

    // position (prefer left/top; fallback to right/top)
    const left = parsePx(data.position?.left);
    const top = parsePx(data.position?.top);
    const right = parsePx(data.position?.right);
    if (top != null) this.container.style.top = top + "px";
    if (left != null) {
      this.container.style.left = left + "px";
      this.container.style.right = "auto";
    } else if (right != null) {
      this.container.style.right = right + "px";
    }
    this._clampPosition();

    // collapsed / ghost
    this.container.classList.toggle("p-ghost", this.isHidden);
    this._syncHideIcon();
    this.container.classList.toggle("p-collapsed", this.isCollapsed);
    this._syncCollapseChevron();

    // tab
    const idx = Number.isFinite(data.activeTab) ? data.activeTab : 0;
    this.activeSectionIdx = Math.max(
      0,
      Math.min(idx, this.sections.length - 1),
    );
    this._syncTabs();

    // search
    const input = this.container.querySelector("#p-search");
    if (input) input.value = typeof data.search === "string" ? data.search : "";
  }

  _syncCollapseChevron() {
    const btn = this.container.querySelector("#p-collapse-btn");
    const icon = btn && btn.querySelector("i");
    if (icon)
      icon.className = this.isCollapsed
        ? "fas fa-chevron-down"
        : "fas fa-chevron-up";
    if (btn)
      btn.setAttribute("aria-expanded", this.isCollapsed ? "false" : "true");
  }

  _syncHideIcon() {
    const btn = this.container.querySelector("#p-hide-btn");
    const icon = btn && btn.querySelector("i");
    if (icon)
      icon.className = this.isHidden ? "fas fa-eye" : "fas fa-eye-slash";
  }

  _toggleCollapsed() {
    if (!this.isCollapsed) {
      this._heightPxBeforeCollapse = this.container.style.height || null;
      this.container.style.removeProperty("height");
    } else if (this._heightPxBeforeCollapse) {
      this.container.style.height = this._heightPxBeforeCollapse;
    }

    this.isCollapsed = !this.isCollapsed;
    this.container.classList.toggle("p-collapsed", this.isCollapsed);
    this._syncCollapseChevron();
    this._scheduleUiSave();
  }

  _applySearchFilter() {
    const input = this.container.querySelector("#p-search");
    const q = ((input && input.value) || "").trim().toLowerCase();
    const pane = this.container.querySelector(".p-pane.p-pane-active");
    if (!pane) return;
    pane.querySelectorAll(".p-mod-row").forEach((row) => {
      const name = row.querySelector(".p-mod-name")?.textContent || "";
      const desc = row.querySelector(".p-mod-desc")?.textContent || "";
      const hay = (name + " " + desc).toLowerCase();
      row.style.display = !q || hay.includes(q) ? "" : "none";
    });
  }

  _onSectionTabChange() {
    const input = this.container.querySelector("#p-search");
    this._applySearchFilter();
    this._scheduleUiSave();
  }

  _refreshConfigInputs() {
    this.container.querySelectorAll(".p-config-input").forEach((input) => {
      const { mod, cfg } = input.dataset;
      if (!mod || !cfg || !this.configState[mod]) return;
      const val = this.configState[mod][cfg];
      if (input.type === "checkbox") {
        input.checked = !!val;
      } else if (input.type === "range") {
        input.value = String(val);
        const display = this.container.querySelector(
          `.p-config-value[data-mod="${mod}"][data-cfg="${cfg}"]`,
        );
        if (display) {
          const unit = display.textContent.replace(/[0-9.-]/g, "") || "ms";
          display.textContent = val + unit;
        }
      } else {
        input.value = val != null ? String(val) : "";
      }
    });
  }

  _resetConfigDefaults() {
    SECTIONS.forEach((sec) => {
      sec.mods.forEach((mod) => {
        (mod.config || []).forEach((cfg) => {
          const prev = this.configState[mod.id][cfg.key];
          const def = cfg.default;
          if (prev === def) return;
          this.configState[mod.id][cfg.key] = def;
          this.onModeChange("config", { id: mod.id, key: cfg.key, value: def });
        });
      });
    });
    this._refreshConfigInputs();
    this._scheduleModStateSave();
  }

  _showPanelSettings() {
    if (!this.container) return;
    const existing = this.container.querySelector("#p-panel-settings-modal");
    if (existing) {
      existing.remove();
      this.container.classList.remove("modal-open");
      return;
    }
    this.container.classList.add("modal-open");
    const currentSurface =
      this.panelSurface || this.container.dataset.panelSurface || "glass";
    const modal = document.createElement("div");
    modal.id = "p-panel-settings-modal";
    modal.className = "p-modal open";
    modal.innerHTML = `
      <div class="p-modal-card">
        <div class="p-modal-title">Customize panel</div>
        <div class="p-modal-body">
          <label class="p-modal-option">
            <input type="radio" name="p-panel-surface" value="glass" ${currentSurface === "glass" ? "checked" : ""} />
            <span>Glass</span>
          </label>
          <label class="p-modal-option">
            <input type="radio" name="p-panel-surface" value="background" ${currentSurface === "background" ? "checked" : ""} />
            <span>Background</span>
          </label>
        </div>
        <div class="p-modal-actions">
          <button class="p-modal-btn" data-act="cancel" type="button">Cancel</button>
          <button class="p-modal-btn p-primary" data-act="save" type="button">Save</button>
        </div>
      </div>
    `;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        this.container.classList.remove("modal-open");
        return;
      }
      const btn = e.target.closest(".p-modal-btn");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "save") {
        const selected =
          modal.querySelector('input[name="p-panel-surface"]:checked')?.value ||
          "glass";
        this.panelSurface = selected === "background" ? "background" : "glass";
        this.container.dataset.panelSurface = this.panelSurface;
        this._scheduleUiSave?.();
      }
      modal.remove();
      this.container.classList.remove("modal-open");
    });
    this.container.appendChild(modal);
  }

  _setupEvents() {
    this.container
      .querySelector("#p-sidebar")
      .addEventListener("click", (e) => {
        const cat = e.target.closest(".p-cat");
        if (!cat) return;
        this.activeSectionIdx = parseInt(cat.dataset.idx, 10);
        this._syncTabs();
        this._onSectionTabChange();
      });
    this.container.querySelectorAll(".p-mod-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest(".p-fav-btn")) return;
        if (e.target.closest(".p-mod-collapse-btn")) {
          row.classList.toggle("p-expanded");
          return;
        }
        this._setSelectedRow(row.dataset.modId);
      });
    });
    const importBtn = this.container.querySelector("#p-import-btn");
    const importInput = this.container.querySelector("#p-import-input");
    if (importBtn && importInput) {
      importBtn.addEventListener("click", () => importInput.click());
      importInput.addEventListener("change", async () => {
        const f = importInput.files && importInput.files[0];
        importInput.value = "";
        if (!f) return;
        const activeSection = this.sections[this.activeSectionIdx];
        const isModpackTab = activeSection?.key === "modpack";
        const defaultSec = activeSection ? activeSection.key : "extras";
        const builtInIds = this._getBuiltInIds();
        const handleDuplicate = async (meta) => {
          if (builtInIds.has(String(meta.id))) {
            throw new Error(`Cannot overwrite built-in mod: ${meta.id}`);
          }
          const d = await this._promptDuplicate(meta);
          return d === "overwrite" ? "overwrite" : "cancel";
        };
        if (isModpackTab) {
          this._showToast("info", "Importing modpack…");
          try {
            const importedIds = await imported
              .loadImportedMetas()
              .then((m) => m.map((x) => x.id))
              .catch(() => []);
            const existing = new Set([...builtInIds, ...importedIds]);
            const result = await importModpackZip(f, {
              existingIds: existing,
              defaultSection: defaultSec,
              onDuplicate: handleDuplicate,
            });
            for (const rec of result.records) {
              if (this.onImportedMod) {
                try {
                  this.onImportedMod(rec);
                } catch (e) {
                  console.warn(
                    "[Mod Loader] Modpack mod runtime registration failed:",
                    e?.message || e,
                  );
                }
              }
            }
            const metas = await imported.loadImportedMetas().catch(() => []);
            await this._rebuildWithSections(getSections(metas));
            this._showToast(
              "ok",
              `Modpack '${result.meta.name}' imported (${result.records.length} mod${result.records.length !== 1 ? "s" : ""})`,
            );
          } catch (e) {
            this._showToast("err", e?.message || "Modpack import failed");
          }
        } else {
          // Single mod import
          this._showToast("info", "Importing mod…");
          try {
            const importedIds = await imported
              .loadImportedMetas()
              .then((m) => m.map((x) => x.id))
              .catch(() => []);
            const existing = new Set([...builtInIds, ...importedIds]);
            const rec = await importZipFile(f, {
              existingIds: existing,
              defaultSection: defaultSec,
              onDuplicate: handleDuplicate,
            });
            if (this.onImportedMod) {
              try {
                this.onImportedMod(rec);
              } catch (e) {
                console.warn(
                  "[Mod Loader] Imported mod registered with UI but failed to register runtime:",
                  e?.message || e,
                );
              }
            }
            const metas = await imported.loadImportedMetas().catch(() => []);
            await this._rebuildWithSections(getSections(metas));
            this._showToast("ok", `Imported '${rec.id}'`);
            if (rec.metadata?.scripting)
              this._showToast(
                "warn",
                `'${rec.id}' uses the scripting API. Only import mods from sources you trust. I take no responsibility for what imported mods do.`,
                6000,
              );
          } catch (e) {
            this._showToast("err", e?.message || "Import failed");
          }
        }
      });
    }

    const folderBtn = this.container.querySelector("#p-folder-btn");
    if (folderBtn) {
      folderBtn.addEventListener("click", async () => {
        try {
          const res = await pickFolder();
          const activeSection = this.sections[this.activeSectionIdx];
          const defaultSec = activeSection ? activeSection.key : "extras";
          const builtInIds = this._getBuiltInIds();
          this._showToast("info", "Importing folder...");
          let rec;
          if (res instanceof FileList) {
            rec = await importFolderFromFiles(res, {
              existingIds: new Set([
                ...builtInIds,
                ...(await this._getImportedIds()),
              ]),
              defaultSection: defaultSec,
              onDuplicate: async (meta) => {
                if (builtInIds.has(String(meta.id)))
                  throw new Error("Cannot overwrite built-in mod!");
                return await this._promptDuplicate(meta);
              },
            });
          } else {
            rec = await importFolder(res, {
              existingIds: new Set([
                ...builtInIds,
                ...(await this._getImportedIds()),
              ]),
              defaultSection: defaultSec,
              onDuplicate: async (meta) => {
                if (builtInIds.has(String(meta.id)))
                  throw new Error("Cannot overwrite built-in mod!");
                return await this._promptDuplicate(meta);
              },
            });
          }
          if (this.onImportedMod) this.onImportedMod(rec);
          const metas = await imported.loadImportedMetas();
          await this._rebuildWithSections(getSections(metas));
          this._showToast("ok", `Imported folder as '${rec.id}'`);
        } catch (e) {
          if (e.name !== "AbortError") this._showToast("err", e.message);
        }
      });
    }

    const devBtn = this.container.querySelector("#p-dev-toggle");
    if (devBtn) {
      devBtn.addEventListener("click", () => {
        this.devMode = !this.devMode;
        this._renderDevMode();
        this._scheduleUiSave();
      });
    }

    const enableAll = this.container.querySelector("#p-enable-all");
    const disableAll = this.container.querySelector("#p-disable-all");
    const toggleAll = this.container.querySelector("#p-toggle-all");
    const bulk = (mode) => {
      const pane = this.container.querySelector(".p-pane.p-pane-active");
      if (!pane) return;
      const secType = pane.dataset.secType;
      if (secType !== "toggle") {
        this._showToast("err", "Bulk actions only apply to toggle tabs");
        return;
      }
      pane.querySelectorAll(".p-mod-row").forEach((row) => {
        const id = row.dataset.modId;
        if (!id || id === "off") return;
        if (mode === "enable") this.state[id] = true;
        else if (mode === "disable") this.state[id] = false;
        else this.state[id] = !this.state[id];
        this.onModeChange(pane.dataset.secKey, { id, active: this.state[id] });
      });
      this._updateUI();
      this._updateStatsBar();
      this._scheduleModStateSave();
    };
    if (enableAll) enableAll.addEventListener("click", () => bulk("enable"));
    if (disableAll) disableAll.addEventListener("click", () => bulk("disable"));
    if (toggleAll) toggleAll.addEventListener("click", () => bulk("toggle"));

    // favorites
    this.container.addEventListener("click", (e) => {
      const btn = e.target.closest(".p-fav-btn");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.favId;
      if (!id) return;
      const next = !this.favorites.has(id);
      if (next) this.favorites.add(id);
      else this.favorites.delete(id);
      idb.setFavorite(id, next).catch(() => {});
      this._renderFavorites();
      this._updateStatsBar();
      this._scheduleUiSave();
    });

    this.container
      .querySelector("#p-close-btn")
      .addEventListener("click", () => {
        this.container.style.display = "none";
      });

    this.container
      .querySelector("#p-collapse-btn")
      .addEventListener("click", () => {
        this._toggleCollapsed();
      });

    this.container
      .querySelector("#p-hide-btn")
      .addEventListener("click", () => {
        this.isHidden = !this.isHidden;
        this.container.classList.toggle("p-ghost", this.isHidden);
        this._syncHideIcon();
        this._scheduleUiSave();
      });

    const titlebar = this.container.querySelector("#p-titlebar");
    titlebar.addEventListener("dblclick", (e) => {
      if (e.target.closest(".p-titlebar-btn")) return;
      this._toggleCollapsed();
    });

    this.container
      .querySelector("#p-delete-selected-btn")
      ?.addEventListener("click", () => {
        this._deleteSelectedImportedMod();
      });
    this.container
      .querySelector("#p-panel-settings-btn")
      ?.addEventListener("click", () => {
        this._showPanelSettings();
      });

    const search = this.container.querySelector("#p-search");
    if (search) {
      search.addEventListener("input", () => {
        this._applySearchFilter();
        this._scheduleUiSave();
      });
    }

    this.container
      .querySelector("#p-reset-config")
      .addEventListener("click", () => {
        this._resetConfigDefaults();
      });

    this._onDocKeydown = (e) => {
      if (e.key !== "Escape" || !this.container) return;
      if (this.container.style.display === "none") return;
      this.container.style.display = "none";
    };
    document.addEventListener("keydown", this._onDocKeydown);

    this.container.querySelectorAll(".p-mod-header").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (e.target.closest(".p-fav-btn")) return;
        if (e.target.closest(".p-mod-collapse-btn")) return;
        const { modId, sectionKey, sectionType } = btn.dataset;
        if (sectionType === "exclusive") {
          this.state[sectionKey] = modId;
          this.onModeChange(sectionKey, modId);
        } else {
          this.state[modId] = !this.state[modId];
          this.onModeChange(sectionKey, {
            id: modId,
            active: this.state[modId],
          });
        }
        this._updateUI();
        this._updateStatsBar();
        this._scheduleModStateSave();
      });
    });

    this.container.querySelectorAll(".p-config-input").forEach((input) => {
      const update = () => {
        const { mod, cfg } = input.dataset;
        let val;

        if (input.type === "checkbox") {
          val = input.checked;
        } else if (input.type === "range") {
          val = parseInt(input.value, 10);
          const display = this.container.querySelector(
            `.p-config-value[data-mod="${mod}"][data-cfg="${cfg}"]`,
          );
          if (display) {
            const unit = display.textContent.replace(/[0-9.-]/g, "");
            display.textContent = val + unit;
          }
        } else {
          val = input.value;
        }

        this.configState[mod][cfg] = val;
        this.onModeChange("config", { id: mod, key: cfg, value: val });
        this._scheduleModStateSave();
      };

      const eventType =
        input.type === "checkbox" ||
        input.type === "color" ||
        input.type === "date"
          ? "change"
          : "input";
      input.addEventListener(eventType, update);
    });

    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".p-titlebar-btn")) return;
      this.isDragging = true;
      this.dragOffset.x = e.clientX - this.container.offsetLeft;
      this.dragOffset.y = e.clientY - this.container.offsetTop;
      const onMove = (e) => {
        if (!this.isDragging) return;

        let x = e.clientX - this.dragOffset.x;
        let y = e.clientY - this.dragOffset.y;

        const maxX = window.innerWidth - this.container.offsetWidth;
        const maxY = window.innerHeight - this.container.offsetHeight;

        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        this.container.style.left = x + "px";
        this.container.style.top = y + "px";
        this.container.style.right = "auto";
      };
      const onUp = () => {
        this.isDragging = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        this._scheduleUiSave();
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    window.addEventListener("resize", () => {
      if (!this.container || this.container.style.display === "none") return;
      this._clampPosition();
    });

    if (typeof ResizeObserver !== "undefined") {
      this._layoutObserver = new ResizeObserver(() => {
        if (!this.container || this.container.style.display === "none") return;
        if (
          this.isCollapsed ||
          this.container.classList.contains("p-collapsed")
        )
          return;
        this._scheduleUiSave();
      });
      this._layoutObserver.observe(this.container);
    }
  }

  _syncTabs() {
    this.container.querySelectorAll(".p-cat").forEach((el) => {
      el.classList.toggle(
        "p-cat-active",
        parseInt(el.dataset.idx, 10) === this.activeSectionIdx,
      );
    });
    this.container.querySelectorAll(".p-pane").forEach((el) => {
      el.classList.toggle(
        "p-pane-active",
        parseInt(el.dataset.idx, 10) === this.activeSectionIdx,
      );
    });
  }

  _updateUI() {
    this.container.querySelectorAll(".p-mod-row").forEach((row) => {
      const { modId, sectionKey, sectionType } = row.dataset;
      const isActive =
        sectionType === "exclusive"
          ? this.state[sectionKey] === modId
          : this.state[modId] === true;
      row.classList.toggle("p-row-active", isActive);
      const status = row.querySelector(".p-status");
      if (status) status.textContent = isActive ? "on" : "off";
    });
  }

  _injectOpenButton() {
    const inject = () => {
      const container = document.querySelector(".button-container");
      if (!container || document.querySelector("#ML-open-btn")) return;
      const btn = document.createElement("button");
      btn.id = "ML-open-btn";
      btn.className = "btn-small";
      btn.innerHTML = '<i class="fas fa-layer-group"></i> Mod Loader';
      btn.addEventListener("click", () => {
        const hidden =
          !this.container.style.display ||
          this.container.style.display === "none";
        this.container.style.display = hidden ? "flex" : "none";
        if (hidden) this._clampPosition();
      });
      container.insertBefore(btn, container.firstChild);
    };

    inject();
    const observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  _renderFavorites() {
    if (!this.container) return;
    this.container.querySelectorAll(".p-mod-row").forEach((row) => {
      const id = row.dataset.modId;
      if (!id) return;
      row.classList.toggle("p-fav", this.favorites.has(id));
    });
    this._sortFavoritesInDom();
  }

  _sortFavoritesInDom() {
    if (!this.container) return;
    this.container.querySelectorAll(".p-pane").forEach((pane) => {
      const rows = Array.from(pane.querySelectorAll(".p-mod-row"));
      if (rows.length <= 1) return;
      const favorites = rows.filter((r) => this.favorites.has(r.dataset.modId));
      const rest = rows.filter((r) => !this.favorites.has(r.dataset.modId));
      [...favorites, ...rest].forEach((r) => pane.appendChild(r));
    });
  }

  _renderDevMode() {
    if (!this.container) return;
    this.container.classList.toggle("p-dev", !!this.devMode);
    const devCat = this.container
      .querySelector(".p-cat[data-idx] i.fa-terminal")
      ?.closest(".p-cat");
    if (devCat) devCat.style.display = this.devMode ? "flex" : "none";
  }

  async _initDevCard() {
    const codeArea = this.container.querySelector("#p-dev-code");
    const previewImg = this.container.querySelector("#p-dev-img");
    if (!codeArea || !previewImg) return;
    const asset = await loadAssets();
    if (!asset) return;
    const needAsset = ["body", "leg", "head", "hair", "foot", "face", "arm", "hand"];
    for (const name of needAsset) {
      if (!asset[name]) {
        console.error(`[Mod Loader] Asset ${name} is required but not found`);
        return;
      }
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 50; canvas.height = 75;
    previewImg.style.imageRendering = "pixelated";
    const base = { x: 24, y: 48 };
    const layout = {
      body: { dx: 0, dy: 0, key: "color_body" },
      head: { dx: 0, dy: 0, key: "color_skin" },
      hair: { dx: 0, dy: 0, key: "color_hair" },
      face: { dx: 0, dy: 0 },
      hand: { dx: 7, dy: -15, key: "color_skin", pair: { dx: -7, dy: -15 } },
      arm:  { dx: 7, dy: -15, key: "color_body", pair: { dx: -7, dy: -15 } },
      leg:  { dx: -4, dy: 0, key: "color_legs",  pair: { dx: 4,  dy: 0  } },
      foot: { dx: -6, dy: -5, key: "color_feet",  pair: { dx: 6,  dy: -5  } },
    };
    const order = ["leg","body","arm","hand","head","hair","face","foot"];
    const hexToInt = (h) => parseInt(h.replace("#",""), 16);
    const state = { outfit: {
      style_hair:  0,
      color_body:  hexToInt("#111111"),
      color_skin:  hexToInt("#c99b86"),
      color_hair:  hexToInt("#47a53b"),
      color_legs:  hexToInt("#154479"),
      color_feet:  hexToInt("#5f3f11"),
    } };
    const timerIntervals = new Set();
    const timerTimeouts  = new Set();
    const timerRAFs      = new Set();
    const clearTimers = () => {
      for (const id of timerIntervals) globalThis.clearInterval(id);   timerIntervals.clear();
      for (const id of timerTimeouts)  globalThis.clearTimeout(id);    timerTimeouts.clear();
      for (const id of timerRAFs)      globalThis.cancelAnimationFrame(id); timerRAFs.clear();
    };
    const setIntervalMock  = (cb,ms,...a)=>{ const id=globalThis.setInterval(cb,ms,...a);  timerIntervals.add(id); return id; };
    const clearIntervalMock= (id)=>{ timerIntervals.delete(id); globalThis.clearInterval(id); };
    const setTimeoutMock   = (cb,ms,...a)=>{ const id=globalThis.setTimeout(cb,ms,...a);   timerTimeouts.add(id);  return id; };
    const clearTimeoutMock = (id)=>{ timerTimeouts.delete(id);  globalThis.clearTimeout(id); };
    const rafMock          = (cb)=>{ const id=globalThis.requestAnimationFrame(cb); timerRAFs.add(id); return id; };
    const cafMock          = (id)=>{ timerRAFs.delete(id); globalThis.cancelAnimationFrame(id); };
    const logEl = this.container.querySelector("#p-dev-log");
    const devLog = (level, args) => {
      if (!logEl) return;
      const entry = document.createElement("div");
      entry.className = `p-dev-log-entry p-dev-log-${level}`;
      const icon = level === "error" ? "fa-times-circle" : level === "warn" ? "fa-exclamation-triangle" : "fa-chevron-right";
      const text = args.map(a => {
        try { return typeof a === "object" ? JSON.stringify(a) : String(a); } catch { return String(a); }
      }).join(" ");
      entry.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
      logEl.appendChild(entry);
      logEl.scrollTop = logEl.scrollHeight;
    };
    const devConsole = {
      log:   (...a) => { devLog("log",   a); globalThis.console.log(...a);   },
      warn:  (...a) => { devLog("warn",  a); globalThis.console.warn(...a);  },
      error: (...a) => { devLog("error", a); globalThis.console.error(...a); },
      info:  (...a) => { devLog("log",   a); globalThis.console.info(...a);  },
      debug: (...a) => { devLog("log",   a); globalThis.console.debug(...a); },
    };
    const clearLog = () => { if (logEl) logEl.innerHTML = ""; };
    const virtualFS   = new Map();
    const moduleCache = new Map();
    const resolvePath = (from, dep) => {
      if (!dep.startsWith("./") && !dep.startsWith("../")) return null;
      const base = from.includes("/") ? from.split("/").slice(0,-1) : [];
      for (const part of dep.split("/")) {
        if (part === "..") base.pop();
        else if (part !== ".") base.push(part);
      }
      return base.join("/");
    };
    let _requireVirtual;
    const evalVirtualModule = (filePath, code) => {
      const m = { exports: {} };
      try {
        const fromPath = filePath;
        const g = globalThis;
        const globals = {
          undefined, NaN, Infinity,
          isNaN:g.isNaN, isFinite:g.isFinite,
          parseInt:g.parseInt, parseFloat:g.parseFloat,
          decodeURI:g.decodeURI, encodeURI:g.encodeURI,
          decodeURIComponent:g.decodeURIComponent, encodeURIComponent:g.encodeURIComponent,
          JSON:g.JSON, Math:g.Math, Date:g.Date, RegExp,
          Object, Array, String, Number, Boolean, Symbol, BigInt,
          Map, Set, WeakMap, WeakSet, WeakRef,
          Promise, Error, TypeError, RangeError, SyntaxError, ReferenceError, URIError, EvalError,
          ArrayBuffer, DataView, Proxy, Reflect,
          Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
          Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array,
          console: devConsole,
          window:g.window, document:g.document, navigator:g.navigator,
          location:g.location, history:g.history,
          performance:g.performance, crypto:g.crypto,
          fetch:g.fetch?.bind(g), XMLHttpRequest:g.XMLHttpRequest, WebSocket:g.WebSocket,
          URL:g.URL, URLSearchParams:g.URLSearchParams,
          Blob:g.Blob, File:g.File, FileReader:g.FileReader, FormData:g.FormData,
          TextEncoder:g.TextEncoder, TextDecoder:g.TextDecoder,
          AbortController:g.AbortController, AbortSignal:g.AbortSignal,
          Event:g.Event, CustomEvent:g.CustomEvent, EventTarget:g.EventTarget,
          MutationObserver:g.MutationObserver, IntersectionObserver:g.IntersectionObserver,
          ResizeObserver:g.ResizeObserver,
          localStorage:g.localStorage, sessionStorage:g.sessionStorage,
          queueMicrotask:g.queueMicrotask?.bind(g),
          structuredClone:g.structuredClone?.bind(g),
          atob:g.atob?.bind(g), btoa:g.btoa?.bind(g),
          Worker:g.Worker, Audio:g.Audio, Image:g.Image,
          requestIdleCallback:g.requestIdleCallback?.bind(g),
          cancelIdleCallback:g.cancelIdleCallback?.bind(g),
          require:(dep)=>_requireVirtual(dep, fromPath),
          module:m, exports:m.exports,
          setInterval:setIntervalMock, clearInterval:clearIntervalMock,
          setTimeout:setTimeoutMock,   clearTimeout:clearTimeoutMock,
          requestAnimationFrame:rafMock, cancelAnimationFrame:cafMock,
        };
        new Function(...Object.keys(globals), code)(...Object.values(globals));
      } catch(e) { console.error(`[Mod Loader] ${filePath}:`, e); }
      return m.exports;
    };
    _requireVirtual = (name, fromPath="") => {
      if (name === "@interstellar/StellarAPI") return api;
      if (!name.startsWith("./") && !name.startsWith("../")) throw new Error(`Unknown module: ${name}`);
      const base = resolvePath(fromPath, name);
      for (const c of [base, base+".js", base+"/index.js"].filter(Boolean)) {
        if (!virtualFS.has(c)) continue;
        if (moduleCache.has(c)) return moduleCache.get(c);
        const exp = evalVirtualModule(c, virtualFS.get(c));
        moduleCache.set(c, exp); return exp;
      }
      throw new Error(`Module not found: ${name} (resolved: ${base})`);
    };
    const MAIN_TAB = "__main__";
    const tabsData  = new Map();
    tabsData.set(MAIN_TAB, { content: "", label: "entry.js", dirty: false });
    let activeTab = MAIN_TAB;
    const tabBar   = this.container.querySelector("#p-dev-tabs");
    const saveBtn  = this.container.querySelector("#p-dev-save-file");
    const errorEl  = this.container.querySelector("#p-dev-error");
    const updateSaveBtn = () => {
      if (!saveBtn) return;
      const isFile = activeTab !== MAIN_TAB;
      saveBtn.disabled = !isFile;
      saveBtn.title = isFile ? `Save to ${activeTab}` : "No file selected";
    };
    const renderTabBar = () => {
      if (!tabBar) return;
      tabBar.innerHTML = "";
      for (const [path, tab] of tabsData.entries()) {
        const t = document.createElement("span");
        t.className = "p-dev-tab" + (path === activeTab ? " p-dev-tab-active" : "");
        const isMain = path === MAIN_TAB;
        const dirty  = tab.dirty && !isMain;
        t.innerHTML  = `<span class="p-dev-tab-name">${dirty ? '<span class="p-dev-tab-dot"></span>' : ""}${tab.label}</span>`
          + (isMain ? "" : `<span class="p-dev-tab-x" title="Close tab"><i class="fas fa-times"></i></span>`);
        t.querySelector(".p-dev-tab-name").addEventListener("click", () => switchTab(path));
        t.querySelector(".p-dev-tab-x")?.addEventListener("click", (e) => { e.stopPropagation(); closeTab(path); });
        tabBar.appendChild(t);
      }
    };
    const switchTab = (path) => {
      if (!tabsData.has(path)) return;
      if (tabsData.has(activeTab)) {
        tabsData.get(activeTab).content = codeArea.value;
      }
      activeTab = path;
      codeArea.value = tabsData.get(path).content;
      updateSaveBtn();
      renderTabBar();
      updatePreview();
    };
    const openFileTab = (fullPath) => {
      if (!tabsData.has(fullPath)) {
        tabsData.set(fullPath, {
          content: virtualFS.get(fullPath) ?? "",
          label: fullPath.includes("/") ? fullPath.split("/").pop() : fullPath,
          dirty: false,
        });
      }
      switchTab(fullPath);
    };
    const closeTab = (path) => {
      if (path === MAIN_TAB && tabsData.size <= 1) return;
      tabsData.delete(path);
      if (activeTab === path) {
        const keys = [...tabsData.keys()];
        switchTab(keys[keys.length - 1] ?? MAIN_TAB);
      } else {
        renderTabBar();
      }
    };
    codeArea.addEventListener("input", () => {
      if (tabsData.has(activeTab)) {
        const tab = tabsData.get(activeTab);
        const isDirty = activeTab !== MAIN_TAB && codeArea.value !== (virtualFS.get(activeTab) ?? "");
        if (tab.dirty !== isDirty) { tab.dirty = isDirty; renderTabBar(); }
      }
    });
    const treeEl = this.container.querySelector("#p-dev-tree");
    const renderTree = () => {
      if (!treeEl) return;
      treeEl.innerHTML = "";
      if (virtualFS.size === 0) {
        treeEl.innerHTML = `<span class="p-dev-tree-empty">no files</span>`;
        return;
      }
      const folders = new Map();
      for (const path of [...virtualFS.keys()].sort()) {
        const slash = path.lastIndexOf("/");
        const folder = slash >= 0 ? path.slice(0, slash) : "";
        const file   = slash >= 0 ? path.slice(slash+1)  : path;
        if (!folders.has(folder)) folders.set(folder, []);
        folders.get(folder).push(file);
      }
      for (const [folder, files] of [...folders.entries()].sort()) {
        if (folder) {
          const fe = document.createElement("span");
          fe.className = "p-dev-tree-folder";
          fe.title = folder;
          fe.innerHTML = `<i class="fas fa-folder"></i> ${folder.split("/").pop()}`;
          treeEl.appendChild(fe);
        }
        for (const file of files.sort()) {
          const fullPath = folder ? `${folder}/${file}` : file;
          const fie = document.createElement("span");
          fie.className = "p-dev-tree-file" + (folder ? " p-dev-tree-nested" : "")
                        + (tabsData.has(fullPath) ? " p-dev-tree-open" : "");
          fie.title = fullPath; fie.dataset.path = fullPath;
          fie.innerHTML = `<i class="fas fa-file-code"></i> ${file}`;
          fie.addEventListener("click", () => openFileTab(fullPath));
          treeEl.appendChild(fie);
        }
      }
    };
    const importFolderBtn = this.container.querySelector("#p-dev-import-folder");
    if (importFolderBtn) {
      importFolderBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file"; input.webkitdirectory = true; input.multiple = true;
        input.onchange = async () => {
          virtualFS.clear(); moduleCache.clear();
          for (const f of input.files) {
            if (!/\.(js|mjs|cjs|json)$/.test(f.name)) continue;
            virtualFS.set(f.webkitRelativePath.split("/").slice(1).join("/"), await f.text());
          }
          for (const path of tabsData.keys()) {
            if (path !== MAIN_TAB && !virtualFS.has(path)) tabsData.delete(path);
          }
          if (!tabsData.has(activeTab)) activeTab = MAIN_TAB;
          renderTree(); renderTabBar(); updateSaveBtn();
        };
        input.click();
      });
    }
    const importZipBtn = this.container.querySelector("#p-dev-import-zip");
    if (importZipBtn) {
      importZipBtn.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file"; input.accept = ".zip";
        input.onchange = async () => {
          if (!input.files[0]) return;
          try {
            const { unzip } = require("./vendor/fflate");
            const entries = await unzip(new Uint8Array(await input.files[0].arrayBuffer()));
            virtualFS.clear(); moduleCache.clear();
            const td = new TextDecoder("utf-8", { fatal: false });
            for (const [path, data] of Object.entries(entries)) {
              if (path.endsWith("/")) continue;
              const parts = path.split("/");
              const rel = parts.length > 1 ? parts.slice(1).join("/") : path;
              if (!/\.(js|mjs|cjs|json)$/.test(rel)) continue;
              virtualFS.set(rel, td.decode(data));
            }
            for (const path of tabsData.keys()) {
              if (path !== MAIN_TAB && !virtualFS.has(path)) tabsData.delete(path);
            }
            if (!tabsData.has(activeTab)) activeTab = MAIN_TAB;
            renderTree(); renderTabBar(); updateSaveBtn();
          } catch(e) { console.error("[Mod Loader] zip import error:", e); }
        };
        input.click();
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        if (activeTab === MAIN_TAB) return;
        const content = codeArea.value;
        virtualFS.set(activeTab, content);
        moduleCache.delete(activeTab);
        const tab = tabsData.get(activeTab);
        if (tab) { tab.content = content; tab.dirty = false; }
        const blob = new Blob([content], { type: "text/javascript" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url;
        a.download = activeTab.includes("/") ? activeTab.split("/").pop() : activeTab;
        a.click();
        URL.revokeObjectURL(url);
        renderTabBar(); renderTree();
        updatePreview();
      });
    }
    const clearLogBtn = this.container.querySelector("#p-dev-clear-log");
    if (clearLogBtn) clearLogBtn.addEventListener("click", clearLog);
    const tint = (img, colorInt) => {
      const c = document.createElement("canvas");
      const tCtx = c.getContext("2d");
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      tCtx.drawImage(img, 0, 0);
      const r = (colorInt >> 16) & 255, g = (colorInt >> 8) & 255, b = colorInt & 255;
      tCtx.fillStyle = `rgb(${r},${g},${b})`;
      tCtx.globalCompositeOperation = "multiply";
      tCtx.fillRect(0, 0, c.width, c.height);
      tCtx.globalCompositeOperation = "destination-in";
      tCtx.drawImage(img, 0, 0);
      tCtx.globalCompositeOperation = "source-over";
      return c;
    };
    const drawPart = (name, info, outfit) => {
      const img = asset[name]; if (!img) return;
      if (name === "hair" && (outfit.style_hair ?? 0) === 0) return;
      const color = info.key ? (outfit[info.key] ?? null) : null;
      const drawImg = color != null ? tint(img, color) : img;
      const x = base.x + info.dx - (img.naturalWidth  || img.width)  / 2;
      const y = base.y + info.dy - (img.naturalHeight || img.height) / 2;
      ctx.drawImage(drawImg, x, y);
      if (info.pair) {
        ctx.drawImage(drawImg,
          base.x + info.pair.dx - (img.naturalWidth  || img.width)  / 2,
          base.y + info.pair.dy - (img.naturalHeight || img.height) / 2,
        );
      }
    };
    const render = (outfit) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      for (const name of order) drawPart(name, layout[name], outfit);
      previewImg.src = canvas.toDataURL("image/png");
    };
    const api = {
      default: {
        sendPacket: (packet) => {
          if (packet?.outfit) state.outfit = { ...state.outfit, ...packet.outfit };
          render(state.outfit);
        },
      },
    };

    const defaultCode = `\
const api = require("@interstellar/StellarAPI");

class StraightMod {
  constructor() {
    this.index = 0;
    this.appearance = {};
    this.colorParts = [
      "color_body","color_legs","color_feet","color_hair","color_skin",
    ];
    this.interval = null;
    this.speed = 10;
  }

  next() {
    this.index = (this.index + 1) % this.colorParts.length;
    const p = this.colorParts[this.index];
    const time = Date.now() / 25;
    const intensity = Math.round(Math.sin(0.3 * time) * 127 + 128);
    const color = (intensity << 16) | (intensity << 8) | intensity;
    this.appearance[p] = color;
    api.default.sendPacket({ type: 7, outfit: { style_hair: 1, ...this.appearance } });
  }

  start() {
    this.stop();
    this.interval = setInterval(() => {
      if (typeof Interstellar === "undefined" || !Interstellar.ingame) return;
      this.next();
    }, this.speed);
  }

  stop() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
  }
}

exports.default = StraightMod;`;
    tabsData.get(MAIN_TAB).content = defaultCode;
    codeArea.value = defaultCode;

    let autoRun = true;
    const autoRunCb = this.container.querySelector("#p-dev-autorun");
    if (autoRunCb) autoRunCb.addEventListener("change", () => { autoRun = autoRunCb.checked; });

    const showError = (msg) => {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.style.display = msg ? "block" : "none";
    };

    const updatePreview = () => {
      clearTimers(); moduleCache.clear(); clearLog(); showError("");
      const code = codeArea.value;
      const fromPath = activeTab === MAIN_TAB ? "" : activeTab;
      const g = globalThis;
      try {
        const moduleObj = { exports: {} };
        const globals = {
          undefined, NaN, Infinity,
          isNaN:g.isNaN, isFinite:g.isFinite,
          parseInt:g.parseInt, parseFloat:g.parseFloat,
          decodeURI:g.decodeURI, encodeURI:g.encodeURI,
          decodeURIComponent:g.decodeURIComponent, encodeURIComponent:g.encodeURIComponent,
          JSON:g.JSON, Math:g.Math, Date:g.Date, RegExp,
          Object, Array, String, Number, Boolean, Symbol, BigInt,
          Map, Set, WeakMap, WeakSet, WeakRef,
          Promise, Error, TypeError, RangeError, SyntaxError, ReferenceError, URIError, EvalError,
          ArrayBuffer, DataView, Proxy, Reflect,
          Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
          Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array,
          console:devConsole,
          window:g.window, document:g.document, navigator:g.navigator,
          location:g.location, history:g.history,
          performance:g.performance, crypto:g.crypto,
          fetch:g.fetch?.bind(g), XMLHttpRequest:g.XMLHttpRequest, WebSocket:g.WebSocket,
          URL:g.URL, URLSearchParams:g.URLSearchParams,
          Blob:g.Blob, File:g.File, FileReader:g.FileReader, FormData:g.FormData,
          TextEncoder:g.TextEncoder, TextDecoder:g.TextDecoder,
          AbortController:g.AbortController, AbortSignal:g.AbortSignal,
          Event:g.Event, CustomEvent:g.CustomEvent, EventTarget:g.EventTarget,
          MutationObserver:g.MutationObserver, IntersectionObserver:g.IntersectionObserver,
          ResizeObserver:g.ResizeObserver,
          localStorage:g.localStorage, sessionStorage:g.sessionStorage,
          queueMicrotask:g.queueMicrotask?.bind(g),
          structuredClone:g.structuredClone?.bind(g),
          atob:g.atob?.bind(g), btoa:g.btoa?.bind(g),
          Worker:g.Worker, Audio:g.Audio, Image:g.Image,
          requestIdleCallback:g.requestIdleCallback?.bind(g),
          cancelIdleCallback:g.cancelIdleCallback?.bind(g),
          require:(dep)=>_requireVirtual(dep, fromPath),
          module:moduleObj, exports:moduleObj.exports,
          Interstellar:{ ingame: true },
          setInterval:setIntervalMock, clearInterval:clearIntervalMock,
          setTimeout:setTimeoutMock,   clearTimeout:clearTimeoutMock,
          requestAnimationFrame:rafMock, cancelAnimationFrame:cafMock,
        };
        new Function(...Object.keys(globals), code)(...Object.values(globals));
        const mod = moduleObj.exports?.default ?? moduleObj.exports;
        if (typeof mod === "function") {
          const inst = new mod();
          if (typeof inst.start === "function") inst.start();
          if (typeof inst.next  === "function") inst.next();
          else render(state.outfit);
        } else {
          render(state.outfit);
        }
      } catch(e) {
        showError(e.message);
        devLog("error", [e.message]);
      }
    };
    codeArea.addEventListener("input", () => { if (autoRun) updatePreview(); });
    const runBtn = this.container.querySelector("#p-dev-run");
    if (runBtn) runBtn.addEventListener("click", updatePreview);
    codeArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        updatePreview();
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (activeTab !== MAIN_TAB) saveBtn?.click();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const s = codeArea.selectionStart, en = codeArea.selectionEnd;
        codeArea.value = codeArea.value.slice(0,s) + "  " + codeArea.value.slice(en);
        codeArea.selectionStart = codeArea.selectionEnd = s + 2;
        if (autoRun) updatePreview();
      }
    });

    renderTabBar(); updateSaveBtn(); updatePreview();
  }

  _updateStatsBar() {
    if (!this.container) return;
    const stats = this._getStats();
    const set = (k, label, v) => {
      const el = this.container.querySelector(`.p-stat[data-k="${k}"]`);
      if (!el) return;
      el.textContent = `${label} ${v}`;
    };
    set("total", "mods", stats.total);
    set("enabled", "on", stats.enabled);
    set("favs", "fav", stats.favs);
    set("imports", "imp", stats.imports);
  }
}

exports.default = LoaderUI;