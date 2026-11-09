/* «سند» مساعد النظام: المعرفة والردود */
(function (S) {
  'use strict';
  const SF = window.SADEN_FORMS;
  const { esc } = SF;
  const { state, chip, today, can, api, navFlat } = S;
  Object.assign(S, { asFace, asBlink, asAnswer });

  /* ---------- "سند" مساعد النظام: شخصية كرتونية أسفل الشاشة تُسحب لأي مكان، ودردشة تساعد المستخدم ----------
   * يعمل داخل النظام بدون خدمات خارجية: يفهم السؤال بكلماته المفتاحية، ويدل على النماذج والصفحات، ويجيب من بيانات المستخدم (طلباته وعدّاداته) */
  const AS_KEY = () => `assist:${(state.user || {}).id || ''}`;
  const asGet = (k, d) => {
    try {
      const v = JSON.parse(localStorage.getItem(`${AS_KEY()}:${k}`));
      return v == null ? d : v;
    } catch {
      return d;
    }
  };
  const asSet = (k, v) => {
    try {
      localStorage.setItem(`${AS_KEY()}:${k}`, JSON.stringify(v));
    } catch {
      /* تجاهل */
    }
  };
  /* جمل سند: عند سحبه من مكانه (جملة جديدة مع كل حركة)، والعبارات التحفيزية كل نصف ساعة */
  const AS_DRAG = [
    'انت هتنقلني كتير ؟! 😤',
    'وبعدين !! 🙄',
    'اللهم صبّرك يا روح !! 😮‍💨',
    'يا سيدي مش كده !! 😵',
    'ارسى لك على مكان الله يهديك !! 🤦‍♂️',
    'ما بالراحة يا برنس 😵‍💫',
    'دوختني والله 🌀',
    'هو أنا شنطة سفر ؟! 🧳',
    'خلاص استقريت هنا ولا لسه ؟ 🤨',
    'براحة على عضمي 🦴',
    'كده كويس ؟ ولا نلف لفة كمان 🙃',
    'يا عم ثبّتني في حتة بقى 😩',
  ];
  const AS_MOTIVE = [
    'أنت قادر على تحقيق أكثر مما تتخيل.',
    'لا تنتظر التقدير لتبدع، اجعل إبداعك يستحق التقدير.',
    'نجاحك يبدأ من إيمانك بقدراتك.',
    'كن فخوراً بكل خطوة تخطوها نحو الأفضل.',
    'لا يوجد عمل صغير عندما تؤديه بإتقان.',
    'اصنع فرقاً أينما كنت.',
    'تميزك ليس صدفة، بل نتيجة اجتهادك.',
    'لا تجعل صعوبة البداية تنسيك جمال الوصول.',
    'كن الشخص الذي يعتمد عليه الجميع دائماً.',
    'كل يوم جديد يحمل فرصة جديدة للنجاح.',
    'اجعل طموحك أكبر من العقبات.',
    'لا تقارن نفسك بغيرك، نافس نسختك السابقة.',
    'الإنجازات العظيمة تبدأ بعادات صغيرة.',
    'افعل ما عليك بإخلاص، ودع نتائجك تتحدث.',
    'كن إضافة حقيقية لكل مكان تعمل فيه.',
    'لا تتوقف عن التعلم، فكل معرفة تفتح لك باباً جديداً.',
    'النجاح ليس أن تكون الأفضل دائماً، بل أن تسعى لتكون أفضل.',
    'خلف كل إنجاز عظيم شخص لم يستسلم.',
    'قيمتك الحقيقية فيما تضيفه، لا فيما تطلبه.',
    'ابدأ يومك بعزيمة، وأنهه بإنجاز.',
    'لا تنتظر أن يراك الآخرون مميزاً، كن مميزاً حتى يصبح تجاهلك مستحيلاً.',
    'بعض الإنجازات لا يراها أحد، لكنها تصنع مستقبلك.',
    'كن صاحب أثر، فالمناصب تتغير والآثار الطيبة تبقى.',
    'لا تجعل الظروف تحدد سقف طموحك.',
    'أعظم استثمار يمكن أن تقوم به هو الاستثمار في نفسك.',
    'حين تؤمن بقدراتك وتعمل بإخلاص، تصبح العقبات مجرد محطات عبور.',
    'لا تبحث عن الطريق الأسهل، بل ابنِ القدرة على تجاوز الطريق الصعب.',
    'اجعل ضميرك رقيباً، وإتقانك عنواناً، ونجاحك هدفاً.',
  ];
  /* رسالة سند المميزة: أول عبارة تحفيزية في اليوم */
  const AS_MOTTO = 'تذكر دائماً.. أنت لا تعمل فقط من أجل إنجاز مهمة، أنت تبني خبرة، وتصنع قيمة، وترسم مستقبلك.';
  /* جملة عشوائية لا تتكرر مرتين متتاليتين */
  const asPick = (list, k) => {
    const last = asGet(`last-${k}`, -1);
    let i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === last) i = (i + 1) % list.length;
    asSet(`last-${k}`, i);
    return list[i];
  };
  /* الشخصية: سند الروبوت — صورة (public/robot.png) مأخوذة من الموديل ثلاثي الأبعاد نفسه، تظهر في رأس الدردشة وحتى يكتمل تحميل الموديل */
  const AS_IMG = '<img class="as-img" src="robot.png" alt="" draggable="false">';
  /* طبقة تعبيرات الوجه فوق الصورة (نفس أبعاد الصورة 378×706): جفون للرمش والغمز والنوم، وعيون سعيدة ^^، وأفواه، وخدود، ومؤثرات حوله */
  const AS_FACE = `<svg class="as-face" viewBox="0 0 378 706" aria-hidden="true">
    <defs><radialGradient id="afSkin" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#f4cdb0"/><stop offset="1" stop-color="#eab693"/></radialGradient>
      <filter id="afBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
    <g class="af-lid l"><ellipse cx="200" cy="176" rx="26" ry="21" fill="url(#afSkin)"/><path d="M175 191 Q200 203 225 191" stroke="#4a2a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
    <g class="af-lid r"><ellipse cx="279" cy="176" rx="23" ry="21" fill="url(#afSkin)"/><path d="M257 191 Q279 203 301 191" stroke="#4a2a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
    <g class="af-happy"><ellipse cx="200" cy="176" rx="26" ry="21" fill="url(#afSkin)"/><ellipse cx="279" cy="176" rx="23" ry="21" fill="url(#afSkin)"/>
      <path d="M178 186 Q200 158 222 186" stroke="#3b2214" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M259 186 Q279 158 299 186" stroke="#3b2214" stroke-width="6" fill="none" stroke-linecap="round"/></g>
    <g class="af-mouth">
      <ellipse cx="247" cy="236" rx="40" ry="15" fill="url(#afSkin)" filter="url(#afBlur)"/>
      <g class="m grin"><path d="M214 227 Q247 236 280 227 Q276 263 247 265 Q218 263 214 227 Z" fill="#7a1f12"/><path d="M219 229 Q247 237 275 229 L273 238 Q247 244 221 238 Z" fill="#fff"/><ellipse cx="247" cy="255" rx="15" ry="6.5" fill="#ef6b73"/></g>
      <g class="m o"><ellipse cx="247" cy="241" rx="10" ry="13" fill="#7a1f12"/><ellipse cx="247" cy="247" rx="5.5" ry="4.5" fill="#ef6b73"/></g>
      <g class="m tongue"><path d="M217 231 Q247 249 277 231" stroke="#7a1f12" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M238 239 Q237 266 251 266 Q264 266 262 240 Z" fill="#ef6b73" stroke="#c2414b" stroke-width="2"/><line x1="250" y1="243" x2="250" y2="258" stroke="#c2414b" stroke-width="2"/></g>
      <g class="m wavy"><path d="M219 238 q7 -8 14 0 t14 0 t14 0 t14 0" stroke="#7a1f12" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    </g>
    <g class="af-blush"><ellipse cx="176" cy="214" rx="19" ry="9" fill="#ff5b7a" opacity=".5" filter="url(#afBlur)"/><ellipse cx="304" cy="214" rx="17" ry="9" fill="#ff5b7a" opacity=".5" filter="url(#afBlur)"/></g>
    <g class="af-tears"><path d="M168 188 q-10 16 -4 26 q9 4 10 -8 z" fill="#7dd3fc" stroke="#38bdf8" stroke-width="2"/><path d="M311 188 q10 16 4 26 q-9 4 -10 -8 z" fill="#7dd3fc" stroke="#38bdf8" stroke-width="2"/></g>
    <path class="af-sweat" d="M330 112 q15 22 0 32 q-15 -10 0 -32 z" fill="#bae6fd" stroke="#38bdf8" stroke-width="3"/>
    <text class="af-sym af-q" x="330" y="78">?</text><text class="af-sym af-bang" x="334" y="78">!</text>
    <g class="af-zzz"><text x="292" y="92">Z</text><text x="326" y="58">z</text><text x="350" y="30">z</text></g>
    <g class="af-hearts"><text x="300" y="80">❤</text><text x="40" y="110">❤</text><text x="330" y="150">❤</text></g>
    <g class="af-stars"><g class="af-orbit"><text x="120" y="70">★</text><text x="330" y="80">★</text><text x="230" y="20">✦</text><text x="60" y="140">✦</text></g></g>
    <g class="af-spark"><text x="40" y="60">✦</text><text x="330" y="50">✨</text><text x="20" y="180">✦</text></g>
  </svg>`;
  /* المهندس ثلاثي الأبعاد: تحميل المكتبة مرة واحدة عند الحاجة */
  let asLib = null;
  const asLoad3d = () =>
    asLib ||
    (asLib = ['vendor/three.min.js', 'js/robot3d.js'].reduce(
      (p, src) =>
        p.then(
          () =>
            new Promise((ok, no) => {
              const s = document.createElement('script');
              s.src = src;
              s.onload = ok;
              s.onerror = no;
              document.head.appendChild(s);
            }),
        ),
      Promise.resolve(),
    ));
  /* نفس المواقف بحركات المهندس ثلاثي الأبعاد */
  const AS_3D = {
    'o/q': 'think',
    'o/bang': 'scared',
    'wavy/stars': 'dizzy',
    'grin/spark': 'wave',
    'laugh/tears': 'laugh',
    'wavy/sweat': 'confused',
    'grin/hearts': 'love',
    'o/': 'look',
  };
  function asFace3d(eng, face, fx, ms) {
    if (face === 'tongue') return eng.face('tongue');
    if (face === 'grin' && !fx) return eng.face('wink');
    const a = AS_3D[`${face}/${fx || ''}`];
    if (!a) return;
    eng.play(a);
    if (a === 'love' && ms)
      setTimeout(() => {
        if (eng.action === 'love') eng.play('idle');
      }, ms);
  }
  /* تعبير مؤقت للوجه ومؤثر حوله، ثم الرجوع للوجه العادي */
  function asFace(face, fx, ms = 1800) {
    const el = document.getElementById('assist');
    if (!el || el.classList.contains('sleeping')) return;
    if (el._eng) {
      asFace3d(el._eng, face, fx, ms);
      return;
    }
    clearTimeout(el._ft);
    el.dataset.face = face || '';
    el.dataset.fx = fx || '';
    if (ms)
      el._ft = setTimeout(() => {
        el.dataset.face = '';
        el.dataset.fx = '';
      }, ms);
  }
  function asBlink(wink) {
    const el = document.getElementById('assist');
    if (!el || el.classList.contains('sleeping')) return;
    if (el._eng) {
      el._eng.face(wink ? 'wink' : 'blink');
      return;
    }
    el.classList.add(wink ? 'winking' : 'blinking');
    setTimeout(() => el.classList.remove('blinking', 'winking'), wink ? 520 : 190);
  }
  /* نكت خفيفة عن الشغل */
  const AS_JOKES = [
    'مرة محاسب اتجوز… طلب من مراته جرد للمطبخ كل آخر شهر 😂',
    'سألوا المهندس: عمق الجسة كام؟ قال: على حسب مزاج الحفارة النهارده 😅',
    'سألوني ليه لابس الخوذة على طول؟ قلت: عشان الأفكار ما تطيرش 😎',
    'إقامة قربت تخلص… فضلت تعيط في "متابعة الإقامات" لحد ما شئون الموظفين جددتها 😂',
    'المدير: عاوز التقرير بكرة الصبح. الموظف: حاضر… وأنا: هو أنا اللي هسهر ولا إنت؟ 🤖',
    'الطلب لما يرجع للتعديل للمرة التالتة: خلاص بقيت من العيلة 😂',
    'المخزن قال للورشة: إنتي بتصرفي كتير! الورشة: وإنت بتعد كتير 🤭',
  ];
  /* تطبيع النص العربي للمطابقة: الهمزات، التاء المربوطة، الألف المقصورة، التشكيل، "ال" */
  const asNorm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[ً-ْـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const asWords = (s) =>
    asNorm(s)
      .split(' ')
      .map((w) => w.replace(/^(وال|بال|لل|فال|ال)/, ''))
      .filter((w) => w.length > 1);
  const asHas = (t, list) => list.some((k) => t.includes(asNorm(k)));
  /* رابط يظهر فقط إذا كانت الصفحة متاحة للمستخدم */
  const asLink = (href, label) => ({ href, label });
  const asCanHref = (href) => {
    const k = href.replace(/^#\//, '').split(/[/?]/)[0];
    return (
      !k ||
      navFlat().some(([h]) => h.split('?')[0] === href.split('?')[0]) ||
      can(k) ||
      ['new', 'req', 'employee', 'drilling-project', 'chat', 'account', 'guide'].includes(k)
    );
  };
  /* قاعدة المعرفة: الكلمات المفتاحية ← الرد والروابط */
  function asKnowledge() {
    const s = state.stats || {},
      u = state.user || {};
    return [
      {
        k: ['السلام عليكم', 'مرحبا', 'اهلا', 'هاي', 'صباح', 'مساء'],
        a: () =>
          `وعليكم السلام ورحمة الله يا ${u.name.split(' ')[0]} 👋<br>أنا <b>سند</b>، مساعدك في النظام. اسألني عن أي نموذج أو صفحة، أو عن طلباتك.`,
        chips: true,
        face: ['grin', 'spark'],
      },
      { k: ['شكرا', 'تسلم', 'يعطيك العافيه', 'مشكور', 'جزاك'], a: () => 'العفو! 😊 أنا هنا متى احتجتني.', face: ['grin', 'hearts'] },
      {
        k: ['نكته', 'نكت', 'ضحكني', 'هزر', 'زهقان', 'مليت'],
        a: () => `${AS_JOKES[Math.floor(Math.random() * AS_JOKES.length)]}<br><small class="muted">عاوز كمان؟ قول "نكتة" تاني 😄</small>`,
        face: ['laugh', 'tears'],
        chips: false,
      },
      { k: ['بحبك', 'حبيبي', 'شاطر', 'برافو', 'احسنت', 'جميل'], a: () => 'يا سلام! كده هتخليني أتكسف 🙈❤', face: ['grin', 'hearts'] },
      {
        k: ['مين انت', 'من انت', 'اسمك', 'ايش انت', 'انت مين'],
        a: () => 'أنا <b>سند</b> 🤖 مساعد SADEN ERP SYSTEM. أعرفك بالنماذج والصفحات، وأقولك حالة طلباتك، وأدلّك على أي خطوة.',
      },
      {
        k: ['بانتظار اعتمادي', 'اعتمادي', 'اعتمد', 'معلقه عندي', 'عندي طلبات', 'الطلبات الجاريه', 'بانتظار اجرائي'],
        a: () =>
          s.inbox
            ? `عندك <b>${s.inbox}</b> طلب بانتظار ${u.role === 'accountant' ? 'إجرائك' : 'اعتمادك'} الآن.`
            : 'لا توجد طلبات بانتظارك الآن 👌',
        links: [asLink('#/inbox', u.role === 'accountant' ? 'بانتظار إجرائي' : 'بانتظار اعتمادي')],
      },
      {
        k: ['معاده', 'رجعت', 'ارجع', 'تعديل طلب', 'معاد للتعديل', 'رفض'],
        a: () =>
          s.myReturned
            ? `عندك <b>${s.myReturned}</b> طلب معاد للتعديل. افتحه من "طلباتي" واضغط "تعديل وإعادة الإرسال"، وستجد سبب الإعادة أعلى النموذج.`
            : 'لا توجد طلبات معادة لك للتعديل حالياً. إذا رُفض طلب يظهر سبب الرفض في سجل الإجراءات داخل الطلب.',
        links: [asLink('#/mine', 'طلباتي')],
      },
      {
        k: ['طلباتي', 'طلبي', 'حاله طلب', 'وصل طلبي', 'فين طلبي', 'متابعه طلب'],
        a: () =>
          'تابع كل طلباتك من صفحة "طلباتي": الحالة، والمرحلة الحالية، ومن عنده الطلب الآن. ويمكنك كتابة رقم الطلب هنا (مثل SADEN-2026-0029) وأبحث لك عنه.',
        links: [asLink('#/mine', 'طلباتي')],
      },
      {
        k: ['رفع طلب', 'طلب جديد', 'اعمل طلب', 'انشاء طلب', 'اقدم طلب', 'نموذج'],
        a: () =>
          'من "رفع طلب جديد" تختار النموذج، تملأ البيانات وتراجع الخطاب ثم ترسله للاعتماد. قل لي اسم الطلب (مثل: بدل سكن، تجديد إقامة، صيانة جهاز) وأفتحه لك مباشرة.',
        links: [asLink('#/new', 'رفع طلب جديد')],
      },
      {
        k: ['دردشه', 'شات', 'محادثه', 'رساله', 'كلم', 'تواصل'],
        a: () =>
          `الدردشة الداخلية من أيقونة الرسائل في الشريط العلوي: مجموعة لفرعك ومحادثات خاصة مع أي زميل.${s.chatUnread ? ` عندك <b>${s.chatUnread}</b> رسالة غير مقروءة.` : ''} ولكتم محادثة اضغط الجرس في رأسها.`,
        links: [asLink('#/chat', 'فتح الدردشة')],
      },
      {
        k: ['بريد', 'ايميل', 'مراسله داخليه'],
        a: () => `البريد الداخلي للمراسلات الرسمية مع المرفقات.${s.mailUnread ? ` عندك <b>${s.mailUnread}</b> رسالة غير مقروءة.` : ''}`,
        links: [asLink('#/mail', 'البريد الداخلي')],
      },
      {
        k: ['كلمه المرور', 'كلمة السر', 'باسورد', 'الرقم السري', 'تغيير الباسورد'],
        a: () => 'تغيير كلمة المرور من "حسابي": اكتب الحالية ثم الجديدة مرتين. إذا نسيت كلمة المرور تواصل مع مدير النظام لإعادة تعيينها.',
        links: [asLink('#/account', 'حسابي')],
      },
      {
        k: ['توقيع', 'امضاء'],
        a: () => 'ارفع صورة توقيعك من "حسابي" ← التوقيع الإلكتروني، ليظهر على الخطابات عند اعتمادك.',
        links: [asLink('#/account', 'حسابي')],
      },
      {
        k: ['طباعه', 'اطبع', 'pdf', 'بي دي اف'],
        a: () => 'افتح الطلب واضغط "🖨️ طباعة / PDF"، ثم اختر الطابعة أو "حفظ كـ PDF" من نافذة الطباعة.',
      },
      {
        k: ['اقامه', 'اقامات', 'هويه', 'تجديد'],
        a: () =>
          'لتجديد الإقامة: "طلب تجديد إقامة" مع صورة الإقامة القديمة، وتنفّذه شئون الموظفين فيُحدَّث تاريخ الانتهاء في سجل الموظف. والإقامات القريبة من الانتهاء في "متابعة الإقامات".',
        links: [asLink('#/new/iqamaRenew', 'طلب تجديد إقامة'), asLink('#/iqamas', 'متابعة الإقامات')],
      },
      {
        k: ['خروج وعوده', 'تاشيره', 'تمديد', 'سفر'],
        a: () =>
          'لتأشيرة الخروج والعودة أو تمديدها: "طلب خروج وعودة / تمديد". في التمديد تحدد من يتحمل التكلفة (الشركة أو الموظف) وقيمتها.',
        links: [asLink('#/new/exitReentry', 'طلب خروج وعودة')],
      },
      {
        k: ['كفاله', 'نقل كفاله'],
        a: () => 'نقل الكفالة من "طلب نقل كفالة موظف"، وبعد التنفيذ يسجّل النظام الكفالة الجديدة في ملف الموظف.',
        links: [asLink('#/new/sponsorTransfer', 'طلب نقل كفالة')],
      },
      {
        k: ['اجازه', 'رصيد', 'مباشره'],
        a: () =>
          'رصيد الإجازة يظهر في ملف الموظف (سجل الإجازات) ويُحسب مثل التصفية: 21 يوماً لأول 5 سنوات ثم 30. وبعد العودة من الإجازة ارفع "مباشرة عمل موظف" ليبدأ الحساب من تاريخ المباشرة.',
        links: [asLink('#/employees', 'سجل الموظفين'), asLink('#/new/workStart', 'مباشرة عمل')],
      },
      {
        k: ['موظف', 'موظفين', 'سجل الموظفين', 'ملف موظف'],
        a: () => 'سجل الموظفين في "الموارد البشرية": كارت لكل موظف، وملف كامل بالتفاصيل والإجازات والمستندات والعهد.',
        links: [asLink('#/employees', 'سجل الموظفين')],
      },
      {
        k: ['تصفيه', 'نهايه خدمه', 'مخالصه'],
        a: () =>
          'ملف تصفية الموظف من "طلب تصفية موظف": يرفعه المحاسب من شاشة واحدة (البيانات والخصومات والعهد والمرفقات، ومع السيارة محضر التسليم المعتمد من إدارة الحركة)، ثم شئون الموظفين، ثم محاسب إدارة الرواتب.',
        links: [asLink('#/new/settlementCase', 'طلب تصفية موظف')],
      },
      {
        k: ['جرد', 'عهده الفرع'],
        a: () => 'جرد فرعك من "إدارة العمليات ← إدارة الجرد ← جرد الفروع"، ويمكن تنزيل جرد الفرع كاملاً في ملف Excel واحد.',
        links: [asLink('#/inventory', 'جرد الفروع')],
      },
      {
        k: ['صيانه جهاز', 'عطل جهاز', 'جهاز عطلان', 'جهاز خربان'],
        a: () =>
          'لصيانة جهاز من جرد فرعك: "طلب صيانة جهاز" (أو زر 🔧 بجوار الجهاز في الجرد)، ويتابع معك مسئول الصيانة بالمراسلات حتى يقفل الطلب.',
        links: [asLink('#/new/deviceMaint', 'طلب صيانة جهاز')],
      },
      {
        k: ['استعاره', 'جهاز نوعي', 'اجهزه نوعيه'],
        a: () => 'الأجهزة النوعية ملك الإدارة وتُعار للفروع بـ"طلب استعارة جهاز".',
        links: [asLink('#/devices', 'الأجهزة النوعية')],
      },
      {
        k: ['سياره', 'مركبه', 'صيانه سياره', 'مخالفه'],
        a: () => 'المركبات في "إدارة الحركة": أسطول السيارات والمخالفات المرورية، وصيانة المركبة بـ"طلب صيانة مركبة".',
        links: [asLink('#/fleet', 'أسطول السيارات'), asLink('#/new/carMaintenance', 'طلب صيانة مركبة')],
      },
      {
        k: ['حفاره', 'حفارات', 'حفر', 'جسه', 'جسات', 'مشروع'],
        a: () => 'قسم الحفر: "أسطول الحفارات" بطاقم كل حفارة، و"مشاريع تحت التنفيذ" بسجل الجسات وأعماقها وتحديثات المشروع حتى إقفاله.',
        links: [asLink('#/drilling-projects', 'مشاريع تحت التنفيذ'), asLink('#/drilling', 'أسطول الحفارات')],
      },
      {
        k: ['ورشه', 'شراء', 'عرض سعر', 'تصنيع', 'مخزن'],
        a: () => 'الورشة: المخزون والتصنيع والخردة، وطلبات الصيانة، وطلب تصنيع / شراء من الورشة، وعروض الأسعار.',
        links: [asLink('#/new/mfgRequest', 'طلب تصنيع / شراء من الورشة'), asLink('#/new/priceQuote', 'عرض سعر')],
      },
      {
        k: ['دليل', 'شرح', 'كيف استخدم', 'تعليمات'],
        a: () => 'دليل الاستخدام فيه شرح كامل للنظام، ويمكنك سؤالي هنا عن أي شيء.',
        links: [asLink('#/guide', 'دليل الاستخدام')],
      },
      {
        k: ['التاريخ', 'اليوم كام', 'تاريخ اليوم', 'الهجري'],
        a: () => {
          const d = new Date();
          let h = '';
          try {
            h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { dateStyle: 'long' }).format(d);
          } catch {
            /* تجاهل */
          }
          return `اليوم ${['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d.getDay()]} ${SF.fmtDate(today())}${h ? `<br>الموافق ${h}` : ''}`;
        },
      },
      {
        k: ['فرعي', 'حسابي', 'صلاحياتي', 'دوري'],
        a: () => `أنت <b>${esc(u.name)}</b> — ${esc(u.title || u.roleLabel || '')}${u.branch ? ` — فرع ${esc(u.branch)}` : ''}.`,
        links: [asLink('#/account', 'حسابي')],
      },
    ];
  }
  /* أقرب نموذج للسؤال من النماذج المتاحة للمستخدم (تطابق كلمات العنوان) */
  /* كلمات عامة لا تميّز نموذجاً عن غيره */
  const AS_STOP = new Set(
    [
      'طلب',
      'طلبات',
      'نموذج',
      'خطاب',
      'عاوز',
      'عايز',
      'ابغي',
      'ابي',
      'اريد',
      'كيف',
      'ازاي',
      'فين',
      'وين',
      'عن',
      'في',
      'من',
      'علي',
      'الي',
      'لي',
      'عندي',
      'كم',
      'هل',
      'اعمل',
      'ارفع',
      'موظف',
      'جديد',
      'لو',
      'سمحت',
      'ممكن',
      'محتاج',
      'بدي',
      'اعرف',
    ].map(asNorm),
  );
  function asFindForms(text) {
    const w = asWords(text).filter((x) => !AS_STOP.has(x));
    if (!w.length || !can('new')) return [];
    return (
      SF.FORMS.filter((f) => SF.formAllowed(state.user, f.id) && !(state.config.disabledForms || []).includes(f.id))
        .map((f) => {
          const fw = asWords(f.title).filter((x) => !AS_STOP.has(x));
          const hit = fw.filter((x) =>
            w.some((y) => y === x || (y.length > 3 && x.startsWith(y)) || (x.length > 3 && y.startsWith(x))),
          ).length;
          return { f, score: hit / Math.max(2, fw.length) + (hit ? 0.05 * hit : 0) };
        })
        .filter((x) => x.score >= 0.45)
        .sort((a, b) => b.score - a.score)
        /* الأقرب فقط: يُستبعد ما يقل كثيراً عن أفضل تطابق */
        .filter((x, i, all) => x.score >= all[0].score - 0.1)
        .slice(0, 3)
        .map((x) => x.f)
    );
  }
  async function asAnswer(q) {
    const t = asNorm(q);
    /* رقم طلب */
    const ser = /SADEN-\d{4}-\d+/i.exec(q);
    if (ser) {
      const list = await api('GET', `/api/requests?scope=${can('all') ? 'all' : 'mine'}`).catch(() => []);
      const r = list.find((x) => x.serial.toUpperCase() === ser[0].toUpperCase());
      return r
        ? {
            html: `الطلب <b dir="ltr">${esc(r.serial)}</b> — ${esc(r.typeTitle)}<br>${esc(r.summary || '')}<br>الحالة: ${chip(r)}`,
            links: [asLink(`#/req/${r.id}`, 'فتح الطلب')],
          }
        : { html: `لم أجد الطلب <b dir="ltr">${esc(ser[0])}</b> ضمن الطلبات المتاحة لك. تأكد من الرقم.` };
    }
    /* مشكلة تقنية: نموذج قصير يُرسل لمدير النظام مباشرة في الدردشة */
    if (AS_SUPPORT.some((k) => t.includes(asNorm(k)))) {
      if (state.user.role === 'admin')
        return { html: 'أنت مدير النظام 🙂 طلبات المساعدة التقنية من المستخدمين تصلك في الدردشة الداخلية وفي الإشعارات.' };
      return {
        support: true,
        html: 'تقدر تبعت مشكلتك لـ<b>مدير النظام</b> مباشرة من هنا 👇<br>اكتب ماذا كنت تفعل وماذا ظهر لك، وسأرسلها له فوراً مع اسم الصفحة، والرد يصلك في الدردشة.',
      };
    }
    const kb = asKnowledge();
    const hit = kb
      .filter((e) => asHas(t, e.k))
      .sort(
        (a, b) =>
          Math.max(...b.k.filter((k) => t.includes(asNorm(k))).map((k) => k.length)) -
          Math.max(...a.k.filter((k) => t.includes(asNorm(k))).map((k) => k.length)),
      )[0];
    const forms = asFindForms(q);
    const formLinks = forms.map((f) => asLink(`#/new/${f.id}`, `📝 ${f.title}`));
    if (hit)
      return {
        html: typeof hit.a === 'function' ? hit.a() : hit.a,
        links: [...(hit.links || []), ...formLinks.filter((l) => !(hit.links || []).some((x) => x.href === l.href))].filter((l) =>
          asCanHref(l.href),
        ),
        chips: hit.chips,
        face: hit.face,
      };
    if (forms.length)
      return {
        html: forms.length === 1 ? `تقصد <b>${esc(forms[0].title)}</b>؟ اضغط لفتح النموذج 👇` : 'وجدت لك هذه النماذج 👇',
        links: formLinks,
      };
    /* صفحة بالاسم */
    const pages = navFlat()
      .filter(([, , l]) => {
        const lw = asWords(l);
        return lw.some((x) => asWords(q).includes(x));
      })
      .slice(0, 4);
    if (pages.length) return { html: 'تقصد إحدى هذه الصفحات؟ 👇', links: pages.map(([h, , l]) => asLink(h, l)) };
    return {
      html: 'لم أفهم سؤالك تماماً 🤔<br>جرّب تكتب اسم الطلب (مثل: بدل سكن، تجديد إقامة) أو اختر من الاقتراحات.<br>ولو عندك مشكلة في النظام اضغط «مساعدة تقنية» وأوصلك بمدير النظام.',
      chips: true,
      face: ['wavy', 'sweat'],
    };
  }
  /* كلمات طلب المساعدة التقنية */
  const AS_SUPPORT = [
    'مساعدة تقنية',
    'مساعده فنيه',
    'دعم فني',
    'الدعم الفني',
    'مشكلة تقنية',
    'مشكلة في النظام',
    'عندي مشكلة',
    'عندي مشكله',
    'مدير النظام',
    'كلم الادمن',
    'الأدمن',
    'فيه عطل',
    'عطل في',
    'عطل فني',
    'مش شغال',
    'مش شغالة',
    'مش بيفتح',
    'مش راضي',
    'خطأ في',
    'ظهر خطأ',
    'ايرور',
    'error',
    'bug',
    'بلاغ',
  ];
  const AS_CHIPS = () =>
    ['بانتظار اعتمادي', 'طلباتي', 'رفع طلب جديد', 'تجديد إقامة', 'الدردشة', 'تغيير كلمة المرور'].filter(
      (c) => c !== 'تجديد إقامة' || SF.formAllowed(state.user, 'iqamaRenew'),
    );
  Object.assign(S, { asGet, asSet, AS_DRAG, AS_MOTIVE, AS_MOTTO, asPick, AS_IMG, asLoad3d, asLink, asCanHref, AS_CHIPS });
})((window.SES_APP = window.SES_APP || {}));
