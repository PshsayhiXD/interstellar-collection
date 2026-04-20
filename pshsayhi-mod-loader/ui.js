const { SECTIONS }   = require("./sections");
const { STYLES }     = require("./styles");
const { buildPanel } = require("./panel");

class LoaderUI {
  constructor(onModeChange) {
    this.onModeChange     = onModeChange;
    this.container        = null;
    this.isDragging       = false;
    this.dragOffset       = { x: 0, y: 0 };
    this.activeSectionIdx = 0;
    this.isCollapsed      = false;
    this.isHidden         = false;

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
    this._updateUI();
    this._loadIcons();
    this._injectOpenButton();
    
    const { checkForUpdates } = require('./updateChecker');
    checkForUpdates('pshsayhi-mod-loader');
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



  _setupEvents() {
    this.container.querySelector("#p-sidebar").addEventListener("click", e => {
      const cat = e.target.closest(".p-cat");
      if (!cat) return;
      this.activeSectionIdx = parseInt(cat.dataset.idx);
      this._syncTabs();
    });

    this.container.querySelector("#p-close-btn").addEventListener("click", () => {
      this.container.style.display = "none";
    });

    this.container.querySelector("#p-collapse-btn").addEventListener("click", () => {
      this.isCollapsed = !this.isCollapsed;
      this.container.classList.toggle("p-collapsed", this.isCollapsed);
      const icon = this.container.querySelector("#p-collapse-btn i");
      icon.className = this.isCollapsed ? "fas fa-chevron-down" : "fas fa-chevron-up";
    });

    this.container.querySelector("#p-hide-btn").addEventListener("click", () => {
      this.isHidden = !this.isHidden;
      this.container.classList.toggle("p-ghost", this.isHidden);
      const icon = this.container.querySelector("#p-hide-btn i");
      icon.className = this.isHidden ? "fas fa-eye" : "fas fa-eye-slash";
    });

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
          val = parseInt(input.value);
          // Update display value
          const display = this.container.querySelector(`.p-config-value[data-mod="${mod}"][data-cfg="${cfg}"]`);
          if (display) {
            // Re-fetch mod config for unit (or just assume existing content's structure)
            const unit = display.textContent.replace(/[0-9.-]/g, '');
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

    const titlebar = this.container.querySelector("#p-titlebar");
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
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    });

    window.addEventListener("resize", () => {
      if (!this.container || this.container.style.display === "none") return;
      const rect = this.container.getBoundingClientRect();
      const maxX = window.innerWidth - this.container.offsetWidth;
      const maxY = window.innerHeight - this.container.offsetHeight;
      const x = Math.max(0, Math.min(rect.left, maxX));
      const y = Math.max(0, Math.min(rect.top, maxY));
      if (x !== rect.left || y !== rect.top) {
        this.container.style.left  = x + "px";
        this.container.style.top   = y + "px";
        this.container.style.right = "auto";
      }
    });
  }

  _syncTabs() {
    this.container.querySelectorAll(".p-cat").forEach(el => {
      el.classList.toggle("p-cat-active", parseInt(el.dataset.idx) === this.activeSectionIdx);
    });
    this.container.querySelectorAll(".p-pane").forEach(el => {
      el.classList.toggle("p-pane-active", parseInt(el.dataset.idx) === this.activeSectionIdx);
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
      });
      container.insertBefore(btn, container.firstChild);
    };

    inject();
    const observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

exports.default = LoaderUI;
