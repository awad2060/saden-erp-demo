/* سند الروبوت ثلاثي الأبعاد — الحركات: الوضعية (قيم المفاصل والوجه)، والوقفة الأساسية، وجدول الحركات، وتعبيرات الوجه.
 * جزء من robot3d.js: يُحمَّل قبله ويسجّل في SADEN_ROBOT_PARTS.moves. مؤثرات الحركة تأتي في fx (stick / drop / tear / burst) */
(function () {
  'use strict';
  const PI = Math.PI;
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));

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
  const blendInto = (a, b, k) => {
    for (const key in b) {
      if (typeof b[key] === 'number') a[key] = lerp(a[key], b[key], k);
      else if (b[key] && typeof b[key] === 'object' && a[key] && typeof a[key] === 'object') blendInto(a[key], b[key], k);
    }
  };
  const S = [-1, 1];

  /* الوقفة الأساسية: طفو خفيف وتمايل ونظر نحو المؤشر */
  function base(p, { now, look }) {
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
  const ACTIONS = {
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
      enter(tag, fx) {
        fx.burst('spark', 3);
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
      enter(tag, fx) {
        fx.burst('spark', 3);
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
      enter(tag, fx) {
        fx.burst('spark', 4);
        fx.burst('star', 2);
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
      enter(tag, fx) {
        fx.stick('q', [0.42, 0.7, 0.1], tag, 'bob');
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
      every: [0.8, (tag, fx) => fx.drop('drop', [-0.45, 0.25, 0.2], tag)],
      enter(tag, fx) {
        fx.stick('q', [0.48, 0.72, 0.1], tag, 'bob');
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
      every: [0.45, (tag, fx) => fx.drop('note', [rnd(-0.6, 0.6), rnd(0.3, 0.6), 0.1], tag, 'rise')],
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
      every: [0.22, (tag, fx) => S.forEach((s) => fx.tear(s, tag))],
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
      every: [0.4, (tag, fx) => fx.drop('heart', [rnd(-0.5, 0.5), rnd(0.1, 0.5), 0.2], tag, 'rise')],
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
      every: [2.2, (tag, fx) => fx.drop('drop', [0.16, -0.05, 0.5], tag, 'fall')],
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
      enter(tag, fx) {
        fx.stick('bang', [0.46, 0.72, 0.1], tag, 'pop');
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
      enter(tag, fx) {
        for (let k = 0; k < 4; k++) fx.stick('star', [0, 0.72, 0], tag, 'orbit', k * (PI / 2));
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
      every: [1.1, (tag, fx) => fx.drop('z', [0.35, 0.5, 0.1], tag, 'z')],
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
      enter(tag, fx) {
        fx.stick('bang', [0.46, 0.72, 0.1], tag, 'pop');
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
  /* يُسجَّل لملف robot3d.js (يُحمَّل بعده) */
  (window.SADEN_ROBOT_PARTS = window.SADEN_ROBOT_PARTS || {}).moves = { mkPose, blendInto, S, base, ACTIONS, FACES };
})();
