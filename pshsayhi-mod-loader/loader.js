const script = require("@interstellar/InterstellarScriptingMod");
const LoaderUI = require("./ui").default;
const { MODS } = require("./mods/registry");

async function checkForUpdates(
  modSlug,
  repoUser = "PshsayhiXD",
  repoName = "interstellar-collection",
) {
  try {
    let currentVersion = "0.0.0";
    try {
      const res = await fetch("./interstellar.json");
      if (res.ok) {
        const data = await res.json();
        if (data.version) currentVersion = data.version;
      }
    } catch (e) {
      console.warn("[Updater] Could not load interstellar.json.");
    }
    const releasesRes = await fetch(
      `https://api.github.com/repos/${repoUser}/${repoName}/releases`,
    );
    if (!releasesRes.ok) throw new Error("Failed to fetch releases");
    const releases = await releasesRes.json();
    const prefix = `${modSlug}-v`;
    const modReleases = releases
      .filter(
        (r) => r.tag_name?.startsWith(prefix) && !r.draft && !r.prerelease,
      )
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    if (!modReleases.length) return;
    const latestRelease = modReleases[0];
    const remoteVersion = latestRelease.tag_name.replace(prefix, "");
    if (isNewerVersion(currentVersion, remoteVersion))
      showUpdateBanner(latestRelease, remoteVersion, currentVersion);
  } catch (error) {
    console.error("[Updater] Update check failed:", error);
  }
}

const isNewerVersion = (oldV, newV) => {
  const o = oldV.split(".").map(Number);
  const n = newV.split(".").map(Number);
  for (let i = 0; i < Math.max(o.length, n.length); i++) {
    const diff = (n[i] || 0) - (o[i] || 0);
    if (diff > 0) return true;
    if (diff < 0) return false;
  }
  return false;
};

function parseMarkdown(md) {
  if (!md) return "";
  return md
    .replace(/### (.*)/g, "<h3>$1</h3>")
    .replace(/## (.*)/g, "<h2>$1</h2>")
    .replace(/# (.*)/g, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(?!\*)(.*?)\*(?!\*)/g, "<em>$1</em>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n/g, "<br>");
}

function showUpdateBanner(release, newVer, oldVer) {
  if (document.getElementById("pshsayhi-update-banner")) return;
  if (!document.getElementById("pshsayhi-update-style")) {
    const style = document.createElement("style");
    style.id = "pshsayhi-update-style";
    style.textContent = `
      @keyframes pshsayhiSlideInBottom{
        from{transform:translateY(50px);opacity:0}
        to{transform:translateY(0);opacity:1}
      }
      .pshsayhi-update-close{
        position:absolute;
        top:10px;
        right:15px;
        cursor:pointer;
        font-size:18px;
        opacity:0.7;
        transition:0.2s;
      }
      .pshsayhi-update-close:hover{opacity:1}
      .pshsayhi-update-body h1,.pshsayhi-update-body h2,.pshsayhi-update-body h3{
        margin:8px 0 4px 0;
        font-size:1.1em;
      }
      .pshsayhi-update-btn{
        display:inline-block;
        margin-top:15px;
        padding:8px 16px;
        background:linear-gradient(135deg,#6e8efb,#a777e3);
        color:white;
        text-decoration:none;
        border-radius:6px;
        font-weight:500;
        transition:0.2s;
        text-align:center;
        width:calc(100% - 32px);
        box-sizing:border-box;
        border:none;
      }
      .pshsayhi-update-btn:hover{
        box-shadow:0 0 10px rgba(167,119,227,0.6);
        transform:scale(1.02);
      }
      .pshsayhi-update-content{
        padding:20px;
      }
      .pshsayhi-update-body{
        font-size:0.9em;
        color:#ddd;
        margin-top:12px;
        max-height:150px;
        overflow-y:auto;
        border-top:1px solid rgba(255,255,255,0.1);
        padding-top:12px;
        line-height:1.4;
      }
      .pshsayhi-update-body::-webkit-scrollbar{
        width:4px;
      }
      .pshsayhi-update-body::-webkit-scrollbar-thumb{
        background:rgba(255,255,255,0.2);
        border-radius:2px;
      }
    `;
    document.head.appendChild(style);
  }
  const banner = document.createElement("div");
  banner.id = "pshsayhi-update-banner";
  banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        background: rgba(15, 15, 30, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        color: white;
        font-family: 'Inter', -apple-system, sans-serif;
        z-index: 999999;
        overflow: hidden;
        animation: pshsayhiSlideInBottom 0.4s ease-out forwards;
    `;
  const asset = release.assets?.find((a) => a.name.endsWith(".zip"));
  const downloadHtml = asset
    ? `<a href="${asset.browser_download_url}" class="pshsayhi-update-btn">Download .zip Update</a>`
    : "";
  banner.innerHTML = `
    <div class="pshsayhi-update-content">
      <span class="pshsayhi-update-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
      <div style="font-weight:600;font-size:1.2rem;color:#fff;margin-bottom:5px;">Update Available 🚀</div>
      <div style="font-size:0.9rem;color:#bbb;">Version ${oldVer} &rarr; <strong style="color:#fff;">${newVer}</strong></div>
      <div class="pshsayhi-update-body">${parseMarkdown(release.body)}</div>
      ${downloadHtml}
    </div>`;
  document.body.appendChild(banner);
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
    this.ui = new LoaderUI(this.handleModeChange.bind(this));
  }
  async load() {
    console.log("[Pshsayhi's Loader] Dynamic startup...");
    if (typeof document !== "undefined") {
      this.ui.create();
      checkForUpdates("pshsayhi-mod-loader");
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