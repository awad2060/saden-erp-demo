/* سند الروبوت ثلاثي الأبعاد — البناء: الرسم والمشهد والخامات، والهيكل (جذع وأطراف)، والرأس والشاشة وملامحها، والظل.
 * جزء من robot3d.js: يُحمَّل قبله (مع three.js) ويسجّل دواله في SADEN_ROBOT_PARTS.build */
(function () {
  'use strict';
  const T = window.THREE;
  const PI = Math.PI;

  /* بيئة إضاءة (سماء وأرض ولوحات ضوء) للانعكاسات على الهيكل اللامع والشاشة */
  function envTex(renderer) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d'),
      lg = g.createLinearGradient(0, 0, 0, 256);
    lg.addColorStop(0, '#e8eef5');
    lg.addColorStop(0.45, '#b4c0cc');
    lg.addColorStop(0.55, '#6f7782');
    lg.addColorStop(1, '#2e333a');
    g.fillStyle = lg;
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#ffffff';
    g.fillRect(80, 40, 130, 70);
    g.fillRect(330, 60, 80, 46);
    g.fillStyle = '#dff6ff';
    g.fillRect(230, 18, 60, 34);
    const tx = new T.CanvasTexture(c);
    tx.mapping = T.EquirectangularReflectionMapping;
    tx.encoding = T.sRGBEncoding;
    const pm = new T.PMREMGenerator(renderer);
    const env = pm.fromEquirectangular(tx).texture;
    pm.dispose();
    tx.dispose();
    return env;
  }

  /* ---------- أدوات البناء ---------- */
  const col = (h) => new T.Color(h).convertSRGBToLinear();
  const part = (geo, mat, parent, pos, scl, rot) => {
    const m = new T.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (scl) m.scale.set(...scl);
    if (rot) m.rotation.set(...rot);
    parent.add(m);
    return m;
  };
  const grp = (parent, pos) => {
    const g = new T.Group();
    if (pos) g.position.set(...pos);
    parent.add(g);
    return g;
  };
  const sph = (r, w = 32, h = 22) => new T.SphereGeometry(r, w, h);
  const cap = (r, l) => new T.CapsuleGeometry(r, l, 8, 18);
  const cyl = (r1, r2, h, n = 32) => new T.CylinderGeometry(r1, r2, h, n);
  const tor = (r, t, arc = 2 * PI, n = 40) => new T.TorusGeometry(r, t, 10, n, arc);

  /* الرسم: WebGL بظلال ناعمة وألوان sRGB (null إن لم يدعمه المتصفح) */
  function makeRenderer(container, opts) {
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.snapshot });
    } catch {
      return null;
    }
    if (!renderer.getContext()) return null;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowPower ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    return renderer;
  }
  /* المشهد والكاميرا والإضاءة (سماء، شمس بظل، ملء، وحافة) */
  function makeScene(renderer) {
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
    scene.environment = envTex(renderer);
    scene.add(new T.HemisphereLight(0xffffff, 0x7d8794, 0.35));
    const sun = new T.DirectionalLight(0xffffff, 1.7);
    sun.position.set(2.2, 4.2, 3.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 3, bottom: -0.5, near: 0.5, far: 12 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 5;
    scene.add(sun);
    const fill = new T.DirectionalLight(0xe0f2ff, 0.6);
    fill.position.set(-3, 2, 2);
    scene.add(fill);
    const rim = new T.DirectionalLight(0xbaf3ff, 1.1);
    rim.position.set(-1, 3, -4);
    scene.add(rim);
    return { scene, camera };
  }
  /* الخامات: هيكل أبيض لامع، معدن داكن، شاشة سوداء زجاجية، وإضاءة سماوية */
  function makeMats() {
    const MAT = {
      shell: new T.MeshPhysicalMaterial({ color: col(0xeef2f6), roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06 }),
      silver: new T.MeshPhysicalMaterial({ color: col(0xc9d1da), roughness: 0.25, metalness: 0.75, clearcoat: 0.6 }),
      dark: new T.MeshPhysicalMaterial({ color: col(0x2a3038), roughness: 0.32, metalness: 0.65, clearcoat: 0.4 }),
      visor: new T.MeshPhysicalMaterial({ color: col(0x05070b), roughness: 0.04, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02 }),
      glow: new T.MeshBasicMaterial({ color: 0x38e8ff, toneMapped: false }),
      glowSoft: new T.MeshBasicMaterial({ color: 0x0c6f86, toneMapped: false }),
      eyeIn: new T.MeshBasicMaterial({ color: 0x0b3442, toneMapped: false }),
      white: new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    };
    const brMat = new T.MeshBasicMaterial({ color: 0x38e8ff, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
    const cheekMat = new T.MeshBasicMaterial({ color: 0xff7ab8, toneMapped: false, transparent: true, opacity: 0, depthWrite: false });
    const tongueMat = new T.MeshBasicMaterial({ color: 0xff8fb3, toneMapped: false });
    return { MAT, brMat, cheekMat, tongueMat };
  }

  /* ---------- الهيكل: جذر ← حوض ← جذع ← رقبة ← رأس، والأطراف بمفاصلها ---------- */
  function buildBody(scene, MAT) {
    const root = grp(scene);
    const body = grp(root);
    const hips = grp(body, [0, 0.72, 0]);
    part(sph(0.17), MAT.dark, hips, [0, 0.02, 0], [1.15, 0.5, 0.88]);
    const legs = buildLegs(hips, MAT);
    const spine = grp(hips, [0, 0.05, 0]);
    part(sph(0.3, 40, 30), MAT.shell, spine, [0, 0.29, 0], [1, 1.08, 0.86]);
    /* دائرة الصدر المضيئة بإطار داكن */
    const chest = grp(spine, [0, 0.33, 0.25]);
    chest.rotation.x = -0.18;
    part(cyl(0.085, 0.085, 0.04), MAT.dark, chest, null, null, [PI / 2, 0, 0]);
    part(new T.CircleGeometry(0.062, 40), MAT.glow, chest, [0, 0, 0.026]);
    part(tor(0.074, 0.008), MAT.glowSoft, chest, [0, 0, 0.028]);
    part(new T.CircleGeometry(0.03, 24), MAT.white, chest, [0, 0, 0.03]);
    [-1, 1].forEach((s) =>
      part(new T.BoxGeometry(0.012, 0.16, 0.012), MAT.glowSoft, spine, [s * 0.255, 0.26, 0.12], null, [0.2, s * 0.6, s * 0.15]),
    );
    const arms = buildArms(spine, MAT);
    const neck = grp(spine, [0, 0.62, 0]);
    part(cyl(0.075, 0.09, 0.09), MAT.dark, neck, [0, 0.03, 0]);
    part(tor(0.08, 0.01), MAT.glowSoft, neck, [0, 0.05, 0], null, [PI / 2, 0, 0]);
    return { root, body, hips, legs, spine, arms, neck };
  }
  /* الرجلان: ورك ← ركبة ← قدم */
  function buildLegs(hips, MAT) {
    return [-1, 1].map((s) => {
      const hip = grp(hips, [s * 0.13, -0.02, 0]);
      part(sph(0.08), MAT.dark, hip);
      part(cap(0.07, 0.12), MAT.dark, hip, [0, -0.14, 0]);
      const knee = grp(hip, [0, -0.3, 0]);
      part(sph(0.075), MAT.dark, knee);
      part(cap(0.105, 0.1), MAT.shell, knee, [0, -0.13, 0]);
      part(tor(0.1, 0.012), MAT.glowSoft, knee, [0, -0.06, 0], null, [PI / 2, 0, 0]);
      part(sph(0.13), MAT.shell, knee, [0, -0.3, 0.05], [1, 0.62, 1.5]);
      part(cyl(0.13, 0.135, 0.035), MAT.dark, knee, [0, -0.375, 0.05], [1, 1, 1.5]);
      return { hip, knee };
    });
  }
  /* الذراعان: كتف ← كوع ← يد بأصابع تنثني معاً (قبضة) وإبهام مستقل (علامة الإعجاب) */
  function buildArms(spine, MAT) {
    return [-1, 1].map((s) => {
      const sh = grp(spine, [s * 0.33, 0.48, 0]);
      part(sph(0.088), MAT.dark, sh);
      part(cap(0.075, 0.13), MAT.shell, sh, [0, -0.15, 0]);
      const el = grp(sh, [0, -0.33, 0]);
      part(sph(0.066), MAT.dark, el);
      part(cap(0.078, 0.11), MAT.shell, el, [0, -0.12, 0]);
      part(new T.BoxGeometry(0.01, 0.1, 0.01), MAT.glowSoft, el, [s * 0.072, -0.12, 0.02]);
      const hand = grp(el, [0, -0.29, 0]);
      part(sph(0.075), MAT.shell, hand, [0, 0, 0], [0.8, 0.9, 1]);
      const fing = grp(hand, [0, -0.05, 0]);
      [-0.036, -0.012, 0.012, 0.036].forEach((z) => {
        const f = grp(fing, [-s * 0.01, 0, z]);
        part(cap(0.018, 0.045), MAT.shell, f, [0, -0.035, 0]);
        part(sph(0.019), MAT.dark, f, [0, -0.07, 0]);
      });
      const thumb = grp(hand, [-s * 0.035, -0.005, 0.055]);
      thumb.rotation.set(-0.6, 0, -s * 0.35);
      part(cap(0.02, 0.045), MAT.shell, thumb, [0, -0.035, 0]);
      part(sph(0.021), MAT.dark, thumb, [0, -0.07, 0]);
      return { sh, el, hand, fing, thumb, s };
    });
  }
  /* قناع شفافية بأركان مستديرة (لحواف الشاشة) */
  function rrMask(rx, ry) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#fff';
    g.beginPath();
    g.roundRect(4, 4, 248, 248, Math.min(rx, ry));
    g.fill();
    const t = new T.CanvasTexture(c);
    return t;
  }
  /* الرأس: الهيكل، والشاشة السوداء (جزء منحنٍ من كرة فوق سطح الرأس بأركان مستديرة وإطار داكن)، والسماعتان والهوائيان والقبة */
  function buildHead(neck, MAT) {
    const head = grp(neck, [0, 0.44, 0]);
    const HR = [0.48, 0.41, 0.44];
    part(sph(0.46, 48, 36), MAT.shell, head, [0, 0, 0], [HR[0] / 0.46, HR[1] / 0.46, HR[2] / 0.46]);
    const panel = (r, w, h, mat) => {
      const geo = new T.SphereGeometry(r, 72, 40, PI / 2 - w / 2, w, PI / 2 + 0.02 - h / 2, h);
      const m = part(geo, mat, head, [0, 0, 0], [HR[0] / 0.46, HR[1] / 0.46, HR[2] / 0.46]);
      return m;
    };
    const bezel = MAT.dark.clone();
    bezel.alphaMap = rrMask(96, 110);
    bezel.alphaTest = 0.5;
    bezel.side = T.FrontSide;
    const vis = MAT.visor.clone();
    vis.alphaMap = rrMask(92, 106);
    vis.alphaTest = 0.5;
    panel(0.4625, 2.02, 1.12, bezel);
    panel(0.466, 1.9, 1.0, vis);
    const VS = 0.471 / 0.46;
    /* نقطة على سطح الشاشة (أمامها بقليل) */
    const vz = (x, y) => HR[2] * VS * Math.sqrt(Math.max(0, 1 - (x / (HR[0] * VS)) ** 2 - (y / (HR[1] * VS)) ** 2));
    [-1, 1].forEach((s) => {
      const ear = grp(head, [s * 0.465, -0.01, 0]);
      ear.rotation.z = (s * PI) / 2;
      part(cyl(0.14, 0.14, 0.09), MAT.dark, ear);
      part(cyl(0.105, 0.105, 0.03), MAT.silver, ear, [0, -s * 0.055, 0]);
      part(tor(0.11, 0.011), MAT.glow, ear, [0, -s * 0.072, 0], null, [PI / 2, 0, 0]);
      const ant = grp(head, [s * 0.44, 0.12, -0.02]);
      ant.rotation.z = -s * 0.12;
      part(cyl(0.012, 0.014, 0.32, 12), MAT.dark, ant, [0, 0.16, 0]);
      part(tor(0.022, 0.006, 2 * PI, 20), MAT.glow, ant, [0, 0.3, 0], null, [PI / 2, 0, 0]);
      part(sph(0.04), MAT.dark, ant, [0, 0.35, 0]);
    });
    const crown = grp(head, [0, 0.395, 0]);
    part(cyl(0.15, 0.17, 0.05), MAT.dark, crown);
    part(tor(0.12, 0.012), MAT.glow, crown, [0, 0.028, 0], null, [PI / 2, 0, 0]);
    part(sph(0.1, 24, 12), MAT.visor, crown, [0, 0.025, 0], [1, 0.25, 1]);
    return { head, HR, vz };
  }
  /* العينان المضيئتان: مفتوحة بحدقة ولمعتين، أو قوس (سعيدة ∩ / مقفولة ∪)، أو X (دايخ) */
  function buildEyes(faceG, MAT, HR, vz) {
    return [-1, 1].map((s) => {
      const x = s * 0.15,
        y = 0.02;
      const g = grp(faceG, [x, y, vz(x, y)]);
      g.rotation.y = Math.asin(x / HR[0]) * 0.9;
      const open = grp(g);
      part(new T.CircleGeometry(0.078, 40), MAT.eyeIn, open, [0, 0, 0]);
      part(tor(0.078, 0.013), MAT.glow, open, [0, 0, 0.006]);
      part(tor(0.054, 0.004), MAT.glowSoft, open, [0, 0, 0.008]);
      const pup = grp(open, [0, 0, 0.012]);
      part(new T.CircleGeometry(0.038, 32), MAT.glow, pup);
      part(new T.CircleGeometry(0.017, 20), MAT.white, pup, [-0.016, 0.02, 0.006]);
      part(new T.CircleGeometry(0.008, 12), MAT.white, pup, [0.017, -0.015, 0.006]);
      const arc = part(tor(0.058, 0.013, PI, 24), MAT.glow, g, [0, -0.02, 0.01]);
      const xg = grp(g, [0, 0, 0.01]);
      [PI / 4, -PI / 4].forEach((r) => part(new T.BoxGeometry(0.12, 0.022, 0.004), MAT.glow, xg, null, null, [0, 0, r]));
      return { g, open, pup, arc, xg, s };
    });
  }
  /* ملامح الشاشة: عيون مضيئة، حواجب رقمية تظهر مع التعبير، خدود، أفواه */
  function buildFace({ head, HR, vz, MAT, brMat, cheekMat }) {
    const faceG = grp(head);
    const eyes = buildEyes(faceG, MAT, HR, vz);
    const brows = [-1, 1].map((s) => {
      const x = s * 0.15,
        y = 0.13;
      const b = grp(faceG, [x, y, vz(x, y) + 0.006]);
      b.rotation.y = Math.asin(x / HR[0]) * 0.9;
      part(new T.BoxGeometry(0.09, 0.016, 0.004), brMat, b);
      return b;
    });
    [-1, 1].forEach((s) => {
      const x = s * 0.26,
        y = -0.08;
      const ck = part(new T.CircleGeometry(0.035, 24), cheekMat, faceG, [x, y, vz(x, y) + 0.006], [1.3, 0.7, 1]);
      ck.rotation.y = Math.asin(x / HR[0]) * 0.9;
    });
    return { faceG, eyes, brows };
  }
  /* الأفواه: ابتسامة، عبوس، متموج، مفتوح (بلسان داخلي)، ولسان خارج */
  function buildMouths({ faceG, vz, MAT, tongueMat }) {
    const my = -0.11,
      mz = vz(0, my) + 0.008;
    const M = {};
    M.smile = part(tor(0.055, 0.011, PI, 24), MAT.glow, faceG, [0, my + 0.025, mz], null, [0, 0, PI]);
    M.frown = part(tor(0.05, 0.011, PI, 24), MAT.glow, faceG, [0, my - 0.03, mz]);
    const wav = new T.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => new T.Vector3(-0.07 + i * 0.0175, i % 2 ? 0.01 : -0.01, 0)));
    M.wavy = part(new T.TubeGeometry(wav, 40, 0.009, 6, false), MAT.glow, faceG, [0, my, mz]);
    M.open = grp(faceG, [0, my - 0.005, mz]);
    const cav = grp(M.open);
    part(new T.CircleGeometry(0.05, 32), MAT.eyeIn, cav);
    part(tor(0.05, 0.01), MAT.glow, cav, [0, 0, 0.001]);
    const tongueIn = part(new T.CircleGeometry(0.024, 20), tongueMat, M.open, [0, -0.02, 0.002], [1.3, 0.7, 1]);
    M.tongue = grp(faceG, [0, my, mz]);
    part(tor(0.055, 0.011, PI, 24), MAT.glow, M.tongue, [0, 0.025, 0], null, [0, 0, PI]);
    const tng = grp(M.tongue, [0.018, -0.03, 0.002]);
    part(cap(0.022, 0.03), tongueMat, tng, [0, -0.02, 0], [1.2, 1, 0.3]);
    return { M, cav, tongueIn, tng };
  }
  /* ظل دائري على الأرض، وظلال الأجزاء، والأرض التي تستقبل الظل */
  function buildShadow({ scene, root, opts, cheekMat, brMat }) {
    const sc = document.createElement('canvas');
    sc.width = sc.height = 64;
    const sg = sc.getContext('2d'),
      rg = sg.createRadialGradient(32, 32, 2, 32, 32, 32);
    rg.addColorStop(0, 'rgba(0,0,0,.38)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = rg;
    sg.fillRect(0, 0, 64, 64);
    const shadow = new T.Mesh(
      new T.PlaneGeometry(1.3, 0.9),
      new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -PI / 2;
    shadow.position.y = 0.002;
    scene.add(shadow);
    root.traverse((m) => {
      if (m.isMesh && m.material !== cheekMat && m.material !== brMat && m.material.toneMapped !== false) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    if (opts.ground !== false) {
      const ground = new T.Mesh(new T.PlaneGeometry(6, 6), new T.ShadowMaterial({ opacity: 0.22 }));
      ground.rotation.x = -PI / 2;
      ground.position.y = 0.001;
      ground.receiveShadow = true;
      scene.add(ground);
    }
    return shadow;
  }
  /* يُسجَّل لملف robot3d.js (يُحمَّل بعده) */
  (window.SADEN_ROBOT_PARTS = window.SADEN_ROBOT_PARTS || {}).build = {
    makeRenderer,
    makeScene,
    makeMats,
    buildBody,
    buildHead,
    buildFace,
    buildMouths,
    buildShadow,
  };
})();
