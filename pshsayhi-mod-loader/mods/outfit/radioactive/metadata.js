exports.default = {
  id: "radioactive",
  label: "Radioactive",
  description: "A toxic green outfit.",
  author: "pshsayhi",
  version: "1.0.0",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-radiation",
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
      key: "glowSpeed",
      label: "Glow Speed",
      group: "Motion",
      type: "range",
      min: 0.001,
      max: 0.02,
      step: 0.001,
      default: 0.006
    },
    {
      key: "gradient",
      label: "Gradient Offset",
      group: "Motion",
      type: "range",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2
    },
    {
      key: "brightness",
      label: "Glow Intensity",
      group: "Visuals",
      type: "range",
      min: 0.2,
      max: 1,
      step: 0.05,
      default: 0.85
    }
  ]
};