const api = require("@interstellar/StellarAPI");

class TrafficLight {
  constructor() {
    this.enabled = true;
    this.speed = 10;
    this.changeInterval = 3000;

    this.black = 0x111111;
    this.red = 0xc91d1d;
    this.yellow = 0xd8b100;
    this.green = 0x00a82f;

    this.appearance = {};
    this.rafId = null;
    this.running = false;
    this.lastTick = 0;
  }

  getColor(now) {
    switch (Math.floor(now / this.changeInterval) % 3) {
      case 0:
        return this.red;
      case 1:
        return this.yellow;
      default:
        return this.green;
    }
  }

  tick(now) {
    if (!this.enabled) return;
    if (now - this.lastTick < this.speed) return;

    this.lastTick = now;
    const color = this.getColor(now);

    this.appearance.color_hair = this.black;
    this.appearance.color_skin = color;
    this.appearance.color_body = color;
    this.appearance.color_legs = this.black;
    this.appearance.color_feet = this.black;

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

exports.default = TrafficLight;