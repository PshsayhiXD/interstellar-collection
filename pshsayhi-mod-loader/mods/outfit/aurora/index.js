const api = require("@interstellar/StellarAPI");

class Aurora {
  constructor() {
    this.enabled = true;
    this.speed = 10;
    this.flowSpeed = 0.0015;
    this.waveOffset = 0.8;
    this.colors = [
      0x00ff88,
      0x00d9ff,
      0x4b7cff,
      0x8b5cff,
      0x00ff88
    ];
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
    const phase = now * this.flowSpeed + index * this.waveOffset;
    const pos = ((Math.sin(phase) + 1) / 2) * (this.colors.length - 1);
    const a = Math.floor(pos);
    const b = Math.min(a + 1, this.colors.length - 1);
    return this.lerpColor(this.colors[a], this.colors[b], pos - a);
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

exports.default = Aurora;