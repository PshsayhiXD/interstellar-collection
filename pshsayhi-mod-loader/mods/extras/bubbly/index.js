class Bubbly {
  constructor() {
    this.running = false;
    this.boundClick = this.onClick.bind(this);
    this.count = 10;
    this.minSize = 10;
    this.maxSize = 22;
    this.lifetime = 1800;
    this.rise = 160;
    this.spread = 50;
  }

  spawn(x, y) {
    const el = document.createElement("div");
    const size = this.minSize + Math.random() * (this.maxSize - this.minSize);
    const ox = (Math.random() - 0.5) * this.spread;
    const oy = (Math.random() - 0.5) * this.spread;
    const dx = (Math.random() - 0.5) * 40;
    const rot = (Math.random() - 0.5) * 30;

    el.style.cssText = [
      "position:fixed",
      `left:${x + ox - size / 2}px`,
      `top:${y + oy - size / 2}px`,
      `width:${size}px`,
      `height:${size}px`,
      "border-radius:50%",
      "pointer-events:none",
      "z-index:2147483646",
      "border:2px solid rgba(255,255,255,.75)",
      "background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.45),rgba(170,220,255,.18) 55%,rgba(100,170,255,.08) 100%)",
      "box-shadow:0 0 12px rgba(170,220,255,.35)",
      "transition:transform 1.8s ease-out,opacity 1.8s ease-out"
    ].join(";");

    const shine = document.createElement("div");
    shine.style.cssText = [
      "position:absolute",
      "left:22%",
      "top:18%",
      "width:22%",
      "height:22%",
      "border-radius:50%",
      "background:rgba(255,255,255,.9)"
    ].join(";");
    el.appendChild(shine);

    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = `translate(${dx}px,-${this.rise + Math.random() * 50}px) scale(.15) rotate(${rot}deg)`;
      el.style.opacity = "0";
    });

    setTimeout(() => {
      if (!el.parentNode) return;

      el.animate([
        { transform: el.style.transform },
        { transform: `${el.style.transform} scale(.45)` },
        { transform: `${el.style.transform} scale(0)` }
      ], {
        duration: 180,
        easing: "ease-out"
      });

      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 180);
    }, this.lifetime);
  }

  onClick(e) {
    if (!this.running) return;
    for (let i = 0; i < this.count; i++) this.spawn(e.clientX, e.clientY);
  }

  start() {
    if (this.running) return;
    this.running = true;
    document.addEventListener("click", this.boundClick, { passive: true });
  }

  stop() {
    this.running = false;
    document.removeEventListener("click", this.boundClick);
  }
}

exports.default = Bubbly;