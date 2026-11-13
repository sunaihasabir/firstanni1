/* =====================================================================
   💖  MAIN — wires everything together.
   Sections: loader → opening surprise → hero → story → drama king →
   gallery → letter → quotes → faith → mama → beach → final surprise.
   ===================================================================== */

(function () {
  "use strict";

  const CFG = window.ANNIVERSARY_CONFIG;
  const C = window.CONTENT;
  const hasGsap = typeof window.gsap !== "undefined";
  const reduce = window.FX ? FX.reduceMotion : false;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const sfx = (name) => window.AudioFX && AudioFX.sfx[name]();

  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add(hasGsap ? "has-gsap" : "no-gsap");

  /* ------------------------------------------------------------------
     MEDIA HELPERS — real photos/videos with friendly placeholders
     ------------------------------------------------------------------ */
  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  function placeholder(src, label, kind = "photo") {
    const d = document.createElement("div");
    d.className = "ph ph-v" + (hashStr(src) % 5);
    const file = src.split("/").pop();
    d.innerHTML = `
      <div class="ph-inner">
        <span class="ph-icon">${kind === "video" ? "🎬" : "📸"}</span>
        <span class="ph-title">${label || (kind === "video" ? "Our video goes here" : "Our photo goes here")}</span>
        <code class="ph-file">${src.replace(file, "")}<b>${file}</b></code>
      </div>`;
    d.setAttribute("role", "img");
    d.setAttribute("aria-label", "Placeholder for " + file);
    return d;
  }

  /** Image that silently turns into a placeholder if the file is missing. */
  function smartImage(src, alt, phLabel) {
    const wrap = document.createElement("div");
    wrap.className = "smart-media";
    const img = new Image();
    img.alt = alt || "";
    img.decoding = "async";
    img.loading = "lazy";
    img.onload = () => wrap.classList.add("loaded");
    img.onerror = () => { img.remove(); wrap.appendChild(placeholder(src, phLabel)); wrap.classList.add("is-ph"); };
    img.src = src;
    wrap.appendChild(img);
    return wrap;
  }

  // Background videos: use the file from config, keep them muted, pause when off-screen
  $$(".bg-video").forEach((v) => {
    if (!CFG.backgroundVideo) { v.remove(); return; }
    if (!v.currentSrc.endsWith(CFG.backgroundVideo)) { v.innerHTML = ""; v.src = CFG.backgroundVideo; }
    v.muted = true;
    v.addEventListener("error", () => v.remove());
    new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }).observe(v);
  });

  // Fill [data-src-key] slots (hero + final couple photos)
  $$(".media-slot[data-src-key]").forEach((slot) => {
    const item = CFG[slot.dataset.srcKey];
    if (item) slot.appendChild(smartImage(item.src, item.caption, "Our favorite couple photo"));
  });

  /* ------------------------------------------------------------------
     LOADER
     ------------------------------------------------------------------ */
  const loader = $("#loader"), fill = $("#loaderFill");
  // Time-based so it never gets stuck: ~1.8s normally, never more than 5s
  const loadStart = performance.now();
  let loadDone = false;
  const loadTimer = setInterval(() => {
    const t = performance.now() - loadStart;
    const ready = document.readyState === "complete" || t > 5000;
    const pct = Math.min(t / 1800, 1) * (ready ? 100 : 90);
    fill.style.width = pct + "%";
    if (pct >= 100 && !loadDone) { loadDone = true; clearInterval(loadTimer); setTimeout(finishLoading, 350); }
  }, 60);

  function finishLoading() {
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 900);
    initOpening();
  }

  /* ------------------------------------------------------------------
     1. OPENING SURPRISE
     ------------------------------------------------------------------ */
  const opening = $("#opening");
  let openingScene = null, siteInitialised = false;

  function initOpening() {
    if (window.Scenes && Scenes.supported && !openingScene) {
      try { openingScene = Scenes.OpeningScene($("#openingCanvas")); } catch (e) { console.warn("Opening 3D failed", e); }
    }
    if (!openingScene) opening.classList.add("css-gift-mode");
    if (!$("#openingPetals").children.length) FX.petals($("#openingPetals"), 26);

    if (hasGsap) {
      gsap.fromTo(".opening-title", { opacity: 0, y: 30, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6, ease: "power3.out", delay: 0.2 });
      gsap.fromTo(".opening-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.4, delay: 0.9 });
      gsap.fromTo("#openSurpriseBtn", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1, delay: 1.5, ease: "back.out(1.8)" });
      gsap.fromTo(".opening-hint", { opacity: 0 }, { opacity: 0.7, duration: 1, delay: 2.2 });
    }
  }

  let opening_busy = false;
  $("#openSurpriseBtn").addEventListener("click", async () => {
    if (opening_busy) return;
    opening_busy = true;
    AudioFX.start();
    sfx("chime");
    updateMusicBtn();

    if (hasGsap) gsap.to(".opening-content", { opacity: 0, y: -30, duration: 0.6, ease: "power2.in" });
    else $(".opening-content").style.opacity = 0;

    if (openingScene) {
      const done = openingScene.open();
      setTimeout(() => {
        const p = openingScene.giftScreenPos();
        FX.sparkleBurst(p.x, p.y, 180, 9);
        sfx("sparkle");
        FX.heartRain(140, 8000);
      }, 900);
      await done;
    } else {
      opening.classList.add("css-gift-open");
      const r = $(".css-gift") ? $(".css-gift").getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      FX.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 160, 9);
      FX.heartRain(120, 8000);
      await new Promise((r) => setTimeout(r, 1600));
    }

    // cinematic transition
    const flash = $("#openingFlash");
    if (hasGsap) {
      await gsap.timeline()
        .to(flash, { opacity: 1, duration: 0.7, ease: "power2.in" })
        .add(() => { revealSite(); })
        .to(opening, { opacity: 0, duration: 1.2, ease: "power2.out" })
        .to(flash, { opacity: 0, duration: 1.2 }, "<");
    } else revealSite();
    opening.classList.add("hidden");
    opening_busy = false;
  });

  function revealSite() {
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    if (!siteInitialised) { siteInitialised = true; initSite(); }
    heroIntro();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function replayOpening() {
    closeAllOverlays();
    document.body.classList.add("is-locked");
    opening.classList.remove("hidden", "css-gift-open");
    opening.style.opacity = 1;
    if (openingScene) openingScene.reset();
    if (hasGsap) gsap.set(".opening-content", { opacity: 1, y: 0 });
    else $(".opening-content").style.opacity = 1;
    initOpening();
  }
  $("#replayBtn").addEventListener("click", replayOpening);
  $("#footerReplay").addEventListener("click", replayOpening);

  /* ------------------------------------------------------------------
     SITE INITIALISATION (after the gift opens)
     ------------------------------------------------------------------ */
  let heroHeart = null;
  function initSite() {
    initNav();
    initCounter();
    buildTimeline();
    buildStats();
    buildBubbles();
    buildGallery();
    initFolders();
    initLetter();
    buildQuotes();
    buildVerses();
    buildMama();
    initBeach();
    initWishes();
    initFinal();
    initReveals();

    if (window.Scenes && Scenes.supported) {
      try {
        heroHeart = Scenes.HeartScene($("#heroCanvas"), { anchor: $(".hero-photo .magic-frame"), corner: [-0.04, -0.04], size: 0.42, particles: 90 });
      } catch (e) { console.warn(e); }
    }
  }

  function heroIntro() {
    if (!hasGsap) return;
    gsap.fromTo(".ht-line", { opacity: 0, y: 60, rotateX: -50 }, { opacity: 1, y: 0, rotateX: 0, duration: 1.4, stagger: 0.2, ease: "power4.out", delay: 0.3 });
    gsap.fromTo("#hero .reveal-up", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, delay: 0.7, ease: "power3.out" });
  }

  /* ------------------------------------------------------------------
     NAV + SCROLL PROGRESS
     ------------------------------------------------------------------ */
  function initNav() {
    const nav = $("#mainNav"), toggle = $("#navToggle"), links = $("#navLinks");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
      sfx("pop");
    });
    links.addEventListener("click", (e) => { if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", false); } });
    // smooth scrolling for every in-page link (done in JS so it doesn't fight ScrollTrigger)
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });

    const bar = $("#scrollProgress span");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      nav.classList.toggle("scrolled", scrollY > 40);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // highlight the current section
    const map = new Map($$("#navLinks a").map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && map.has(e.target.id)) {
          map.forEach((a) => a.classList.remove("active"));
          map.get(e.target.id).classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------------
     ANNIVERSARY COUNTER
     ------------------------------------------------------------------ */
  function initCounter() {
    const { year, month, day } = CFG.startDate;
    const start = new Date(year, month - 1, day, 0, 0, 0);
    const anniversary = new Date(year + 1, month - 1, day, 0, 0, 0);
    const UNITS = ["days", "hours", "minutes", "seconds"];
    const els = {}; $$("#counter b").forEach((b) => (els[b.dataset.unit] = b));
    const note = $("#counterNote");

    function parts() {
      const diff = Math.max(0, Date.now() - start.getTime());
      return {
        days: Math.floor(diff / 864e5),
        hours: Math.floor(diff / 36e5) % 24,
        minutes: Math.floor(diff / 6e4) % 60,
        seconds: Math.floor(diff / 1e3) % 60
      };
    }
    function setNote() {
      const now = new Date();
      if (now < anniversary) {
        const left = Math.ceil((anniversary - now) / 864e5);
        note.innerHTML = `of loving you · <b>${left}</b> ${left === 1 ? "day" : "days"} until our first anniversary 🎉`;
      } else if (now - anniversary < 864e5) {
        note.innerHTML = `<b>Today is our day!</b> Happy First Anniversary, My Hubby G 🎉❤️`;
      } else {
        note.innerHTML = `of loving you — and counting, forever ♾️`;
      }
    }
    let counted = false;
    function render() {
      const p = parts();
      if (counted) UNITS.forEach((k) => (els[k].textContent = p[k]));
    }
    // count up the first time the counter is visible
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || counted) return;
      io.disconnect();
      const p = parts();
      if (hasGsap && !reduce) {
        const o = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        gsap.to(o, { ...p, duration: 2.4, ease: "power3.out", onUpdate() { UNITS.forEach((k) => (els[k].textContent = Math.round(o[k]))); }, onComplete() { counted = true; render(); } });
      } else { counted = true; render(); }
    });
    io.observe($("#counter"));
    setNote();
    setInterval(() => { render(); }, 1000);
    setInterval(setNote, 60000);
  }

  /* ------------------------------------------------------------------
     3. STORY TIMELINE
     ------------------------------------------------------------------ */
  const FX_DECOR = {
    chat: `<div class="deco deco-chat"><span class="b b1">💬 nice reel!</span><span class="b b2">📩 hi 🙂</span><span class="b b3">✨ hello!</span><span class="wa">WhatsApp 💚</span></div>`,
    night: `<div class="deco deco-night"><span class="moon">🌙</span><span class="bus">🚌</span><span class="clock">3:00 AM</span></div>`,
    sunrise: `<div class="deco deco-sunrise"><span class="sun"></span><span class="t t1">6:00 AM ☀️ Good morning</span><span class="t t2">8:00 AM 📹 first video call</span></div>`,
    care: `<div class="deco deco-care"><span class="sick">🤒</span><span class="arrow">→</span><span class="well">😊</span><span class="tg">“Thanks God.”</span></div>`,
    heart: `<div class="deco deco-heart"><span class="big-heart">❤</span><span class="ily l">I love you</span><span class="ily r">I love you too</span></div>`,
    hug: `<div class="deco deco-hug"><span>🫂</span></div>`,
    car: `<div class="deco deco-car">
            <div class="road"></div>
            <svg class="car" viewBox="0 0 160 80" aria-hidden="true">
              <path d="M18 52 L30 30 Q36 20 52 20 L100 20 Q114 20 122 32 L134 46 Q150 48 150 58 L150 62 L10 62 L10 56 Q10 52 18 52 Z" fill="#ff5c8a"/>
              <path d="M40 30 Q44 25 54 25 L74 25 L74 44 L32 44 Z" fill="#cfe9ff" opacity=".9"/>
              <path d="M80 25 L100 25 Q110 25 116 34 L122 44 L80 44 Z" fill="#cfe9ff" opacity=".9"/>
              <circle cx="40" cy="62" r="11" fill="#2b1840"/><circle cx="40" cy="62" r="4" fill="#f5c66b"/>
              <circle cx="118" cy="62" r="11" fill="#2b1840"/><circle cx="118" cy="62" r="4" fill="#f5c66b"/>
              <text x="62" y="40" font-size="12">📱</text>
            </svg>
            <span class="car-heart h1">❤</span><span class="car-heart h2">💕</span><span class="car-heart h3">❤</span>
          </div>`,
    glow: `<div class="deco deco-glow"><span class="ring"></span><span class="in">❤</span></div>`,
    family: `<div class="deco deco-family"><span>👩</span><span>❤️</span><span>👨‍👩‍👦</span></div>`,
    bdayHer: `<div class="deco deco-bday her">
              <span class="balloon b1"></span><span class="balloon b2"></span><span class="balloon b3"></span>
              <span class="cake">🎂</span><span class="bday-txt">Happy Birthday, Sunaiha!</span></div>`,
    bdayHis: `<div class="deco deco-bday his">
              <span class="balloon b1"></span><span class="balloon b2"></span><span class="balloon b3"></span><span class="balloon b4"></span>
              <span class="crown">👑</span><span class="cake">🎂</span>
              <span class="bday-txt">Happy Birthday, My Hubby G!</span>
              <span class="confetti">${Array.from({ length: 18 }, (_, k) => `<i style="--k:${k}"></i>`).join("")}</span></div>`,
    families: `<div class="deco deco-families">
              <span class="fam-member"><b>👩</b><small>Mama</small></span>
              <span class="fam-member"><b>👨</b><small>Papa</small></span>
              <span class="fam-member happy"><b>😄</b><small>Fharukh</small></span>
              <span class="fam-member happy"><b>😁</b><small>Sharukh</small></span>
              <span class="fam-line">Two families <span class="fam-heart">❤️</span> one blessing</span></div>`,
    storm: `<div class="deco deco-storm"><span class="cloud">⛈️</span><span class="rain"></span><span class="rainbow">🌈</span><span class="pray">🙏</span></div>`
  };

  function buildTimeline() {
    const tl = $("#timeline");
    C.story.forEach((m, i) => {
      const art = document.createElement("article");
      art.className = "memory " + (i % 2 ? "right" : "left") + " fx-" + m.fx + (m.special ? " special" : "");
      const quotes = (m.quotes || []).map((q) => `<span class="mini-quote">“${q}”</span>`).join("");
      art.innerHTML = `
        <div class="memory-node"><span>${m.icon}</span></div>
        <div class="memory-card">
          ${m.special ? `<span class="special-ribbon">✨ Special ✨</span>` : ""}
          <div class="memory-media"></div>
          <div class="memory-body">
            <p class="memory-num">Memory ${String(i + 1).padStart(2, "0")}</p>
            <h3 class="memory-title">${m.title} <span class="ic">${m.icon}</span></h3>
            <p class="memory-text">${m.text}</p>
            ${quotes ? `<div class="mini-quotes">${quotes}</div>` : ""}
            ${m.after ? `<p class="memory-text">${m.after}</p>` : ""}
            ${FX_DECOR[m.fx] || ""}
            <p class="memory-highlight">${m.highlight}</p>
          </div>
        </div>`;
      // an entry can be "path.jpg" or { src: "path.jpg", pos: "50% 60%" } (pos = which part to keep in view)
      const entry = CFG.memoryPhotos[i];
      const src = entry && (entry.src || entry);
      if (src) {
        const mediaBox = $(".memory-media", art);
        const media = smartImage(src, m.title, "A photo for this memory");
        const img = $("img", media);
        if (img) {
          if (entry.pos) img.style.objectPosition = entry.pos;
          img.addEventListener("load", () => { if (img.naturalHeight > img.naturalWidth * 1.05) mediaBox.classList.add("portrait"); });
        }
        mediaBox.appendChild(media);
      } else $(".memory-media", art).remove();
      tl.appendChild(art);
    });

    if (!hasGsap) { $$(".memory").forEach((m) => m.classList.add("in-view")); return; }

    gsap.to(".timeline-fill", { scaleY: 1, ease: "none", scrollTrigger: { trigger: "#timeline", start: "top 60%", end: "bottom 70%", scrub: true } });
    $$(".memory").forEach((m) => {
      const fromX = innerWidth > 900 ? (m.classList.contains("left") ? -80 : 80) : 40;
      gsap.fromTo($(".memory-card", m), { opacity: 0, x: fromX, rotateY: m.classList.contains("left") ? 12 : -12 },
        { opacity: 1, x: 0, rotateY: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: m, start: "top 80%", once: true, onEnter: () => m.classList.add("in-view") } });
      gsap.fromTo($(".memory-node", m), { scale: 0 }, { scale: 1, duration: 0.7, ease: "back.out(2.5)", scrollTrigger: { trigger: m, start: "top 80%", once: true } });
      if (m.classList.contains("fx-bdayHis") || m.classList.contains("fx-bdayHer")) {
        ScrollTrigger.create({ trigger: m, start: "top 55%", once: true, onEnter: () => {
          const r = $(".memory-card", m).getBoundingClientRect();
          FX.sparkleBurst(r.left + r.width / 2, r.top + 80, m.classList.contains("special") ? 160 : 90, 8);
          if (m.classList.contains("special")) { FX.heartRain(30, 6000); sfx("chime"); } else sfx("sparkle");
        } });
      }
      if (m.classList.contains("fx-heart")) {
        ScrollTrigger.create({ trigger: m, start: "top 60%", once: true, onEnter: () => {
          const r = $(".big-heart", m).getBoundingClientRect();
          FX.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 90, 6); sfx("heartbeat");
        } });
      }
    });
  }

  /* ------------------------------------------------------------------
     4. DRAMA KING — stat cards + speech bubbles
     ------------------------------------------------------------------ */
  function buildStats() {
    const wrap = $("#statCards");
    C.stats.forEach((s, i) => {
      const card = document.createElement("button");
      card.className = "stat-card";
      card.style.setProperty("--accent", s.color);
      card.setAttribute("aria-label", s.label + ": " + s.value + ". Tap to flip.");
      card.innerHTML = `
        <span class="stat-inner">
          <span class="stat-face front">
            <span class="stat-emoji">${s.emoji}</span>
            <span class="stat-label">${s.label}</span>
            <span class="stat-value">${s.value}</span>
            <span class="meter"><span class="meter-fill" style="--w:${s.meter}%"></span></span>
            <span class="stat-text">${s.text}</span>
            <span class="flip-hint">tap to flip ↻</span>
          </span>
          <span class="stat-face back">
            <span class="stat-emoji small">${s.emoji}</span>
            <span class="stat-back">${s.back}</span>
          </span>
        </span>`;
      card.addEventListener("click", () => { card.classList.toggle("flipped"); sfx(i % 2 ? "boing" : "giggle"); });
      card.addEventListener("mouseenter", () => sfx("pop"));
      // playful tilt
      card.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--rx", ((e.clientY - r.top) / r.height - 0.5) * -14 + "deg");
        card.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 14 + "deg");
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
      wrap.appendChild(card);
    });
    if (hasGsap) {
      gsap.fromTo(".stat-card", { opacity: 0, y: 60, scale: 0.85 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.7)", stagger: 0.08,
        scrollTrigger: { trigger: "#statCards", start: "top 80%", once: true, onEnter: () => wrap.classList.add("meters-on") }
      });
    } else wrap.classList.add("meters-on");
  }

  function buildBubbles() {
    const wrap = $("#bubbles");
    C.sayings.forEach((t, i) => {
      const b = document.createElement("button");
      b.className = "bubble b" + (i % 4);
      b.innerHTML = `<span class="who">👑 Sharoz</span>“${t}”`;
      b.addEventListener("click", () => {
        sfx("giggle");
        b.classList.remove("wobble"); void b.offsetWidth; b.classList.add("wobble");
        const r = b.getBoundingClientRect();
        FX.sparkleBurst(r.left + r.width / 2, r.top, 30, 4);
      });
      wrap.appendChild(b);
    });
    if (hasGsap) gsap.fromTo(".bubble", { opacity: 0, scale: 0.4, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, stagger: 0.25, ease: "elastic.out(1, 0.55)", scrollTrigger: { trigger: "#bubbles", start: "top 85%", once: true } });
  }

  /* ------------------------------------------------------------------
     5. GALLERY + LIGHTBOX + SLIDESHOW
     ------------------------------------------------------------------ */
  let currentFilter = "all", lbList = [], lbIndex = 0, slideshowTimer = null;

  function buildGallery() {
    const tabs = $("#galleryTabs");
    const cats = [{ id: "all", label: "All Memories ✨" }].concat(CFG.galleryCategories);
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.className = "tab" + (c.id === "all" ? " active" : "");
      b.textContent = c.label; b.dataset.filter = c.id; b.setAttribute("role", "tab");
      b.addEventListener("click", () => {
        $$(".tab", tabs).forEach((t) => t.classList.remove("active"));
        b.classList.add("active"); currentFilter = c.id; sfx("pop"); renderWall(true);
      });
      tabs.appendChild(b);
    });
    renderWall(false);
  }

  function filtered() { return CFG.gallery.filter((g) => currentFilter === "all" || g.category === currentFilter); }

  function renderWall(animate) {
    const wall = $("#polaroidWall");
    wall.innerHTML = "";
    const items = filtered();
    items.forEach((item, i) => {
      const card = document.createElement("button");
      card.className = "polaroid" + (item.type === "video" ? " is-video" : "");
      const rot = ((hashStr(item.src) % 9) - 4) * 1.1;
      card.style.setProperty("--rot", rot + "deg");
      card.setAttribute("aria-label", (item.type === "video" ? "Play video: " : "Open photo: ") + item.caption);
      const media = document.createElement("div");
      media.className = "polaroid-media";
      if (item.type === "video") {
        media.appendChild(smartVideoThumb(item));
        const play = document.createElement("span"); play.className = "play-badge"; play.textContent = "▶"; media.appendChild(play);
      } else media.appendChild(smartImage(item.src, item.caption));
      card.appendChild(media);
      const cap = document.createElement("span"); cap.className = "polaroid-cap"; cap.textContent = item.caption;
      card.appendChild(cap);
      const tape = document.createElement("span"); tape.className = "tape"; card.appendChild(tape);

      card.addEventListener("click", () => openLightbox(items, i));
      card.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--tx", ((e.clientY - r.top) / r.height - 0.5) * -18 + "deg");
        card.style.setProperty("--ty", ((e.clientX - r.left) / r.width - 0.5) * 18 + "deg");
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--tx", "0deg"); card.style.setProperty("--ty", "0deg"); });
      wall.appendChild(card);
    });
    if (hasGsap) {
      const opts = { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" };
      gsap.fromTo(".polaroid", { opacity: 0, y: 50, rotateX: 25 }, animate ? opts : { ...opts, scrollTrigger: { trigger: wall, start: "top 85%", once: true } });
    }
  }

  function smartVideoThumb(item) {
    // Show the poster if available; otherwise try the video's first frame; otherwise a placeholder
    const wrap = document.createElement("div"); wrap.className = "smart-media";
    const tryVideoFrame = () => {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = item.src + "#t=0.5";
      v.onloadeddata = () => wrap.classList.add("loaded");
      v.onerror = () => { v.remove(); wrap.appendChild(placeholder(item.src, "Our video goes here", "video")); wrap.classList.add("is-ph"); };
      wrap.appendChild(v);
    };
    if (item.poster) {
      const img = new Image(); img.alt = item.caption; img.loading = "lazy";
      img.onload = () => wrap.classList.add("loaded");
      img.onerror = () => { img.remove(); tryVideoFrame(); };
      img.src = item.poster; wrap.appendChild(img);
    } else tryVideoFrame();
    return wrap;
  }

  const lb = $("#lightbox"), lbMedia = $("#lbMedia"), lbCap = $("#lbCaption");
  function openLightbox(list, index, slideshow = false) {
    lbList = list; lbIndex = index;
    openOverlay("lightbox");
    lb.classList.toggle("slideshow", slideshow);
    showLb(0);
    if (slideshow) startSlideshow();
  }
  function showLb(dir) {
    const item = lbList[lbIndex];
    stopVideo();
    lbMedia.innerHTML = "";
    let el;
    if (item.type === "video") {
      el = document.createElement("video");
      el.src = item.src; el.controls = true; el.playsInline = true; el.autoplay = true;
      if (item.poster) el.poster = item.poster;
      el.addEventListener("play", () => AudioFX.duck(true));
      el.addEventListener("pause", () => AudioFX.duck(false));
      el.addEventListener("ended", () => AudioFX.duck(false));
      el.addEventListener("error", () => { el.replaceWith(placeholder(item.src, "Add this video to see it here", "video")); AudioFX.duck(false); });
    } else {
      el = smartImage(item.src, item.caption);
      if (lb.classList.contains("slideshow")) el.classList.add("kenburns");
    }
    lbMedia.appendChild(el);
    lbCap.textContent = item.caption;
    if (hasGsap) gsap.fromTo(lbMedia, { opacity: 0, x: dir * 60, scale: 0.96 }, { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "power3.out" });
  }
  function stopVideo() { const v = $("video", lbMedia); if (v) { v.pause(); AudioFX.duck(false); } }
  function lbStep(d) { lbIndex = (lbIndex + d + lbList.length) % lbList.length; showLb(d); sfx("pop"); if (slideshowTimer) restartProgress(); }
  $("#lbPrev").addEventListener("click", () => lbStep(-1));
  $("#lbNext").addEventListener("click", () => lbStep(1));

  // swipe on phones
  let touchX = null;
  lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => { if (touchX == null) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1); touchX = null; });

  function startSlideshow() {
    stopSlideshow();
    restartProgress();
    slideshowTimer = setInterval(() => { lbIndex = (lbIndex + 1) % lbList.length; showLb(1); restartProgress(); }, 4500);
  }
  function restartProgress() {
    const bar = $("#lbProgress span");
    bar.style.transition = "none"; bar.style.width = "0%"; void bar.offsetWidth;
    bar.style.transition = "width 4.5s linear"; bar.style.width = "100%";
  }
  function stopSlideshow() { clearInterval(slideshowTimer); slideshowTimer = null; }
  $("#slideshowBtn").addEventListener("click", () => {
    const photos = filtered().filter((g) => g.type === "image");
    const list = photos.length ? photos : CFG.gallery.filter((g) => g.type === "image");
    if (list.length) { openLightbox(list, 0, true); sfx("chime"); }
  });

  /* ------------------------------------------------------------------
     5b. FOLDERS — family (open) + romantic (password-locked, encrypted)
     ------------------------------------------------------------------ */
  let vaultItems = null; // decrypted items stay only in memory, until page reload or "Lock again"

  function initFolders() {
    const grid = $("#albumGrid"), form = $("#vaultForm"), actions = $("#albumActions");
    const lockCfg = CFG.lockedFolder || {};

    function renderGrid(items, emptyText) {
      grid.innerHTML = "";
      if (!items.length) { grid.innerHTML = `<p class="album-empty">${emptyText}</p>`; return; }
      items.forEach((item, i) => {
        const card = document.createElement("button");
        card.className = "polaroid small" + (item.type === "video" ? " is-video" : "");
        card.style.setProperty("--rot", (((i * 7) % 9) - 4) * 1.2 + "deg");
        const media = document.createElement("div"); media.className = "polaroid-media";
        if (item.type === "video") {
          const v = document.createElement("video"); v.src = (item.url || item.src) + "#t=1.5"; v.muted = true; v.playsInline = true; v.preload = "metadata";
          const w = document.createElement("div"); w.className = "smart-media loaded"; w.appendChild(v); media.appendChild(w);
          const play = document.createElement("span"); play.className = "play-badge"; play.textContent = "▶"; media.appendChild(play);
        } else media.appendChild(smartImage(item.url || item.src, item.caption, "Family photo"));
        card.appendChild(media);
        const cap = document.createElement("span"); cap.className = "polaroid-cap"; cap.textContent = item.caption || "❤";
        card.appendChild(cap);
        card.addEventListener("click", () => openLightbox(items.map((it) => ({ ...it, src: it.url || it.src })), i));
        grid.appendChild(card);
      });
      if (hasGsap && items.length) gsap.fromTo($$(".polaroid", grid), { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.6, ease: "back.out(1.6)" });
    }

    function openAlbum(mode) {
      const ov = $("#albumOverlay");
      ov.dataset.mode = mode;
      actions.innerHTML = "";
      if (mode === "family") {
        $("#albumTitle").textContent = "Our Beautiful Families 🏡❤️";
        form.hidden = true;
        renderGrid(CFG.familyFolder || [], "Add family photos in js/config.js ❤️");
      } else {
        $("#albumTitle").textContent = "Only For Us 🔒❤️";
        if (vaultItems) showVault();
        else {
          form.hidden = false; grid.innerHTML = "";
          $("#vaultPw").value = ""; $("#vaultMsg").textContent = "This folder is locked. Only we know the password. 🤫";
          $("#vaultHint").textContent = lockCfg.hint ? "Hint: " + lockCfg.hint : "";
          $("#vaultLock").classList.remove("open");
          setTimeout(() => $("#vaultPw").focus(), 400);
        }
      }
      openOverlay("albumOverlay");
      sfx("paper");
    }

    function showVault() {
      form.hidden = true;
      renderGrid(vaultItems, "The folder is unlocked, but it's empty.");
      const relock = document.createElement("button");
      relock.className = "btn btn-ghost small"; relock.textContent = "🔒 Lock it again";
      relock.addEventListener("click", () => {
        vaultItems.forEach((it) => URL.revokeObjectURL(it.url));
        vaultItems = null; $("#lockedFolderBtn").classList.remove("unlocked");
        closeOverlay("albumOverlay");
      });
      actions.appendChild(relock);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pw = $("#vaultPw").value;
      if (!pw) return;
      const btn = $("#vaultBtn"), msg = $("#vaultMsg");
      btn.disabled = true; msg.textContent = "Checking… 💭";
      try {
        if (!Vault.hasCrypto()) throw new Error("NO_CRYPTO");
        const res = await fetch(lockCfg.file || "assets/private/vault.enc", { cache: "no-store" });
        if (!res.ok) throw new Error("NO_FILE");
        const buf = await res.arrayBuffer();
        // forgiving: also try without spaces/capitals (so "Choty Hero 143" works too)
        const easy = pw.toLowerCase().replace(/\s+/g, "");
        let items;
        try { items = await Vault.unlock(buf, pw); }
        catch (e1) { if (e1.message === "WRONG_PASSWORD" && easy !== pw) items = await Vault.unlock(buf, easy); else throw e1; }
        vaultItems = items;
        $("#vaultLock").classList.add("open");
        $("#lockedFolderBtn").classList.add("unlocked");
        msg.textContent = "Unlocked! Welcome, my love ❤️";
        sfx("chime");
        const r = $("#vaultLock").getBoundingClientRect();
        FX.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 140, 8);
        FX.heartRain(50, 6000);
        setTimeout(showVault, 900);
      } catch (err) {
        const code = err.message;
        if (code === "WRONG_PASSWORD") {
          msg.textContent = "Ghalat password! 😜 Try again, my love.";
          form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
          sfx("boing");
        } else if (code === "NO_FILE") {
          msg.textContent = "The folder is empty for now. Lock your photos with tools/lock-photos.html and put vault.enc in assets/private/ 💌";
        } else if (code === "NO_CRYPTO") {
          msg.textContent = "Please open the website online (or with a local server) to unlock this folder.";
        } else {
          msg.textContent = "This locked file looks damaged. Please lock the photos again. 🙏";
        }
      }
      btn.disabled = false;
    });

    $("#familyFolderBtn").addEventListener("click", () => openAlbum("family"));
    $("#lockedFolderBtn").addEventListener("click", () => openAlbum("locked"));
    if (hasGsap) gsap.fromTo(".folder", { opacity: 0, y: 60, rotateX: 30 }, { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.2, ease: "power3.out", scrollTrigger: { trigger: ".folder-row", start: "top 85%", once: true } });
  }

  /* ------------------------------------------------------------------
     6. LOVE LETTER
     ------------------------------------------------------------------ */
  function initLetter() {
    const env = $("#envelope");
    const textEl = $("#letterText");
    let written = false;

    C.letter.forEach((para, i) => {
      const p = document.createElement("p");
      const last = C.letter.length;
      p.className = i === 0 ? "l-head" : i === 1 ? "l-sub" : i >= last - 2 ? "l-sign" : "l-body";
      p.innerHTML = para.split(" ").map((w) => `<span class="w">${w}</span>`).join(" ");
      textEl.appendChild(p);
    });
    const skip = document.createElement("button");
    skip.className = "btn btn-ghost small letter-skip"; skip.textContent = "Show the whole letter ✨";
    textEl.appendChild(skip);

    let tween = null;
    skip.addEventListener("click", () => { if (tween) tween.progress(1); else $$(".w", textEl).forEach((w) => (w.style.opacity = 1)); skip.remove(); });

    env.addEventListener("click", () => {
      if (env.classList.contains("open")) return;
      env.classList.add("open");
      sfx("paper");
      const r = env.getBoundingClientRect();
      setTimeout(() => FX.sparkleBurst(r.left + r.width / 2, r.top + r.height * 0.3, 80, 5), 500);
      setTimeout(() => {
        openOverlay("letterOverlay");
        const petals = $("#letterPetals"); if (!petals.children.length) FX.petals(petals, 22);
        if (!written) {
          written = true;
          if (hasGsap && !reduce) {
            gsap.fromTo("#paper", { y: 120, rotateX: 30, opacity: 0, scale: 0.8 }, { y: 0, rotateX: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power3.out" });
            const words = $$(".w", textEl);
            gsap.set(words, { opacity: 0, y: 6, filter: "blur(4px)" });
            let lastPara = null;
            tween = gsap.to(words, {
              opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power1.out", stagger: 0.055, delay: 1,
              onUpdate() {
                // keep the newest written line in view
                const idx = Math.floor(this.progress() * words.length);
                const para = words[Math.min(idx, words.length - 1)].parentElement;
                if (para !== lastPara) { lastPara = para; para.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
              },
              onComplete() { skip.remove(); const pr = $("#paper").getBoundingClientRect(); FX.sparkleBurst(pr.left + pr.width / 2, pr.bottom - 60, 120, 6); sfx("chime"); }
            });
          } else skip.remove();
        }
      }, 1100);
    });
  }
  function onLetterClose() { $("#envelope").classList.remove("open"); }

  /* ------------------------------------------------------------------
     7. QUOTES CAROUSEL
     ------------------------------------------------------------------ */
  const QUOTE_BG = [
    "radial-gradient(ellipse at 20% 30%, #5b1f6b 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, #2a0f45 0%, transparent 60%)",
    "radial-gradient(ellipse at 70% 20%, #7a2048 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #1d0b38 0%, transparent 60%)",
    "radial-gradient(ellipse at 50% 0%, #3b1a6e 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, #6b1f3d 0%, transparent 60%)",
    "radial-gradient(ellipse at 10% 60%, #6e3a12 0%, transparent 55%), radial-gradient(ellipse at 90% 30%, #3d1460 0%, transparent 60%)",
    "radial-gradient(ellipse at 60% 50%, #5e1c4f 0%, transparent 60%), radial-gradient(ellipse at 0% 0%, #1a1450 0%, transparent 60%)",
    "radial-gradient(ellipse at 30% 20%, #7a5a1a 0%, transparent 55%), radial-gradient(ellipse at 70% 90%, #3a0f40 0%, transparent 60%)",
    "radial-gradient(ellipse at 80% 40%, #2b2a78 0%, transparent 60%), radial-gradient(ellipse at 10% 90%, #6a1a3a 0%, transparent 60%)",
    "radial-gradient(ellipse at 50% 50%, #6b2350 0%, transparent 60%), radial-gradient(ellipse at 100% 0%, #3b1260 0%, transparent 60%)"
  ];
  function buildQuotes() {
    const stage = $("#quoteStage"), dots = $("#qDots"), bg = $("#quoteBg");
    let idx = 0, timer = null;
    C.quotes.forEach((q, i) => {
      const d = document.createElement("button");
      d.className = "q-dot"; d.setAttribute("aria-label", "Quote " + (i + 1));
      d.addEventListener("click", () => go(i, i > idx ? 1 : -1));
      dots.appendChild(d);
    });
    function go(i, dir = 1) {
      idx = (i + C.quotes.length) % C.quotes.length;
      $$(".q-dot", dots).forEach((d, k) => d.classList.toggle("active", k === idx));
      bg.style.background = QUOTE_BG[idx % QUOTE_BG.length];
      const old = $(".quote", stage);
      const q = document.createElement("blockquote");
      q.className = "quote";
      q.innerHTML = `<span class="q-mark">“</span>${C.quotes[idx].split(" ").map((w) => `<span class="qw">${w}</span>`).join(" ")}<span class="q-heart">❤</span>`;
      stage.appendChild(q);
      if (hasGsap) {
        $$(".quote", stage).forEach((o) => { if (o !== q) { gsap.killTweensOf(o); gsap.to(o, { opacity: 0, y: -30 * dir, filter: "blur(8px)", duration: 0.45, onComplete: () => o.remove() }); } });
        const d = old ? 0.5 : 0;
        gsap.set(q, { opacity: 0 });
        gsap.to(q, { opacity: 1, duration: 0.01, delay: d });
        gsap.fromTo($$(".qw", q), { opacity: 0, y: 24, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.06, duration: 0.8, ease: "power3.out", delay: d });
      } else $$(".quote", stage).forEach((o) => { if (o !== q) o.remove(); });
    }
    function auto() { clearInterval(timer); timer = setInterval(() => go(idx + 1), 6500); }
    $("#qNext").addEventListener("click", () => { go(idx + 1, 1); sfx("pop"); auto(); });
    $("#qPrev").addEventListener("click", () => { go(idx - 1, -1); sfx("pop"); auto(); });
    let tx = null;
    stage.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
    stage.addEventListener("touchend", (e) => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); auto(); } tx = null; });
    $("#quotes").addEventListener("mouseenter", () => clearInterval(timer));
    $("#quotes").addEventListener("mouseleave", auto);
    go(0); auto();
  }

  /* ------------------------------------------------------------------
     8. FAITH — verses + light motes
     ------------------------------------------------------------------ */
  function buildVerses() {
    const grid = $("#verseGrid");
    C.verses.forEach((v) => {
      const card = document.createElement("article");
      card.className = "verse-card";
      card.innerHTML = `<span class="verse-cross">✦</span><p class="verse-text">“${v.text}”</p><p class="verse-ref">${v.ref}</p>`;
      grid.appendChild(card);
    });
    const motes = $("#lightMotes");
    const n = FX.isMobile ? 20 : 40;
    for (let i = 0; i < n; i++) {
      const m = document.createElement("i");
      m.style.left = Math.random() * 100 + "%";
      m.style.animationDuration = 8 + Math.random() * 10 + "s";
      m.style.animationDelay = -Math.random() * 15 + "s";
      m.style.setProperty("--s", (0.5 + Math.random()).toFixed(2));
      motes.appendChild(m);
    }
    if (hasGsap) gsap.fromTo(".verse-card", { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: grid, start: "top 80%", once: true } });
    if (hasGsap) gsap.fromTo(".open-bible", { opacity: 0, rotateX: 60, y: 40 }, { opacity: 1, rotateX: 25, y: 0, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: ".open-bible", start: "top 85%", once: true } });
  }

  /* ------------------------------------------------------------------
     9. MAMA — glowing flowers
     ------------------------------------------------------------------ */
  function buildMama() {
    const box = $("#mamaFlowers");
    const flowers = ["🌸", "🌷", "🌼", "💮", "🌺", "✿"];
    const n = FX.isMobile ? 14 : 26;
    for (let i = 0; i < n; i++) {
      const f = document.createElement("span");
      f.textContent = flowers[i % flowers.length];
      f.style.left = Math.random() * 100 + "%";
      f.style.top = Math.random() * 100 + "%";
      f.style.fontSize = 14 + Math.random() * 26 + "px";
      f.style.animationDelay = -Math.random() * 8 + "s";
      f.style.animationDuration = 6 + Math.random() * 6 + "s";
      box.appendChild(f);
    }
  }

  /* ------------------------------------------------------------------
     10. BEACH — scroll-driven sunset → moonlit night
     ------------------------------------------------------------------ */
  function initBeach() {
    let beach = null;
    if (window.Scenes && Scenes.supported) {
      try { beach = Scenes.BeachScene($("#beachCanvas")); } catch (e) { console.warn("Beach 3D failed", e); }
    }
    if (!beach) $("#beach").classList.add("css-beach");
    FX.petals($(".beach-overlay"), 14);

    const steps = $$("[data-beach-step]");
    if (!hasGsap || !window.ScrollTrigger) { steps.forEach((s) => (s.style.opacity = 1)); return; }

    // split the promise into words so it "writes itself" as you scroll
    const promise = $("#beachPromise");
    promise.innerHTML = promise.textContent.split(" ").map((w) => `<span class="pw">${w}</span>`).join(" ");
    const words = $$(".pw", promise);

    gsap.set(steps, { opacity: 0, y: 30 });
    gsap.set(promise, { opacity: 1, y: 0 });
    gsap.set(words, { opacity: 0, y: 8, filter: "blur(6px)" });
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      scrollTrigger: {
        trigger: "#beach", start: "top top", end: "bottom bottom", scrub: 0.8,
        onUpdate: (self) => beach && beach.setProgress(self.progress)
      }
    });
    tl.to(steps[0], { opacity: 1, y: 0, duration: 1 })
      .to(steps[1], { opacity: 1, y: 0, duration: 1 }, "+=0.3")
      .to(steps[2], { opacity: 1, y: 0, duration: 1 }, "+=0.3")
      .to(steps[3], { opacity: 1, y: 0, duration: 1 }, "+=0.3")
      .to([steps[0], steps[1], steps[2], steps[3]], { opacity: 0, y: -40, duration: 0.9, stagger: 0.08 }, "+=1")
      .to(steps[4], { opacity: 1, y: 0, duration: 1 })
      .to(words, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, stagger: 0.12 }, "+=0.3")
      .to(steps[6], { opacity: 1, y: 0, duration: 0.8 }, "+=0.2")
      .to({}, { duration: 1 });
  }

  /* ------------------------------------------------------------------
     10b. LANTERN MESSAGE WALL (shared with everyone via /api/messages)
     ------------------------------------------------------------------ */
  function initWishes() {
    const API = "/api/messages";
    const wall = $("#wishWall"), form = $("#wishForm"), status = $("#wishStatus");
    const text = $("#wishText"), count = $("#wishCount"), btn = $("#wishBtn");
    let adminKey = null;
    try { adminKey = new URLSearchParams(location.search).get("admin"); } catch (e) {}
    let online = true;

    // decorative twinkling stars for the section background
    const stars = $(".wish-stars");
    for (let i = 0; i < (FX.isMobile ? 40 : 90); i++) {
      const st = document.createElement("i");
      st.style.left = Math.random() * 100 + "%"; st.style.top = Math.random() * 70 + "%";
      st.style.animationDelay = -Math.random() * 4 + "s"; st.style.setProperty("--s", (0.5 + Math.random()).toFixed(2));
      stars.appendChild(st);
    }

    const timeAgo = (iso) => {
      const s = (Date.now() - new Date(iso).getTime()) / 1000;
      if (s < 60) return "just now";
      if (s < 3600) return Math.floor(s / 60) + " min ago";
      if (s < 86400) return Math.floor(s / 3600) + " h ago";
      return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    };

    function card(m, fresh) {
      const c = document.createElement("article");
      c.className = "wish-card" + (fresh ? " fresh" : "");
      c.style.setProperty("--tilt", ((parseInt(m.id.slice(-2), 16) % 7) - 3) * 0.8 + "deg");
      const lantern = document.createElement("span"); lantern.className = "wish-lantern"; lantern.textContent = "🏮";
      const p = document.createElement("p"); p.className = "wish-msg"; p.textContent = m.message;
      const who = document.createElement("p"); who.className = "wish-who";
      const b = document.createElement("b"); b.textContent = "— " + m.name;
      const t = document.createElement("span"); t.textContent = timeAgo(m.createdAt);
      who.append(b, t);
      c.append(lantern, p, who);
      if (adminKey) {
        const del = document.createElement("button");
        del.className = "wish-del"; del.textContent = "🗑"; del.title = "Delete this message";
        del.addEventListener("click", async () => {
          const r = await fetch(API + "?id=" + encodeURIComponent(m.id), { method: "DELETE", headers: { "x-admin-key": adminKey } });
          if (r.ok) c.remove(); else alertStatus("Could not delete (check the admin key).");
        });
        c.appendChild(del);
      }
      return c;
    }

    function alertStatus(msg, ok) { status.textContent = msg; status.classList.toggle("ok", !!ok); }

    function renderEmpty() {
      if (!wall.querySelector(".wish-card")) wall.innerHTML = `<p class="wish-empty">No lanterns yet… be the first to send one! 🏮</p>`;
    }

    async function load() {
      try {
        const r = await fetch(API, { cache: "no-store" });
        if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error("offline");
        const data = await r.json();
        wall.innerHTML = "";
        data.messages.forEach((m) => wall.appendChild(card(m)));
        renderEmpty();
        if (hasGsap && data.messages.length) gsap.fromTo($$(".wish-card", wall), { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.7, ease: "power3.out" });
      } catch (e) {
        online = false;
        wall.innerHTML = `<p class="wish-empty">💌 The message wall comes alive once the website is online on Netlify (see README). Messages written there will appear here for everyone.</p>`;
      }
    }

    text.addEventListener("input", () => (count.textContent = text.value.length + " / 500"));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = text.value.trim();
      if (message.length < 2) { alertStatus("Please write a little message 💌"); return; }
      if (!online) { alertStatus("The message wall works once the website is online 🙂"); return; }
      btn.disabled = true; alertStatus("Releasing your lantern…");
      try {
        const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: $("#wishName").value, message, website: $("#wishWebsite").value }) });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Something went wrong. Please try again.");
        // a lantern floats up from the button
        const br = btn.getBoundingClientRect();
        const fly = document.createElement("span"); fly.className = "fly-lantern"; fly.textContent = "🏮";
        fly.style.left = br.left + br.width / 2 + "px"; fly.style.top = br.top + "px";
        fly.addEventListener("animationend", () => fly.remove());
        document.body.appendChild(fly);
        FX.sparkleBurst(br.left + br.width / 2, br.top, 70, 5); sfx("chime");
        const empty = $(".wish-empty", wall); if (empty) empty.remove();
        if (data.message) {
          const c = card(data.message, true); wall.prepend(c);
          if (hasGsap) gsap.fromTo(c, { opacity: 0, scale: 0.6, y: -30 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: "back.out(1.7)" });
        }
        text.value = ""; count.textContent = "0 / 500";
        alertStatus("Thank you! Your lantern is shining on our wall ❤️", true);
      } catch (err) {
        alertStatus(err.message);
      }
      btn.disabled = false;
    });

    load();
  }

  /* ------------------------------------------------------------------
     11. FINAL SURPRISE
     ------------------------------------------------------------------ */
  function initFinal() {
    let finalHeart = null;
    if (window.Scenes && Scenes.supported) {
      try { finalHeart = Scenes.HeartScene($("#finalCanvas"), { anchor: $(".final-photo .magic-frame"), corner: [0.5, 0.5], size: 1.5, particles: 220 }); } catch (e) { console.warn(e); }
    }
    let fwTimer = null, slideTimer = null;
    $("#openHeartBtn").addEventListener("click", () => {
      finalHeart && finalHeart.pulse();
      sfx("heartbeat");
      const r = $("#openHeartBtn").getBoundingClientRect();
      FX.sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 160, 8);
      setTimeout(() => {
        openOverlay("finalOverlay");
        buildFinalSlides();
        const lines = $$("#finalMessage p");
        $("#finalActions").style.opacity = 0;
        if (hasGsap) {
          gsap.set(lines, { opacity: 0, y: 30, filter: "blur(10px)" });
          const step = reduce ? 0.3 : 1.7;
          const tl = gsap.timeline({ delay: 0.8, onComplete() { gsap.to("#finalActions", { opacity: 1, duration: 1 }); FX.fireworks(8); FX.heartRain(120, 9000); sfx("chime"); } });
          lines.forEach((line, i) => {
            tl.to(line, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, ease: "power3.out" }, i * step)
              .call(() => line.scrollIntoView({ behavior: "smooth", block: "nearest" }), null, i * step);
          });
        } else { lines.forEach((l) => (l.style.opacity = 1)); $("#finalActions").style.opacity = 1; }
        FX.heartRain(80, 8000);
        FX.fireworks(4);
        clearInterval(fwTimer);
        fwTimer = setInterval(() => { if ($("#finalOverlay").classList.contains("open")) FX.fireworks(2); else clearInterval(fwTimer); }, 6000);
      }, 500);
    });
    $("#moreFireworks").addEventListener("click", () => { FX.fireworks(10); FX.heartRain(60, 7000); });

    function buildFinalSlides() {
      const box = $("#finalSlides");
      if (!box.children.length) {
        CFG.finalSlideshow.forEach((src) => { const s = smartImage(src, "Us", "Our favorite photo"); s.classList.add("fs"); box.appendChild(s); });
      }
      const slides = $$(".fs", box);
      let k = 0;
      slides.forEach((s, i) => s.classList.toggle("on", i === 0));
      clearInterval(slideTimer);
      slideTimer = setInterval(() => {
        if (!$("#finalOverlay").classList.contains("open")) { clearInterval(slideTimer); return; }
        slides[k].classList.remove("on"); k = (k + 1) % slides.length; slides[k].classList.add("on");
      }, 5000);
    }
  }

  /* ------------------------------------------------------------------
     GENERIC REVEALS & OVERLAYS
     ------------------------------------------------------------------ */
  function initReveals() {
    if (!hasGsap) return;
    $$(".section-head").forEach((h) => {
      gsap.fromTo(h.children, { opacity: 0, y: 40, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 85%", once: true } });
    });
    $$("main .reveal-up").forEach((el) => {
      if (el.closest("#hero")) return;
      gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    // little sparkle when a section comes into view (magical transitions)
    $$("main > section").forEach((s) => {
      ScrollTrigger.create({ trigger: s, start: "top 55%", once: true, onEnter: () => s.classList.add("entered") });
    });
  }

  const overlayStack = [];
  function openOverlay(id) {
    const o = document.getElementById(id);
    if (o.classList.contains("open")) return;
    o.classList.add("open");
    overlayStack.push(id);
    document.body.classList.add("overlay-open");
  }
  function closeOverlay(id) {
    const o = document.getElementById(id);
    if (!o || !o.classList.contains("open")) return;
    o.classList.remove("open");
    const i = overlayStack.indexOf(id); if (i > -1) overlayStack.splice(i, 1);
    if (!overlayStack.length) document.body.classList.remove("overlay-open");
    if (id === "lightbox") { stopVideo(); stopSlideshow(); lbMedia.innerHTML = ""; }
    if (id === "letterOverlay") onLetterClose();
  }
  function closeAllOverlays() { [...overlayStack].forEach(closeOverlay); }
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-close]");
    if (c) { closeOverlay(c.dataset.close); sfx("pop"); return; }
    if (e.target.classList && e.target.classList.contains("overlay")) closeOverlay(e.target.id);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlayStack.length) closeOverlay(overlayStack[overlayStack.length - 1]);
    if ($("#lightbox").classList.contains("open")) {
      if (e.key === "ArrowRight") lbStep(1);
      if (e.key === "ArrowLeft") lbStep(-1);
    }
  });

  /* ------------------------------------------------------------------
     FLOATING CONTROLS
     ------------------------------------------------------------------ */
  function updateMusicBtn() {
    const on = AudioFX.isMusicOn();
    $("#musicToggle").classList.toggle("off", !on);
    $("#musicToggle").title = on ? "Pause music" : "Play music";
  }
  function updateSfxBtn() {
    const on = AudioFX.isSfxOn();
    $("#sfxToggle").textContent = on ? "🔔" : "🔕";
    $("#sfxToggle").classList.toggle("off", !on);
    $("#sfxToggle").title = on ? "Mute sound effects" : "Unmute sound effects";
  }
  $("#musicToggle").addEventListener("click", () => { AudioFX.toggleMusic(); updateMusicBtn(); });
  $("#sfxToggle").addEventListener("click", () => { AudioFX.toggleSfx(); updateSfxBtn(); sfx("pop"); });
  $("#fireworksBtn").addEventListener("click", () => { FX.fireworks(7); FX.heartRain(40, 6000); });
  $("#fcMore").addEventListener("click", () => {
    const open = $(".floating-controls").classList.toggle("expanded");
    $("#fcMore").setAttribute("aria-expanded", open);
    $("#fcMore").textContent = open ? "×" : "✨";
    sfx("pop");
  });
  updateSfxBtn(); updateMusicBtn();

  /* ------------------------------------------------------------------
     HIDDEN SECRET MESSAGE  (tiny heart in hero, or type "hero")
     ------------------------------------------------------------------ */
  function showSecret() {
    $("#secretText").textContent = CFG.secretMessage;
    openOverlay("secretOverlay");
    sfx("sparkle");
    FX.sparkleBurst(innerWidth / 2, innerHeight / 2, 120, 8);
  }
  $("#secretHeart").addEventListener("click", showSecret);
  let typed = "";
  document.addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed.endsWith("hero") || typed.endsWith("hubby")) { typed = ""; showSecret(); }
  });
})();
