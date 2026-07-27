exports.default = {
  id: "bubbleclick",
  label: "Bubble Click",
  description: "Spawns floating bubbles whenever you click.",
  author: "pshsayhi",
  version: "1.0.0",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-tint",
  entryPoint: "index.js",
  type: "toggle",
  section: "extras",
  licenseName: "MIT",
  licensePath: "LICENSE",
  config: [
    {
      key: "count",
      label: "Bubble Count",
      group: "General",
      type: "range",
      min: 1,
      max: 30,
      step: 1,
      default: 10
    },
    {
      key: "minSize",
      label: "Minimum Size",
      group: "Appearance",
      type: "range",
      min: 4,
      max: 24,
      step: 1,
      unit: "px",
      default: 10
    },
    {
      key: "maxSize",
      label: "Maximum Size",
      group: "Appearance",
      type: "range",
      min: 8,
      max: 48,
      step: 1,
      unit: "px",
      default: 22
    },
    {
      key: "rise",
      label: "Rise Distance",
      group: "Animation",
      type: "range",
      min: 50,
      max: 400,
      step: 10,
      unit: "px",
      default: 160
    },
    {
      key: "spread",
      label: "Spawn Spread",
      group: "Animation",
      type: "range",
      min: 0,
      max: 150,
      step: 5,
      unit: "px",
      default: 50
    },
    {
      key: "lifetime",
      label: "Lifetime",
      group: "Animation",
      type: "range",
      min: 500,
      max: 5000,
      step: 100,
      unit: "ms",
      default: 1800
    }
  ]
};