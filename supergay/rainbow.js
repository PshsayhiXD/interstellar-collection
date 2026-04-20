const script = require("@interstellar/InterstellarScriptingMod");
const api = require("@interstellar/StellarAPI");
let _rainbowMs = 85;
Object.defineProperty(window, "rainbowMs", {
  get: () => _rainbowMs,
  set: (v) => {
    _rainbowMs = v;
    instance?.restart();
  },
});
let instance;
class straight extends script.default {
  constructor() {
    super(...arguments);
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

  hsvToRgb(h, s, v) {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r, g, b;
    if (i % 6 === 0) [r, g, b] = [v, t, p];
    else if (i % 6 === 1) [r, g, b] = [q, v, p];
    else if (i % 6 === 2) [r, g, b] = [p, v, t];
    else if (i % 6 === 3) [r, g, b] = [p, q, v];
    else if (i % 6 === 4) [r, g, b] = [t, p, v];
    else [r, g, b] = [v, p, q];
    const R = Math.round(r * 255);
    const G = Math.round(g * 255);
    const B = Math.round(b * 255);
    return (R << 16) | (G << 8) | B;
  }

  async load() {
    instance = this;
    this.restart();
  }

  restart() {
    clearInterval(this.i);
    let partIndex = 0;
    let hue = 0;
    this.i = setInterval(() => {
      if (!Interstellar.ingame) return;
      const p = this.colorParts[partIndex];
      this.appearance[p] = this.hsvToRgb(hue, 0.35, 1);
      partIndex = (partIndex + 1) % this.colorParts.length;
      hue = (hue + 0.05) % 1;
      api.default.sendPacket({
        type: 7,
        outfit: {
          style_hair: 1,
          ...this.appearance,
        },
      });
    }, _rainbowMs);
  }
}
exports.default = straight;
