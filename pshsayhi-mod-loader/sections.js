const { MODS } = require("./mods/registry");

const SECTIONS_MAP = {
  outfit: {
    label: "Outfit",
    icon:  "",
    type:  "exclusive"
  },
  extras: {
    label: "Extras",
    icon:  "",
    type:  "toggle"
  },
  modpack: {
    label: "Modpacks",
    icon:  "fa-box-open",
    type:  "toggle"
  },
  dev: {
    label: "Dev",
    icon:  "fa-terminal",
    type:  "toggle"
  }
};

function getSections(extraMetas = []) {
  const sections = [];
  const seen = new Set();

  for (const [key, config] of Object.entries(SECTIONS_MAP)) {
    sections.push({
      key,
      ...config,
      mods: []
    });
  }

  const pushMod = (secKey, mod) => {
    if (!secKey || !mod?.id) return;
    const id = String(mod.id);
    if (seen.has(id)) return;
    seen.add(id);
    const sec = sections.find((s) => s.key === secKey);
    if (!sec) return;
    sec.mods.push(mod);
  };

Object.values(MODS).flat().forEach((item) => {
    const meta = item.metadata;
    pushMod(meta.section || "extras", {
      id: meta.id,
      label: meta.label,
      description: meta.description,
      author: meta.author,
      version: meta.version,
      licenseName: meta.licenseName,
      licensePath: meta.licensePath,
      icon: meta.icon || "fa-question-circle",
      iconPath: meta.iconPath,
      customHtml: meta.customHtml,
      source: "built-in",
      config: meta.config || []
    });
  });

  (extraMetas || []).forEach((meta) => {
    if (!meta || !meta.id) return;
    // Mods imported as part of a modpack always go to the modpack section
    const secKey = meta.source === "modpack" ? "modpack" : (meta.section || "extras");
    pushMod(secKey, {
      id: meta.id,
      label: meta.label || meta.id,
      description: meta.description,
      author: meta.author,
      version: meta.version,
      licenseName: meta.licenseName,
      licensePath: meta.licensePath,
      icon: meta.icon || "fa-question-circle",
      iconPath: meta.iconPath,
      customHtml: meta.customHtml,
      source: meta.source || "imported",
      config: meta.config || []
    });
  });

  const outfit = sections.find((s) => s.key === "outfit");
  if (outfit && !seen.has("off")) {
    outfit.mods.push({
      id: "off",
      label: "Disable Styles",
      description: "Reverts to default outfit.",
      icon: "fa-ban",
      source: "built-in",
      config: []
    });
  }

  return sections;
}

exports.getSections = getSections;
exports.SECTIONS = getSections();