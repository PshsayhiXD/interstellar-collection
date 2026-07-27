const api = require("@interstellar/StellarAPI");

class Galaxy {
  constructor() {
    this.enabled = true;
    this.speed = 10;
    this.flowSpeed = 0.0015;
    this.gradient = 0.9;
    this.twinkle = true;
    this.twinkleChance = 0.004;

    this.colors = [
      0x050510,
      0x16163d,
      0x37206b,
      0x5a2fa8,
      0x9b6cff
    ];

    this.star = 0xd7caff;

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
    this.starPart = -1;
    this.starUntil = 0;
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
    const pos = (now * this.flowSpeed + index * this.gradient) % this.colors.length;

    const a = Math.floor(pos);
    const b = (a + 1) % this.colors.length;
    const t = pos - a;

    return this.lerpColor(
      this.colors[a],
      this.colors[b],
      t
    );
  }

  tick(now) {
    if (!this.enabled) return;
    if (now - this.lastTick < this.speed) return;
    this.lastTick = now;
    if (this.twinkle && now > this.starUntil && Math.random() < this.twinkleChance) {
      this.starPart = Math.floor(Math.random() * this.colorParts.length);
      this.starUntil = now + 120;
    }
    if (now > this.starUntil) this.starPart = -1;
    for (let i = 0; i < this.colorParts.length; i++) {
      this.appearance[this.colorParts[i]] =
        i === this.starPart
          ? this.star
          : this.getColor(now, i);
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

exports.default = Galaxy;