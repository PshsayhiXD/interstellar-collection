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
        <button id="p-hide-btn"     class="p-titlebar-btn" title="Ghost mode"><i class="fas fa-eye-slash"></i></button>
        <button id="p-collapse-btn" type="button" class="p-titlebar-btn" title="Collapse" aria-expanded="true"><i class="fas fa-chevron-up"></i></button>
        <button id="p-close-btn"    class="p-titlebar-btn" title="Close"><i class="fas fa-xmark"></i></button>
      </div>
    </div>
    <div id="p-body">
      <nav id="p-sidebar"></nav>
      <div id="p-main-col">
        <div class="p-toolbar">
          <input id="p-search" type="search" placeholder="Filter mods…" autocomplete="off" />
          <button id="p-reset-config" type="button" title="Reset all mod options to defaults">Reset</button>
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

  const sidebar = panel.querySelector("#p-sidebar");
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

    sec.mods.forEach(mod => {
      const row = document.createElement("div");
      row.className           = "p-mod-row";
      row.dataset.modId       = mod.id;
      row.dataset.sectionKey  = sec.key;
      row.dataset.sectionType = sec.type;

      let configHtml = "";
      if (mod.config && mod.config.length > 0) {
        const items = mod.config.map(cfg => {
          const val = configState[mod.id][cfg.key];
          let inputHtml = "";
          let itemClass = "p-config-item";

          switch(cfg.type) {
            case "range":
              inputHtml = `
                <div class="p-config-label">
                  ${cfg.label}
                  <span class="p-config-value" data-mod="${mod.id}" data-cfg="${cfg.key}">${val}${cfg.unit || 'ms'}</span>
                </div>
                <input class="p-range p-config-input" type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${val}" data-mod="${mod.id}" data-cfg="${cfg.key}" />
              `;
              break;
            case "checkbox":
              itemClass += " p-config-row";
              inputHtml = `
                <div class="p-config-label">${cfg.label}</div>
                <label class="p-switch">
                  <input type="checkbox" class="p-config-input" data-mod="${mod.id}" data-cfg="${cfg.key}" ${val ? 'checked' : ''}>
                  <span class="p-slider"></span>
                </label>
              `;
              break;
            default:
              inputHtml = `
                <div class="p-config-label">${cfg.label}</div>
                <input type="${cfg.type}" class="p-input p-config-input" placeholder="${cfg.placeholder || ''}" value="${val}" data-mod="${mod.id}" data-cfg="${cfg.key}" />
              `;
          }
          return `<div class="${itemClass}">${inputHtml}</div>`;
        }).join("");
        configHtml = `<div class="p-config">${items}</div>`;
      }

      const iconHtml = mod.iconPath 
        ? `<img class="p-mod-img" data-path="${mod.iconPath}" data-mod-id="${mod.id}" src="" style="display:none;" />`
        : `<i class="fas ${mod.icon}"></i>`;

      row.innerHTML = `
        <button class="p-mod-header" data-mod-id="${mod.id}" data-section-key="${sec.key}" data-section-type="${sec.type}">
          <div class="p-mod-icon">${iconHtml}</div>
          <div class="p-mod-info">
            <span class="p-mod-name">${mod.label}</span>
            ${mod.description ? `<div class="p-mod-desc">${mod.description}</div>` : ''}
            ${mod.id !== 'off' ? `<div class="p-mod-meta">v${mod.version || '1.0.0'} by ${mod.author || 'unknown'} • ${mod.licenseName || 'Mod'}</div>` : ''}
          </div>
          <span class="p-status">off</span>
        </button>
        ${configHtml}
      `;

      pane.appendChild(row);
    });

    content.appendChild(pane);
  });

  return panel;
}

exports.buildPanel = buildPanel;
