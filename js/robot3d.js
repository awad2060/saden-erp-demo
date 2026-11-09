/* سند الروبوت ثلاثي الأبعاد: روبوت لطيف مبني بالكامل بالكود (three.js) — رأس أبيض لامع بشاشة سوداء وعيون سماوية مضيئة،
 * سماعات وهوائيان، دائرة مضيئة على الصدر، ومفاصل معدنية داكنة. نفس واجهة مهندس سادن (SadenEngineer) فيُستبدل به مباشرة:
 * const bot = SadenRobot.create(عنصر, { auto: true }); bot.play('wave'); bot.face('wink'); bot.lookAt(x, y);
 * يرجع null إذا كان المتصفح لا يدعم WebGL. */
(function () {
  'use strict';
  const T = window.THREE;
  const PI = Math.PI;
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));

  /* رسومات المؤثرات (؟ ! Z قلب نجمة لمعة نوتة قطرة) */
  const TEX = {};
  function fxTex(kind) {
    if (TEX[kind]) return TEX[kind];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    const txt = (ch, col, size = 104) => {
      g.font = `900 ${size}px Arial, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineWidth = 16;
      g.strokeStyle = '#fff';
      g.strokeText(ch, 64, 70);
      g.fillStyle = col;
      g.fillText(ch, 64, 70);
    };
    const star = (n, r1, r2, col, stroke) => {
      g.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = -PI / 2 + (i * PI) / n,
          r = i % 2 ? r2 : r1;
        g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
      }
      g.closePath();
      g.lineWidth = 8;
      g.strokeStyle = stroke;
      g.stroke();
      g.fillStyle = col;
      g.fill();
    };
    if (kind === 'q') txt('?', '#0e7490');
    else if (kind === 'bang') txt('!', '#dc2626');
    else if (kind === 'z') txt('Z', '#06b6d4', 96);
    else if (kind === 'note') txt('♪', '#7c3aed', 110);
    else if (kind === 'heart') {
      g.beginPath();
      g.moveTo(64, 112);
      g.bezierCurveTo(14, 78, 6, 46, 24, 28);
      g.bezierCurveTo(40, 12, 60, 18, 64, 38);
      g.bezierCurveTo(68, 18, 88, 12, 104, 28);
      g.bezierCurveTo(122, 46, 114, 78, 64, 112);
      g.lineWidth = 9;
      g.strokeStyle = '#fff';
      g.stroke();
      g.fillStyle = '#ef4444';
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)';
      g.beginPath();
      g.ellipse(40, 42, 10, 6, -0.6, 0, 2 * PI);
      g.fill();
    } else if (kind === 'star') star(5, 56, 24, '#facc15', '#a16207');
    else if (kind === 'spark') star(4, 58, 14, '#a5f3fc', '#0891b2');
    else if (kind === 'drop') {
      g.beginPath();
      g.moveTo(64, 8);
      g.quadraticCurveTo(100, 58, 100, 82);
      g.arc(64, 82, 36, 0, PI);
      g.quadraticCurveTo(28, 58, 64, 8);
      g.lineWidth = 6;
      g.strokeStyle = '#0284c7';
      g.stroke();
      g.fillStyle = '#7dd3fc';
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.8)';
      g.beginPath();
      g.ellipse(52, 80, 7, 12, 0.3, 0, 2 * PI);
      g.fill();
    }
    TEX[kind] = new T.CanvasTexture(c);
    TEX[kind].encoding = T.sRGBEncoding;
    return TEX[kind];
  }
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

  function create(container, opts = {}) {
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
    const col = (h) => new T.Color(h).convertSRGBToLinear();
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
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

    /* الخامات: هيكل أبيض لامع، معدن داكن، شاشة سوداء زجاجية، وإضاءة سماوية */
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

    /* ---------- الهيكل: جذر ← حوض ← جذع ← رقبة ← رأس، والأطراف بمفاصلها ---------- */
    const root = grp(scene);
    const body = grp(root);
    const hips = grp(body, [0, 0.72, 0]);
    part(sph(0.17), MAT.dark, hips, [0, 0.02, 0], [1.15, 0.5, 0.88]);
    const legs = [-1, 1].map((s) => {
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
    const arms = [-1, 1].map((s) => {
      const sh = grp(spine, [s * 0.33, 0.48, 0]);
      part(sph(0.088), MAT.dark, sh);
      part(cap(0.075, 0.13), MAT.shell, sh, [0, -0.15, 0]);
      const el = grp(sh, [0, -0.33, 0]);
      part(sph(0.066), MAT.dark, el);
      part(cap(0.078, 0.11), MAT.shell, el, [0, -0.12, 0]);
      part(new T.BoxGeometry(0.01, 0.1, 0.01), MAT.glowSoft, el, [s * 0.072, -0.12, 0.02]);
      const hand = grp(el, [0, -0.29, 0]);
      part(sph(0.075), MAT.shell, hand, [0, 0, 0], [0.8, 0.9, 1]);
      /* الأصابع تنثني معاً (قبضة) والإبهام مستقل (علامة الإعجاب) */
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
    const neck = grp(spine, [0, 0.62, 0]);
    part(cyl(0.075, 0.09, 0.09), MAT.dark, neck, [0, 0.03, 0]);
    part(tor(0.08, 0.01), MAT.glowSoft, neck, [0, 0.05, 0], null, [PI / 2, 0, 0]);
    const head = grp(neck, [0, 0.44, 0]);
    const HR = [0.48, 0.41, 0.44];
    part(sph(0.46, 48, 36), MAT.shell, head, [0, 0, 0], [HR[0] / 0.46, HR[1] / 0.46, HR[2] / 0.46]);
    /* الشاشة السوداء (الوجه): جزء منحنٍ من كرة فوق سطح الرأس مباشرة، بأركان مستديرة (قناع شفافية) وإطار رمادي داكن */
    const rrMask = (rx, ry) => {
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
    };
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
    /* السماعتان والهوائيان والقبة العلوية */
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
    /* ملامح الشاشة: عيون مضيئة، حواجب رقمية تظهر مع التعبير، خدود، أفواه */
    const faceG = grp(head);
    const eyes = [-1, 1].map((s) => {
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
      /* عين سعيدة ∩ / مقفولة ∪ */
      const arc = part(tor(0.058, 0.013, PI, 24), MAT.glow, g, [0, -0.02, 0.01]);
      /* عين X (دايخ) */
      const xg = grp(g, [0, 0, 0.01]);
      [PI / 4, -PI / 4].forEach((r) => part(new T.BoxGeometry(0.12, 0.022, 0.004), MAT.glow, xg, null, null, [0, 0, r]));
      return { g, open, pup, arc, xg, s };
    });
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
    /* ظل دائري على الأرض */
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

    /* ---------- الوضعية: قيم مستهدفة تقترب منها المفاصل بنعومة ---------- */
    const mkPose = () => ({
      y: 0,
      rx: 0,
      ry: 0,
      rz: 0,
      sq: 1,
      hipsY: 0,
      hipsZ: 0,
      hipsYaw: 0,
      spX: 0,
      spY: 0,
      spZ: 0,
      hX: 0,
      hY: 0,
      hZ: 0,
      sh: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
      ],
      el: [
        { x: 0, z: 0 },
        { x: 0, z: 0 },
      ],
      hip: [
        { x: 0, z: 0 },
        { x: 0, z: 0 },
      ],
      kn: [0, 0],
      fist: [0, 0],
      eye: [1, 1],
      pX: 0,
      pY: 0,
      pS: 1,
      brY: [0, 0],
      brR: [0, 0],
      mo: 0,
      mw: 1,
      ck: 0,
      tg: 0,
      ant: 0,
      dim: 1,
    });
    const cur = mkPose();
    const blendInto = (a, b, k) => {
      for (const key in b) {
        if (typeof b[key] === 'number') a[key] = lerp(a[key], b[key], k);
        else if (b[key] && typeof b[key] === 'object' && a[key] && typeof a[key] === 'object') blendInto(a[key], b[key], k);
      }
    };
    const S = [-1, 1];
    let look = { x: 0, y: 0 },
      spin = 0,
      now = 0;

    /* الوقفة الأساسية: طفو خفيف وتمايل ونظر نحو المؤشر */
    function base(p) {
      const br = Math.sin(now * 2.2);
      p.sq = 1 + 0.01 * br;
      p.spX = 0.02 * br;
      p.hipsZ = 0.025 * Math.sin(now * 1.1);
      S.forEach((s, i) => {
        p.sh[i].z = s * (0.18 + 0.02 * br);
        p.el[i].x = -0.18;
        p.sh[i].x = 0.04;
        p.fist[i] = 0.25;
      });
      p.hY = look.x * 0.45;
      p.hX = look.y * 0.25 - 0.03;
      p.pX = look.x;
      p.pY = look.y;
      p.ant = 0.04 * Math.sin(now * 3);
    }
    /* كل حركة: مدتها (أو مستمرة) ووضعيتها ووجهها ومؤثراتها */
    const A = {
      idle: { loop: true, pose() {} },
      wave: {
        dur: 2.4,
        pose(p, t) {
          const i = 1,
            s = 1;
          p.sh[i].z = s * 2.55;
          p.sh[i].x = -0.15;
          p.el[i].x = -0.35;
          p.el[i].z = s * 0.55 * Math.sin(t * 13);
          p.fist[i] = 0;
          p.hZ = -0.12;
          p.hY = 0.15;
          p.spZ = -0.05;
          p.mouth = 'open';
          p.mo = 0.55;
          p.ck = 0.4;
          p.ant = 0.2 * Math.sin(t * 13);
        },
        enter() {
          burst('spark', 3);
        },
      },
      /* علامة الإعجاب: اليد أمام الجسم والإبهام لأعلى وغمزة */
      thumb: {
        dur: 2.2,
        pose(p, t) {
          const i = 0;
          p.sh[i].x = -1.1;
          p.sh[i].z = -0.35;
          p.el[i].x = -1.25;
          p.fist[i] = 1;
          p.hZ = 0.1;
          p.hY = -0.12;
          p.spY = -0.1;
          p.em = ['h', 'n'];
          p.mouth = 'open';
          p.mo = 0.45;
          p.ck = 0.5;
          p.y = Math.max(0, Math.sin(clamp(t / 0.5, 0, 1) * PI)) * 0.06;
        },
        enter() {
          burst('spark', 3);
        },
      },
      happy: {
        dur: 1.7,
        pose(p, t) {
          const u = (t % 0.85) / 0.85;
          if (u < 0.22) {
            p.sq = lerp(1, 0.84, ease(u / 0.22));
            p.kn = [0.6, 0.6];
            p.hip[0].x = p.hip[1].x = -0.4;
          } else if (u < 0.75) {
            const a = (u - 0.22) / 0.53;
            p.y = Math.sin(a * PI) * 0.5;
            p.sq = a < 0.3 ? 1.08 : 1;
            p.hip[0].x = p.hip[1].x = -0.45;
            p.kn = [0.9, 0.9];
            S.forEach((s, i) => {
              p.sh[i].z = s * 2.6;
              p.el[i].x = -0.3;
              p.fist[i] = 0;
            });
          } else {
            p.sq = lerp(0.88, 1, ease((u - 0.75) / 0.25));
          }
          p.em = ['h', 'h'];
          p.mouth = 'open';
          p.mo = 0.9;
          p.ck = 0.8;
          p.ant = 0.3 * Math.sin(t * 18);
        },
        enter() {
          burst('spark', 4);
          burst('star', 2);
        },
      },
      think: {
        loop: true,
        pose(p, t) {
          p.sh[1].x = -0.55;
          p.sh[1].z = -0.12;
          p.el[1].x = -2.3;
          p.fist[1] = 0.8;
          p.sh[0].z = -0.6;
          p.sh[0].x = 0.2;
          p.el[0].x = -1.1;
          p.hZ = 0.2;
          p.hX = -0.16;
          p.hY = 0.1;
          p.pX = 0.7;
          p.pY = -0.9;
          p.brY = [-0.3, 1.2];
          p.mouth = 'open';
          p.mo = 0.18;
          p.mw = 0.55;
          p.kn[0] = Math.max(0, Math.sin(t * 7)) * 0.25;
        },
        enter(tag) {
          stick('q', [0.42, 0.7, 0.1], tag, 'bob');
        },
      },
      confused: {
        dur: 2.8,
        pose(p, t) {
          const i = 1,
            s = 1;
          p.sh[i].z = s * 2.35;
          p.sh[i].x = -0.35;
          p.el[i].x = -1.7 + 0.28 * Math.sin(t * 22);
          p.fist[i] = 0.6;
          p.hZ = -0.22;
          p.hY = -0.15;
          p.pX = -0.5;
          p.pY = -0.6;
          p.brY = [1, -0.4];
          p.brR = [0.4, -0.3];
          p.mouth = 'wavy';
        },
        every: [0.8, (tag) => drop('drop', [-0.45, 0.25, 0.2], tag)],
        enter(tag) {
          stick('q', [0.48, 0.72, 0.1], tag, 'bob');
        },
      },
      talk: {
        dur: 2.2,
        pose(p, t) {
          const i = 0,
            s = -1;
          p.mouth = 'open';
          p.mo = 0.15 + 0.6 * Math.abs(Math.sin(t * 11)) * (0.6 + 0.4 * Math.sin(t * 3.3));
          p.hX = 0.05 * Math.sin(t * 6);
          p.hZ = 0.05 * Math.sin(t * 2.5);
          p.sh[i].z = s * 0.55;
          p.sh[i].x = -0.6 + 0.25 * Math.sin(t * 3);
          p.el[i].x = -1.15;
          p.fist[i] = 0;
          p.brY = [0.4 * Math.abs(Math.sin(t * 4)), 0.4 * Math.abs(Math.sin(t * 4))];
        },
      },
      point: {
        dur: 2.2,
        pose(p) {
          const i = 1,
            s = 1;
          p.sh[i].z = s * 1.45;
          p.sh[i].x = -0.55;
          p.el[i].x = -0.1;
          p.fist[i] = 0;
          p.hY = 0.5;
          p.hZ = -0.05;
          p.pX = 1;
          p.spY = 0.15;
          p.mouth = 'open';
          p.mo = 0.45;
          p.em = ['n', 'h'];
        },
      },
      walk: {
        loop: true,
        pose(p, t) {
          const w = t * 7.5,
            a = Math.sin(w);
          p.hip[0].x = a * 0.55;
          p.hip[1].x = -a * 0.55;
          p.kn = [Math.max(0, -Math.cos(w)) * 0.9, Math.max(0, Math.cos(w)) * 0.9];
          S.forEach((s, i) => {
            p.sh[i].x = (i ? a : -a) * 0.5;
            p.el[i].x = -0.4;
          });
          p.y = Math.abs(Math.cos(w)) * 0.05;
          p.spY = a * 0.1;
          p.hY = -a * 0.06;
          p.mouth = 'smile';
        },
      },
      dance: {
        loop: true,
        pose(p, t) {
          const w = t * 2 * PI * 1.6,
            a = Math.sin(w);
          p.hipsZ = 0.16 * a;
          p.spZ = -0.22 * a;
          p.hZ = 0.18 * a;
          p.y = Math.abs(Math.sin(w)) * 0.09;
          S.forEach((s, i) => {
            p.sh[i].z = s * (1.6 + 1.0 * Math.sin(w + i * PI));
            p.el[i].x = -0.9;
            p.el[i].z = s * 0.4;
            p.fist[i] = 0;
          });
          p.hip[0].x = Math.max(0, a) * -0.6;
          p.hip[1].x = Math.max(0, -a) * -0.6;
          p.kn = [Math.max(0, a) * 1.1, Math.max(0, -a) * 1.1];
          p.em = ['h', 'h'];
          p.mouth = 'open';
          p.mo = 0.7;
          p.ck = 0.6;
          p.ant = 0.35 * a;
        },
        every: [0.45, (tag) => drop('note', [rnd(-0.6, 0.6), rnd(0.3, 0.6), 0.1], tag, 'rise')],
      },
      laugh: {
        dur: 3.2,
        pose(p, t) {
          const sh = Math.sin(t * 28);
          const fwd = t > 1.6;
          p.spX = fwd ? 0.35 + 0.04 * sh : -0.22 + 0.04 * sh;
          p.hX = fwd ? 0.1 : -0.35;
          p.y = Math.abs(sh) * 0.025;
          S.forEach((s, i) => {
            p.sh[i].x = fwd && i ? -0.3 : -0.75;
            p.sh[i].z = s * -0.12;
            p.el[i].x = fwd && i ? -0.2 : -1.6;
            p.fist[i] = 0.7;
          });
          if (fwd) {
            p.sh[1].z = 0.6;
            p.hip[1].x = -0.4;
            p.kn[1] = 0.5;
          }
          p.em = ['h', 'h'];
          p.mouth = 'open';
          p.mo = 0.75 + 0.25 * Math.abs(sh);
          p.mw = 1.15;
          p.ck = 1;
          p.ant = 0.15 * sh;
        },
        every: [0.22, (tag) => S.forEach((s) => tear(s, tag))],
      },
      love: {
        loop: true,
        pose(p, t) {
          p.rz = 0.07 * Math.sin(t * 2.2);
          p.hZ = 0.15 + 0.05 * Math.sin(t * 2.2);
          S.forEach((s, i) => {
            p.sh[i].x = -0.95;
            p.sh[i].z = s * -0.38;
            p.el[i].x = -1.45;
            p.fist[i] = 0.5;
          });
          p.kn[0] = 1.2;
          p.hip[0].x = 0.1;
          p.em = ['h', 'h'];
          p.mouth = 'smile';
          p.ck = 1.3;
          p.pY = 0.4;
        },
        every: [0.4, (tag) => drop('heart', [rnd(-0.5, 0.5), rnd(0.1, 0.5), 0.2], tag, 'rise')],
      },
      sad: {
        loop: true,
        pose(p, t) {
          p.spX = 0.12;
          p.hX = 0.18;
          p.hZ = 0.08;
          S.forEach((s, i) => {
            p.sh[i].z = s * 0.05;
            p.sh[i].x = 0.1;
            p.el[i].x = -0.05;
          });
          p.eye = [0.7, 0.7];
          p.pY = 0.8;
          p.brR = [0.55, 0.55];
          p.brY = [0.2, 0.2];
          p.mouth = 'frown';
          p.sq = 0.98 + 0.01 * Math.sin(t * 1.2);
          p.ant = -0.25;
        },
        every: [2.2, (tag) => drop('drop', [0.16, -0.05, 0.5], tag, 'fall')],
      },
      scared: {
        loop: true,
        pose(p, t) {
          S.forEach((s, i) => {
            p.sh[i].z = s * (2.2 + 0.5 * Math.sin(t * 18 + i * 2));
            p.sh[i].x = -0.3;
            p.el[i].x = -0.7 * Math.abs(Math.sin(t * 20 + i));
            p.fist[i] = 0;
            p.hip[i].x = 0.55 * Math.sin(t * 16 + i * PI);
            p.kn[i] = 0.9 * Math.abs(Math.sin(t * 16 + i * PI));
          });
          p.rz = 0.08 * Math.sin(t * 30);
          p.y = 0.05;
          p.eye = [1.3, 1.3];
          p.pS = 0.6;
          p.pX = 0;
          p.pY = 0;
          p.brY = [1.6, 1.6];
          p.mouth = 'open';
          p.mo = 1;
          p.mw = 0.7;
          p.hX = -0.1;
          p.ant = 0.3 * Math.sin(t * 40);
        },
        enter(tag) {
          stick('bang', [0.46, 0.72, 0.1], tag, 'pop');
        },
      },
      dizzy: {
        dur: 3.2,
        pose(p, t) {
          const imp = t < 0.35;
          const w = t * 5;
          p.sq = imp ? lerp(0.72, 1, ease(t / 0.35)) : 1;
          p.hZ = 0.25 * Math.sin(w);
          p.hX = 0.12 * Math.cos(w);
          p.rz = 0.1 * Math.sin(w + 1);
          p.spZ = -0.08 * Math.sin(w);
          S.forEach((s, i) => {
            p.sh[i].z = s * (0.55 + 0.3 * Math.sin(w + i * 2));
            p.el[i].x = -0.4;
            p.kn[i] = 0.2 + 0.15 * Math.sin(w + i * PI);
          });
          p.em = ['x', 'x'];
          p.mouth = 'tongue';
          p.tg = 0.25 * Math.sin(w * 1.5);
          p.ant = 0.3 * Math.sin(w * 2);
        },
        enter(tag) {
          for (let k = 0; k < 4; k++) stick('star', [0, 0.72, 0], tag, 'orbit', k * (PI / 2));
        },
      },
      sleep: {
        loop: true,
        pose(p, t) {
          const br = Math.sin(t * 1.3);
          p.hipsY = -0.55;
          p.spX = 0.08 + 0.03 * br;
          p.hX = 0.12;
          p.hZ = 0.32 + 0.03 * br;
          S.forEach((s, i) => {
            p.hip[i].x = -1.45;
            p.hip[i].z = s * 0.14;
            p.kn[i] = 0.05;
            p.sh[i].x = -0.8;
            p.sh[i].z = s * 0.15;
            p.el[i].x = -0.35;
            p.fist[i] = 0.4;
          });
          p.em = ['c', 'c'];
          p.mouth = 'open';
          p.mo = 0.12 + (0.12 * (br + 1)) / 2;
          p.mw = 0.5;
          p.sq = 1 + 0.02 * br;
          p.ant = -0.35;
          p.dim = 0.35;
        },
        every: [1.1, (tag) => drop('z', [0.35, 0.5, 0.1], tag, 'z')],
      },
      wake: {
        dur: 1.3,
        pose(p, t) {
          p.y = t < 0.5 ? Math.sin((t / 0.5) * PI) * 0.35 : 0;
          S.forEach((s, i) => {
            p.sh[i].z = s * (t < 0.6 ? 2.4 : 0.4);
            p.el[i].x = -0.4;
            p.fist[i] = 0;
          });
          p.eye = [1.35, 1.35];
          p.pS = 0.55;
          p.brY = [1.6, 1.6];
          p.mouth = 'open';
          p.mo = 0.9;
          p.mw = 0.7;
          p.ant = 0.4 * Math.sin(t * 30);
        },
        enter(tag) {
          stick('bang', [0.46, 0.72, 0.1], tag, 'pop');
        },
      },
      yawn: {
        dur: 2.6,
        pose(p, t) {
          const u = Math.sin(clamp(t / 2.4, 0, 1) * PI);
          S.forEach((s, i) => {
            p.sh[i].z = s * lerp(0.18, 2.8, u);
            p.el[i].x = lerp(-0.18, -0.5, u);
          });
          p.spX = -0.15 * u;
          p.hX = -0.3 * u;
          p.sq = 1 + 0.05 * u;
          p.em = u > 0.4 ? ['c', 'c'] : ['n', 'n'];
          p.mouth = 'open';
          p.mo = u;
          p.mw = 0.8;
        },
      },
      look: {
        dur: 2.4,
        pose(p, t) {
          const a = Math.sin(t * 2.6);
          p.hY = a * 0.7;
          p.pX = a;
          p.pY = 0;
          p.mouth = 'open';
          p.mo = 0.2;
          p.mw = 0.5;
          p.brY = [0.5, 0.5];
        },
      },
      hop: {
        dur: 0.9,
        pose(p, t) {
          const u = t / 0.9;
          p.y = u > 0.2 && u < 0.8 ? Math.sin(((u - 0.2) / 0.6) * PI) * 0.25 : 0;
          p.sq = u < 0.2 ? 0.9 : 1;
          p.mouth = 'open';
          p.mo = 0.5;
          p.em = ['h', 'h'];
          p.ant = 0.3 * Math.sin(u * 20);
        },
      },
    };
    /* تعبيرات وجه سريعة فوق أي حركة */
    const FACES = {
      wink: {
        dur: 0.8,
        f(p) {
          p.em = [p.em[0], 'h'];
          p.mouth = p.mouth === 'smile' ? 'open' : p.mouth;
          p.mo = Math.max(p.mo, 0.4);
        },
      },
      tongue: {
        dur: 1.4,
        f(p, t) {
          p.mouth = 'tongue';
          p.tg = 0.3 * Math.sin(t * 14);
          p.em = ['n', 'h'];
          p.ck = 0.6;
        },
      },
      blink: {
        dur: 0.35,
        f(p, t) {
          const b = 1 - Math.sin(clamp(t / 0.35, 0, 1) * PI) * 0.95;
          p.eye = [p.eye[0] * b, p.eye[1] * b];
        },
      },
      surprised: {
        dur: 1,
        f(p) {
          p.eye = [1.3, 1.3];
          p.pS = 0.6;
          p.brY = [1.5, 1.5];
          p.mouth = 'open';
          p.mo = 0.8;
          p.mw = 0.6;
        },
      },
      angry: {
        dur: 1.4,
        f(p) {
          p.brR = [-0.5, -0.5];
          p.brY = [-0.6, -0.6];
          p.mouth = 'frown';
          p.eye = [0.75, 0.75];
        },
      },
    };

    /* ---------- المؤثرات (صور صغيرة تطير حول الشخصية) ---------- */
    const parts = [];
    const sprite = (kind, parent, s0) => {
      const s = new T.Sprite(new T.SpriteMaterial({ map: fxTex(kind), transparent: true, depthWrite: false, toneMapped: false }));
      s.scale.set(s0, s0, s0);
      parent.add(s);
      return s;
    };
    function addP(o) {
      o.age = 0;
      parts.push(o);
      o.s.material.opacity = 0;
      return o;
    }
    function stick(kind, pos, tag, mode, phase = 0) {
      addP({ s: sprite(kind, head, 0.24), p0: pos, life: Infinity, tag, mode, phase, sc: kind === 'star' ? 0.17 : 0.26 });
    }
    function drop(kind, pos, tag, mode = 'slide') {
      addP({
        s: sprite(kind, mode === 'rise' ? root : head, 0.16),
        p0: mode === 'rise' ? [pos[0], pos[1] + 1.3, pos[2]] : pos,
        life: mode === 'z' ? 2.2 : mode === 'rise' ? 1.8 : 1.1,
        tag,
        mode,
        sc: kind === 'z' ? 0.22 : kind === 'drop' ? 0.12 : 0.2,
        dx: rnd(-0.2, 0.2),
      });
    }
    function tear(s, tag) {
      addP({
        s: sprite('drop', head, 0.08),
        p0: [s * 0.22, 0, 0.45],
        v: [s * rnd(0.5, 0.9), rnd(0.4, 0.8), 0.1],
        life: 0.7,
        tag,
        mode: 'ball',
        sc: 0.09,
      });
    }
    function burst(kind, n) {
      for (let k = 0; k < n; k++) {
        const a = rnd(0, 2 * PI);
        addP({
          s: sprite(kind, head, 0.1),
          p0: [Math.cos(a) * 0.6, 0.3 + Math.sin(a) * 0.38, 0.2],
          life: 0.9,
          mode: 'tw',
          sc: rnd(0.12, 0.2),
          phase: rnd(0, 3),
        });
      }
    }
    function updParts(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const o = parts[i];
        o.age += dt;
        const a = o.age,
          s = o.s,
          P = o.p0;
        let op = 1,
          sc = o.sc;
        if (o.mode === 'bob') {
          s.position.set(P[0], P[1] + Math.sin(a * 4) * 0.04, P[2]);
          s.material.rotation = Math.sin(a * 3) * 0.25;
        } else if (o.mode === 'pop') {
          s.position.set(P[0], P[1], P[2]);
          sc *= a < 0.25 ? 1.3 * Math.sin(((a / 0.25) * PI) / 2) : 1 + 0.08 * Math.sin(a * 12);
        } else if (o.mode === 'orbit') {
          const ang = o.phase + a * 3.2;
          s.position.set(Math.cos(ang) * 0.55, P[1] + Math.sin(ang * 2) * 0.03, Math.sin(ang) * 0.46);
          s.material.rotation = a * 4;
        } else if (o.mode === 'rise') {
          s.position.set(P[0] + Math.sin(a * 5 + o.dx * 20) * 0.08, P[1] + a * 0.55, P[2]);
          sc *= 0.6 + 0.5 * Math.min(1, a / 0.5);
        } else if (o.mode === 'z') {
          s.position.set(P[0] + a * 0.18, P[1] + a * 0.3, P[2]);
          sc *= 0.5 + a * 0.35;
          s.material.rotation = -0.3 + Math.sin(a * 3) * 0.2;
        } else if (o.mode === 'slide') {
          s.position.set(P[0] + (P[0] > 0 ? 1 : -1) * a * 0.03, P[1] - a * a * 0.35, P[2]);
        } else if (o.mode === 'fall') {
          s.position.set(P[0], P[1] - a * a * 0.6, P[2]);
        } else if (o.mode === 'ball') {
          s.position.set(P[0] + o.v[0] * a, P[1] + o.v[1] * a - 1.6 * a * a, P[2] + o.v[2] * a);
        } else if (o.mode === 'tw') {
          s.position.set(P[0], P[1] + a * 0.15, P[2]);
          sc *= Math.sin(clamp(a / o.life, 0, 1) * PI);
          s.material.rotation = a * 3;
        }
        const fadeIn = Math.min(1, a / 0.12);
        if (o.life !== Infinity) op = Math.min(1, (o.life - a) / (o.life * 0.35));
        if (o.out != null) op = Math.max(0, 1 - (a - o.out) / 0.25);
        s.material.opacity = clamp(op * fadeIn, 0, 1);
        s.scale.set(sc, sc, sc);
        if ((o.life !== Infinity && a >= o.life) || (o.out != null && a - o.out >= 0.25)) {
          s.parent.remove(s);
          s.material.dispose();
          parts.splice(i, 1);
        }
      }
    }

    /* ---------- تشغيل الحركات ---------- */
    let act = null,
      tag = 0,
      faceOv = null,
      nextBlink = 2,
      blinkT = -1,
      autoOn = !!opts.auto,
      nextAuto = rnd(4, 7);
    const listeners = [];
    function play(name, o = {}) {
      const def = A[name] || A.idle;
      const old = tag;
      tag++;
      parts.forEach((p) => {
        if (p.tag === old && p.out == null) p.out = p.age;
      });
      act = { name: A[name] ? name : 'idle', def, t: 0, tag, next: o.then || 'idle', st: 0 };
      if (def.enter) def.enter(tag);
      listeners.forEach((f) => f(act.name));
      return api;
    }
    function face(name) {
      if (FACES[name]) faceOv = { def: FACES[name], t: 0 };
      return api;
    }

    /* ---------- رسم إطار ---------- */
    const W = { h: opts.frameH || 3.15, w: opts.frameW || 1.9, cy: opts.frameY || 1.32 };
    function fit() {
      const w = container.clientWidth || 1,
        h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const tf = Math.tan((camera.fov * PI) / 360);
      const d = Math.max(W.h / (2 * tf), W.w / (2 * tf * camera.aspect));
      camera.position.set(0, W.cy + 0.15, d);
      camera.lookAt(0, W.cy, 0);
      camera.updateProjectionMatrix();
    }
    const ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(container);
    else window.addEventListener('resize', fit);
    fit();

    const glowBase = new T.Color(0x38e8ff),
      glowDim = new T.Color(0x0e5566);
    function apply(dt) {
      const p = Object.assign(mkPose(), { em: ['n', 'n'], mouth: 'smile', dim: 1 });
      base(p);
      act.t += dt;
      act.def.pose(p, act.t);
      if (act.def.every) {
        act.st += dt;
        if (act.st >= act.def.every[0]) {
          act.st = 0;
          act.def.every[1](act.tag);
        }
      }
      if (faceOv) {
        faceOv.t += dt;
        faceOv.def.f(p, faceOv.t);
        if (faceOv.t >= faceOv.def.dur) faceOv = null;
      }
      /* رمش تلقائي */
      if (blinkT < 0 && now > nextBlink) blinkT = 0;
      if (blinkT >= 0) {
        blinkT += dt;
        const b = 1 - Math.sin(clamp(blinkT / 0.16, 0, 1) * PI) * 0.95;
        p.eye = [p.eye[0] * b, p.eye[1] * b];
        if (blinkT > 0.16) {
          blinkT = -1;
          nextBlink = now + (Math.random() < 0.2 ? 0.25 : rnd(2, 5));
        }
      }
      const k = 1 - Math.exp(-dt * 14),
        kf = 1 - Math.exp(-dt * 30),
        eyeK = 1 - Math.exp(-dt * 40);
      const keepEye = [cur.eye[0], cur.eye[1]];
      blendInto(cur, p, k);
      cur.eye = [lerp(keepEye[0], p.eye[0], eyeK), lerp(keepEye[1], p.eye[1], eyeK)];
      cur.mo = lerp(cur.mo, p.mo, kf);
      /* تطبيق على المفاصل */
      root.position.y = Math.max(0, cur.y);
      root.rotation.set(cur.rx, spin + cur.ry, cur.rz);
      body.scale.set(1 / Math.sqrt(cur.sq), cur.sq, 1 / Math.sqrt(cur.sq));
      hips.position.y = 0.72 + cur.hipsY;
      hips.rotation.set(0, cur.hipsYaw, cur.hipsZ);
      spine.rotation.set(cur.spX, cur.spY, cur.spZ);
      neck.rotation.set(cur.hX, cur.hY, cur.hZ);
      arms.forEach((a, i) => {
        a.sh.rotation.set(cur.sh[i].x, cur.sh[i].y, cur.sh[i].z);
        a.el.rotation.set(cur.el[i].x, 0, cur.el[i].z);
        a.fing.rotation.z = -a.s * 1.5 * cur.fist[i];
        /* في القبضة يستقيم الإبهام مع الساعد ويبرز من أعلى القبضة (علامة الإعجاب) */
        a.thumb.rotation.set(lerp(-0.6, 0.15, cur.fist[i]), 0, -a.s * lerp(0.35, 0, cur.fist[i]));
        a.thumb.position.set(-a.s * lerp(0.035, 0.012, cur.fist[i]), lerp(-0.005, -0.06, cur.fist[i]), lerp(0.055, 0.035, cur.fist[i]));
        a.thumb.scale.setScalar(lerp(1, 1.35, cur.fist[i]));
      });
      legs.forEach((l, i) => {
        l.hip.rotation.set(cur.hip[i].x, 0, cur.hip[i].z - cur.hipsZ);
        l.knee.rotation.x = cur.kn[i];
      });
      head.children.forEach((c) => {
        if (c.userData.ant) c.rotation.z = c.userData.ant + cur.ant * c.userData.s;
      });
      /* الشاشة: العيون والحواجب والفم */
      eyes.forEach((e, i) => {
        const m = p.em[i];
        e.open.visible = m === 'n';
        e.arc.visible = m === 'h' || m === 'c';
        e.xg.visible = m === 'x';
        e.arc.rotation.z = m === 'c' ? PI : 0;
        e.arc.position.y = m === 'c' ? 0.01 : -0.02;
        e.open.scale.set(1, Math.max(0.06, cur.eye[i]), 1);
        e.g.position.x = e.s * 0.15 + clamp(cur.pX, -1, 1) * 0.022;
        e.g.position.y = 0.02 - clamp(cur.pY, -1, 1) * 0.02;
        e.pup.position.set(clamp(cur.pX, -1, 1) * 0.018, -clamp(cur.pY, -1, 1) * 0.018, 0.004);
        e.pup.scale.setScalar(cur.pS);
        e.xg.rotation.z = now * 6 * e.s;
      });
      brMat.opacity = clamp(
        Math.max(Math.abs(cur.brY[0]), Math.abs(cur.brY[1])) * 0.9 + Math.max(Math.abs(cur.brR[0]), Math.abs(cur.brR[1])) * 1.4,
        0,
        1,
      );
      brows.forEach((b, i) => {
        b.position.y = 0.13 + cur.brY[i] * 0.022;
        b.rotation.z = -S[i] * cur.brR[i];
      });
      ['smile', 'frown', 'wavy', 'open', 'tongue'].forEach((n) => {
        M[n].visible = p.mouth === n;
      });
      const op = Math.max(0.15, cur.mo);
      cav.scale.set(cur.mw, op, 1);
      tongueIn.visible = cur.mo > 0.35;
      tongueIn.position.y = -0.03 * op;
      tng.rotation.z = cur.tg;
      cheekMat.opacity = clamp(cur.ck, 0, 1.3) * 0.45;
      MAT.glow.color.copy(glowDim).lerp(glowBase, clamp(cur.dim, 0, 1));
      shadow.scale.setScalar(clamp(1 - root.position.y * 0.8, 0.4, 1) * (cur.hipsY < -0.3 ? 1.25 : 1));
      shadow.material.opacity = clamp(1 - root.position.y, 0.3, 1);
    }
    /* الهوائيان يتمايلان مع الحركة */
    head.children.forEach((c) => {
      if (c.isGroup && c.children.length === 3 && c.position.y > 0.1 && Math.abs(c.position.x) > 0.4) {
        c.userData.ant = c.rotation.z;
        c.userData.s = c.position.x > 0 ? 1 : -1;
      }
    });
    let last = performance.now(),
      raf = 0,
      alive = true;
    function frame(ts) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden || (opts.paused && opts.paused())) {
        last = ts;
        return;
      }
      const dt = clamp((ts - last) / 1000, 0, 0.05);
      last = ts;
      now += dt;
      if (act.def.dur && act.t >= act.def.dur) play(act.next);
      if (autoOn && act.name === 'idle' && !faceOv) {
        nextAuto -= dt;
        if (nextAuto <= 0) {
          nextAuto = rnd(5, 9);
          const r = Math.random();
          if (r < 0.2) face('wink');
          else if (r < 0.32) face('tongue');
          else if (r < 0.5) play('look');
          else if (r < 0.62) play('thumb');
          else if (r < 0.72) play('yawn');
          else if (r < 0.86) play('hop');
          else face('blink');
        }
      }
      apply(dt);
      updParts(dt);
      renderer.render(scene, camera);
    }
    const api = {
      play,
      face,
      lookAt(x, y) {
        const r = container.getBoundingClientRect();
        look = {
          x: clamp((x - (r.left + r.width / 2)) / Math.max(400, r.width * 2), -1, 1),
          y: clamp((y - (r.top + r.height * 0.3)) / Math.max(300, r.height * 2), -1, 1),
        };
      },
      spin(d) {
        spin += d;
      },
      setSpin(v) {
        spin = v;
      },
      setAuto(v) {
        autoOn = !!v;
        nextAuto = rnd(3, 6);
      },
      onAction(f) {
        listeners.push(f);
      },
      get action() {
        return act.name;
      },
      actions: Object.keys(A),
      faces: Object.keys(FACES),
      /* لقطة PNG شفافة (تتطلب snapshot: true) */
      snapshot() {
        renderer.render(scene, camera);
        return renderer.domElement.toDataURL('image/png');
      },
      dispose() {
        alive = false;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        renderer.dispose();
        renderer.domElement.remove();
      },
    };
    play('idle');
    raf = requestAnimationFrame(frame);
    return api;
  }
  window.SadenRobot = { create };
})();
