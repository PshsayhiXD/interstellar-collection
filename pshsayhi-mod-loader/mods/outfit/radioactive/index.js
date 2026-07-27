const api = require("@interstellar/StellarAPI");

class Radioactive {
  constructor() {
    this.enabled = true;
    this.speed = 10;
    this.glowSpeed = 0.006;
    this.gradient = 0.2;
    this.brightness = 0.85;
    this.green = 0x007a22;
    this.white = 0xb8d8b8;
    this.appearance = {};
    this.colorParts = [
      "color_hair",
      "color_skin",
      "color_body",
      "color_legs",
      "color_feet"
    ];
    this.rafId = null;
    this.running = false;
    this.lastTick = 0;
  }

  lerpColor(a, b, t) {
    const ar = (a >> 16) & 255;
    const ag = (a >> 8) & 255;
    const ab = a & 255;
    const br = (b >> 16) & 255;
    const bg = (b >> 8) & 255;
    const bb = b & 255;
    return (
      (Math.round(ar + (br - ar) * t) << 16) |
      (Math.round(ag + (bg - ag) * t) << 8) |
      Math.round(ab + (bb - ab) * t)
    );
  }

  getColor(now, index) {
    const phase = now * this.glowSpeed + index * this.gradient;
    const glow = Math.pow((Math.sin(phase) + 1) / 2, 1.8);
    return this.lerpColor(
      this.green,
      this.white,
      glow * this.brightness
    );
  }

  tick(now) {
    if (!this.enabled) return;
    if (now - this.lastTick < this.speed) return;
    this.lastTick = now;
    for (let i = 0; i < this.colorParts.length; i++)
      this.appearance[this.colorParts[i]] = this.getColor(now, i);
    api.default.sendPacket({
      type: 7,
      outfit: {
        style_hair: 1,
        ...this.appearance
      }
    });
  }

  start() {
    this.stop();
    this.running = true;
    this.lastTick = 0;
    const loop = (now) => {
      if (!this.running) return;
      if (typeof Interstellar !== "undefined" && Interstellar.ingame) this.tick(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}

exports.default = Radioactive;