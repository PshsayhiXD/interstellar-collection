exports.default = {
  id: "galaxy",
  label: "Galaxy",
  description: "A drifting nebula with shimmering stars.",
  author: "pshsayhi",
  version: "1.0.0",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-star",
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
      key: "gradient",
      label: "Gradient Offset",
      group: "Animation",
      type: "range",
      min: 0.1,
      max: 2,
      step: 0.1,
      default: 0.9
    },
    {
      key: "twinkle",
      label: "Enable Twinkle",
      group: "Stars",
      type: "checkbox",
      default: true
    },
    {
      key: "twinkleChance",
      label: "Twinkle Chance",
      group: "Stars",
      type: "range",
      min: 0.001,
      max: 0.02,
      step: 0.001,
      default: 0.004
    }
  ]
};