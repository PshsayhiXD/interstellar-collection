exports.default = {
  id: "magma",
  label: "Magma",
  description: "Molten lava.",
  author: "pshsayhi",
  version: "1.0.0",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-fire",
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
      key: "flowInterval",
      label: "Flow Interval",
      group: "Animation",
      type: "range",
      min: 100,
      max: 2000,
      step: 50,
      unit: "ms",
      default: 350
    },
    {
      key: "rock",
      label: "Rock Color",
      group: "Colors",
      type: "color",
      default: "#101010"
    },
    {
      key: "core",
      label: "Core Color",
      group: "Colors",
      type: "color",
      default: "#ffd24d"
    },
    {
      key: "hot",
      label: "Hot Lava Color",
      group: "Colors",
      type: "color",
      default: "#ff7a00"
    },
    {
      key: "lava",
      label: "Lava Color",
      group: "Colors",
      type: "color",
      default: "#d43b00"
    }
  ]
};