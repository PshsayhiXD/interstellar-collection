exports.default = {
  id: "aurora",
  label: "Aurora",
  description: "Flowing ribbons of vibrant aurora colors.",
  author: "pshsayhi",
  version: "1.0.0",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-magic",
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
      key: "flowSpeed",
      label: "Flow Speed",
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
    }
  ]
};