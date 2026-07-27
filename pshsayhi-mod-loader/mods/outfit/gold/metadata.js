exports.default = {
  id: "gold",
  label: "Gold",
  description: "A polished gold outfit with a shimmering metallic reflection.",
  author: "pshsayhi",
  version: "1.0.0",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-coins",
  entryPoint: "index.js",
  type: "exclusive",
  section: "outfit",
  licenseName: "MIT",
  licensePath: "LICENSE",
  config: [
    {
      key: "enabled",
      label: "Enable Animation",
      group: "Animation",
      type: "checkbox",
      default: true
    },
    {
      key: "speed",
      label: "Update Delay",
      group: "Performance",
      type: "range",
      min: 5,
      max: 100,
      step: 1,
      unit: "ms",
      default: 10
    },
    {
      key: "shimmerSpeed",
      label: "Shimmer Speed",
      group: "Animation",
      type: "range",
      min: 0.0002,
      max: 0.005,
      step: 0.0001,
      default: 0.0015
    },
    {
      key: "waveOffset",
      label: "Wave Offset",
      group: "Animation",
      type: "range",
      min: 0.1,
      max: 2,
      step: 0.1,
      default: 0.8
    },
    {
      key: "shadow",
      label: "Shadow Color",
      group: "Colors",
      type: "color",
      default: "#120d00"
    },
    {
      key: "dark",
      label: "Dark Gold",
      group: "Colors",
      type: "color",
      default: "#2d2000"
    },
    {
      key: "gold",
      label: "Gold Color",
      group: "Colors",
      type: "color",
      default: "#6b5200"
    },
    {
      key: "highlight",
      label: "Highlight Color",
      group: "Colors",
      type: "color",
      default: "#ffd54a"
    }
  ]
};