const _VERSION = "1.0.2";

async function checkForUpdate(modSlug, repoUser = "PshsayhiXD", repoName = "interstellar-collection") {
  try {
    const last = sessionStorage.getItem("upd_check");
    if (last && Date.now() - Number(last) < 10 * 60 * 1000) return false;
    sessionStorage.setItem("upd_check", String(Date.now()));
    const res = await fetch(`https://api.github.com/repos/${repoUser}/${repoName}/releases?per_page=100&t=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!res.ok) throw new Error(`Failed to fetch releases (${res.status})`);
    const releases = await res.json();
    const slug = String(modSlug).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const extractVersion = tag => {
      const v = String(tag || "").trim();
      const patterns = [
        new RegExp(`^${slug}[-_]?v?(\\d+\\.\\d+\\.\\d+(?:[-+][^\\s]+)?)$`, "i"),
        /^v?(\d+\.\d+\.\d+(?:[-+][^\s]+)?)$/i,
        /^(\d+\.\d+\.\d+(?:[-+][^\s]+)?)$/i
      ];
      for (const p of patterns) {
        const m = v.match(p);
        if (m) return m[1];
      }
      return null;
    };
    const normalize = v =>
      String(v).replace(/^v/i, "").split("-")[0].split(".").map(n => +n || 0);
    const isNewer = (a, b) => {
      const A = normalize(a);
      const B = normalize(b);
      for (let i = 0; i < Math.max(A.length, B.length); i++) {
        const d = (B[i] || 0) - (A[i] || 0);
        if (d > 0) return true;
        if (d < 0) return false;
      }
      return false;
    };
    const matches = (Array.isArray(releases) ? releases : [])
      .map(release => ({ release, version: extractVersion(release.tag_name) }))
      .filter(({ release, version }) => version && !release.draft && !release.prerelease)
      .sort((a, b) => new Date(b.release.published_at || 0) - new Date(a.release.published_at || 0));
    if (!matches.length) return false;
    const latest = matches[0].release;
    const remoteVersion = String(matches[0].version).replace(/^v/i, "").trim();
    if (!isNewer(_VERSION, remoteVersion)) return false;
    const asset = latest.assets?.[0];
    if (!asset?.browser_download_url) {
      console.warn("[Updater] No downloadable release asset found:", latest.html_url);
      return false;
    }
    const confirmed = confirm(`A new version of ${modSlug} is available.\nCurrent: ${_VERSION}\nNew: ${remoteVersion}\n\nDownload it now?`);
    if (!confirmed) return false;
    const download = document.createElement("a");
    download.href = asset.browser_download_url;
    download.download = asset.name || "";
    download.rel = "noopener";
    document.body.appendChild(download);
    download.click();
    download.remove();
    return true;
  } catch (e) {
    console.error("[Updater] failed:", e);
    return false;
  }
}

exports.default = checkForUpdate;
exports._VERSION = _VERSION;