const api = require("@interstellar/StellarAPI");

class StraightMod {
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
    this.speed = 10;
  }

  next() {
    this.index = (this.index + 1) % this.colorParts.length;
    const p = this.colorParts[this.index];

    this.cycle = (this.cycle || 0) + 0.05;
    const intensity = Math.floor(((Math.sin(this.cycle) + 1) / 2) * 255);
    const color = (intensity << 16) | (intensity << 8) | intensity;

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
      if (typeof Interstellar === 'undefined' || !Interstellar.ingame) return;
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

exports.default = StraightMod;
