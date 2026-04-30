exports.default = {
  id: "purplewave",
  label: "Purple Wave Mod",
  description: "Made with love for \"longgay\".",
  author: "pshsayhi",
  version: "1.0.1",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-wave-square",
  entryPoint: "index.js",
  type: "exclusive",
  section: "outfit",
  licenseName: "MIT",
  licensePath: "LICENSE",
  config: [
    {
      key: "speed",
      label: "Update Delay (Smoothness)",
      group: "Performance",
      type: "range",
      min: 10,
      max: 100,
      step: 1,
      unit: "ms",
      default: 16
    },
    {
      key: "hueSpeed",
      label: "Wave Movement Speed",
      group: "Motion",
      type: "range",
      min: 0.0005,
      max: 0.01,
      step: 0.0005,
      default: 0.0015
    },
    {
      key: "waveSpread",
      label: "Wave Spacing",
      group: "Motion",
      type: "range",
      min: 0.1,
      max: 2,
      step: 0.1,
      default: 0.9
    },
    {
      key: "hueRange",
      label: "Color Variation Range",
      group: "Color",
      type: "range",
      min: 0.01,
      max: 0.2,
      step: 0.01,
      default: 0.08
    },
    {
      key: "saturation",
      label: "Color Saturation",
      group: "Color",
      type: "range",
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.9
    },
    {
      key: "value",
      label: "Brightness",
      group: "Color",
      type: "range",
      min: 0,
      max: 1,
      step: 0.01,
      default: 1
    }
  ]
};