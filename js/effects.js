/* =====================================================================
   ✨  EFFECTS — sparkles, fireworks, floating hearts, rose petals,
       heart cursor trail. Pure canvas/DOM, no external libraries.
   ===================================================================== */

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  /* ---------------- FX canvas (sparkles + fireworks) ---------------- */
  const canvas = document.getElementById("fxCanvas");
  const g = canvas.getContext("2d");
  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  let parts = [], rockets = [], running = false;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const GOLDS = ["#ffd98a", "#f5c66b", "#fff1c9", "#ffb347", "#ffffff"];
  const FIREWORK_COLORS = [
    ["#ff5c8a", "#ffb3c7"], ["#f5c66b", "#fff1c9"], ["#b39dff", "#e6ddff"],
    ["#7ad3ff", "#d6f3ff"], ["#ff8f6b", "#ffd1c2"], ["#ffffff", "#ffe6ef"]
  ];

  function loop() {
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.px = r.x; r.py = r.y;
      r.x += r.vx; r.y += r.vy; r.vy += 0.05;
      g.strokeStyle = "rgba(255,230,180,0.9)"; g.lineWidth = 2;
      g.beginPath(); g.moveTo(r.px, r.py); g.lineTo(r.x, r.y); g.stroke();
      if (Math.random() < 0.6) parts.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5), vy: Math.random(), life: 1, decay: 0.05, size: 1.5, color: "#ffd98a", grav: 0.02 });
      if (r.vy >= -0.5 || r.y <= r.ty) { explode(r.x, r.y, r.heart); rockets.splice(i, 1); }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.px = p.x; p.py = p.y;
      p.vx *= p.drag || 0.985; p.vy *= p.drag || 0.985;
      p.vy += p.grav ?? 0.04;
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const a = Math.max(0, p.life);
      if (p.trail) {
        g.strokeStyle = hexA(p.color, a); g.lineWidth = p.size;
        g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke();
      } else {
        g.fillStyle = hexA(p.color, a);
        g.beginPath(); g.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2); g.fill();
      }
      if (p.twinkle && Math.random() < 0.15) {
        g.fillStyle = hexA("#ffffff", a);
        g.fillRect(p.x - 0.5, p.y - 0.5, 1.5, 1.5);
      }
    }
    g.globalCompositeOperation = "source-over";

    if (parts.length || rockets.length) requestAnimationFrame(loop);
    else { running = false; g.clearRect(0, 0, W, H); }
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
  }

  function explode(x, y, heart) {
    const [c1, c2] = FIREWORK_COLORS[(Math.random() * FIREWORK_COLORS.length) | 0];
    const count = isMobile ? 70 : 120;
    for (let i = 0; i < count; i++) {
      let vx, vy;
      if (heart) {
        // parametric heart shape
        const t = (i / count) * Math.PI * 2;
        vx = 16 * Math.pow(Math.sin(t), 3) / 4.2;
        vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 4.2;
      } else {
        const ang = Math.random() * Math.PI * 2, sp = Math.random() * 5 + 1.5;
        vx = Math.cos(ang) * sp; vy = Math.sin(ang) * sp;
      }
      parts.push({ x, y, vx, vy, life: 1, decay: 0.012 + Math.random() * 0.01, size: 2,
        color: Math.random() < 0.5 ? c1 : c2, grav: 0.035, trail: true, twinkle: true, drag: 0.975 });
    }
    window.AudioFX && AudioFX.sfx.boom();
    kick();
  }

  window.FX = {
    reduceMotion, isMobile,

    /** Soft golden sparkle burst from a point (screen coords). */
    sparkleBurst(x, y, amount = 80, spread = 7) {
      if (reduceMotion) amount = Math.min(amount, 25);
      for (let i = 0; i < amount; i++) {
        const ang = Math.random() * Math.PI * 2, sp = Math.random() * spread;
        parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5, life: 1,
          decay: 0.008 + Math.random() * 0.012, size: Math.random() * 2.4 + 0.8,
          color: GOLDS[(Math.random() * GOLDS.length) | 0], grav: 0.03, twinkle: true });
      }
      kick();
    },

    /** Launch fireworks across the screen. */
    fireworks(count = 6) {
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const x = W * (0.15 + Math.random() * 0.7);
          rockets.push({ x, y: H + 10, vx: (Math.random() - 0.5) * 1.5, vy: -(H * 0.012 + 7 + Math.random() * 3),
            ty: H * (0.15 + Math.random() * 0.3), heart: Math.random() < 0.35 });
          window.AudioFX && AudioFX.sfx.whoosh();
          kick();
        }, i * 380 + Math.random() * 200);
      }
    },

    /** Hundreds of floating hearts rising across the screen. */
    heartRain(count = 60, duration = 7000) {
      const layer = document.getElementById("heartsLayer");
      if (reduceMotion) count = Math.min(count, 12);
      if (isMobile) count = Math.round(count * 0.6);
      const glyphs = ["❤", "💖", "💕", "💗", "♥", "💞", "✨"];
      for (let i = 0; i < count; i++) {
        const s = document.createElement("span");
        s.className = "rain-heart";
        s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
        const size = 12 + Math.random() * 28;
        s.style.left = Math.random() * 100 + "vw";
        s.style.fontSize = size + "px";
        s.style.setProperty("--drift", (Math.random() - 0.5) * 160 + "px");
        s.style.setProperty("--rot", (Math.random() - 0.5) * 80 + "deg");
        s.style.animationDuration = (duration / 1000) * (0.6 + Math.random() * 0.6) + "s";
        s.style.animationDelay = Math.random() * (duration / 2500) + "s";
        s.addEventListener("animationend", () => s.remove());
        layer.appendChild(s);
      }
    },

    /** Fill a container with slowly falling rose petals. */
    petals(container, count = 18) {
      if (!container) return;
      if (reduceMotion) count = Math.min(count, 6);
      if (isMobile) count = Math.round(count * 0.6);
      for (let i = 0; i < count; i++) {
        const p = document.createElement("i");
        p.className = "petal";
        p.style.left = Math.random() * 100 + "%";
        p.style.setProperty("--s", (0.6 + Math.random() * 0.9).toFixed(2));
        p.style.setProperty("--sway", (Math.random() * 120 - 60) + "px");
        p.style.animationDuration = (9 + Math.random() * 10) + "s, " + (2.5 + Math.random() * 3) + "s";
        p.style.animationDelay = (-Math.random() * 18) + "s, " + (-Math.random() * 3) + "s";
        p.style.setProperty("--hue", Math.random() < 0.3 ? "330" : "350");
        container.appendChild(p);
      }
    }
  };

  /* ---------------- Heart cursor trail (desktop only) ---------------- */
  if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    let last = 0;
    window.addEventListener("pointermove", (e) => {
      const now = performance.now();
      if (now - last < 55) return;
      last = now;
      const h = document.createElement("span");
      h.className = "cursor-heart";
      h.textContent = Math.random() < 0.8 ? "❤" : "✨";
      h.style.left = e.clientX + "px";
      h.style.top = e.clientY + "px";
      h.style.setProperty("--dx", (Math.random() - 0.5) * 30 + "px");
      h.addEventListener("animationend", () => h.remove());
      document.body.appendChild(h);
    }, { passive: true });
  }
})();
