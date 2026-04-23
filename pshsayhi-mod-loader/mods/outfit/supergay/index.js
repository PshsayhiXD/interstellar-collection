const api = require("@interstellar/StellarAPI");

class SuperGayMod {
  constructor() {
    this.appearance = {};
    this.colorParts = [
      "color_body",
      "color_legs",
      "color_feet",
      "color_hair",
      "color_skin",
    ];
    this.interval = null;
    this.speed = 85;
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

  start() {
    this.stop();
    let partIndex = 0;
    let hue = 0;
    this.interval = setInterval(() => {
      if (typeof Interstellar === 'undefined' || !Interstellar.ingame) return;
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
    }, this.speed);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

exports.default = SuperGayMod;
