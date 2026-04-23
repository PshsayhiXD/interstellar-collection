class SparkTrailMod {
  constructor() {
    this.running = false;
    this.boundMove = this.onMove.bind(this);
    this.lastSpawn = 0;
    this.speed = 48;
    this.hue = 0;
  }

  pickColor() {
    this.hue = (this.hue + 37) % 360;
    return `hsl(${this.hue} 85% 72%)`;
  }

  spawn(x, y) {
    const el = document.createElement("div");
    const ox = (Math.random() - 0.5) * 14;
    const oy = (Math.random() - 0.5) * 14;
    const size = 4 + Math.random() * 5;
    el.style.cssText = [
      "position:fixed",
      `left:${x + ox - size / 2}px`,
      `top:${y + oy - size / 2}px`,
      `width:${size}px`,
      `height:${size}px`,
      "border-radius:50%",
      "pointer-events:none",
      "z-index:2147483646",
      `background:${this.pickColor()}`,
      "box-shadow:0 0 8px rgba(255,255,255,0.35)",
      "opacity:0.9",
      "transition:opacity 0.55s ease,transform 0.55s ease",
    ].join(";");
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "0";
      el.style.transform = "scale(0.15)";
    });
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 600);
  }

  onMove(e) {
    if (!this.running) return;
    const now = performance.now();
    if (now - this.lastSpawn < this.speed) return;
    this.lastSpawn = now;
    this.spawn(e.clientX, e.clientY);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastSpawn = 0;
    document.addEventListener("mousemove", this.boundMove, { passive: true });
  }

  stop() {
    this.running = false;
    document.removeEventListener("mousemove", this.boundMove);
  }
}

exports.default = SparkTrailMod;
