/* =====================================================================
   🎵  AUDIO — background music + gentle sound effects
   • Music only starts after the opening button is clicked (browser rule).
   • If assets/music/our-song.mp3 is missing, a soft built-in piano
     melody is generated instead, so there is always music.
   • Sound effects are synthesized (no files needed) and can be muted.
   ===================================================================== */

(function () {
  const cfg = window.ANNIVERSARY_CONFIG || {};
  const TARGET_VOL = Math.min(1, Math.max(0, cfg.musicVolume ?? 0.55));

  let ctx = null;          // WebAudio context (created on first click)
  let sfxBus = null;
  let reverb = null;
  let musicEl = null;      // <audio> for the real song
  let usingFallback = false;
  let musicOn = false;
  let sfxOn = true;
  let fallback = null;     // generated melody engine
  let fadeRaf = null;
  let ducked = false;

  try { sfxOn = localStorage.getItem("ann_sfx") !== "off"; } catch (e) {}

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(2.8, 2.2);
    const revGain = ctx.createGain(); revGain.gain.value = 0.35;
    reverb.connect(revGain).connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.32;
    sfxBus.connect(ctx.destination);
    sfxBus.connect(reverb);
    return ctx;
  }

  function makeImpulse(seconds, decay) {
    const rate = ctx.sampleRate, len = rate * seconds;
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  /* ---------------- Real music file ---------------- */
  function prepareMusic() {
    if (!cfg.music) return;
    musicEl = new Audio();
    musicEl.src = cfg.music;
    musicEl.loop = true;
    musicEl.preload = "auto";
    musicEl.volume = 0;
    musicEl.addEventListener("error", () => {
      // File missing or unreadable → switch to the generated melody if music should be playing
      if (musicOn && !usingFallback) startFallback();
    });
  }

  function fadeElement(to, ms, done) {
    cancelAnimationFrame(fadeRaf);
    if (!musicEl) return;
    const from = musicEl.volume, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      try { musicEl.volume = from + (to - from) * k; } catch (e) {}
      if (k < 1) fadeRaf = requestAnimationFrame(step); else done && done();
    };
    fadeRaf = requestAnimationFrame(step);
  }

  /* ---------------- Generated fallback melody ---------------- */
  function startFallback() {
    if (!ensureCtx()) return;
    usingFallback = true;
    if (!fallback) fallback = createFallback();
    fallback.start();
  }

  function createFallback() {
    const master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
    master.connect(lp); lp.connect(ctx.destination); lp.connect(reverb);

    const n = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // Cmaj7 – Am7 – Fmaj7 – G(sus)  : warm, romantic progression
    const chords = [
      [48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 62]
    ];
    const melody = [
      [76, 74, 72, 74, 76, 79, 76, -1], [72, 71, 69, 71, 72, 76, 74, -1],
      [69, 72, 76, 77, 76, 72, 69, -1], [71, 74, 79, 78, 79, 74, 71, 74]
    ];
    const beat = 0.62; // seconds per eighth-ish step
    let timer = null, bar = 0, nextTime = 0, running = false;

    function piano(freq, t, dur, vol) {
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      o1.type = "sine"; o2.type = "triangle";
      o1.frequency.value = freq; o2.frequency.value = freq * 2;
      const g2 = ctx.createGain(); g2.gain.value = 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o1.connect(g); o2.connect(g2).connect(g); g.connect(master);
      o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    function pad(freqs, t, dur) {
      freqs.forEach((f) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 8;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.035, t + 1.2);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.1);
      });
    }
    function scheduleBar(t) {
      const ch = chords[bar % 4], mel = melody[bar % 4];
      pad(ch.map(n), t, beat * 8 + 0.6);
      piano(n(ch[0] - 12), t, 3.2, 0.12);
      mel.forEach((m, i) => { if (m > 0) piano(n(m), t + i * beat, 2.2, 0.07 + Math.random() * 0.02); });
      // soft arpeggio sparkle
      ch.forEach((m, i) => piano(n(m + 12), t + beat * 4 + i * beat * 0.5, 1.6, 0.025));
      bar++;
    }
    function tick() {
      while (nextTime < ctx.currentTime + 1.5) { scheduleBar(nextTime); nextTime += beat * 8; }
    }
    return {
      start() {
        if (running) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(TARGET_VOL * 1.2, ctx.currentTime + 2.5); return; }
        running = true;
        nextTime = ctx.currentTime + 0.1;
        master.gain.setValueAtTime(0.0001, ctx.currentTime);
        master.gain.linearRampToValueAtTime(TARGET_VOL * 1.2, ctx.currentTime + 4);
        tick(); timer = setInterval(tick, 400);
      },
      stop() {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        setTimeout(() => { clearInterval(timer); running = false; }, 1300);
      }
    };
  }

  /* ---------------- Sound effects ---------------- */
  function tone(type, f0, f1, dur, vol, delay = 0) {
    if (!sfxOn || !ensureCtx()) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, filterFreq, delay = 0) {
    if (!sfxOn || !ensureCtx()) return;
    const t = ctx.currentTime + delay;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = filterFreq; f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(sfxBus); src.start(t);
  }

  const sfx = {
    pop()     { tone("sine", 600, 1200, 0.12, 0.25); },
    boing()   { tone("sine", 180, 520, 0.28, 0.3); tone("sine", 520, 260, 0.25, 0.15, 0.12); },
    giggle()  { [0, 0.09, 0.18, 0.27].forEach((d, i) => tone("triangle", 700 + i * 90, 900 + i * 90, 0.08, 0.12, d)); },
    chime()   { [0, 0.08, 0.16, 0.24].forEach((d, i) => tone("sine", [1046, 1318, 1568, 2093][i], null, 1.2, 0.12, d)); },
    sparkle() { for (let i = 0; i < 6; i++) tone("sine", 1800 + Math.random() * 1600, null, 0.4, 0.05, i * 0.05); },
    whoosh()  { noise(0.7, 0.5, 900); },
    paper()   { noise(0.35, 0.35, 2500); noise(0.25, 0.25, 3500, 0.18); },
    boom()    { noise(0.9, 0.5, 300); tone("sine", 120, 40, 0.6, 0.25); for (let i = 0; i < 5; i++) tone("sine", 2000 + Math.random() * 2000, null, 0.25, 0.03, 0.15 + i * 0.06); },
    heartbeat(){ tone("sine", 70, 50, 0.18, 0.4); tone("sine", 70, 50, 0.16, 0.3, 0.22); }
  };

  /* ---------------- Public API ---------------- */
  window.AudioFX = {
    sfx: new Proxy(sfx, { get: (o, k) => (o[k] ? (...a) => { try { o[k](...a); } catch (e) {} } : () => {}) }),

    /** Called on the very first user click (opening button). */
    start() {
      const c = ensureCtx();
      if (c && c.state === "suspended") c.resume();
      this.playMusic();
    },

    playMusic() {
      musicOn = true;
      document.body.classList.add("music-on");
      if (usingFallback) { startFallback(); return; }
      if (!musicEl) prepareMusic();
      if (!musicEl) { startFallback(); return; }
      const p = musicEl.play();
      if (p && p.then) {
        p.then(() => fadeElement(ducked ? 0.08 : TARGET_VOL, 3500))
         .catch(() => startFallback());
      }
    },

    pauseMusic() {
      musicOn = false;
      document.body.classList.remove("music-on");
      if (usingFallback && fallback) fallback.stop();
      else if (musicEl) fadeElement(0, 800, () => musicEl.pause());
    },

    toggleMusic() { musicOn ? this.pauseMusic() : this.playMusic(); return musicOn; },
    isMusicOn() { return musicOn; },

    /** Lower the music while a video is playing. */
    duck(on) {
      ducked = on;
      if (!musicOn) return;
      if (usingFallback && fallback) { on ? fallback.stop() : fallback.start(); }
      else if (musicEl) fadeElement(on ? 0.05 : TARGET_VOL, 600);
    },

    toggleSfx() {
      sfxOn = !sfxOn;
      try { localStorage.setItem("ann_sfx", sfxOn ? "on" : "off"); } catch (e) {}
      return sfxOn;
    },
    isSfxOn() { return sfxOn; }
  };

  prepareMusic();
})();
