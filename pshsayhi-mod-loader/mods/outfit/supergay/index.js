const api = require("@interstellar/StellarAPI");

class superGay {
  constructor() {
    this.ms = 10;
    this.waveSpeed = 0.3;
    this.step = 0.8;
    this.hueSpeed = 0.0008;
    this.saturation = 1;
    this.value = 1;
    this.amplitude = 0.18;
    this.colorParts = [
      "color_hair",
      "color_skin",
      "color_body",
      "color_legs",
      "color_feet"
    ];
    this.intervalId = null;
  }

  start() {
    this.stop();
    this.intervalId = setInterval(() => {
      const t = Date.now() * 0.001 * this.waveSpeed * 6.28318;
      const baseHue = (Date.now() * this.hueSpeed) % 1;
      const appearance = {};
      for (let i = 0; i < this.colorParts.length; i++) {
        const wave = Math.sin(t + i * this.step) * 0.5 + 0.5;
        const hue = (baseHue + wave * this.amplitude) % 1;
        appearance[this.colorParts[i]] = this.hsvToRgb(
          hue,
          this.saturation,
          this.value
        );
      }
      api.default.sendPacket({
        type: 7,
        outfit: {
          style_hair: 1,
          ...appearance
        }
      });
    }, this.ms);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
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
    return (
      (Math.round(r * 255) << 16) |
      (Math.round(g * 255) << 8) |
      Math.round(b * 255)
    );
  }
}

exports.default = superGay;