const api = require("@interstellar/StellarAPI");

class AttendtionSeeker {
  constructor() {
    this.enabled = true;
    this.speed = 10;
    this.swapSpeed = 350;
    this.smooth = false;

    this.black = 0x111111;
    this.white = 0xe5e5e5;

    this.appearance = {};
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

  tick(now) {
    if (!this.enabled) return;
    if (now - this.lastTick < this.speed) return;

    this.lastTick = now;

    let top;
    let bottom;

    if (this.smooth) {
      const phase = (Math.sin(now / this.swapSpeed * Math.PI * 2) + 1) / 2;
      top = this.lerpColor(this.white, this.black, phase);
      bottom = this.lerpColor(this.black, this.white, phase);
    } else {
      const swap = Math.floor(now / this.swapSpeed) % 2 === 0;
      top = swap ? this.white : this.black;
      bottom = swap ? this.black : this.white;
    }

    this.appearance.color_hair = top;
    this.appearance.color_skin = top;
    this.appearance.color_body = top;
    this.appearance.color_legs = bottom;
    this.appearance.color_feet = bottom;
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

exports.default = AttendtionSeeker;