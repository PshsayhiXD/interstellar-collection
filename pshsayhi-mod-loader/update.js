const _VERSION = "1.2.0";

async function checkForUpdates(ui, modSlug, repoUser = "PshsayhiXD", repoName = "interstellar-collection") {
  try {
    const last = sessionStorage.getItem("upd_check");
    if (last && Date.now() - last < 10 * 60 * 1000) return;
    sessionStorage.setItem("upd_check", Date.now());
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
      .map(r => ({ release: r, version: extractVersion(r.tag_name) }))
      .filter(x => x.version && !x.release.draft && !x.release.prerelease)
      .sort((a, b) => new Date(b.release.published_at || 0) - new Date(a.release.published_at || 0));
    if (!matches.length) return ui?._renderUpdateBanner?.(null);
    const latest = matches[0].release;
    const remoteVersion = String(matches[0].version).replace(/^v/i, "").trim();
    if (isNewer(_VERSION, remoteVersion)) {
      ui?._renderUpdateBanner?.({
        release: latest,
        newVer: remoteVersion,
        oldVer: _VERSION
      });
    } else ui?._renderUpdateBanner?.(null);
  } catch (e) {
    console.error("[Updater] failed:", e);
    ui?._renderUpdateBanner?.(null);
  }
}

exports.default = checkForUpdates;
exports._VERSION = _VERSION;