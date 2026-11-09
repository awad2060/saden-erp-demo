/* مهندس سادن ثلاثي الأبعاد: شخصية كرتونية مبنية بالكامل بالكود (three.js) بمفاصل وحركات وتعبيرات وجه ومؤثرات.
 * الاستخدام: const eng = SadenEngineer.create(عنصر, { auto: true }); eng.play('wave'); eng.face('wink'); eng.lookAt(x, y);
 * يرجع null إذا كان المتصفح لا يدعم WebGL. */
(function () {
  'use strict';
  const T = window.THREE;
  const PI = Math.PI;
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));

  const C = {
    skin: 0xf2c29b,
    skinDk: 0xe2a57c,
    hair: 0x3b2416,
    helmet: 0xd71f26,
    brim: 0xb3161c,
    shirt: 0xa9b8c9,
    vest: 0xf97316,
    stripe: 0xeef2f7,
    jeans: 0x3d5a80,
    boot: 0x5b3a24,
    belt: 0x6b4226,
    white: 0xffffff,
    pupil: 0x1d140e,
    brow: 0x3b2416,
    mouth: 0x5e1610,
    tongue: 0xf06a7a,
    cheek: 0xff6b8a,
    line: 0x2a1a12,
  };

  /* تظليل كرتوني بثلاث درجات */
  function toonGrad() {
    const c = document.createElement('canvas');
    c.width = 3;
    c.height = 1;
    const g = c.getContext('2d');
    ['#9a9a9a', '#d6d6d6', '#ffffff'].forEach((col, i) => {
      g.fillStyle = col;
      g.fillRect(i, 0, 1, 1);
    });
    const t = new T.CanvasTexture(c);
    t.minFilter = t.magFilter = T.NearestFilter;
    t.generateMipmaps = false;
    return t;
  }
  /* الحدّ الأسود حول الأجزاء (يُرسم الوجه الخلفي منفوخاً على اتجاه السطح) */
  function outlineMat(th) {
    return new T.ShaderMaterial({
      uniforms: { c: { value: new T.Color(C.line) }, t: { value: th } },
      vertexShader: 'uniform float t; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * t, 1.0); }',
      fragmentShader: 'uniform vec3 c; void main(){ gl_FragColor = vec4(c, 1.0); }',
      side: T.BackSide,
    });
  }
  /* رسومات المؤثرات (؟ ! Z قلب نجمة نقطة نوتة لمعة) */
  const TEX = {};
  function fxTex(kind, real) {
    const key = kind + (real ? 'r' : '');
    if (TEX[key]) return TEX[key];
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
    if (kind === 'q') txt('?', '#1f3a5f');
    else if (kind === 'bang') txt('!', '#dc2626');
    else if (kind === 'z') txt('Z', '#3b82f6', 96);
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
    else if (kind === 'spark') star(4, 58, 14, '#fde047', '#f59e0b');
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
    TEX[key] = new T.CanvasTexture(c);
    if (real) TEX[key].encoding = T.sRGBEncoding;
    return TEX[key];
  }
  function logoTex() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(64, 64, 60, 0, 2 * PI);
    g.fill();
    g.fillStyle = '#b3161c';
    g.font = '900 88px Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('S', 64, 70);
    return new T.CanvasTexture(c);
  }

  /* خامة مرسومة على لوحة: الحجم، دالة الرسم، التكرار */
  function canvasTex(size, draw, rep = 1) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(rep, rep);
    t.anisotropy = 4;
    return t;
  }
  const noise = (g, s, n, a) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
    }
  };
  const REAL_TEX = () => ({
    denim: canvasTex(
      256,
      (g, s) => {
        g.fillStyle = '#3f5f88';
        g.fillRect(0, 0, s, s);
        for (let i = -s; i < s * 2; i += 3) {
          g.strokeStyle = i % 2 ? 'rgba(255,255,255,.09)' : 'rgba(0,0,40,.14)';
          g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(i, 0);
          g.lineTo(i + s, s);
          g.stroke();
        }
        noise(g, s, 5000, 0.08);
      },
      3,
    ),
    plaid: canvasTex(
      256,
      (g, s) => {
        g.fillStyle = '#a9b2bc';
        g.fillRect(0, 0, s, s);
        for (let k = 0; k < s; k += 64) {
          g.fillStyle = 'rgba(45,60,85,.32)';
          g.fillRect(k, 0, 20, s);
          g.fillRect(0, k, s, 20);
          g.fillStyle = 'rgba(255,255,255,.28)';
          g.fillRect(k + 34, 0, 5, s);
          g.fillRect(0, k + 34, s, 5);
          g.fillStyle = 'rgba(120,30,30,.18)';
          g.fillRect(k + 50, 0, 3, s);
          g.fillRect(0, k + 50, s, 3);
        }
        noise(g, s, 3000, 0.05);
      },
      2,
    ),
    vest: canvasTex(
      128,
      (g, s) => {
        g.fillStyle = '#f97316';
        g.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 2) {
          g.fillStyle = 'rgba(0,0,0,.05)';
          g.fillRect(0, y, s, 1);
        }
        noise(g, s, 1500, 0.07);
      },
      4,
    ),
    hair: canvasTex(
      256,
      (g, s) => {
        g.fillStyle = '#3a2315';
        g.fillRect(0, 0, s, s);
        for (let i = 0; i < 900; i++) {
          const x = Math.random() * s,
            y = Math.random() * s;
          g.strokeStyle = Math.random() < 0.5 ? 'rgba(120,80,50,.35)' : 'rgba(10,5,2,.4)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x, y);
          g.quadraticCurveTo(x + 3, y + 8, x + 1, y + 18);
          g.stroke();
        }
      },
      2,
    ),
    leather: canvasTex(
      128,
      (g, s) => {
        g.fillStyle = '#5b3a24';
        g.fillRect(0, 0, s, s);
        noise(g, s, 2500, 0.1);
        for (let i = 0; i < 40; i++) {
          g.strokeStyle = 'rgba(0,0,0,.12)';
          g.beginPath();
          g.arc(Math.random() * s, Math.random() * s, 4 + Math.random() * 8, 0, 3);
          g.stroke();
        }
      },
      2,
    ),
    iris: canvasTex(
      128,
      (g, s) => {
        const c = s / 2;
        const rg = g.createRadialGradient(c, c, 8, c, c, c);
        rg.addColorStop(0, '#000');
        rg.addColorStop(0.3, '#000');
        rg.addColorStop(0.34, '#8a5a2b');
        rg.addColorStop(0.75, '#6b4120');
        rg.addColorStop(0.95, '#2a180b');
        rg.addColorStop(1, '#2a180b');
        g.fillStyle = rg;
        g.fillRect(0, 0, s, s);
        for (let i = 0; i < 90; i++) {
          const a = Math.random() * Math.PI * 2;
          g.strokeStyle = Math.random() < 0.5 ? 'rgba(200,150,80,.35)' : 'rgba(30,15,5,.35)';
          g.beginPath();
          g.moveTo(c + Math.cos(a) * 22, c + Math.sin(a) * 22);
          g.lineTo(c + Math.cos(a) * 58, c + Math.sin(a) * 58);
          g.stroke();
        }
      },
      1,
    ),
  });
  /* بيئة إضاءة (سماء وأرض ولوحات ضوء) للانعكاسات */
  function envTex(renderer) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d'),
      lg = g.createLinearGradient(0, 0, 0, 256);
    lg.addColorStop(0, '#d9e2ec');
    lg.addColorStop(0.45, '#aab6c4');
    lg.addColorStop(0.55, '#7d746a');
    lg.addColorStop(1, '#3f3830');
    g.fillStyle = lg;
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#ffffff';
    g.fillRect(90, 50, 110, 60);
    g.fillRect(330, 70, 70, 40);
    g.fillStyle = '#fff3e0';
    g.fillRect(230, 20, 50, 30);
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
    const REAL = opts.style === 'real';
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return null;
    }
    if (!renderer.getContext()) return null;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowPower ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    if (REAL) {
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.LinearToneMapping;
      renderer.toneMappingExposure = 0.92;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
    }
    const col = (h) => (REAL ? new T.Color(h).convertSRGBToLinear() : new T.Color(h));
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
    let sun;
    if (REAL) {
      scene.environment = envTex(renderer);
      scene.add(new T.HemisphereLight(0xffffff, 0x8a7a68, 0.25));
      sun = new T.DirectionalLight(0xfff1e0, 1.9);
      sun.position.set(2.2, 4.2, 3.6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 3, bottom: -0.5, near: 0.5, far: 12 });
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.02;
      sun.shadow.radius = 5;
      const fill = new T.DirectionalLight(0xdbe8ff, 0.55);
      fill.position.set(-3, 2, 2);
      scene.add(fill);
      const rim = new T.DirectionalLight(0xffffff, 0.9);
      rim.position.set(-1, 3, -4);
      scene.add(rim);
    } else {
      scene.add(new T.HemisphereLight(0xffffff, 0xc9b49c, 0.42));
      sun = new T.DirectionalLight(0xffffff, 0.62);
      sun.position.set(2.5, 4, 4);
    }
    scene.add(sun);

    const grad = toonGrad();
    const MAT = {};
    const RT = REAL ? REAL_TEX() : null;
    if (RT)
      ['denim', 'plaid', 'vest', 'hair', 'leather', 'iris'].forEach((k) => {
        RT[k].encoding = T.sRGBEncoding;
      });
    const realMat = (c) => {
      const std = (o) => new T.MeshStandardMaterial({ color: col(c), roughness: 0.6, ...o });
      switch (c) {
        case C.helmet:
        case C.brim:
          return new T.MeshPhysicalMaterial({ color: col(c), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 });
        case C.skin:
        case C.skinDk:
          return new T.MeshPhysicalMaterial({
            color: col(c),
            roughness: 0.55,
            sheen: 0.5,
            sheenColor: col(0xffb49a),
            sheenRoughness: 0.5,
            emissive: col(0x5a1a08),
            emissiveIntensity: 0.18,
          });
        case C.hair:
          return std({ color: col(0xffffff), map: RT.hair, bumpMap: RT.hair, bumpScale: 0.006, roughness: 0.5 });
        case C.shirt:
          return std({ color: col(0xffffff), map: RT.plaid, bumpMap: RT.plaid, bumpScale: 0.002, roughness: 0.85 });
        case C.vest:
          return std({ color: col(0xffffff), map: RT.vest, bumpMap: RT.vest, bumpScale: 0.003, roughness: 0.75 });
        case C.jeans:
          return std({ color: col(0xffffff), map: RT.denim, bumpMap: RT.denim, bumpScale: 0.004, roughness: 0.9 });
        case C.boot:
        case C.belt:
          return std({
            color: col(c === C.belt ? 0xcfa080 : 0xffffff),
            map: RT.leather,
            bumpMap: RT.leather,
            bumpScale: 0.004,
            roughness: 0.42,
          });
        case C.line:
          return std({ color: col(0x1c1612), roughness: 0.95 });
        case 0xd4a017:
          return std({ metalness: 1, roughness: 0.28 });
        default:
          return std();
      }
    };
    const toon = (c) => MAT[c] || (MAT[c] = REAL ? realMat(c) : new T.MeshToonMaterial({ color: c, gradientMap: grad }));
    const flat = (c, o = {}) =>
      REAL ? new T.MeshStandardMaterial({ color: col(c), roughness: 0.4, ...o }) : new T.MeshBasicMaterial({ color: c, ...o });
    const OUT = outlineMat(0.014);
    /* جزء من الجسم: شكل + لون + حدّ أسود اختياري */
    const part = (geo, mat, parent, pos, scl, rot, outline = true) => {
      const m = new T.Mesh(geo, typeof mat === 'number' ? toon(mat) : mat);
      if (pos) m.position.set(...pos);
      if (scl) m.scale.set(...scl);
      if (rot) m.rotation.set(...rot);
      if (outline && !REAL) m.add(new T.Mesh(geo, OUT));
      parent.add(m);
      return m;
    };
    const grp = (parent, pos) => {
      const g = new T.Group();
      if (pos) g.position.set(...pos);
      parent.add(g);
      return g;
    };
    const sph = (r, w = 28, h = 20) => new T.SphereGeometry(r, w, h);
    const cap = (r, l) => new T.CapsuleGeometry(r, l, 8, 18);

    /* ---------- الهيكل: جذر ← حوض ← جذع ← رقبة ← رأس، والأطراف بمفاصلها ---------- */
    const root = grp(scene);
    const body = grp(root); // للضغط والتمدد
    const hips = grp(body, [0, 0.78, 0]);
    part(sph(0.3), C.jeans, hips, [0, 0, 0], [1, 0.62, 0.85]);
    const legs = [-1, 1].map((s) => {
      const hip = grp(hips, [s * 0.13, -0.02, 0]);
      part(cap(0.11, 0.2), C.jeans, hip, [0, -0.17, 0]);
      const knee = grp(hip, [0, -0.36, 0]);
      part(cap(0.1, 0.16), C.jeans, knee, [0, -0.15, 0]);
      part(sph(0.13), C.boot, knee, [0, -0.32, 0.06], [1, 0.72, 1.45]);
      part(new T.CylinderGeometry(0.135, 0.135, 0.03, 20), C.line, knee, [0, -0.4, 0.06], [1, 1, 1.45], null, false);
      return { hip, knee };
    });
    const spine = grp(hips, [0, 0.05, 0]);
    part(cap(0.28, 0.12), C.shirt, spine, [0, 0.3, 0], [1, 1, 0.84]);
    /* سترة السلامة مفتوحة من الأمام بشريطين عاكسين */
    const vestR = (y) => 0.305 + (0.275 - 0.305) * ((y - 0.03) / 0.42);
    const vestG = grp(spine, [0, 0, 0]);
    vestG.scale.set(1, 1, 0.86);
    const vMat = REAL
      ? Object.assign(realMat(C.vest), { side: T.DoubleSide })
      : new T.MeshToonMaterial({ color: C.vest, gradientMap: grad, side: T.DoubleSide });
    part(new T.CylinderGeometry(0.275, 0.305, 0.42, 32, 1, true, 0.5, 2 * PI - 1), vMat, vestG, [0, 0.24, 0], null, null, false);
    [0.12, 0.3].forEach((y) =>
      part(
        new T.CylinderGeometry(vestR(y + 0.02) + 0.005, vestR(y - 0.02) + 0.005, 0.04, 32, 1, true, 0.5, 2 * PI - 1),
        REAL
          ? new T.MeshStandardMaterial({
              color: col(0xdfe4ea),
              metalness: 0.6,
              roughness: 0.22,
              side: T.DoubleSide,
              emissive: col(0x404040),
            })
          : new T.MeshToonMaterial({ color: C.stripe, gradientMap: grad, side: T.DoubleSide, emissive: 0x555555 }),
        vestG,
        [0, y, 0],
        null,
        null,
        false,
      ),
    );
    /* حزام العدة بجيوب جانبية */
    part(new T.TorusGeometry(0.29, 0.035, 10, 40), C.belt, spine, [0, 0.03, 0], [1, 0.86, 1], [PI / 2, 0, 0]);
    [-1, 1].forEach((s) => {
      part(new T.BoxGeometry(0.11, 0.12, 0.07), C.belt, spine, [s * 0.25, -0.02, 0.12], null, [0, s * 0.7, 0]);
    });
    part(new T.BoxGeometry(0.07, 0.05, 0.03), 0xd4a017, spine, [0, 0.03, 0.255], null, null, false);
    part(new T.TorusGeometry(0.11, 0.03, 8, 24), C.shirt, spine, [0, 0.63, 0], null, [PI / 2, 0, 0]);
    const arms = [-1, 1].map((s) => {
      const sh = grp(spine, [s * 0.3, 0.48, 0]);
      part(sph(0.1), C.vest, sh, [0, 0, 0]);
      part(cap(0.085, 0.2), C.shirt, sh, [0, -0.16, 0]);
      const el = grp(sh, [0, -0.36, 0]);
      part(cap(0.075, 0.16), C.skin, el, [0, -0.13, 0]);
      const hand = grp(el, [0, -0.32, 0]);
      part(sph(0.085), C.skin, hand, [0, 0.01, 0], [0.62, 0.95, 1]);
      [-0.045, -0.015, 0.015, 0.045].forEach((z, k) =>
        part(cap(0.021, 0.05 + (k === 1 || k === 2 ? 0.012 : 0)), C.skin, hand, [-s * 0.012, -0.08, z], null, [0, 0, -s * 0.3]),
      );
      part(cap(0.024, 0.045), C.skin, hand, [-s * 0.035, -0.01, 0.06], null, [-0.7, 0, -s * 0.3]);
      return { sh, el, hand };
    });
    const neck = grp(spine, [0, 0.62, 0]);
    part(new T.CylinderGeometry(0.08, 0.09, REAL ? 0.16 : 0.1, 16), C.skin, neck, [0, REAL ? 0.05 : 0.03, 0], null, null, false);
    const head = grp(neck, [0, REAL ? 0.37 : 0.42, 0]);
    if (REAL) head.scale.setScalar(0.87);
    const HR = [0.42, 0.4, 0.386];
    part(sph(0.42, 40, 30), C.skin, head, [0, 0, 0], [1, 0.95, 0.92]);
    /* نقطة على سطح الوجه */
    const fz = (x, y) => HR[2] * Math.sqrt(Math.max(0, 1 - (x / HR[0]) ** 2 - (y / HR[1]) ** 2));
    [-1, 1].forEach((s) => part(sph(0.08), C.skin, head, [s * 0.41, -0.04, 0], [0.5, 1, 0.8]));
    part(new T.SphereGeometry(0.43, 32, 20, PI, PI, 0, PI * 0.62), C.hair, head, [0, 0.02, -0.01], [1, 0.97, 0.94]);
    [-1, 1].forEach((s) => part(sph(0.07), C.hair, head, [s * 0.36, 0.1, 0.1], [0.6, 1, 0.8], [0, 0, s * 0.3], false));
    /* ملامح الوجه */
    const faceG = grp(head);
    const eyes = [-1, 1].map((s) => {
      const x = s * 0.14,
        y = -0.02;
      const g = grp(faceG, [x, y, fz(x, y) - 0.012]);
      const open = grp(g);
      part(
        sph(0.085),
        REAL
          ? new T.MeshPhysicalMaterial({ color: col(0xf3efe8), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03 })
          : flat(C.white),
        open,
        [0, 0, 0],
        [0.85, 1.1, 0.45],
        null,
        false,
      );
      if (!REAL) part(new T.TorusGeometry(0.084, 0.008, 6, 30), flat(C.line), open, [0, 0, 0.01], [0.85, 1.1, 1], null, false);
      const pup = grp(open, [0, 0, 0.03]);
      if (REAL)
        part(
          new T.CircleGeometry(0.044, 32),
          new T.MeshPhysicalMaterial({ map: RT.iris, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02 }),
          pup,
          [0, 0, 0.011],
          [1, 1.08, 1],
          null,
          false,
        );
      else part(sph(0.048), flat(C.pupil), pup, [0, 0, 0], [1, 1.1, 0.45], null, false);
      let lid = null;
      if (REAL) {
        const lp = grp(g);
        lp.scale.set(0.85, 1.1, 0.6);
        lid = part(new T.SphereGeometry(0.092, 28, 14, 0, 2 * PI, 0, PI / 2), C.skin, lp, null, null, null, false);
        part(new T.TorusGeometry(0.092, 0.006, 6, 30, PI), flat(0x24160e), lid, null, null, [PI / 2, 0, 0], false);
      }
      part(sph(0.017), flat(C.white), pup, [-0.016, 0.022, 0.02], null, null, false);
      part(sph(0.008), flat(C.white), pup, [0.016, -0.016, 0.02], null, null, false);
      /* عين سعيدة ∩ / مقفولة ∪ */
      const arc = part(new T.TorusGeometry(0.06, 0.014, 8, 20, PI), flat(C.line), g, [0, -0.02, 0.04], null, null, false);
      /* عين X (دايخ) */
      const xg = grp(g, [0, 0, 0.04]);
      [PI / 4, -PI / 4].forEach((r) => part(new T.BoxGeometry(0.13, 0.024, 0.01), flat(C.line), xg, null, null, [0, 0, r], false));
      return { g, open, pup, arc, xg, s, lid };
    });
    const brows = [-1, 1].map((s) => {
      const x = s * 0.14,
        y = 0.115;
      const b = grp(faceG, [x, y, fz(x, y) + 0.004]);
      part(cap(0.018, 0.08), flat(C.brow), b, null, null, [0, 0, PI / 2], false);
      return b;
    });
    part(sph(0.04), C.skinDk, faceG, [0, -0.1, fz(0, -0.1) + 0.004], [1, 0.85, 0.8], null, false);
    const cheekMat = REAL
      ? new T.MeshBasicMaterial({ color: col(0xff8a8a), transparent: true, opacity: 0.1, depthWrite: false })
      : flat(C.cheek, { transparent: true, opacity: 0.2, depthWrite: false });
    [-1, 1].forEach((s) => {
      const x = s * 0.25,
        y = -0.13;
      part(sph(0.065), cheekMat, faceG, [x, y, fz(x, y) - 0.01], [1, 0.6, 0.3], null, false);
    });
    /* الأفواه: ابتسامة، مفتوح (كلام/ضحك/دهشة)، زعلان، متعرّج، لسان */
    const my = -0.2,
      mz = fz(0, my);
    const M = {};
    M.smile = part(new T.TorusGeometry(0.07, 0.014, 8, 24, PI), flat(C.mouth), faceG, [0, my + 0.03, mz + 0.002], null, [0, 0, PI], false);
    M.frown = part(new T.TorusGeometry(0.06, 0.014, 8, 24, PI), flat(C.mouth), faceG, [0, my - 0.03, mz + 0.002], null, null, false);
    const wav = new T.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => new T.Vector3(-0.08 + i * 0.02, i % 2 ? 0.012 : -0.012, 0)));
    M.wavy = part(new T.TubeGeometry(wav, 40, 0.012, 6, false), flat(C.mouth), faceG, [0, my, mz + 0.002], null, null, false);
    M.open = grp(faceG, [0, my - 0.005, mz - 0.012]);
    const cav = part(sph(0.075), flat(C.mouth), M.open, [0, 0, 0], [1, 1, 0.35], null, false);
    const teeth = part(new T.BoxGeometry(0.1, 0.025, 0.012), flat(C.white), M.open, [0, 0.05, 0.022], null, null, false);
    const tongueIn = part(sph(0.042), flat(C.tongue), M.open, [0, -0.04, 0.012], [1.25, 0.6, 0.5], null, false);
    M.tongue = grp(faceG, [0, my, mz]);
    part(new T.TorusGeometry(0.07, 0.014, 8, 24, PI), flat(C.mouth), M.tongue, [0, 0.03, 0.002], null, [0, 0, PI], false);
    const tng = grp(M.tongue, [0.02, -0.035, 0.012]);
    part(cap(0.032, 0.05), flat(C.tongue), tng, [0, -0.03, 0], [1.15, 1, 0.5], null, false);
    part(new T.BoxGeometry(0.004, 0.05, 0.004), flat(0xc2414b), tng, [0, -0.03, 0.016], null, null, false);
    /* الخوذة الحمراء بحافة وحرف علوي وشعار */
    const helm = grp(head, [0, 0.12, 0]);
    part(new T.SphereGeometry(0.47, 40, 20, 0, 2 * PI, 0, PI / 2), C.helmet, helm, [0, 0, 0], [1, 0.88, 0.98]);
    part(new T.CylinderGeometry(0.5, 0.53, 0.045, 48), C.brim, helm, [0, 0, 0.035], [1, 1, 1.06]);
    part(new T.TorusGeometry(0.465, 0.035, 10, 30, PI), C.brim, helm, [0, 0, 0], [1, 0.88, 0.98], [0, PI / 2, 0], false);
    const lp = grp(helm);
    lp.rotation.set(-0.55, 0.5, 0);
    const logo = logoTex();
    if (REAL) logo.encoding = T.sRGBEncoding;
    part(
      new T.CircleGeometry(0.09, 32),
      REAL
        ? new T.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.3 })
        : new T.MeshBasicMaterial({ map: logo, transparent: true }),
      lp,
      [0, 0, 0.455],
      null,
      null,
      false,
    );
    if (!REAL)
      part(
        new T.SphereGeometry(0.2, 16, 10, 0, 2 * PI, 0, PI / 2),
        flat(C.white, { transparent: true, opacity: 0.35 }),
        helm,
        [-0.18, 0.28, 0.1],
        [1, 0.35, 0.6],
        [-0.5, 0, 0.5],
        false,
      );
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
    if (REAL) {
      root.traverse((m) => {
        if (m.isMesh && m.material !== cheekMat) {
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
      eye: [1, 1],
      pX: 0,
      pY: 0,
      pS: 1,
      brY: [0, 0],
      brR: [0, 0],
      mo: 0,
      mw: 1,
      ck: 0.2,
      tg: 0,
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

    /* الوقفة الأساسية: تنفس وتمايل خفيف ونظر نحو المؤشر */
    function base(p) {
      const br = Math.sin(now * 2.2);
      p.sq = 1 + 0.012 * br;
      p.spX = 0.02 * br;
      p.hipsZ = 0.03 * Math.sin(now * 1.1);
      S.forEach((s, i) => {
        p.sh[i].z = s * (0.16 + 0.02 * br);
        p.el[i].x = -0.15;
        p.sh[i].x = 0.04;
      });
      p.hY = look.x * 0.45;
      p.hX = look.y * 0.25 - 0.03;
      p.pX = look.x;
      p.pY = look.y;
      p.ck = 0.2;
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
          p.hZ = -0.12;
          p.hY = 0.15;
          p.spZ = -0.05;
          p.mouth = 'open';
          p.mo = 0.55;
          p.brY = [1, 1];
          p.ck = 0.5;
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
            p.sq = lerp(1, 0.82, ease(u / 0.22));
            p.kn = [0.6, 0.6];
            p.hip[0].x = p.hip[1].x = -0.4;
          } else if (u < 0.75) {
            const a = (u - 0.22) / 0.53;
            p.y = Math.sin(a * PI) * 0.5;
            p.sq = a < 0.3 ? 1.1 : 1;
            p.hip[0].x = p.hip[1].x = -0.45;
            p.kn = [0.9, 0.9];
            S.forEach((s, i) => {
              p.sh[i].z = s * 2.6;
              p.el[i].x = -0.3;
            });
          } else {
            p.sq = lerp(0.86, 1, ease((u - 0.75) / 0.25));
          }
          p.em = ['h', 'h'];
          p.mouth = 'open';
          p.mo = 0.9;
          p.ck = 0.8;
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
          p.el[1].x = -2.35;
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
          p.hip[0].z = -0.05;
          p.kn[0] = Math.max(0, Math.sin(t * 7)) * 0.25;
        },
        enter(tag) {
          stick('q', [0.42, 0.62, 0.1], tag, 'bob');
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
          p.hZ = -0.22;
          p.hY = -0.15;
          p.pX = -0.5;
          p.pY = -0.6;
          p.brY = [1, -0.4];
          p.brR = [0.4, -0.3];
          p.mouth = 'wavy';
          p.ck = 0.1;
        },
        every: [0.8, (tag) => drop('drop', [-0.42, 0.25, 0.15], tag)],
        enter(tag) {
          stick('q', [0.48, 0.66, 0.1], tag, 'bob');
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
          p.brY = [0.5 * Math.abs(Math.sin(t * 4)), 0.5 * Math.abs(Math.sin(t * 4))];
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
          p.hY = 0.5;
          p.hZ = -0.05;
          p.pX = 1;
          p.spY = 0.15;
          p.mouth = 'open';
          p.mo = 0.45;
          p.em = ['n', 'h'];
          p.brY = [0.6, 0.6];
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
          });
          p.hip[0].x = Math.max(0, a) * -0.6;
          p.hip[1].x = Math.max(0, -a) * -0.6;
          p.kn = [Math.max(0, a) * 1.1, Math.max(0, -a) * 1.1];
          p.em = ['h', 'h'];
          p.mouth = 'open';
          p.mo = 0.7;
          p.ck = 0.6;
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
          p.brY = [0.8, 0.8];
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
          });
          p.kn[0] = 1.2;
          p.hip[0].x = 0.1;
          p.em = ['h', 'h'];
          p.mouth = 'smile';
          p.ck = 1.3;
          p.brY = [0.5, 0.5];
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
          p.eye = [0.75, 0.75];
          p.pY = 0.8;
          p.brR = [0.55, 0.55];
          p.brY = [0.2, 0.2];
          p.mouth = 'frown';
          p.ck = 0.05;
          p.sq = 0.98 + 0.01 * Math.sin(t * 1.2);
        },
        every: [2.2, (tag) => drop('drop', [0.16, -0.05, 0.4], tag, 'fall')],
      },
      scared: {
        loop: true,
        pose(p, t) {
          S.forEach((s, i) => {
            p.sh[i].z = s * (2.2 + 0.5 * Math.sin(t * 18 + i * 2));
            p.sh[i].x = -0.3;
            p.el[i].x = -0.7 * Math.abs(Math.sin(t * 20 + i));
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
          p.ck = 0;
          p.hX = -0.1;
        },
        enter(tag) {
          stick('bang', [0.46, 0.66, 0.1], tag, 'pop');
        },
      },
      dizzy: {
        dur: 3.2,
        pose(p, t) {
          const imp = t < 0.35;
          const w = t * 5;
          p.sq = imp ? lerp(0.7, 1, ease(t / 0.35)) : 1;
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
          p.ck = 0.3;
        },
        enter(tag) {
          for (let k = 0; k < 4; k++) stick('star', [0, 0.62, 0], tag, 'orbit', k * (PI / 2));
        },
      },
      sleep: {
        loop: true,
        pose(p, t) {
          const br = Math.sin(t * 1.3);
          p.hipsY = -0.6;
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
          });
          p.em = ['c', 'c'];
          p.mouth = 'open';
          p.mo = 0.12 + (0.12 * (br + 1)) / 2;
          p.mw = 0.5;
          p.ck = 0.3;
          p.sq = 1 + 0.02 * br;
        },
        every: [1.1, (tag) => drop('z', [0.35, 0.45, 0.1], tag, 'z')],
      },
      wake: {
        dur: 1.3,
        pose(p, t) {
          p.y = t < 0.5 ? Math.sin((t / 0.5) * PI) * 0.35 : 0;
          S.forEach((s, i) => {
            p.sh[i].z = s * (t < 0.6 ? 2.4 : 0.4);
            p.el[i].x = -0.4;
          });
          p.eye = [1.35, 1.35];
          p.pS = 0.55;
          p.brY = [1.6, 1.6];
          p.mouth = 'open';
          p.mo = 0.9;
          p.mw = 0.7;
          p.ck = 0;
        },
        enter(tag) {
          stick('bang', [0.46, 0.66, 0.1], tag, 'pop');
        },
      },
      yawn: {
        dur: 2.6,
        pose(p, t) {
          const u = Math.sin(clamp(t / 2.4, 0, 1) * PI);
          S.forEach((s, i) => {
            p.sh[i].z = s * lerp(0.16, 2.8, u);
            p.el[i].x = lerp(-0.15, -0.5, u);
          });
          p.spX = -0.15 * u;
          p.hX = -0.3 * u;
          p.sq = 1 + 0.06 * u;
          p.em = u > 0.4 ? ['c', 'c'] : ['n', 'n'];
          p.mouth = 'open';
          p.mo = u;
          p.mw = 0.8;
          p.brY = [-0.5 * u, -0.5 * u];
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
          p.sq = u < 0.2 ? 0.88 : 1;
          p.mouth = 'open';
          p.mo = 0.5;
          p.em = ['h', 'h'];
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
          p.brY = [0.6, -0.3];
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
          p.eye = [0.8, 0.8];
          p.ck = 0.9;
        },
      },
    };

    /* ---------- المؤثرات (صور صغيرة تطير حول الشخصية) ---------- */
    const parts = [];
    const sprite = (kind, parent, sc) => {
      const s = new T.Sprite(new T.SpriteMaterial({ map: fxTex(kind, REAL), transparent: true, depthWrite: false, toneMapped: false }));
      s.scale.set(sc, sc, sc);
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
        p0: [s * 0.2, -0.04, 0.35],
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
          p0: [Math.cos(a) * 0.55, 0.3 + Math.sin(a) * 0.35, 0.2],
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
          s.position.set(Math.cos(ang) * 0.5, P[1] + Math.sin(ang * 2) * 0.03, Math.sin(ang) * 0.42);
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

    function apply(dt) {
      /* الوضعية المستهدفة لهذا الإطار */
      const p = Object.assign(mkPose(), { em: ['n', 'n'], mouth: 'smile' });
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
      /* رمش تلقائي للعين المفتوحة */
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
        kf = 1 - Math.exp(-dt * 30);
      const eyeK = 1 - Math.exp(-dt * 40);
      const keepEye = [cur.eye[0], cur.eye[1]];
      blendInto(cur, p, k);
      cur.eye = [lerp(keepEye[0], p.eye[0], eyeK), lerp(keepEye[1], p.eye[1], eyeK)];
      cur.mo = lerp(cur.mo, p.mo, kf);
      /* تطبيق على المفاصل */
      root.position.y = Math.max(0, cur.y);
      root.rotation.set(cur.rx, spin + cur.ry, cur.rz);
      body.scale.set(1 / Math.sqrt(cur.sq), cur.sq, 1 / Math.sqrt(cur.sq));
      hips.position.y = 0.78 + cur.hipsY;
      hips.rotation.set(0, cur.hipsYaw, cur.hipsZ);
      spine.rotation.set(cur.spX, cur.spY, cur.spZ);
      neck.rotation.set(cur.hX, cur.hY, cur.hZ);
      arms.forEach((a, i) => {
        a.sh.rotation.set(cur.sh[i].x, cur.sh[i].y, cur.sh[i].z);
        a.el.rotation.set(cur.el[i].x, 0, cur.el[i].z);
      });
      legs.forEach((l, i) => {
        l.hip.rotation.set(cur.hip[i].x, 0, cur.hip[i].z - cur.hipsZ);
        l.knee.rotation.x = cur.kn[i];
      });
      /* الوجه */
      eyes.forEach((e, i) => {
        const m = p.em[i];
        if (e.lid) {
          e.open.visible = m === 'n' || m === 'c';
          e.arc.visible = m === 'h';
          e.arc.rotation.z = 0;
          e.arc.position.y = -0.02;
          e.xg.visible = m === 'x';
          e.lid.visible = e.open.visible;
          let o = cur.eye[i];
          if (m === 'c') o = 0;
          e.lid.rotation.x = o >= 1 ? -0.55 - (o - 1) * 0.9 : lerp(1.62, -0.55, o);
          e.pup.visible = o > 0.2;
          e.pup.position.set(clamp(cur.pX, -1, 1) * 0.028, -clamp(cur.pY, -1, 1) * 0.03, 0.03);
          e.pup.scale.setScalar(0.85 + cur.pS * 0.15);
          e.xg.rotation.z = now * 6 * e.s;
          return;
        }
        e.open.visible = m === 'n';
        e.arc.visible = m === 'h' || m === 'c';
        e.xg.visible = m === 'x';
        e.arc.rotation.z = m === 'c' ? PI : 0;
        e.arc.position.y = m === 'c' ? 0.01 : -0.02;
        e.open.scale.set(1, Math.max(0.05, cur.eye[i]), 1);
        e.pup.position.set(clamp(cur.pX, -1, 1) * 0.028, -clamp(cur.pY, -1, 1) * 0.03, 0.03);
        e.pup.scale.setScalar(cur.pS);
        e.xg.rotation.z = now * 6 * e.s;
      });
      brows.forEach((b, i) => {
        b.position.y = 0.115 + cur.brY[i] * 0.025;
        b.rotation.z = -S[i] * cur.brR[i];
      });
      ['smile', 'frown', 'wavy', 'open', 'tongue'].forEach((n) => {
        M[n].visible = p.mouth === n;
      });
      const op = Math.max(0.12, cur.mo);
      M.open.scale.set(cur.mw, 1, 1);
      cav.scale.set(1, op, 0.35);
      teeth.visible = cur.mo > 0.45 && cur.mw > 0.85;
      teeth.position.y = 0.075 * op - 0.012;
      tongueIn.position.y = -0.075 * op + 0.02;
      tongueIn.visible = cur.mo > 0.3;
      tng.rotation.z = cur.tg;
      cheekMat.opacity = clamp(cur.ck, 0, 1.3) * (REAL ? 0.28 : 0.5);
      shadow.scale.setScalar(clamp(1 - root.position.y * 0.8, 0.4, 1) * (cur.hipsY < -0.3 ? 1.25 : 1));
      shadow.material.opacity = clamp(1 - root.position.y, 0.3, 1);
    }
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
          if (r < 0.25) face('wink');
          else if (r < 0.42) face('tongue');
          else if (r < 0.6) play('look');
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
      /* اتجاه النظر بإحداثيات الشاشة */
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
  window.SadenEngineer = { create };
})();
