exports.default = {
  "id": "purplewave",
  "label": "Purple Wave Mode",
  "description": "Lookin's all nice and purple",
  "author": "pshsayhi",
  "version": "1.0.0",
  "homeUrl": "https://github.com/PshsayhiXD/interstellar-collection",
  "icon": "fa-wave-polygon",
  "entryPoint": "index.js",
  "type": "exclusive",
  "section": "outfit",
  "licenseName": "MIT",
  "licensePath": "LICENSE",
  "config": [
    {
      "key": "speed",
      "label": "Speed (ms)",
      "group": "Interval",
      "type": "range",
      "min": 10,
      "max": 200,
      "step": 5,
      "unit": "ms",
      "default": 85
    }
  ]
};
