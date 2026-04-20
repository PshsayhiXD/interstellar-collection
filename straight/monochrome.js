const script = require("@interstellar/InterstellarScriptingMod");
const api = require("@interstellar/StellarAPI");

let _monochromeMs = 10;
// or set to 10 for the extremely straight mode
// or set to 10 for the extremely straight mode
// or set to 85 for less gay
// or set to 85 for less gay

Object.defineProperty(window, "monochromeMs", {
  get: () => _monochromeMs,
  set: (v) => {
    _monochromeMs = v;
    instance?.restart();
  },
});

let instance;

class straight extends script.default {
  constructor() {
    super(...arguments);
    this.index = 0;
    this.appearance = {};
    this.colorParts = [
      "color_body",
      "color_legs",
      "color_feet",
      "color_hair",
      "color_skin",
    ];
    this.i = null;
  }

  async load() {
    instance = this;
    this.restart();
  }

  restart() {
    clearInterval(this.i);
    this.i = setInterval(() => {
      if (!Interstellar.ingame) return;
      const time = Date.now() / 25;
      const v = Math.round(Math.sin(0.3 * time) * 127 + 128);
      const intColor = (v << 16) | (v << 8) | v;

      this.appearance[this.colorParts[this.index]] = intColor;
      this.index = (this.index + 1) % this.colorParts.length;

      api.default.sendPacket({
        type: 7,
        outfit: {
          style_hair: 1,
          ...this.appearance,
        },
      });
    }, _monochromeMs);
  }
}

exports.default = straight;