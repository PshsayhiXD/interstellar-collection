const STYLES = `
  #pshsayhi-loader {
    position: fixed;
    top: 60px;
    right: 20px;
    width: 360px;
    height: 440px;
    max-width: 90vw;
    max-height: 90vh;
    min-width: 300px;
    min-height: 380px;
    resize: both;
    display: none;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    z-index: 999999;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.9);
    background: rgba(15, 12, 28, 0.65);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.15);
    box-shadow:
      0 16px 40px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.12);
    user-select: none;
  }

  #p-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px 10px 12px;
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    cursor: move;
    flex-shrink: 0;
  }
  #p-titlebar .p-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  #p-titlebar .p-logo {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #fff;
    flex-shrink: 0;
  }
  #p-titlebar .p-name {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: -0.01em;
  }
  #p-titlebar .p-version {
    font-size: 10px;
    font-weight: 500;
    color: rgba(255,255,255,0.35);
    margin-left: 4px;
  }
  .p-titlebar-btn {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: none;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: background 0.15s, color 0.15s;
    padding: 0;
  }
  #p-close-btn:hover {
    background: rgba(248, 113, 113, 0.25);
    color: #fca5a5;
  }
  #p-hide-btn:hover {
    background: rgba(250, 204, 21, 0.18);
    color: #fde047;
  }
  #p-collapse-btn:hover {
    background: rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.8);
  }
  #pshsayhi-loader.p-collapsed #p-body {
    display: none;
  }
  #pshsayhi-loader.p-collapsed {
    height: auto;
  }
  #pshsayhi-loader.p-ghost {
    opacity: 0.12;
    transition: opacity 0.25s ease;
  }
  #pshsayhi-loader.p-ghost:hover {
    opacity: 0.55;
  }
  #pshsayhi-loader.p-ghost #p-body {
    pointer-events: none;
  }

  #p-body {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  #p-sidebar {
    width: 88px;
    flex-shrink: 0;
    padding: 10px 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-right: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.12);
    overflow-y: auto;
  }
  .p-cat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 6px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    color: rgba(255,255,255,0.4);
    border: 1px solid transparent;
  }
  .p-cat i {
    font-size: 14px;
  }
  .p-cat span {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: center;
    line-height: 1.2;
  }
  .p-cat:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.7);
  }
  .p-cat.p-cat-active {
    background: rgba(167,139,250,0.18);
    border-color: rgba(167,139,250,0.3);
    color: #c4b5fd;
  }

  #p-content {
    flex: 1;
    padding: 12px 12px 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  #p-content::-webkit-scrollbar { width: 4px; }
  #p-content::-webkit-scrollbar-track { background: transparent; }
  #p-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.12);
    border-radius: 4px;
  }

  .p-pane { display: none; flex-direction: column; gap: 6px; width: 100%; }
  .p-pane.p-pane-active { display: flex; }

  @keyframes rowSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .p-mod-row {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    animation: rowSlideIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
  .p-mod-row:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }
  .p-mod-row.p-row-active {
    border-color: rgba(167,139,250,0.6);
    background: rgba(167,139,250,0.1);
    box-shadow: 0 0 15px rgba(167,139,250,0.15);
    transform: translateY(0);
  }
  .p-mod-row.p-row-active[data-section-type="toggle"] {
    border-color: rgba(52, 211, 153, 0.6);
    background: rgba(52, 211, 153, 0.08);
    box-shadow: 0 0 15px rgba(52, 211, 153, 0.15);
    transform: translateY(0);
  }

  .p-mod-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 11px;
    cursor: pointer;
    box-sizing: border-box;
    background: transparent;
    border: none;
    color: inherit;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    transition: background 0.12s;
  }
  .p-mod-header:hover { background: rgba(255,255,255,0.04); }

  .p-mod-icon {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: rgba(255,255,255,0.07);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .p-row-active .p-mod-icon {
    background: rgba(167,139,250,0.25);
    color: #c4b5fd;
  }
  .p-row-active[data-section-type="toggle"] .p-mod-icon {
    background: rgba(74,222,128,0.2);
    color: #4ade80;
  }

  .p-mod-img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    border-radius: 4px;
  }

  .p-mod-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    min-width: 0;
    padding-right: 8px;
    text-align: left;
  }

  .p-mod-name {
    color: rgba(255,255,255,0.75);
    transition: color 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    font-size: 12px;
    font-weight: 600;
  }
  .p-row-active .p-mod-name { color: rgba(255,255,255,0.95); }

  .p-mod-desc {
    font-size: 10px;
    color: rgba(255,255,255,0.55);
    line-height: 1.35;
    margin-top: 2px;
    margin-bottom: 3px;
    word-wrap: break-word;
    font-weight: 400;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.3s;
  }
  .p-mod-row:hover .p-mod-desc {
    -webkit-line-clamp: unset;
    color: rgba(255,255,255,0.85);
  }
  .p-mod-meta {
    font-size: 9px;
    color: rgba(255,255,255,0.25);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .p-status {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 99px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.25);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    flex-shrink: 0;
  }
  .p-row-active .p-status {
    background: rgba(167,139,250,0.25);
    color: #c4b5fd;
    transform: scale(1.05);
  }
  .p-row-active[data-section-type="toggle"] .p-status {
    background: rgba(74,222,128,0.2);
    color: #4ade80;
    transform: scale(1.05);
  }

  .p-config {
    padding: 0 11px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    display: none;
  }
  .p-row-active .p-config { display: flex; }

  .p-config-item { display: flex; flex-direction: column; gap: 4px; }
  .p-config-item.p-config-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 2px 0;
  }

  /* Toggle Switch */
  .p-switch {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
    flex-shrink: 0;
  }
  .p-switch input { opacity: 0; width: 0; height: 0; }
  .p-slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(255,255,255,0.1);
    transition: .3s;
    border-radius: 18px;
  }
  .p-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 2px;
    bottom: 2px;
    background-color: rgba(255,255,255,0.8);
    transition: .3s;
    border-radius: 50%;
  }
  input:checked + .p-slider { background-color: #8b5cf6; box-shadow: 0 0 10px rgba(139, 92, 246, 0.4); }
  input:checked + .p-slider:before { transform: translateX(14px); background-color: #fff; }

  /* Generic Inputs */
  .p-input {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #fff;
    padding: 4px 8px;
    font-family: inherit;
    font-size: 11px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    width: 100%;
    box-sizing: border-box;
  }
  .p-input:focus {
    border-color: rgba(167,139,250,0.5);
    background: rgba(255,255,255,0.1);
  }
  .p-input[type="color"] {
    padding: 2px;
    height: 24px;
    cursor: pointer;
  }
  .p-input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }

  .p-config-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    font-weight: 600;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .p-config-label .p-config-value {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.65);
    text-transform: none;
    letter-spacing: 0;
  }

  .p-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,0.1);
    outline: none;
    cursor: pointer;
  }
  .p-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #a78bfa;
    box-shadow: 0 0 0 3px rgba(167,139,250,0.2);
    cursor: pointer;
    transition: box-shadow 0.15s;
  }
  .p-range::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 5px rgba(167,139,250,0.25);
  }
  .p-range::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #a78bfa;
    border: none;
    cursor: pointer;
  }

  #p-update-banner {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    background: rgba(52, 211, 153, 0.1);
    border-top: 1px solid rgba(52, 211, 153, 0.3);
    box-shadow: 0 -4px 20px rgba(52, 211, 153, 0.08);
    flex-shrink: 0;
    max-height: 150px;
    animation: rowSlideIn 0.5s ease-out forwards;
  }
  .p-banner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .p-banner-title {
    font-size: 11px;
    font-weight: 700;
    color: #a7f3d0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  #p-update-download {
    background: #10b981;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
    transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
  }
  #p-update-download:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
  }
  .p-changelog {
    font-size: 9.5px;
    color: rgba(255,255,255,0.7);
    line-height: 1.4;
    overflow-y: auto;
    max-height: 80px;
    padding-right: 4px;
    word-wrap: break-word;
    font-family: inherit;
  }
  .p-changelog::-webkit-scrollbar { width: 3px; }
  .p-changelog::-webkit-scrollbar-track { background: transparent; }
  .p-changelog::-webkit-scrollbar-thumb {
    background: rgba(52, 211, 153, 0.3);
    border-radius: 4px;
  }
`;

exports.STYLES = STYLES;
