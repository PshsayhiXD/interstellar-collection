exports.default = {
  id: "trafficlight",
  label: "Traffic Light",
  description: "red yellow green.",
  author: "pshsayhi",
  version: "1.0.0",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fa-traffic-light",
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
      key: "changeInterval",
      label: "Change Interval",
      group: "Animation",
      type: "range",
      min: 500,
      max: 10000,
      step: 100,
      unit: "ms",
      default: 3000
    }
  ]
};