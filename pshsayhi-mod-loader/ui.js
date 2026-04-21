const { SECTIONS }   = require("./sections");
const { STYLES }     = require("./styles");
const { buildPanel } = require("./panel");

const LAYOUT_SESSION_KEY = "pshsayhi-mod-loader-layout";

function parsePx(val) {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val.replace(/px$/i, ""));
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

class LoaderUI {
  constructor(onModeChange) {
    this.onModeChange     = onModeChange;
    this.container        = null;
    this.isDragging       = false;
    this.dragOffset       = { x: 0, y: 0 };
    this.activeSectionIdx = 0;
    this.isCollapsed      = false;
    this.isHidden         = false;
    this._layoutSaveTimer = null;
    this._layoutObserver  = null;
    this._onDocKeydown    = null;
    this._heightPxBeforeCollapse = null;

    // state[sectionKey] = active mod id        (exclusive)
    // state[modId]      = boolean              (toggle)
    // configState[modId][key] = value
    this.state       = {};
    this.configState = {};

    SECTIONS.forEach(sec => {
      if (sec.type === "exclusive") {
        this.state[sec.key] = sec.mods[sec.mods.length - 1].id;
        // default = last (off)
      }
      sec.mods.forEach(mod => {
        if (sec.type === "toggle") this.state[mod.id] = false;
        this.configState[mod.id] = {};
        (mod.config || []).forEach(cfg => {
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

  create() {
    if (this.container) return;
    this._injectStyles();
    this.container = buildPanel(SECTIONS, this.configState);
    document.body.appendChild(this.container);
    this._setupEvents();
    this._restoreLayout();
    this._updateUI();
    this._loadIcons();
    this._injectOpenButton();
  }

  async _loadIcons() {
    const images = this.container.querySelectorAll(".p-mod-img");
    for (const img of images) {
      const { path, modId } = img.dataset;
      try {
        const fullPath = `./mods/${modId}/${path}`;
        const resp = await fetch(fullPath);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        img.src = URL.createObjectURL(blob);
        img.style.display = "block";
      } catch (e) {
        console.warn(`[Pshsayhi's Loader] Failed to load icon for mod '${modId}' at '${path}':`, e.message);
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
      this.container.style.left  = x + "px";
      this.container.style.top   = y + "px";
      this.container.style.right = "auto";
    }
  }

  _saveLayout() {
    if (!this.container) return;
    try {
      const c = this.container;
      if (c.style.display === "none" || this.isCollapsed || c.classList.contains("p-collapsed")) return;
      const rect = c.getBoundingClientRect();
      const left = parsePx(c.style.left);
      const top = parsePx(c.style.top);
      const payload = {
        left: left != null ? left : rect.left,
        top: top != null ? top : rect.top,
        width: rect.width,
        height: rect.height,
      };
      sessionStorage.setItem(LAYOUT_SESSION_KEY, JSON.stringify(payload));
    } catch (e) {
      /* quota / private mode */
    }
  }

  _scheduleLayoutSave() {
    clearTimeout(this._layoutSaveTimer);
    this._layoutSaveTimer = setTimeout(() => this._saveLayout(), 250);
  }

  _restoreLayout() {
    if (!this.container) return;
    try {
      const raw = sessionStorage.getItem(LAYOUT_SESSION_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      let left = parsePx(data.left);
      let top = parsePx(data.top);
      const width = parsePx(data.width);
      const height = parsePx(data.height);
      if (left == null || top == null) return;
      const maxW = window.innerWidth * 0.9;
      const maxH = window.innerHeight * 0.9;
      if (width != null && width >= 300) {
        this.container.style.width = Math.min(width, maxW) + "px";
      }
      if (height != null && height > 0) {
        this.container.style.height = Math.min(height, maxH) + "px";
      }
      this.container.style.left = left + "px";
      this.container.style.top = top + "px";
      this.container.style.right = "auto";
      this._clampPosition();
    } catch (e) {
      /* invalid JSON */
    }
  }

  _syncCollapseChevron() {
    const btn = this.container.querySelector("#p-collapse-btn");
    const icon = btn && btn.querySelector("i");
    if (icon) icon.className = this.isCollapsed ? "fas fa-chevron-down" : "fas fa-chevron-up";
    if (btn) btn.setAttribute("aria-expanded", this.isCollapsed ? "false" : "true");
  }

  _syncHideIcon() {
    const btn = this.container.querySelector("#p-hide-btn");
    const icon = btn && btn.querySelector("i");
    if (icon) icon.className = this.isHidden ? "fas fa-eye" : "fas fa-eye-slash";
  }

  _toggleCollapsed() {
    // When layout restore sets inline height, it overrides `.p-collapsed { height: auto }`.
    // So we clear inline height on collapse, and restore it on expand.
    if (!this.isCollapsed) {
      this._heightPxBeforeCollapse = this.container.style.height || null;
      this.container.style.removeProperty("height");
    } else if (this._heightPxBeforeCollapse) {
      this.container.style.height = this._heightPxBeforeCollapse;
    }

    this.isCollapsed = !this.isCollapsed;
    this.container.classList.toggle("p-collapsed", this.isCollapsed);
    this._syncCollapseChevron();
  }

  _applySearchFilter() {
    const input = this.container.querySelector("#p-search");
    const q = ((input && input.value) || "").trim().toLowerCase();
    const pane = this.container.querySelector(".p-pane.p-pane-active");
    if (!pane) return;
    pane.querySelectorAll(".p-mod-row").forEach(row => {
      const name = row.querySelector(".p-mod-name")?.textContent || "";
      const desc = row.querySelector(".p-mod-desc")?.textContent || "";
      const hay = (name + " " + desc).toLowerCase();
      row.style.display = !q || hay.includes(q) ? "" : "none";
    });
  }

  _onSectionTabChange() {
    const input = this.container.querySelector("#p-search");
    if (input) input.value = "";
    this._applySearchFilter();
  }

  _refreshConfigInputs() {
    this.container.querySelectorAll(".p-config-input").forEach(input => {
      const { mod, cfg } = input.dataset;
      if (!mod || !cfg || !this.configState[mod]) return;
      const val = this.configState[mod][cfg];
      if (input.type === "checkbox") {
        input.checked = !!val;
      } else if (input.type === "range") {
        input.value = String(val);
        const display = this.container.querySelector(`.p-config-value[data-mod="${mod}"][data-cfg="${cfg}"]`);
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
    SECTIONS.forEach(sec => {
      sec.mods.forEach(mod => {
        (mod.config || []).forEach(cfg => {
          const prev = this.configState[mod.id][cfg.key];
          const def = cfg.default;
          if (prev === def) return;
          this.configState[mod.id][cfg.key] = def;
          this.onModeChange("config", { id: mod.id, key: cfg.key, value: def });
        });
      });
    });
    this._refreshConfigInputs();
  }

  _setupEvents() {
    this.container.querySelector("#p-sidebar").addEventListener("click", e => {
      const cat = e.target.closest(".p-cat");
      if (!cat) return;
      this.activeSectionIdx = parseInt(cat.dataset.idx, 10);
      this._syncTabs();
      this._onSectionTabChange();
    });

    this.container.querySelector("#p-close-btn").addEventListener("click", () => {
      this.container.style.display = "none";
    });

    this.container.querySelector("#p-collapse-btn").addEventListener("click", () => {
      this._toggleCollapsed();
    });

    this.container.querySelector("#p-hide-btn").addEventListener("click", () => {
      this.isHidden = !this.isHidden;
      this.container.classList.toggle("p-ghost", this.isHidden);
      this._syncHideIcon();
    });

    const titlebar = this.container.querySelector("#p-titlebar");
    titlebar.addEventListener("dblclick", e => {
      if (e.target.closest(".p-titlebar-btn")) return;
      this._toggleCollapsed();
    });

    const search = this.container.querySelector("#p-search");
    if (search) {
      search.addEventListener("input", () => this._applySearchFilter());
    }

    this.container.querySelector("#p-reset-config").addEventListener("click", () => {
      this._resetConfigDefaults();
    });

    this._onDocKeydown = e => {
      if (e.key !== "Escape" || !this.container) return;
      if (this.container.style.display === "none") return;
      this.container.style.display = "none";
    };
    document.addEventListener("keydown", this._onDocKeydown);

    this.container.querySelectorAll(".p-mod-header").forEach(btn => {
      btn.addEventListener("click", () => {
        const { modId, sectionKey, sectionType } = btn.dataset;
        if (sectionType === "exclusive") {
          this.state[sectionKey] = modId;
          this.onModeChange(sectionKey, modId);
        } else {
          this.state[modId] = !this.state[modId];
          this.onModeChange(sectionKey, { id: modId, active: this.state[modId] });
        }
        this._updateUI();
      });
    });

    this.container.querySelectorAll(".p-config-input").forEach(input => {
      const update = () => {
        const { mod, cfg } = input.dataset;
        let val;

        if (input.type === "checkbox") {
          val = input.checked;
        } else if (input.type === "range") {
          val = parseInt(input.value, 10);
          const display = this.container.querySelector(`.p-config-value[data-mod="${mod}"][data-cfg="${cfg}"]`);
          if (display) {
            const unit = display.textContent.replace(/[0-9.-]/g, "");
            display.textContent = val + unit;
          }
        } else {
          val = input.value;
        }

        this.configState[mod][cfg] = val;
        this.onModeChange("config", { id: mod, key: cfg, value: val });
      };

      const eventType = (input.type === "checkbox" || input.type === "color" || input.type === "date") ? "change" : "input";
      input.addEventListener(eventType, update);
    });

    titlebar.addEventListener("mousedown", e => {
      if (e.target.closest(".p-titlebar-btn")) return;
      this.isDragging   = true;
      this.dragOffset.x = e.clientX - this.container.offsetLeft;
      this.dragOffset.y = e.clientY - this.container.offsetTop;
      const onMove = e => {
        if (!this.isDragging) return;

        let x = e.clientX - this.dragOffset.x;
        let y = e.clientY - this.dragOffset.y;

        const maxX = window.innerWidth - this.container.offsetWidth;
        const maxY = window.innerHeight - this.container.offsetHeight;

        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        this.container.style.left  = x + "px";
        this.container.style.top   = y + "px";
        this.container.style.right = "auto";
      };
      const onUp = () => {
        this.isDragging = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
        this._scheduleLayoutSave();
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    });

    window.addEventListener("resize", () => {
      if (!this.container || this.container.style.display === "none") return;
      this._clampPosition();
    });

    if (typeof ResizeObserver !== "undefined") {
      this._layoutObserver = new ResizeObserver(() => {
        if (!this.container || this.container.style.display === "none") return;
        if (this.isCollapsed || this.container.classList.contains("p-collapsed")) return;
        this._scheduleLayoutSave();
      });
      this._layoutObserver.observe(this.container);
    }
  }

  _syncTabs() {
    this.container.querySelectorAll(".p-cat").forEach(el => {
      el.classList.toggle("p-cat-active", parseInt(el.dataset.idx, 10) === this.activeSectionIdx);
    });
    this.container.querySelectorAll(".p-pane").forEach(el => {
      el.classList.toggle("p-pane-active", parseInt(el.dataset.idx, 10) === this.activeSectionIdx);
    });
  }

  _updateUI() {
    this.container.querySelectorAll(".p-mod-row").forEach(row => {
      const { modId, sectionKey, sectionType } = row.dataset;
      const isActive = sectionType === "exclusive"
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
      btn.id        = "ML-open-btn";
      btn.className = "btn-small";
      btn.innerHTML = '<i class="fas fa-layer-group"></i> Mod Loader';
      btn.addEventListener("click", () => {
        const hidden = !this.container.style.display || this.container.style.display === "none";
        this.container.style.display = hidden ? "flex" : "none";
        if (hidden) this._clampPosition();
      });
      container.insertBefore(btn, container.firstChild);
    };

    inject();
    const observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

exports.default = LoaderUI;
