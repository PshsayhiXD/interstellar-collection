const api = require("@interstellar/StellarAPI");

class StraightMod {
  constructor() {
    this.speed = 16;
    this.smoothEnabled = true;
    this.smoothSpeed = 0.002;
    this.smoothWave = 0.8;
    this.smoothIntensity = 127;
    this.smoothBase = 128;
    this.appearance = {};
    this.colorParts = [
      "color_hair",
      "color_skin",
      "color_body",
      "color_legs",
      "color_feet",
    ];
    this.rafId = null;
    this.running = false;
    this.lastTick = 0;
  }

  getColor(now, index) {
    const phase = now * this.smoothSpeed + index * this.smoothWave;
    const raw = Math.round(Math.sin(phase) * this.smoothIntensity + this.smoothBase);
    const value = Math.max(0, Math.min(255, raw));
    return (value << 16) | (value << 8) | value;
  }

  tick(now) {
    if (!this.smoothEnabled) return;
    if (now - this.lastTick < this.speed) return;
    this.lastTick = now;
    for (let i = 0; i < this.colorParts.length; i += 1) {
      const part = this.colorParts[i];
      this.appearance[part] = this.getColor(now, i);
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

exports.default = StraightMod;