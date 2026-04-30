exports.default = {
  id: "straight",
  label: "Straight Mod",
  description: "Straighty.",
  author: "pshsayhi",
  version: "1.0.1",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-mars",
  entryPoint: "index.js",
  type: "exclusive",
  section: "outfit",
  licenseName: "MIT",
  licensePath: "LICENSE",
  config: [
    {
      key: "smoothEnabled",
      label: "Enable Smooth Animation",
      group: "Animation",
      type: "checkbox",
      default: true
    },
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
      key: "smoothSpeed",
      label: "Wave Movement Speed",
      group: "Motion",
      type: "range",
      min: 0.0005,
      max: 0.01,
      step: 0.0005,
      default: 0.002
    },
    {
      key: "smoothWave",
      label: "Wave Spacing",
      group: "Motion",
      type: "range",
      min: 0.1,
      max: 2,
      step: 0.1,
      default: 0.8
    },
    {
      key: "smoothIntensity",
      label: "Wave Strength",
      group: "Visuals",
      type: "range",
      min: 10,
      max: 127,
      step: 1,
      default: 127
    },
    {
      key: "smoothBase",
      label: "Base Color Level",
      group: "Visuals",
      type: "range",
      min: 0,
      max: 255,
      step: 1,
      default: 128
    }
  ]
};