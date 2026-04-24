function renderConfigGroups(config, modId, configState) {
  const groups = new Map();

  (config || []).forEach((cfg) => {
    const key = cfg.group || "General";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cfg);
  });

  return [...groups.entries()]
    .map(([groupName, items], idx) => {
      const body = items
        .map((cfg) => {
          const val = configState?.[modId]?.[cfg.key];
          let inputHtml = "";
          let itemClass = "p-config-item";

          switch (cfg.type) {
            case "range":
              inputHtml = `
                <div class="p-config-label">
                  ${cfg.label}
                  <span class="p-config-value" data-mod="${modId}" data-cfg="${cfg.key}">${val}${cfg.unit || "ms"}</span>
                </div>
                <input class="p-range p-config-input" type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${val}" data-mod="${modId}" data-cfg="${cfg.key}" />
              `;
              break;
            case "checkbox":
              itemClass += " p-config-row";
              inputHtml = `
                <div class="p-config-label">${cfg.label}</div>
                <label class="p-switch">
                  <input type="checkbox" class="p-config-input" data-mod="${modId}" data-cfg="${cfg.key}" ${val ? "checked" : ""}>
                  <span class="p-slider"></span>
                </label>
              `;
              break;
            default:
              inputHtml = `
                <div class="p-config-label">${cfg.label}</div>
                <input type="${cfg.type}" class="p-input p-config-input" placeholder="${cfg.placeholder || ""}" value="${val}" data-mod="${modId}" data-cfg="${cfg.key}" />
              `;
          }

          return `<div class="${itemClass}">${inputHtml}</div>`;
        })
        .join("");

      return `
        <details class="p-config-group" ${idx === 0 ? "open" : ""}>
          <summary class="p-config-group-title">${groupName}</summary>
          <div class="p-config-group-body">${body}</div>
        </details>
      `;
    })
    .join("");
}

function buildPanel(sections, configState) {
  const panel = document.createElement("div");
  panel.id = "pshsayhi-loader";
  panel.innerHTML = `
    <div id="p-titlebar">
      <div class="p-brand">
        <div class="p-logo"><i class="fas fa-layer-group"></i></div>
        <span class="p-name">Mods Manager</span>
        <span class="p-version">v2</span>
      </div>
      <div style="display:flex;gap:4px;align-items:center;">
        <button id="p-panel-settings-btn" class="p-titlebar-btn" title="Customize panel"><i class="fas fa-cog"></i></button>
        <button id="p-hide-btn" class="p-titlebar-btn" title="Ghost mode"><i class="fas fa-eye-slash"></i></button>
        <button id="p-collapse-btn" type="button" class="p-titlebar-btn" title="Collapse" aria-expanded="true"><i class="fas fa-chevron-up"></i></button>
        <button id="p-close-btn" class="p-titlebar-btn" title="Close"><i class="fas fa-xmark"></i></button>
      </div>
    </div>
    <div id="p-body">
      <nav id="p-sidebar">
        <div id="p-sidebar-nav"></div>
        <div id="p-greet" class="p-greet"></div>
      </nav>
      <div id="p-main-col">
        <div class="p-toolbar">
          <input id="p-search" type="search" placeholder="Filter mods…" autocomplete="off" />
          <div class="p-toolbar-group">
            <input id="p-import-input" type="file" accept=".zip" style="display:none;" />
            <button id="p-folder-btn" type="button" class="p-tool-btn" title="Import a mod folder"><i class="fas fa-folder"></i></button>
            <button id="p-import-btn" type="button" class="p-tool-btn" title="Import a .zip mod package"><i class="fas fa-download"></i></button>
            <button id="p-enable-all" type="button" class="p-tool-btn" title="Enable all mods in this tab"><i class="fas fa-check"></i></button>
            <button id="p-disable-all" type="button" class="p-tool-btn" title="Disable all mods in this tab"><i class="fas fa-times"></i></button>
            <button id="p-toggle-all" type="button" class="p-tool-btn" title="Toggle all mods in this tab"><i class="fas fa-toggle-on"></i></button>
            <button id="p-delete-selected-btn" type="button" class="p-tool-btn" title="Delete selected imported mod"><i class="fas fa-trash"></i></button>
            <button id="p-dev-toggle" type="button" class="p-tool-btn" title="Dev / debug mode"><i class="fas fa-code"></i></button>
          </div>
          <button id="p-reset-config" type="button" title="Reset all mod options to defaults">Reset</button>
        </div>
        <div id="p-stats" class="p-stats">
          <div class="p-stats-left">
            <span class="p-stat" data-k="total">Total Mods: 0</span>
            <span class="p-stat" data-k="enabled">Enabled Mods: 0</span>
            <span class="p-stat" data-k="favs">Favorite Mods: 0</span>
            <span class="p-stat" data-k="imports">Custom Mods: 0</span>
          </div>
        </div>
        <div id="p-content"></div>
      </div>
    </div>
    <div id="p-update-banner" style="display:none;">
      <div class="p-banner-header">
        <div class="p-banner-title"><i class="fas fa-gift"></i> Update v<span id="p-update-version"></span></div>
        <button id="p-update-download">Download .zip</button>
      </div>
      <div id="p-changelog" class="p-changelog"></div>
    </div>
  `;

  const sidebar = panel.querySelector("#p-sidebar-nav");
  const content = panel.querySelector("#p-content");

  sections.forEach((sec, idx) => {
    const cat = document.createElement("div");
    cat.className   = "p-cat" + (idx === 0 ? " p-cat-active" : "");
    cat.dataset.idx = idx;
    cat.innerHTML   = `<i class="fas ${sec.icon}"></i><span>${sec.label}</span>`;
    sidebar.appendChild(cat);

    const pane = document.createElement("div");
    pane.className      = "p-pane" + (idx === 0 ? " p-pane-active" : "");
    pane.dataset.idx    = idx;
    pane.dataset.secKey  = sec.key;
    pane.dataset.secType = sec.type;

    if (sec.key === 'dev') {
      const devCard = document.createElement("div");
      devCard.className = "p-dev-card";
      devCard.innerHTML = `
        <div class="p-dev-preview">
          <img id="p-dev-img" src="" alt="Preview" />
        </div>
        <textarea id="p-dev-code" class="p-dev-code" spellcheck="false" placeholder="Enter JS code here..."></textarea>
      `;
      pane.appendChild(devCard);
    } else {
      sec.mods.forEach(mod => {
        const row = document.createElement("div");
        row.className           = "p-mod-row";
        row.dataset.modId       = mod.id;
        row.dataset.sectionKey  = sec.key;
        row.dataset.sectionType = sec.type;
        row.dataset.source      = mod.source || "built-in";
        row.dataset.version     = mod.version || "1.0.0";

        const configHtml = mod.config && mod.config.length > 0
          ? `<div class="p-config">${renderConfigGroups(mod.config, mod.id, configState)}</div>`
          : "";

        const iconHtml = mod.iconPath
          ? `<img class="p-mod-img" data-path="${mod.iconPath}" data-mod-id="${mod.id}" data-source="${mod.source || 'built-in'}" src="" style="display:none;" />`
          : `<i class="fas ${mod.icon}"></i>`;

        if (mod.customHtml) {
          row.innerHTML = mod.customHtml;
        } else {
          row.innerHTML = `
            <div class="p-mod-header" data-mod-id="${mod.id}" data-section-key="${sec.key}" data-section-type="${sec.type}">
              ${mod.id !== 'off' ? `<button class="p-fav-btn" type="button" title="Favorite" data-fav-id="${mod.id}"><i class="fas fa-star"></i></button>` : ''}
              <span class="p-status">off</span>
              <div class="p-mod-icon">${iconHtml}</div>
              <div class="p-mod-info">
                <span class="p-mod-name">${mod.label}</span>
                ${mod.description ? `<div class="p-mod-desc">${mod.description}</div>` : ''}
                ${mod.id !== 'off' ? `<div class="p-mod-meta">v${mod.version || '1.0.0'} by ${mod.author || 'unknown'} • ${mod.licenseName || 'Mod'}</div>` : ''}
                ${mod.id !== 'off' ? `<div class="p-mod-dev">id: <span>${mod.id}</span> • src: <span>${mod.source || 'built-in'}</span></div>` : ''}
              </div>
              ${mod.id !== 'off' ? `<div class="p-mod-collapse-btn"><i class="fas fa-chevron-down"></i></div>` : ''}
            </div>
            <div class="p-mod-body">
              ${configHtml}
            </div>
          `;
        }

        pane.appendChild(row);
      });
    }

    content.appendChild(pane);
  });

  return panel;
}

exports.buildPanel = buildPanel;