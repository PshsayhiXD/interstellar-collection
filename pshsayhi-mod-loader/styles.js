const STYLES = `
  @property --angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes pastelSpin {
    to { --angle: 360deg; }
  }

  #pshsayhi-loader {
    position: fixed;
    top: 60px;
    right: 20px;
    width: 360px;
    height: auto;
    max-width: 90vw;
    max-height: 90vh;
    min-width: 300px;
    min-height: 0;
    resize: both;
    display: none;
    flex-direction: column;
    box-sizing: border-box;
    border-radius: 16px;
    overflow: hidden;
    isolation: isolate;
    z-index: 999999;
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.9);
    border: 2px solid transparent;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    user-select: none;
  }
  #pshsayhi-loader[data-panel-surface="glass"] {
    background:
      linear-gradient(
        165deg,
        rgba(15, 12, 28, 0.55),
        rgba(22, 18, 42, 0.65)
      ) padding-box;
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
  }
  #pshsayhi-loader[data-panel-surface="background"] {
    background:
      linear-gradient(
        165deg,
        rgba(15, 12, 28, 0.35),
        rgba(22, 18, 42, 0.45)
      ) padding-box,
      conic-gradient(
        from var(--angle),
        hsl(285 58% 86%),
        hsl(320 55% 88%),
        hsl(350 52% 89%),
        hsl(25 58% 88%),
        hsl(45 55% 87%),
        hsl(140 48% 85%),
        hsl(175 50% 84%),
        hsl(210 52% 85%),
        hsl(245 54% 86%),
        hsl(285 58% 86%)
      ) border-box;
    background-clip: padding-box, border-box;
    animation: pastelSpin 5.5s linear infinite;
  }
  #pshsayhi-loader[data-panel-surface="background"]::after {
    content: "";
    position: absolute;
    inset: 2px;
    border-radius: 14px;
    z-index: 0;
    pointer-events: none;
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
  }
  #pshsayhi-loader > * {
    position: relative;
    z-index: 1;
  }

  #pshsayhi-loader:not(.p-collapsed) {
    min-height: 380px;
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
    min-height: 0;
    max-height: none;
    resize: none;
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
    flex: 1 1 auto;
    min-height: 0;
    max-height: calc(90vh - 48px);
    overflow: hidden;
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
    min-height: 0;
    align-self: stretch;
  }

  #p-main-col {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .p-toolbar {
    flex-shrink: 0;
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 8px 12px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .p-toolbar-group{
    display:flex;
    gap:6px;
    align-items:center;
    flex-shrink:0;
  }
  .p-tool-btn{
    width:26px;
    height:26px;
    border-radius:8px;
    border:1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.55);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    transition: transform 0.12s, background 0.15s, color 0.15s, border-color 0.15s;
    padding:0;
    flex-shrink:0;
  }
  .p-tool-btn:hover{
    background: rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.85);
    border-color: rgba(255,255,255,0.14);
  }
  .p-tool-btn:active{
    transform: translateY(1px) scale(0.98);
  }
  #pshsayhi-loader.p-dev #p-dev-toggle{
    background: rgba(167,139,250,0.18);
    border-color: rgba(167,139,250,0.35);
    color: #c4b5fd;
  }
  #p-search {
    flex: 1;
    min-width: 0;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #fff;
    padding: 5px 9px;
    font-family: inherit;
    font-size: 11px;
    outline: none;
    box-sizing: border-box;
  }
  #p-search::placeholder {
    color: rgba(255,255,255,0.35);
  }
  #p-search:focus {
    border-color: rgba(167,139,250,0.45);
    background: rgba(255,255,255,0.08);
  }
  #p-reset-config {
    flex-shrink: 0;
    border: none;
    border-radius: 6px;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.55);
    cursor: pointer;
    padding: 5px 8px;
    font-size: 10px;
    font-weight: 600;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    transition: background 0.15s, color 0.15s;
  }
  #p-reset-config:hover {
    background: rgba(167,139,250,0.2);
    color: #c4b5fd;
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
    min-height: 0;
    padding: 10px 12px 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .p-stats {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    padding:6px 12px 8px;
    border-bottom:1px solid rgba(255,255,255,0.05);
    background:rgba(255,255,255,0.02);
    flex-shrink:0;
    min-height:26px;
    transition:background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .p-stats:hover {
    background:rgba(255,255,255,0.05);
    border-bottom:1px solid rgba(255,255,255,0.1);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.08),
      0 0 12px rgba(180,140,255,0.08);
  }
  .p-stats-left{
    display:flex;
    gap:8px;
    align-items:center;
    flex-shrink:0;
  }
  .p-stat{
    font-size: 9.5px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 3px 7px;
    border-radius: 999px;
  }
  .p-feedback{
    font-size: 10px;
    color: rgba(255,255,255,0.55);
    overflow:hidden;
    white-space:nowrap;
    text-overflow:ellipsis;
    flex:1;
    text-align:right;
    min-width: 0;
  }
  .p-feedback.p-ok{ color: rgba(167,243,208,0.95); }
  .p-feedback.p-err{ color: rgba(252,165,165,0.95); }
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
  .p-mod-header:active{
    transform: translateY(1px);
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

  .p-greet{
    margin-top:auto;
    padding:10px 8px 6px;
    font-size:10px;
    font-weight:700;
    color:rgba(255,255,255,0.45);
    text-align:center;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    border-top:1px solid rgba(255,255,255,0.06);
  }
  .p-row-selected{
    outline:1px solid rgba(167,139,250,0.45);
    box-shadow:0 0 0 1px rgba(167,139,250,0.15), 0 0 14px rgba(167,139,250,0.12);
  }

  .p-fav-btn{
    width: 22px;
    height: 22px;
    border-radius: 7px;
    border: none;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.30);
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    transition: transform 0.12s, background 0.15s, color 0.15s;
    flex-shrink:0;
    padding:0;
  }
  .p-fav-btn:hover{
    background: rgba(250, 204, 21, 0.12);
    color: rgba(253, 224, 71, 0.85);
  }
  .p-fav-btn:active{ transform: translateY(1px) scale(0.98); }
  .p-mod-row.p-fav .p-fav-btn{
    background: rgba(250, 204, 21, 0.18);
    color: rgba(253, 224, 71, 0.95);
  }

  #p-panel-settings-btn:hover{
    background: rgba(167,139,250,0.18);
    color: #c4b5fd;
  }
  #pshsayhi-loader.modal-open #p-panel-settings-btn {
    transform: rotate(180deg);
  }
  #p-delete-selected-btn:hover{
    background: rgba(248, 113, 113, 0.18);
    color: #fca5a5;
  }

  #p-sidebar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }
  #p-sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }

  .p-greet {
    margin-top: auto;
    padding: 10px 8px 6px;
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.45);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .p-mod-dev{
    display:none;
    margin-top: 2px;
    font-size: 9px;
    color: rgba(255,255,255,0.35);
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
  #pshsayhi-loader.p-dev .p-mod-dev{ display:block; }

  .p-modal{
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 10;
    padding: 16px;
  }
  .p-modal-card{
    width: min(320px, 100%);
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 18px 50px rgba(0,0,0,0.55);
    padding: 12px 12px 10px;
  }
  .p-modal-title{
    font-weight: 800;
    font-size: 12px;
    letter-spacing: -0.01em;
    color: rgba(255,255,255,0.9);
    margin-bottom: 6px;
  }
  .p-modal-body{
    font-size: 10.5px;
    color: rgba(255,255,255,0.65);
    line-height: 1.35;
    margin-bottom: 10px;
  }
  .p-modal-actions{
    display:flex;
    justify-content:flex-end;
    gap: 8px;
  }
  .p-modal-btn{
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.75);
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    cursor:pointer;
    transition: transform 0.12s, background 0.15s, border-color 0.15s;
  }
  .p-modal-btn:hover{
    background: rgba(255,255,255,0.10);
    border-color: rgba(255,255,255,0.16);
  }
  .p-modal-btn:active{ transform: translateY(1px) scale(0.99); }
  .p-modal-btn.p-primary{
    background: rgba(167,139,250,0.18);
    border-color: rgba(167,139,250,0.35);
    color: #c4b5fd;
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
  .p-mod-row.p-expanded .p-mod-desc {
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

  .p-mod-collapse-btn {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.3);
    transition: transform 0.2s, color 0.2s;
    border-radius: 6px;
  }
  .p-mod-collapse-btn:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.6);
  }
  .p-mod-row.p-expanded .p-mod-collapse-btn {
    transform: rotate(180deg);
  }

  .p-mod-body {
    display: none;
    flex-direction: column;
    padding: 0 11px 10px;
    gap: 8px;
    border-top: 1px solid rgba(255,255,255,0.03);
    animation: rowSlideIn 0.3s ease-out;
  }
  .p-mod-row.p-expanded .p-mod-body {
    display: flex;
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
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 220px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 2px;
  }
  .p-dev-section {
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    overflow: hidden;
  }
  .p-dev-section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 600;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 6px 10px;
    cursor: pointer;
    user-select: none;
    list-style: none;
    background: rgba(255,255,255,0.02);
    transition: color 0.15s, background 0.15s;
  }
  .p-dev-section-title:hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.04); }
  .p-dev-section-title::-webkit-details-marker { display: none; }
  .p-dev-section-title::after {
    content: "\f078";
    font-family: "Font Awesome 5 Free";
    font-weight: 900;
    font-size: 8px;
    margin-left: auto;
    transition: transform 0.2s;
  }
  .p-dev-section[open] > .p-dev-section-title::after { transform: rotate(180deg); }
  .p-dev-section[open] > .p-dev-section-title { color: rgba(255,255,255,0.55); }
  .p-dev-section-body { padding: 8px; display: flex; flex-direction: column; gap: 8px; }

  .p-config-item { display: flex; flex-direction: column; gap: 4px; }
  .p-config-item.p-config-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 2px 0;
  }

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
    font-size: 16px;
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

  #ML-toast-host {
    position: absolute;
    top: 10px;
    left: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none;
    z-index: 20;
  }
  .ML-toast {
    pointer-events: auto;
    position: relative;
    width: 25%;
    min-width: 140px;
    max-width: 220px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-family: "Plus Jakarta Sans", system-ui, sans-serif;
    font-weight: 600;
    line-height: 1.35;
    color: rgba(255,255,255,0.92);
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(22px) saturate(180%);
    -webkit-backdrop-filter: blur(22px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.10);
    box-shadow: 0 12px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
    transition: opacity 0.2s ease, transform 0.2s ease;
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
  }
  .ML-toast.ML-toast-show {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  .ML-toast::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 999px;
  }
  .ML-toast-ok::before { background: #10b981; }
  .ML-toast-err::before { background: #ef4444; }
  .ML-toast-warn::before { background: #f59e0b; }
  .ML-toast-info::before { background: #a78bfa; }
  .ML-toast-content {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .p-dev-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px;
    background: rgba(0,0,0,0.2);
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .p-dev-top {
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: flex-start;
  }
  .p-dev-preview {
    flex-shrink: 0;
    width: 70px;
    height: 130px;
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .p-dev-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .p-dev-sidebar {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .p-dev-import-row {
    display: flex;
    flex-direction: row;
    gap: 6px;
  }
  .p-dev-imp-btn {
    flex: 1;
    font-size: 10px;
    padding: 4px 7px;
    background: rgba(167,139,250,0.12);
    border: 1px solid rgba(167,139,250,0.25);
    border-radius: 6px;
    color: #a78bfa;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: inherit;
  }
  .p-dev-imp-btn:hover { background: rgba(167,139,250,0.22); }
  .p-dev-imp-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .p-dev-tree {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
    align-content: flex-start;
    min-height: 24px;
    max-height: 86px;
    overflow-y: auto;
  }
  .p-dev-tree-empty {
    font-size: 9px;
    color: rgba(255,255,255,0.2);
    font-style: italic;
    align-self: center;
  }
  .p-dev-tree-folder {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 9px;
    padding: 2px 5px;
    background: rgba(250,200,100,0.1);
    border: 1px solid rgba(250,200,100,0.2);
    border-radius: 4px;
    color: rgba(250,200,100,0.75);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: default;
    flex-basis: 100%;
  }
  .p-dev-tree-file {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 9px;
    padding: 2px 5px;
    background: rgba(167,139,250,0.08);
    border: 1px solid rgba(167,139,250,0.15);
    border-radius: 4px;
    color: rgba(167,139,250,0.7);
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }
  .p-dev-tree-file:hover {
    background: rgba(167,139,250,0.18);
    border-color: rgba(167,139,250,0.35);
    color: #c4b5fd;
  }
  .p-dev-tree-file.p-dev-tree-open {
    border-style: dashed;
  }
  .p-dev-tree-nested { margin-left: 8px; }
  .p-dev-tabs {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 2px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding-bottom: 2px;
    min-height: 26px;
    align-items: flex-end;
  }
  .p-dev-tabs::-webkit-scrollbar { display: none; }
  .p-dev-tab {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 5px 5px 0 0;
    background: rgba(255,255,255,0.04);
    border: 1px solid transparent;
    border-bottom: none;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    user-select: none;
    transition: background 0.1s, color 0.1s;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    max-width: 120px;
  }
  .p-dev-tab:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
  .p-dev-tab.p-dev-tab-active {
    background: rgba(167,139,250,0.15);
    border-color: rgba(167,139,250,0.3);
    color: #c4b5fd;
  }
  .p-dev-tab-name {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    cursor: pointer;
  }
  .p-dev-tab-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #a78bfa;
    flex-shrink: 0;
  }
  .p-dev-tab-x {
    flex-shrink: 0;
    font-size: 8px;
    color: rgba(255,255,255,0.3);
    padding: 1px 2px;
    border-radius: 3px;
    cursor: pointer;
    line-height: 1;
  }
  .p-dev-tab-x:hover { color: #f87171; background: rgba(248,113,113,0.15); }
  .p-dev-code-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .p-dev-run-btn {
    flex: unset;
    width: auto;
    padding: 4px 10px;
    background: rgba(74,222,128,0.14);
    border-color: rgba(74,222,128,0.3);
    color: #4ade80;
  }
  .p-dev-run-btn:hover { background: rgba(74,222,128,0.25); }
  .p-dev-autorun-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }
  .p-dev-autorun-label input { cursor: pointer; accent-color: #a78bfa; }
  #p-dev-save-file { flex: unset; width: auto; }
  .p-dev-error {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 10px;
    color: #f87171;
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 6px;
    padding: 5px 8px;
    word-break: break-all;
  }
  .p-dev-code {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 11px;
    width: 100%;
    height: 160px;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 0 0 8px 8px;
    color: #c4b5fd;
    padding: 10px;
    outline: none;
    resize: vertical;
    box-sizing: border-box;
    tab-size: 2;
    caret-color: #a78bfa;
  }
  .p-dev-code:focus { border-color: rgba(167,139,250,0.35); }
  .p-dev-log-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .p-dev-log-title {
    font-size: 9px;
    color: rgba(255,255,255,0.25);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  #p-dev-clear-log { flex: unset; width: auto; padding: 2px 6px; font-size: 9px; }
  .p-dev-log {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 10px;
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 6px;
    padding: 6px 8px;
    max-height: 80px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .p-dev-log-entry {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    line-height: 1.4;
    word-break: break-all;
  }
  .p-dev-log-entry i { margin-top: 2px; flex-shrink: 0; font-size: 8px; }
  .p-dev-log-log   { color: rgba(255,255,255,0.55); }
  .p-dev-log-warn  { color: #fbbf24; }
  .p-dev-log-error { color: #f87171; }
`;

exports.STYLES = STYLES;