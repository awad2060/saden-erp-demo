/* سند الروبوت ثلاثي الأبعاد: روبوت لطيف مبني بالكامل بالكود (three.js) — رأس أبيض لامع بشاشة سوداء وعيون سماوية مضيئة،
 * سماعات وهوائيان، دائرة مضيئة على الصدر، ومفاصل معدنية داكنة. الاستخدام:
 * const bot = SadenRobot.create(عنصر, { auto: true }); bot.play('wave'); bot.face('wink'); bot.lookAt(x, y);
 * يرجع null إذا كان المتصفح لا يدعم WebGL.
 * الأجزاء: robot3d-build.js (البناء) و robot3d-moves.js (الحركات) — يُحمَّلان قبله بهذا الترتيب. */
(function () {
  'use strict';
  const T = window.THREE;
  /* أجزاء الملف (robot3d-build.js و robot3d-moves.js تُحمَّل قبله) */
  const { makeRenderer, makeScene, makeMats, buildBody, buildHead, buildFace, buildMouths, buildShadow } = window.SADEN_ROBOT_PARTS.build;
  const { mkPose, blendInto, S, base, ACTIONS, FACES } = window.SADEN_ROBOT_PARTS.moves;
  const PI = Math.PI;
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

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
  /* ---------- المؤثرات (صور صغيرة تطير حول الشخصية) ---------- */
  const sprite = (kind, parent, s0) => {
    const s = new T.Sprite(new T.SpriteMaterial({ map: fxTex(kind), transparent: true, depthWrite: false, toneMapped: false }));
    s.scale.set(s0, s0, s0);
    parent.add(s);
    return s;
  };
  function addP(parts, o) {
    o.age = 0;
    parts.push(o);
    o.s.material.opacity = 0;
    return o;
  }
  /* مؤثرات نسخة واحدة: مثبتة على الرأس، أو تسقط / تطير، أو دموع، أو لمعات */
  function makeFx({ parts, head, root }) {
    function stick(kind, pos, tag, mode, phase = 0) {
      addP(parts, { s: sprite(kind, head, 0.24), p0: pos, life: Infinity, tag, mode, phase, sc: kind === 'star' ? 0.17 : 0.26 });
    }
    function drop(kind, pos, tag, mode = 'slide') {
      addP(parts, {
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
      addP(parts, {
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
        addP(parts, {
          s: sprite(kind, head, 0.1),
          p0: [Math.cos(a) * 0.6, 0.3 + Math.sin(a) * 0.38, 0.2],
          life: 0.9,
          mode: 'tw',
          sc: rnd(0.12, 0.2),
          phase: rnd(0, 3),
        });
      }
    }
    return { stick, drop, tear, burst };
  }
  /* حركة المؤثر حسب نوعه: يضع موضعه ودورانه ويرجع مقياسه */
  const FX_MOVE = {
    bob(o, s, a, P, sc) {
      s.position.set(P[0], P[1] + Math.sin(a * 4) * 0.04, P[2]);
      s.material.rotation = Math.sin(a * 3) * 0.25;
      return sc;
    },
    pop(o, s, a, P, sc) {
      s.position.set(P[0], P[1], P[2]);
      return sc * (a < 0.25 ? 1.3 * Math.sin(((a / 0.25) * PI) / 2) : 1 + 0.08 * Math.sin(a * 12));
    },
    orbit(o, s, a, P, sc) {
      const ang = o.phase + a * 3.2;
      s.position.set(Math.cos(ang) * 0.55, P[1] + Math.sin(ang * 2) * 0.03, Math.sin(ang) * 0.46);
      s.material.rotation = a * 4;
      return sc;
    },
    rise(o, s, a, P, sc) {
      s.position.set(P[0] + Math.sin(a * 5 + o.dx * 20) * 0.08, P[1] + a * 0.55, P[2]);
      return sc * (0.6 + 0.5 * Math.min(1, a / 0.5));
    },
    z(o, s, a, P, sc) {
      s.position.set(P[0] + a * 0.18, P[1] + a * 0.3, P[2]);
      s.material.rotation = -0.3 + Math.sin(a * 3) * 0.2;
      return sc * (0.5 + a * 0.35);
    },
    slide(o, s, a, P, sc) {
      s.position.set(P[0] + (P[0] > 0 ? 1 : -1) * a * 0.03, P[1] - a * a * 0.35, P[2]);
      return sc;
    },
    fall(o, s, a, P, sc) {
      s.position.set(P[0], P[1] - a * a * 0.6, P[2]);
      return sc;
    },
    ball(o, s, a, P, sc) {
      s.position.set(P[0] + o.v[0] * a, P[1] + o.v[1] * a - 1.6 * a * a, P[2] + o.v[2] * a);
      return sc;
    },
    tw(o, s, a, P, sc) {
      s.position.set(P[0], P[1] + a * 0.15, P[2]);
      s.material.rotation = a * 3;
      return sc * Math.sin(clamp(a / o.life, 0, 1) * PI);
    },
  };
  /* تحريك المؤثرات وظهورها واختفاؤها، وحذف المنتهي */
  function updParts(parts, dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const o = parts[i];
      o.age += dt;
      const a = o.age,
        s = o.s;
      let op = 1;
      const sc = Object.hasOwn(FX_MOVE, o.mode) ? FX_MOVE[o.mode](o, s, a, o.p0, o.sc) : o.sc;
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

  /* ---------- النسخة: البناء ثم التشغيل ---------- */
  function create(container, opts = {}) {
    const renderer = makeRenderer(container, opts);
    if (!renderer) return null;
    /* R: كل أجزاء النسخة (المشهد، الخامات، المفاصل، الملامح) وحالة التشغيل st */
    const R = { container, opts, renderer, ...makeScene(renderer) };
    Object.assign(R, makeMats());
    Object.assign(R, buildBody(R.scene, R.MAT));
    Object.assign(R, buildHead(R.neck, R.MAT));
    Object.assign(R, buildFace(R));
    Object.assign(R, buildMouths(R));
    R.shadow = buildShadow(R);
    R.cur = mkPose();
    R.st = { look: { x: 0, y: 0 }, spin: 0, now: 0 };
    R.parts = [];
    R.fx = makeFx(R);
    Object.assign(R.st, { act: null, tag: 0, faceOv: null, nextBlink: 2, blinkT: -1, autoOn: !!opts.auto, nextAuto: rnd(4, 7) });
    R.listeners = [];
    makeFit(R);
    R.glowBase = new T.Color(0x38e8ff);
    R.glowDim = new T.Color(0x0e5566);
    /* الهوائيان يتمايلان مع الحركة */
    R.head.children.forEach((c) => {
      if (c.isGroup && c.children.length === 3 && c.position.y > 0.1 && Math.abs(c.position.x) > 0.4) {
        c.userData.ant = c.rotation.z;
        c.userData.s = c.position.x > 0 ? 1 : -1;
      }
    });
    Object.assign(R.st, { last: performance.now(), raf: 0, alive: true });
    R.api = makeApi(R);
    play(R, 'idle');
    R.st.raf = requestAnimationFrame((ts) => frame(R, ts));
    return R.api;
  }
  /* تشغيل حركة: مؤثرات الحركة السابقة تختفي، وتبدأ الجديدة (ثم next عند انتهائها) */
  function play(R, name, o = {}) {
    const { st } = R;
    const def = ACTIONS[name] || ACTIONS.idle;
    const old = st.tag;
    st.tag++;
    R.parts.forEach((p) => {
      if (p.tag === old && p.out == null) p.out = p.age;
    });
    st.act = { name: ACTIONS[name] ? name : 'idle', def, t: 0, tag: st.tag, next: o.then || 'idle', st: 0 };
    if (def.enter) def.enter(st.tag, R.fx);
    R.listeners.forEach((f) => f(st.act.name));
    return R.api;
  }
  function face(R, name) {
    if (FACES[name]) R.st.faceOv = { def: FACES[name], t: 0 };
    return R.api;
  }
  /* إطار الكاميرا على قد الحاوية (ويتابع تغيّر مقاسها) */
  function makeFit(R) {
    const { container, renderer, camera, opts } = R;
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
    R.ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
    if (R.ro) R.ro.observe(container);
    else window.addEventListener('resize', fit);
    fit();
  }
  /* الوضعية المستهدفة لهذا الإطار: الأساسية + الحركة (ومؤثراتها الدورية) + تعبير الوجه + الرمش التلقائي */
  function targetPose(R, dt) {
    const { st } = R;
    const act = st.act;
    const p = Object.assign(mkPose(), { em: ['n', 'n'], mouth: 'smile', dim: 1 });
    base(p, st);
    act.t += dt;
    act.def.pose(p, act.t);
    if (act.def.every) {
      act.st += dt;
      if (act.st >= act.def.every[0]) {
        act.st = 0;
        act.def.every[1](act.tag, R.fx);
      }
    }
    if (st.faceOv) {
      st.faceOv.t += dt;
      st.faceOv.def.f(p, st.faceOv.t);
      if (st.faceOv.t >= st.faceOv.def.dur) st.faceOv = null;
    }
    /* رمش تلقائي */
    if (st.blinkT < 0 && st.now > st.nextBlink) st.blinkT = 0;
    if (st.blinkT >= 0) {
      st.blinkT += dt;
      const b = 1 - Math.sin(clamp(st.blinkT / 0.16, 0, 1) * PI) * 0.95;
      p.eye = [p.eye[0] * b, p.eye[1] * b];
      if (st.blinkT > 0.16) {
        st.blinkT = -1;
        st.nextBlink = st.now + (Math.random() < 0.2 ? 0.25 : rnd(2, 5));
      }
    }
    return p;
  }
  /* اقتراب الوضعية الحالية من المستهدفة ثم تطبيقها على الجسم والشاشة */
  function apply(R, dt) {
    const { cur } = R;
    const p = targetPose(R, dt);
    const k = 1 - Math.exp(-dt * 14),
      kf = 1 - Math.exp(-dt * 30),
      eyeK = 1 - Math.exp(-dt * 40);
    const keepEye = [cur.eye[0], cur.eye[1]];
    blendInto(cur, p, k);
    cur.eye = [lerp(keepEye[0], p.eye[0], eyeK), lerp(keepEye[1], p.eye[1], eyeK)];
    cur.mo = lerp(cur.mo, p.mo, kf);
    applyJoints(R);
    applyScreen(R, p);
  }
  /* تطبيق على المفاصل */
  function applyJoints({ cur, st, root, body, hips, spine, neck, arms, legs, head }) {
    root.position.y = Math.max(0, cur.y);
    root.rotation.set(cur.rx, st.spin + cur.ry, cur.rz);
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
  }
  /* الشاشة: العيون والحواجب والفم، والخدود وخفوت الإضاءة، والظل */
  function applyScreen(R, p) {
    const { cur, st, eyes, brMat, brows, M, cav, tongueIn, tng, cheekMat, MAT, shadow, root } = R;
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
      e.xg.rotation.z = st.now * 6 * e.s;
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
    MAT.glow.color.copy(R.glowDim).lerp(R.glowBase, clamp(cur.dim, 0, 1));
    shadow.scale.setScalar(clamp(1 - root.position.y * 0.8, 0.4, 1) * (cur.hipsY < -0.3 ? 1.25 : 1));
    shadow.material.opacity = clamp(1 - root.position.y, 0.3, 1);
  }
  /* حركة تلقائية عشوائية وهو واقف بلا تعبير */
  function autoPick(R, dt) {
    const { st } = R;
    st.nextAuto -= dt;
    if (st.nextAuto > 0) return;
    st.nextAuto = rnd(5, 9);
    const r = Math.random();
    if (r < 0.2) face(R, 'wink');
    else if (r < 0.32) face(R, 'tongue');
    else if (r < 0.5) play(R, 'look');
    else if (r < 0.62) play(R, 'thumb');
    else if (r < 0.72) play(R, 'yawn');
    else if (r < 0.86) play(R, 'hop');
    else face(R, 'blink');
  }
  /* رسم إطار */
  function frame(R, ts) {
    const { st, opts } = R;
    if (!st.alive) return;
    st.raf = requestAnimationFrame((t) => frame(R, t));
    if (document.hidden || (opts.paused && opts.paused())) {
      st.last = ts;
      return;
    }
    const dt = clamp((ts - st.last) / 1000, 0, 0.05);
    st.last = ts;
    st.now += dt;
    if (st.act.def.dur && st.act.t >= st.act.def.dur) play(R, st.act.next);
    if (st.autoOn && st.act.name === 'idle' && !st.faceOv) autoPick(R, dt);
    apply(R, dt);
    updParts(R.parts, dt);
    R.renderer.render(R.scene, R.camera);
  }
  /* واجهة النسخة */
  function makeApi(R) {
    const { st, container, renderer } = R;
    return {
      play: (name, o) => play(R, name, o),
      face: (name) => face(R, name),
      lookAt(x, y) {
        const r = container.getBoundingClientRect();
        st.look = {
          x: clamp((x - (r.left + r.width / 2)) / Math.max(400, r.width * 2), -1, 1),
          y: clamp((y - (r.top + r.height * 0.3)) / Math.max(300, r.height * 2), -1, 1),
        };
      },
      spin(d) {
        st.spin += d;
      },
      setSpin(v) {
        st.spin = v;
      },
      setAuto(v) {
        st.autoOn = !!v;
        st.nextAuto = rnd(3, 6);
      },
      onAction(f) {
        R.listeners.push(f);
      },
      get action() {
        return st.act.name;
      },
      actions: Object.keys(ACTIONS),
      faces: Object.keys(FACES),
      /* لقطة PNG شفافة (تتطلب snapshot: true) */
      snapshot() {
        renderer.render(R.scene, R.camera);
        return renderer.domElement.toDataURL('image/png');
      },
      dispose() {
        st.alive = false;
        cancelAnimationFrame(st.raf);
        if (R.ro) R.ro.disconnect();
        renderer.dispose();
        renderer.domElement.remove();
      },
    };
  }
  window.SadenRobot = { create };
})();
