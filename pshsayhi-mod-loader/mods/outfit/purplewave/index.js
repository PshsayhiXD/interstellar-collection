const api = require("@interstellar/StellarAPI");

class PurpleWaveMod {
  constructor() {
    this.index = 0;
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
    return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
  }

  next() {
    this.index = (this.index + 1) % this.colorParts.length;
    const p = this.colorParts[this.index];
    const time = Date.now() / 300;
    const base = 0.78;
    const range = 0.08;
    const hue = base + Math.sin(time) * range;
    const color = this.hsvToRgb(hue, 0.9, 1);
    this.appearance[p] = color;
    api.default.sendPacket({
      type: 7,
      outfit: {
        style_hair: 1,
        ...this.appearance,
      },
    });
  }

  start() {
    this.stop();
    this.interval = setInterval(() => {
      if (typeof Interstellar === "undefined" || !Interstellar.ingame) return;
      this.next();
    }, this.speed);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

exports.default = PurpleWaveMod;