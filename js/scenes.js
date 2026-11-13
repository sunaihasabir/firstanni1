/* =====================================================================
   🌌  3D SCENES (Three.js)
   • OpeningScene – stars, golden particles, rotating heart, gift box
   • HeartScene   – floating glowing heart (hero + final section)
   • BeachScene   – ocean waves, sunset → moonlit night, sky lanterns
   Every scene pauses itself when it is off-screen to save battery.
   If WebGL is unavailable the site still works (CSS fallbacks).
   ===================================================================== */

(function () {
  const hasThree = typeof window.THREE !== "undefined";
  const supportsWebGL = (() => {
    if (!hasThree) return false;
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
    catch (e) { return false; }
  })();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

  if (!supportsWebGL) {
    document.documentElement.classList.add("no-webgl");
    window.Scenes = { supported: false };
    return;
  }
  const T = THREE;

  /* ---------- helpers ---------- */
  function makeRenderer(canvas, alpha = true) {
    const r = new T.WebGLRenderer({ canvas, antialias: !isMobile, alpha, powerPreference: "high-performance" });
    r.setPixelRatio(DPR);
    r.outputEncoding = T.sRGBEncoding;
    return r;
  }

  function heartGeometry(depth = 0.45) {
    const s = new T.Shape();
    // classic bezier heart (≈ 2 units wide)
    s.moveTo(0, 0.55);
    s.bezierCurveTo(0, 0.6, -0.1, 1.0, -0.5, 1.0);
    s.bezierCurveTo(-1.1, 1.0, -1.1, 0.3, -1.1, 0.3);
    s.bezierCurveTo(-1.1, -0.1, -0.7, -0.55, 0, -1.0);
    s.bezierCurveTo(0.7, -0.55, 1.1, -0.1, 1.1, 0.3);
    s.bezierCurveTo(1.1, 0.3, 1.1, 1.0, 0.5, 1.0);
    s.bezierCurveTo(0.2, 1.0, 0, 0.6, 0, 0.55);
    const geo = new T.ExtrudeGeometry(s, {
      depth, bevelEnabled: true, bevelThickness: 0.28, bevelSize: 0.22, bevelSegments: isMobile ? 6 : 12, curveSegments: isMobile ? 24 : 48
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }

  function heartMaterial() {
    return new T.MeshPhysicalMaterial({
      color: 0xe0164f, emissive: 0x6a0024, emissiveIntensity: 0.45,
      roughness: 0.22, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.15
    });
  }

  let glowTex = null;
  function glowTexture() {
    if (glowTex) return glowTex;
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d");
    const grd = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,230,190,0.7)");
    grd.addColorStop(1, "rgba(255,200,150,0)");
    x.fillStyle = grd; x.fillRect(0, 0, 128, 128);
    glowTex = new T.CanvasTexture(c);
    return glowTex;
  }

  // Points with soft round sprites + twinkle, drawn by a tiny shader
  function particleField({ count, radius = [20, 60], color = [1, 1, 1], size = 1.6, box = null, twinkle = 1 }) {
    const pos = new Float32Array(count * 3), phase = new Float32Array(count), scale = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      if (box) {
        pos[i * 3] = (Math.random() - 0.5) * box[0];
        pos[i * 3 + 1] = (Math.random() - 0.5) * box[1];
        pos[i * 3 + 2] = (Math.random() - 0.5) * box[2];
      } else {
        const r = radius[0] + Math.random() * (radius[1] - radius[0]);
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph);
      }
      phase[i] = Math.random() * 6.28; scale[i] = 0.4 + Math.random() * 1.2;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    geo.setAttribute("aPhase", new T.BufferAttribute(phase, 1));
    geo.setAttribute("aScale", new T.BufferAttribute(scale, 1));
    const mat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new T.Color(...color) }, uSize: { value: size * DPR },
        uOpacity: { value: 1 }, uTwinkle: { value: twinkle }, uRise: { value: 0 }, uHeight: { value: box ? box[1] : 0 } },
      vertexShader: `
        attribute float aPhase; attribute float aScale;
        uniform float uTime, uSize, uTwinkle, uRise, uHeight;
        varying float vTw;
        void main(){
          vec3 p = position;
          if (uRise > 0.0) {
            p.y = mod(p.y + uTime * uRise * aScale + uHeight*0.5, uHeight) - uHeight*0.5;
            p.x += sin(uTime*0.6 + aPhase) * 0.3;
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vTw = mix(1.0, 0.45 + 0.55*sin(uTime*2.0 + aPhase*3.0), uTwinkle);
          gl_PointSize = uSize * aScale * (30.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uOpacity; varying float vTw;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          a = pow(a, 1.6);
          gl_FragColor = vec4(uColor, a * vTw * uOpacity);
        }`
    });
    return new T.Points(geo, mat);
  }

  // Run a render loop only while the canvas is visible
  function visibilityLoop(canvas, tick) {
    let visible = false, raf = 0, last = performance.now(), dead = false;
    const frame = (now) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      tick(dt, now / 1000);
      if (visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      const was = visible; visible = e.isIntersecting;
      if (visible && !was && !dead) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }, { rootMargin: "100px" });
    io.observe(canvas);
    return { stop() { dead = true; cancelAnimationFrame(raf); io.disconnect(); } };
  }

  function fit(renderer, camera, canvas) {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  /* =================================================================
     OPENING SCENE
     ================================================================= */
  function OpeningScene(canvas) {
    const renderer = makeRenderer(canvas);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 0, 9);

    scene.add(new T.AmbientLight(0x9a7cff, 0.22));
    const key = new T.PointLight(0xffd9a0, 0.8, 30); key.position.set(3, 1.5, 7); scene.add(key);
    const pink = new T.PointLight(0xff4f8b, 0.9, 30); pink.position.set(-4, -1, 5); scene.add(pink);
    const rim = new T.PointLight(0x8a5cff, 1.1, 30); rim.position.set(0, 3, -4); scene.add(rim);

    const stars = particleField({ count: isMobile ? 1800 : 3500, radius: [25, 80], color: [1, 0.95, 0.9], size: 2.2 });
    scene.add(stars);
    const gold = particleField({ count: isMobile ? 160 : 320, box: [18, 14, 8], color: [1, 0.78, 0.4], size: 4, twinkle: 0.7 });
    gold.material.uniforms.uRise.value = 0.35;
    scene.add(gold);

    // Heart
    const heart = new T.Mesh(heartGeometry(), heartMaterial());
    // heart shape is already upright (point at the bottom)
    const heartPivot = new T.Group(); heartPivot.add(heart);
    heartPivot.scale.setScalar(0.62);
    scene.add(heartPivot);
    const heartGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), color: 0xff5c8a, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }));
    heartGlow.scale.set(4.2, 4.2, 1); heartPivot.add(heartGlow); heartGlow.position.z = -0.6;

    // Gift box
    const gift = new T.Group();
    const boxMat = new T.MeshStandardMaterial({ color: 0x3d0d63, roughness: 0.38, metalness: 0.3, emissive: 0x12021f });
    const ribbonMat = new T.MeshStandardMaterial({ color: 0xe8a93c, roughness: 0.22, metalness: 0.9, emissive: 0x6b3f06, emissiveIntensity: 0.55 });
    const body = new T.Mesh(new T.BoxGeometry(1.7, 1.25, 1.7), boxMat); gift.add(body);
    const rb1 = new T.Mesh(new T.BoxGeometry(0.26, 1.27, 1.72), ribbonMat); gift.add(rb1);
    const rb2 = new T.Mesh(new T.BoxGeometry(1.72, 1.27, 0.26), ribbonMat); gift.add(rb2);

    const lid = new T.Group(); lid.position.y = 0.76;
    lid.add(new T.Mesh(new T.BoxGeometry(1.86, 0.32, 1.86), boxMat));
    lid.add(new T.Mesh(new T.BoxGeometry(0.28, 0.34, 1.88), ribbonMat));
    lid.add(new T.Mesh(new T.BoxGeometry(1.88, 0.34, 0.28), ribbonMat));
    const loopGeo = new T.TorusGeometry(0.32, 0.09, 12, 32);
    const bowL = new T.Mesh(loopGeo, ribbonMat); bowL.position.set(-0.3, 0.38, 0); bowL.rotation.set(0, 0, 0.6); bowL.scale.set(1, 0.7, 1); lid.add(bowL);
    const bowR = new T.Mesh(loopGeo, ribbonMat); bowR.position.set(0.3, 0.38, 0); bowR.rotation.set(0, 0, -0.6); bowR.scale.set(1, 0.7, 1); lid.add(bowR);
    const knot = new T.Mesh(new T.SphereGeometry(0.14, 16, 16), ribbonMat); knot.position.y = 0.3; lid.add(knot);
    gift.add(lid);
    const giftGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), color: 0xffc46b, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }));
    giftGlow.scale.set(5, 5, 1); giftGlow.position.z = -1; gift.add(giftGlow);
    gift.rotation.set(0.28, -0.6, 0);
    scene.add(gift);

    let opened = false;
    const mouse = { x: 0, y: 0 };
    const onMove = (e) => { mouse.x = (e.clientX / innerWidth - 0.5); mouse.y = (e.clientY / innerHeight - 0.5); };
    window.addEventListener("pointermove", onMove, { passive: true });

    function layout() {
      fit(renderer, camera, canvas);
      // keep the gift + heart in the lower ~40% of the screen, below the text
      const visH = 2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      const small = camera.aspect < 0.8;
      const s = small ? 0.62 : 0.72;
      gift.scale.setScalar(s);
      gift.position.set(0, -visH / 2 + visH * (small ? 0.12 : 0.13), 0);
      if (!opened) {
        heartPivot.position.set(0, -visH / 2 + visH * (small ? 0.28 : 0.3), -0.4);
        heartPivot.scale.setScalar(small ? 0.32 : 0.38);
      }
    }
    layout();
    window.addEventListener("resize", layout);

    let t = 0;
    const loop = visibilityLoop(canvas, (dt) => {
      t += dt;
      stars.material.uniforms.uTime.value = t;
      gold.material.uniforms.uTime.value = t;
      stars.rotation.y += dt * 0.01;
      heart.rotation.y += dt * (opened ? 1.6 : 0.7);
      heartPivot.position.y += Math.sin(t * 1.5) * 0.0025;
      const beat = 1 + Math.max(0, Math.sin(t * 5)) * 0.04;
      heart.scale.setScalar(beat);
      if (!opened) {
        gift.rotation.y += dt * 0.25;
        lid.rotation.z = Math.sin(t * 3) * 0.015;
      }
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    });

    function screenPos(obj) {
      const v = new T.Vector3(); obj.getWorldPosition(v); v.project(camera);
      return { x: (v.x * 0.5 + 0.5) * canvas.clientWidth, y: (-v.y * 0.5 + 0.5) * canvas.clientHeight };
    }

    return {
      giftScreenPos: () => screenPos(lid),
      /** Opening animation; resolves when it's time to reveal the site */
      open() {
        return new Promise((resolve) => {
          if (!window.gsap) { opened = true; resolve(); return; }
          const tl = gsap.timeline({ onComplete: resolve });
          tl.to(gift.rotation, { y: "+=" + (Math.PI * 2 - (gift.rotation.y % (Math.PI * 2)) - 0.6), duration: 0.5, ease: "power2.out" })
            .to(gift.position, { x: "+=0.06", yoyo: true, repeat: 5, duration: 0.05 }, "<0.2")
            .add(() => { opened = true; })
            .to(lid.position, { y: 3.2, x: 1.4, duration: 1.1, ease: "power3.out" })
            .to(lid.rotation, { z: -1.2, x: 0.6, duration: 1.1, ease: "power3.out" }, "<")
            .to(giftGlow.material, { opacity: 1, duration: 0.4 }, "<")
            .to(giftGlow.scale, { x: 12, y: 12, duration: 1.2, ease: "power2.out" }, "<")
            .to(heartPivot.position, { y: 0.2, z: 1, duration: 1.4, ease: "power3.out" }, "<0.1")
            .to(heartPivot.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 1.4, ease: "back.out(1.6)" }, "<")
            .to(camera.position, { z: 7.6, duration: 2, ease: "power2.inOut" }, "<")
            .to(gold.material.uniforms.uRise, { value: 2.5, duration: 1 }, "<");
        });
      },
      reset() {
        opened = false;
        lid.position.set(0, 0.76, 0); lid.rotation.set(0, 0, 0);
        giftGlow.material.opacity = 0.35; giftGlow.scale.set(5, 5, 1);
        gold.material.uniforms.uRise.value = 0.35;
        camera.position.set(0, 0, 9);
        layout();
      }
    };
  }

  /* =================================================================
     HEART SCENE (hero + final)
     ================================================================= */
  function HeartScene(canvas, { anchor, corner = [0.5, 0.5], size = 1, offset = [0, 0], particles = 140 } = {}) {
    const renderer = makeRenderer(canvas);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 10;

    scene.add(new T.AmbientLight(0xb08cff, 0.25));
    const l1 = new T.PointLight(0xffd9a0, 1.3, 40); l1.position.set(4, 5, 7); scene.add(l1);
    const l2 = new T.PointLight(0xff4f8b, 1.0, 40); l2.position.set(-5, -2, 6); scene.add(l2);

    const group = new T.Group(); scene.add(group);
    const heart = new T.Mesh(heartGeometry(), heartMaterial());

    group.add(heart);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), color: 0xff6b9a, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false }));
    glow.scale.set(5.5, 5.5, 1); glow.position.z = -0.8; group.add(glow);

    // little golden orbiters
    const orbit = particleField({ count: particles, box: [5, 5, 5], color: [1, 0.82, 0.45], size: 3.2, twinkle: 0.8 });
    group.add(orbit);
    const sparkle = particleField({ count: isMobile ? 120 : 260, box: [30, 18, 6], color: [1, 0.9, 0.75], size: 2.4, twinkle: 1 });
    sparkle.material.uniforms.uRise.value = 0.25;
    scene.add(sparkle);

    let mouse = { x: 0, y: 0 };
    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });

    function layout() {
      fit(renderer, camera, canvas);
      const visH = 2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      const visW = visH * camera.aspect;
      const cr = canvas.getBoundingClientRect();
      let sx = 0.5, sy = 0.5;
      if (anchor) {
        const r = anchor.getBoundingClientRect();
        sx = (r.left + r.width * corner[0] - cr.left) / cr.width;
        sy = (r.top + r.height * corner[1] - cr.top) / cr.height;
      }
      group.position.set((sx - 0.5) * visW + offset[0], -(sy - 0.5) * visH + offset[1], 0);
      const s = size * (camera.aspect < 0.8 ? 0.7 : 1);
      group.scale.setScalar(s);
    }
    layout();
    window.addEventListener("resize", layout);
    // anchor elements move when fonts/images load → re-layout a few times
    [300, 1200, 3000].forEach((ms) => setTimeout(layout, ms));

    let t = 0;
    const loop = visibilityLoop(canvas, (dt) => {
      t += dt;
      orbit.material.uniforms.uTime.value = t;
      sparkle.material.uniforms.uTime.value = t;
      heart.rotation.y += dt * 0.6;
      orbit.rotation.y -= dt * 0.3; orbit.rotation.x += dt * 0.1;
      const beat = 1 + Math.pow(Math.max(0, Math.sin(t * 4.2)), 8) * 0.08;
      heart.scale.setScalar(beat);
      glow.material.opacity = 0.45 + Math.sin(t * 2) * 0.12;
      group.rotation.x += ((mouse.y * 0.4) - group.rotation.x) * 0.05;
      group.rotation.z += ((-mouse.x * 0.25) - group.rotation.z) * 0.05;
      heart.position.y = Math.sin(t * 1.3) * 0.15;
      renderer.render(scene, camera);
    });

    return { layout, pulse() { if (window.gsap) gsap.fromTo(group.scale, { x: group.scale.x * 1.3, y: group.scale.y * 1.3, z: group.scale.z * 1.3 }, { x: group.scale.x, y: group.scale.y, z: group.scale.z, duration: 0.8, ease: "elastic.out(1,0.4)" }); } };
  }

  /* =================================================================
     BEACH SCENE — sunset → moonlit night, driven by scroll progress
     ================================================================= */
  function BeachScene(canvas) {
    const renderer = makeRenderer(canvas, false);
    renderer.setClearColor(0x120820);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(55, 1, 0.1, 1200);
    camera.position.set(0, 3.2, 14);
    camera.lookAt(0, 4, -60);

    const U = {
      uTime: { value: 0 },
      uNight: { value: 0 },
      uSunDir: { value: new T.Vector3(0, 0.08, -1).normalize() },
      uMoonDir: { value: new T.Vector3(-0.45, -0.1, -1).normalize() }
    };

    /* --- Sky dome --- */
    const sky = new T.Mesh(new T.SphereGeometry(600, 48, 24), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, uniforms: U,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        varying vec3 vDir; uniform float uNight, uTime; uniform vec3 uSunDir, uMoonDir;
        float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
        void main(){
          float h = clamp(vDir.y, -0.2, 1.0);
          vec3 sTop = vec3(0.17,0.06,0.33), sMid = vec3(0.93,0.42,0.40), sHor = vec3(1.0,0.72,0.42);
          vec3 nTop = vec3(0.01,0.01,0.05), nMid = vec3(0.05,0.07,0.20), nHor = vec3(0.18,0.13,0.32);
          vec3 sunset = mix(sHor, sMid, smoothstep(0.0, 0.12, h)); sunset = mix(sunset, sTop, smoothstep(0.1, 0.55, h));
          vec3 night = mix(nHor, nMid, smoothstep(0.0, 0.15, h)); night = mix(night, nTop, smoothstep(0.12, 0.7, h));
          vec3 col = mix(sunset, night, uNight);
          // sun halo
          float sd = max(dot(vDir, uSunDir), 0.0);
          col += vec3(1.0,0.6,0.3) * pow(sd, 18.0) * 0.6 * (1.0-uNight*0.8);
          col += vec3(1.0,0.85,0.6) * pow(sd, 400.0) * 1.5 * (1.0-uNight);
          // moon halo
          float md = max(dot(vDir, uMoonDir), 0.0);
          col += vec3(0.6,0.7,1.0) * pow(md, 60.0) * 0.35 * uNight;
          // stars
          vec3 g = floor(vDir * 260.0);
          float s = step(0.9965, hash(g));
          float tw = 0.5 + 0.5*sin(uTime*2.5 + hash(g+3.1)*40.0);
          col += vec3(1.0,0.95,0.85) * s * tw * smoothstep(0.03, 0.25, h) * smoothstep(0.35, 1.0, uNight);
          gl_FragColor = vec4(col, 1.0);
        }`
    }));
    scene.add(sky);

    /* --- Sun & Moon discs --- */
    const sun = new T.Mesh(new T.CircleGeometry(16, 48), new T.MeshBasicMaterial({ color: 0xffd79a, transparent: true, depthWrite: false }));
    const sunGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), color: 0xff9a55, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
    sunGlow.scale.set(140, 140, 1);
    scene.add(sun, sunGlow);
    const moon = new T.Mesh(new T.CircleGeometry(9, 48), new T.MeshBasicMaterial({ color: 0xf4f1ff, transparent: true, opacity: 0, depthWrite: false }));
    const moonGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), color: 0xb9c8ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    moonGlow.scale.set(80, 80, 1);
    scene.add(moon, moonGlow);

    /* --- Ocean --- */
    const seg = isMobile ? 140 : 220;
    const oceanGeo = new T.PlaneGeometry(900, 600, seg, seg);
    oceanGeo.rotateX(-Math.PI / 2);
    const ocean = new T.Mesh(oceanGeo, new T.ShaderMaterial({
      uniforms: U,
      vertexShader: `
        uniform float uTime; varying vec3 vWorld; varying vec3 vNormal; varying float vH;
        float wave(vec2 p, vec2 d, float freq, float amp, float speed){ return sin(dot(p, d)*freq + uTime*speed)*amp; }
        float height(vec2 p){
          float h = 0.0;
          h += wave(p, normalize(vec2(0.2,1.0)), 0.18, 0.55, 1.1);
          h += wave(p, normalize(vec2(-0.6,0.8)), 0.33, 0.25, 1.6);
          h += wave(p, normalize(vec2(0.9,0.4)), 0.7, 0.10, 2.3);
          h += wave(p, normalize(vec2(-0.3,-1.0)), 1.3, 0.04, 3.1);
          return h;
        }
        void main(){
          vec3 p = position;
          float atten = smoothstep(-260.0, 0.0, p.z) * 0.6 + 0.4;
          p.y = height(p.xz) * atten;
          vH = p.y;
          float e = 0.15;
          float hx = height(p.xz + vec2(e,0.0)) - height(p.xz - vec2(e,0.0));
          float hz = height(p.xz + vec2(0.0,e)) - height(p.xz - vec2(0.0,e));
          vNormal = normalize(vec3(-hx*atten, 2.0*e, -hz*atten));
          vec4 w = modelMatrix * vec4(p,1.0); vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: `
        uniform float uNight, uTime; uniform vec3 uSunDir, uMoonDir;
        varying vec3 vWorld; varying vec3 vNormal; varying float vH;
        void main(){
          vec3 n = normalize(vNormal);
          vec3 v = normalize(cameraPosition - vWorld);
          float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
          vec3 deepS = vec3(0.10,0.05,0.18), skyS = vec3(1.0,0.55,0.38);
          vec3 deepN = vec3(0.01,0.02,0.07), skyN = vec3(0.10,0.12,0.28);
          vec3 deep = mix(deepS, deepN, uNight), skyc = mix(skyS, skyN, uNight);
          vec3 col = mix(deep, skyc, clamp(fres*1.3, 0.0, 1.0));
          vec3 L = normalize(mix(uSunDir, uMoonDir, smoothstep(0.35, 0.75, uNight)));
          vec3 r = reflect(-L, n);
          float spec = pow(max(dot(r, v), 0.0), 90.0);
          float glitter = pow(max(dot(r, v), 0.0), 900.0);
          vec3 lc = mix(vec3(1.0,0.72,0.4), vec3(0.75,0.82,1.0), smoothstep(0.35,0.75,uNight));
          col += lc * spec * 1.6 + lc * glitter * 4.0;
          float dist = length(vWorld.xz - cameraPosition.xz);
          // magical glowing wave crests at night (bioluminescence)
          float crest = smoothstep(0.45, 0.85, vH);
          float shimmer = 0.6 + 0.4 * sin(uTime * 3.0 + vWorld.x * 0.7 + vWorld.z * 0.4);
          col += vec3(0.25, 0.85, 1.0) * crest * shimmer * smoothstep(0.55, 1.0, uNight) * (1.0 - smoothstep(25.0, 160.0, dist)) * 0.55;
          // horizon fog
          vec3 hor = mix(vec3(1.0,0.66,0.42), vec3(0.16,0.12,0.30), uNight);
          col = mix(col, hor, smoothstep(80.0, 320.0, dist));
          gl_FragColor = vec4(col, 1.0);
        }`
    }));
    ocean.position.z = -200;
    scene.add(ocean);

    /* --- Floating lanterns --- */
    const lanternTex = (() => {
      const c = document.createElement("canvas"); c.width = 64; c.height = 96;
      const x = c.getContext("2d");
      const glowG = x.createRadialGradient(32, 52, 2, 32, 52, 44);
      glowG.addColorStop(0, "rgba(255,200,120,0.9)"); glowG.addColorStop(1, "rgba(255,140,60,0)");
      x.fillStyle = glowG; x.fillRect(0, 0, 64, 96);
      const body = x.createLinearGradient(0, 24, 0, 80);
      body.addColorStop(0, "#ffb85c"); body.addColorStop(0.6, "#ff7a3d"); body.addColorStop(1, "#ffd27a");
      x.fillStyle = body;
      x.beginPath(); x.moveTo(20, 26); x.lineTo(44, 26); x.quadraticCurveTo(50, 50, 42, 76); x.lineTo(22, 76); x.quadraticCurveTo(14, 50, 20, 26); x.fill();
      x.fillStyle = "rgba(255,255,220,0.9)"; x.beginPath(); x.ellipse(32, 70, 6, 3, 0, 0, 7); x.fill();
      return new T.CanvasTexture(c);
    })();
    const lanterns = [];
    const LN = isMobile ? 26 : 48;
    for (let i = 0; i < LN; i++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: lanternTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }));
      const z = -20 - Math.random() * 160;
      sp.userData = { x: (Math.random() - 0.5) * (40 + -z * 0.9), z, y: Math.random() * 60, speed: 0.8 + Math.random() * 1.2, phase: Math.random() * 6.28, start: Math.random() };
      const sc = 1.8 + Math.random() * 1.2; sp.scale.set(sc, sc * 1.5, 1);
      scene.add(sp); lanterns.push(sp);
    }

    /* --- Sparkles over water --- */
    const motes = particleField({ count: isMobile ? 120 : 260, box: [60, 20, 40], color: [1, 0.85, 0.6], size: 3, twinkle: 1 });
    motes.position.set(0, 8, -15);
    motes.material.uniforms.uRise.value = 0.15;
    scene.add(motes);


    /* --- ✨ Heart constellation that draws itself at night --- */
    const HEART_N = 44;
    const heartPts = [];
    for (let i = 0; i < HEART_N; i++) {
      const a = (i / HEART_N) * Math.PI * 2;
      heartPts.push(new T.Vector3(16 * Math.pow(Math.sin(a), 3), 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a), 0));
    }
    const constellation = new T.Group();
    const cStars = heartPts.map((p, i) => {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), color: i % 3 ? 0xfff1d6 : 0xffb3c7, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
      sp.position.copy(p); const k = i % 4 === 0 ? 3.2 : 2.2; sp.scale.set(k, k, 1); constellation.add(sp); return sp;
    });
    const cLineGeo = new T.BufferGeometry().setFromPoints(heartPts.concat([heartPts[0]]));
    const cLine = new T.Line(cLineGeo, new T.LineBasicMaterial({ color: 0xffd6e4, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    constellation.add(cLine);
    const cGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTexture(), color: 0xff6b9a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    cGlow.scale.set(60, 60, 1); cGlow.position.z = -2; constellation.add(cGlow);
    scene.add(constellation);

    /* --- 🌠 Shooting stars --- */
    const streakTex = (() => {
      const c = document.createElement("canvas"); c.width = 256; c.height = 16;
      const x = c.getContext("2d");
      const g = x.createLinearGradient(0, 0, 256, 0);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.85, "rgba(255,240,220,0.8)"); g.addColorStop(1, "rgba(255,255,255,1)");
      x.fillStyle = g; x.beginPath(); x.moveTo(0, 8); x.lineTo(250, 4); x.arc(250, 8, 4, -Math.PI / 2, Math.PI / 2); x.lineTo(0, 8); x.fill();
      return new T.CanvasTexture(c);
    })();
    const shooters = [0, 1, 2].map(() => {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: streakTex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
      sp.scale.set(40, 2.5, 1); sp.userData = { life: 0, active: false }; scene.add(sp); return sp;
    });
    let nextShoot = 2;
    function launchShooter(sp) {
      const d = sp.userData;
      d.active = true; d.life = 0; d.dur = 0.9 + Math.random() * 0.6;
      d.x = (Math.random() - 0.2) * 260; d.y = 70 + Math.random() * 60; d.z = -320;
      const ang = 0.35 + Math.random() * 0.35; // heading down-left
      d.vx = -Math.cos(ang) * 260; d.vy = -Math.sin(ang) * 260;
      sp.material.rotation = Math.atan2(d.vy, d.vx);
    }

    /* --- ✨ Fireflies over the shore --- */
    const fireflies = particleField({ count: isMobile ? 60 : 120, box: [46, 8, 26], color: [1, 0.95, 0.55], size: 4.2, twinkle: 1 });
    fireflies.position.set(0, 3, -8);
    fireflies.material.uniforms.uRise.value = 0.08;
    fireflies.material.uniforms.uOpacity.value = 0;
    scene.add(fireflies);

    let progress = 0, target = 0;
    function layout() {
      fit(renderer, camera, canvas); camera.fov = camera.aspect < 0.8 ? 70 : 55; camera.updateProjectionMatrix();
      const narrow = camera.aspect < 0.8;
      constellation.position.set(narrow ? 30 : 120, narrow ? 150 : 82, -300);
      constellation.scale.setScalar(narrow ? 1.25 : 1.6);
    }
    layout();
    window.addEventListener("resize", layout);

    let t = 0;
    const loop = visibilityLoop(canvas, (dt) => {
      t += dt;
      progress += (target - progress) * 0.06;
      const night = T.MathUtils.smoothstep(progress, 0.15, 0.8);
      U.uTime.value = t; U.uNight.value = night;

      // sun sets, moon rises
      const sunElev = T.MathUtils.lerp(0.09, -0.08, T.MathUtils.smoothstep(progress, 0.0, 0.6));
      U.uSunDir.value.set(0.05, sunElev, -1).normalize();
      const moonElev = T.MathUtils.lerp(-0.08, 0.26, T.MathUtils.smoothstep(progress, 0.35, 1.0));
      U.uMoonDir.value.set(-0.42, moonElev, -1).normalize();
      sun.position.copy(U.uSunDir.value).multiplyScalar(560); sun.lookAt(camera.position);
      sunGlow.position.copy(sun.position);
      sun.material.opacity = 1 - T.MathUtils.smoothstep(progress, 0.45, 0.62);
      sunGlow.material.opacity = 0.9 * (1 - night * 0.9);
      moon.position.copy(U.uMoonDir.value).multiplyScalar(560); moon.lookAt(camera.position);
      moonGlow.position.copy(moon.position);
      moon.material.opacity = T.MathUtils.smoothstep(progress, 0.35, 0.6);
      moonGlow.material.opacity = moon.material.opacity * 0.8;

      // lanterns appear as dusk deepens and rise into the sky
      const lanternVis = T.MathUtils.smoothstep(progress, 0.12, 0.45);
      lanterns.forEach((l) => {
        const d = l.userData;
        d.y += dt * d.speed;
        if (d.y > 70) d.y = 0;
        l.position.set(d.x + Math.sin(t * 0.5 + d.phase) * 1.5, d.y + 0.5, d.z);
        const fadeTop = 1 - T.MathUtils.smoothstep(d.y, 45, 70);
        l.material.opacity = lanternVis * fadeTop * (0.75 + Math.sin(t * 6 + d.phase) * 0.15);
      });
      motes.material.uniforms.uTime.value = t;
      motes.material.uniforms.uOpacity.value = 0.4 + night * 0.6;

      // heart constellation: stars appear one by one, then the line draws itself
      const cProg = T.MathUtils.smoothstep(progress, 0.6, 0.92);
      const shown = cProg * HEART_N;
      cStars.forEach((st, i) => {
        const k = T.MathUtils.clamp(shown - i, 0, 1);
        st.material.opacity = k * (0.75 + 0.25 * Math.sin(t * 3 + i));
      });
      cLineGeo.setDrawRange(0, Math.floor(T.MathUtils.smoothstep(progress, 0.75, 0.97) * (HEART_N + 1)));
      cLine.material.opacity = 0.55 * T.MathUtils.smoothstep(progress, 0.75, 0.85);
      cGlow.material.opacity = 0.35 * T.MathUtils.smoothstep(progress, 0.9, 1.0) * (0.8 + 0.2 * Math.sin(t * 2));

      // shooting stars once the sky is dark
      if (night > 0.5) {
        nextShoot -= dt;
        if (nextShoot <= 0) { const free = shooters.find((s) => !s.userData.active); if (free) launchShooter(free); nextShoot = 1.8 + Math.random() * 3.5; }
      }
      shooters.forEach((sp) => {
        const d = sp.userData; if (!d.active) return;
        d.life += dt; const k = d.life / d.dur;
        if (k >= 1) { d.active = false; sp.material.opacity = 0; return; }
        sp.position.set(d.x + d.vx * d.life, d.y + d.vy * d.life, d.z);
        sp.material.opacity = Math.sin(k * Math.PI) * night;
      });

      fireflies.material.uniforms.uTime.value = t;
      fireflies.material.uniforms.uOpacity.value = T.MathUtils.smoothstep(progress, 0.4, 0.75);

      camera.position.y = 3.2 + Math.sin(t * 0.4) * 0.15;
      camera.lookAt(0, 4 + progress * 4, -60);
      renderer.render(scene, camera);
    });

    return { setProgress(p) { target = Math.max(0, Math.min(1, p)); } };
  }

  window.Scenes = { supported: true, OpeningScene, HeartScene, BeachScene };
})();
