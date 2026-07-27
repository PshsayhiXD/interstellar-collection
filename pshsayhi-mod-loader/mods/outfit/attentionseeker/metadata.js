exports.default = {
  id: "attentionseeker",
  label: "Attendtion Seeker",
  description: "gay afl.",
  author: "pshsayhi",
  version: "1.0.0",
  homeUrl: "https://github.com/PshsayhiXD/interstellar-collection",
  icon: "fas fa-adjust",
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
      key: "swapSpeed",
      label: "Swap Interval",
      group: "Animation",
      type: "range",
      min: 100,
      max: 1000,
      step: 25,
      unit: "ms",
      default: 350
    },
    {
      key: "smooth",
      label: "Smooth Transition",
      group: "Animation",
      type: "checkbox",
      default: false
    }
  ]
};