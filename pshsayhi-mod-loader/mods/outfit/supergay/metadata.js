exports.default = {
  id: "supergay",
  label: "Rainbow Mod",
  description: "im gay",
  author: "pshsayhi",
  version: "1.1.1",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-rainbow",
  entryPoint: "index.js",
  type: "exclusive",
  section: "outfit",
  licenseName: "MIT",
  licensePath: "LICENSE",
  config: [
    {
      key: "ms",
      label: "Update Delay (Smoothness)",
      group: "Performance",
      type: "range",
      min: 10,
      max: 100,
      step: 1,
      unit: "ms",
      default: 10
    },
    {
      key: "waveSpeed",
      label: "Wave Movement Speed",
      group: "Motion",
      type: "range",
      min: 0.05,
      max: 1.5,
      step: 0.05,
      default: 0.3
    },
    {
      key: "step",
      label: "Wave Spacing (Body Flow)",
      group: "Motion",
      type: "range",
      min: 0.1,
      max: 2,
      step: 0.05,
      default: 0.8
    },
    {
      key: "hueSpeed",
      label: "Rainbow Rotation Speed",
      group: "Color",
      type: "range",
      min: 0.0005,
      max: 0.01,
      step: 0.0005,
      default: 0.0008
    },
    {
      key: "amplitude",
      label: "Wave Color Intensity",
      group: "Color",
      type: "range",
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.18
    },
    {
      key: "saturation",
      label: "Color Saturation",
      group: "Color",
      type: "range",
      min: 0,
      max: 1,
      step: 0.01,
      default: 1
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