const api = require("@interstellar/StellarAPI");

class PurpleWaveMod {
  constructor() {
    this.speed = 16;
    this.hueBase = 0.78;
    this.hueRange = 0.08;
    this.hueSpeed = 0.0015;
    this.waveSpread = 0.9;
    this.saturation = 0.9;
    this.value = 1;
    this.appearance = {};
    this.colorParts = [
      "color_body",
      "color_legs",
      "color_feet",
      "color_hair",
      "color_skin",
    ];
    this.running = false;
    this.rafId = null;
    this.lastTick = 0;
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
    return (Math.round(r * 255) << 16) |
           (Math.round(g * 255) << 8) |
           Math.round(b * 255);
  }

  update(now) {
    if (now - this.lastTick < this.speed) return;
    this.lastTick = now;
    for (let i = 0; i < this.colorParts.length; i++) {
      const part = this.colorParts[i];
      const phase = now * this.hueSpeed + i * this.waveSpread;
      const hue = this.hueBase + Math.sin(phase) * this.hueRange;
      this.appearance[part] = this.hsvToRgb(
        hue,
        this.saturation,
        this.value
      );
    }
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
    this.running = true;
    this.lastTick = 0;
    const loop = (now) => {
      if (!this.running) return;
      if (typeof Interstellar !== "undefined" && Interstellar.ingame) this.update(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}

exports.default = PurpleWaveMod;