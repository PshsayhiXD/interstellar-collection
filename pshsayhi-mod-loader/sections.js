const { MODS } = require("./mods/registry");

const SECTIONS_MAP = {
  outfit: {
    label: "Outfit",
    icon:  "fa-shirt",
    type:  "exclusive"
  },
  extras: {
    label: "Extras",
    icon:  "fa-puzzle-piece",
    type:  "toggle"
  }
};

function getSections() {
  const sections = [];
  for (const [key, config] of Object.entries(SECTIONS_MAP)) {
    sections.push({
      key,
      ...config,
      mods: []
    });
  }
  MODS.forEach(item => {
    const meta = item.metadata;
    const sec = sections.find(s => s.key === meta.section);
    if (sec) {
      sec.mods.push({
        id:    meta.id,
        label: meta.label,
        description: meta.description,
        author: meta.author,
        version: meta.version,
        licenseName: meta.licenseName,
        licensePath: meta.licensePath,
        icon:  meta.icon,
        iconPath: meta.iconPath,
        config: meta.config || []
      });
    }
  });
  const outfit = sections.find(s => s.key === "outfit");
  if (outfit) {
    outfit.mods.push({
      id:    "off",
      label: "Disable Styles",
      description: "Reverts to default appearance.",
      icon:  "fa-ban",
      config: []
    });
  }

  return sections;
}

exports.SECTIONS = getSections();
