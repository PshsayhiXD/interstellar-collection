const api = require("@interstellar/StellarAPI");

class Magma {
  constructor() {
    this.enabled = true;
    this.speed = 10;
    this.flowInterval = 350;
    this.rock = 0x101010;
    this.core = 0xffd24d;
    this.hot = 0xff7a00;
    this.lava = 0xd43b00;
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

  tick(now) {
    if (!this.enabled) return;
    if (now - this.lastTick < this.speed) return;
    this.lastTick = now;
    const head = Math.floor(now / this.flowInterval) % this.colorParts.length;
    for (let i = 0; i < this.colorParts.length; i++) {
      const d = (i - head + this.colorParts.length) % this.colorParts.length;
      this.appearance[this.colorParts[i]] =
        d === 0 ? this.core :
        d === 1 ? this.hot :
        d === 2 ? this.lava :
        this.rock;
    }
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

exports.default = Magma;