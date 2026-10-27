(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var fmt = function (n) { return Number(n).toLocaleString('ko-KR'); };
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  /* ---------- 설정: 순서, 항목, 기본 확률(비율) ---------- */
  var STEPS = [
    { key: 'egg', label: '에그' },
    { key: 'grade', label: '등급' },
    { key: 'rarity', label: '레어도' },
    { key: 'enchant', label: '에그 인첸트' },
    { key: 'blessing', label: '축복' }
  ];
  var TABLES = window.EGG_CONFIG.tables;
  /* 점수: 등급·레어도는 범위 안에서 무작위, 에그 인첸트·축복은 배수 */
  var SCORE = window.EGG_CONFIG.score;
  var GROUPS = [['grade', '등급'], ['rarity', '레어도'], ['enchant', '에그 인첸트'], ['blessing', '축복']];
  function pick(key) {
    var t = TABLES[key];
    var sum = t.reduce(function (a, x) { return a + Math.max(0, x.w); }, 0);
    if (sum <= 0) return t[Math.floor(Math.random() * t.length)];
    var r = Math.random() * sum;
    for (var i = 0; i < t.length; i++) {
      r -= Math.max(0, t[i].w);
      if (r < 0) return t[i];
    }
    return t[t.length - 1];
  }

  /* ---------- 캐릭터 ---------- */
  var BUILTIN = window.EGG_CHARACTERS || [];
  var chars = BUILTIN.map(function (c) { return Object.assign({}, c); });

  var uidn = 0;
  function eggSVG(c) {
    var u = ++uidn, h = (c.hue === undefined ? 260 : c.hue);
    var ini = esc(Array.from(c.name || '?')[0] || '?');
    var face = c.img
      ? '<clipPath id="cp' + u + '"><circle cx="100" cy="160" r="45"/></clipPath>' +
        '<circle cx="100" cy="160" r="50" fill="hsl(' + h + ' 70% 97%)"/>' +
        '<image href="' + c.img + '" x="55" y="115" width="90" height="90" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp' + u + ')"/>' +
        '<circle cx="100" cy="160" r="47.5" fill="none" stroke="hsl(' + h + ' 55% 38%)" stroke-width="3"/>'
      : '<circle cx="100" cy="160" r="46" fill="hsl(' + h + ' 70% 97%)" opacity=".9"/>' +
        '<text class="ini" x="100" y="176" text-anchor="middle" font-size="46" fill="hsl(' + h + ' 55% 36%)">' + ini + '</text>';
    return '<svg viewBox="0 0 200 260" role="img" aria-label="' + esc(c.name) + ' 에그"><defs>' +
      '<linearGradient id="g' + u + '" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="hsl(' + h + ' 85% 80%)"/><stop offset="1" stop-color="hsl(' + h + ' 65% 50%)"/></linearGradient><filter id="rg' + u + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter></defs>' +
      '<path d="M100 8C150 8 188 90 188 156C188 214 150 252 100 252C50 252 12 214 12 156C12 90 50 8 100 8Z" fill="url(#g' + u + ')"/>' +
      '<g fill="hsl(' + h + ' 90% 90%)" opacity=".55"><circle cx="58" cy="82" r="9"/><circle cx="146" cy="104" r="6"/><circle cx="70" cy="214" r="7"/><circle cx="142" cy="212" r="10"/><circle cx="120" cy="52" r="5"/></g>' +
      '<ellipse cx="68" cy="70" rx="12" ry="26" transform="rotate(24 68 70)" fill="#fff" opacity=".35"/>' + face +
      '<path class="rim-glow" d="M100 8C150 8 188 90 188 156C188 214 150 252 100 252C50 252 12 214 12 156C12 90 50 8 100 8Z" filter="url(#rg' + u + ')"/><path class="rim" d="M100 8C150 8 188 90 188 156C188 214 150 252 100 252C50 252 12 214 12 156C12 90 50 8 100 8Z"/></svg>';
  }

  var eggEl = $('#egg'), eggName = $('#eggName');
  var IDLE = { name: '?', hue: 255 };
  function showEgg(c) { eggEl.innerHTML = eggSVG(c); }
  function showIdle() {
    resetStage();
    showEgg(IDLE);
    eggEl.className = 'egg-wrap idle';
    eggName.textContent = chars.length ? '무슨 에그가 나올까?' : '캐릭터를 먼저 추가해 주세요';
  }

  function renderChars() {
    $('#charList').innerHTML = chars.map(function (c) {
      return '<li class="char"><span class="mini">' + eggSVG(c) + '</span><span class="cname">' + esc(c.name) + '</span></li>';
    }).join('');
    $('#count').textContent = chars.length;
    $('#drawBtn').disabled = busy || !chars.length;
    if (!busy) showIdle();
  }

  /* ---------- 확률 패널 ---------- */
  function pctText(key, it) {
    var sum = TABLES[key].reduce(function (a, x) { return a + Math.max(0, x.w); }, 0);
    return sum > 0 ? (Math.max(0, it.w) / sum * 100) : 0;
  }
  function tagOf(key, it) {
    var sc = SCORE[key] && SCORE[key][it.n];
    if (sc === undefined) return '';
    return Array.isArray(sc) ? fmt(sc[0]) + '–' + fmt(sc[1]) : '×' + sc;
  }
  function renderOdds() {
    $('#odds').innerHTML = GROUPS.map(function (g) {
      var key = g[0];
      return '<div class="odds-group"><h3>' + g[1] + '</h3>' + TABLES[key].map(function (it) {
        var p = pctText(key, it);
        return '<div class="odd"><div class="nm"><div class="nmr"><span style="color:' + it.c + '">' + esc(it.n) + '</span><small>' + tagOf(key, it) + '</small></div>' +
          '<div class="bar"><i style="width:' + p + '%;background:' + it.c + '"></i></div></div><span class="pct">' + p.toFixed(1) + '%</span></div>';
      }).join('') + '</div>';
    }).join('');
  }

  /* ---------- 뽑기 ---------- */
  var stage = $('#stage'), pedestal = $('#pedestal');
  var ann = $('#announce'), annK = $('.k', ann), annV = $('.v', ann), gradeBadge = $('#gradeBadge'), scoreEl = $('#score'), scoreNum = $('#scoreNum'), scoreFormula = $('#scoreFormula');
  var pills = {};
  Array.prototype.forEach.call(document.querySelectorAll('.pill'), function (el) { pills[el.dataset.key] = el; });
  var ENCH = { '스크램블드': 'scrambled', '코스믹': 'cosmic', '골든': 'golden', '니트로': 'nitro', '오메가': 'omega' };
  var LABELS = { grade: '등급', rarity: '레어도', enchant: '에그 인첸트' };
  var busy = false;

  /* 축복 이펙트 (canvas) */
  var cv = $('#fx'), ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1, fxName = null, fxStart = 0, fxLast = 0, raf = 0, parts = [];
  var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pickOne(a) { return a[Math.floor(Math.random() * a.length)]; }
  function mk(o) { o.age = 0; o.ph = Math.random() * 6.2832; return o; }
  function sizeCanvas() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.max(1, Math.round(W * dpr));
    cv.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function center() {
    var s = stage.getBoundingClientRect(), e = eggEl.getBoundingClientRect();
    return { x: e.left - s.left + e.width / 2, y: e.top - s.top + e.height / 2, w: e.width, h: e.height };
  }
  function inEllipse(c, ex, ey) {
    var a = Math.random() * 6.2832, r = Math.sqrt(Math.random());
    return { x: c.x + Math.cos(a) * c.w * 0.5 * ex * r, y: c.y + Math.sin(a) * c.h * 0.5 * ey * r };
  }
  function orb(x, y, r, color, a) {
    if (a <= 0 || r <= 0) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }
  function sparkle(x, y, r, a, color, rot) {
    if (a <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0); ctx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
    ctx.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0); ctx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r);
    ctx.fill(); ctx.restore();
  }
  function sparkAround(c, cols) {
    var p = inEllipse(c, 1.15, 1.0);
    return mk({ k: 'spark', x: p.x, y: p.y, vx: rnd(-8, 8), vy: rnd(-28, -6), life: rnd(0.9, 1.7), s: rnd(6, 15), col: pickOne(cols) });
  }

  function sparkOutside(c, cols) {
    var a = Math.random() * 6.2832, r = rnd(0.75, 1.4);
    return mk({ k: 'spark', x: c.x + Math.cos(a) * c.w * 0.5 * r * 1.3, y: c.y + Math.sin(a) * c.h * 0.5 * r, vx: rnd(-8, 8), vy: rnd(-24, -6), life: rnd(0.9, 1.6), s: rnd(5, 11), col: pickOne(cols) });
  }

  var FXD = {
    /* Holy: 금빛으로 반짝이는 별빛 */
    holy: {
      bg: function (c, t) { orb(c.x, c.y, c.w * 1.5, 'rgba(255,240,170,.55)', 0.55 + 0.15 * Math.sin(t * 2)); },
      em: [{ rate: 42, fn: function (c) { return sparkAround(c, ['#fff7cf', '#ffe27a', '#ffffff']); } }]
    },
    /* Divine: 하늘에서 내려오는 빛줄기 */
    divine: {
      bg: function (c, t) {
        orb(c.x, c.y - c.h * 0.1, c.w * 1.6, 'rgba(140,225,255,.5)', 0.6);
        for (var i = 0; i < 5; i++) {
          var bx = c.x + (i - 2) * c.w * 0.42 + Math.sin(t * 0.6 + i) * 10;
          var bw = c.w * (0.18 + 0.05 * Math.sin(t + i * 2));
          var g = ctx.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, 'rgba(190,240,255,0)'); g.addColorStop(0.25, 'rgba(190,240,255,.55)'); g.addColorStop(1, 'rgba(190,240,255,0)');
          ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 1.3 + i); ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(bx - bw * 0.3, 0); ctx.lineTo(bx + bw * 0.3, 0); ctx.lineTo(bx + bw * 1.4, H); ctx.lineTo(bx - bw * 1.4, H); ctx.fill();
        }
      },
      em: [
        { rate: 16, fn: function (c) { return mk({ k: 'orb', x: c.x + rnd(-c.w * 1.2, c.w * 1.2), y: c.y + c.h * 0.7, vx: 0, vy: rnd(-50, -25), life: rnd(2, 3.5), s: rnd(2, 5), col: '#cdf3ff' }); } },
        { rate: 12, fn: function (c) { return sparkAround(c, ['#e8fbff', '#9fe6ff']); } }
      ]
    },
    /* Hallowed: 신성한 마법진이 도는 보랏빛 */
    hallowed: {
      bg: function (c, t) {
        orb(c.x, c.y, c.w * 1.5, 'rgba(170,140,255,.5)', 0.6 + 0.1 * Math.sin(t * 2));
        ctx.lineWidth = 2;
        for (var r = 0; r < 2; r++) {
          var rx = c.w * (0.95 + r * 0.35), ry = rx * 0.28;
          ctx.save(); ctx.translate(c.x, c.y + c.h * 0.36);
          ctx.globalAlpha = 0.75 - r * 0.2; ctx.strokeStyle = r ? '#b9a2ff' : '#e6dcff';
          ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.2832); ctx.stroke();
          ctx.fillStyle = '#fff';
          for (var i = 0; i < 10; i++) {
            var a = t * (r ? -0.7 : 0.9) + i * 6.2832 / 10;
            ctx.beginPath(); ctx.arc(Math.cos(a) * rx, Math.sin(a) * ry, 3, 0, 6.2832); ctx.fill();
          }
          ctx.restore();
        }
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(t * 0.5); ctx.globalAlpha = 0.45; ctx.strokeStyle = '#d8c8ff';
        ctx.beginPath(); ctx.ellipse(0, 0, c.w * 0.95, c.w * 0.3, 0, 0, 6.2832); ctx.stroke(); ctx.restore();
      },
      em: [
        { rate: 22, fn: function (c) { var a = Math.random() * 6.2832; return mk({ k: 'orb', x: c.x + Math.cos(a) * c.w * 0.95, y: c.y + c.h * 0.36 + Math.sin(a) * c.w * 0.26, vx: 0, vy: rnd(-70, -35), life: rnd(1.2, 2.2), s: rnd(2, 4), col: '#d8c8ff' }); } },
        { rate: 10, fn: function (c) { return sparkAround(c, ['#f1eaff', '#c7b3ff']); } }
      ]
    },
    /* Saintly: 천사의 고리와 떨어지는 꽃잎 */
    saintly: {
      bg: function (c, t) {
        orb(c.x, c.y, c.w * 1.4, 'rgba(255,215,235,.5)', 0.55);
        var hy = c.y - c.h * 0.62 + Math.sin(t * 2) * 4;
        ctx.globalAlpha = 0.95; ctx.lineWidth = 5; ctx.strokeStyle = '#fff4c2';
        ctx.beginPath(); ctx.ellipse(c.x, hy, c.w * 0.36, c.w * 0.1, 0, 0, 6.2832); ctx.stroke();
        ctx.globalAlpha = 0.4; ctx.lineWidth = 12; ctx.strokeStyle = '#ffd1e6'; ctx.stroke();
      },
      em: [
        { rate: 9, fn: function () { var vy = rnd(35, 70); return mk({ k: 'petal', x: rnd(0, W), y: -10, vx: rnd(-10, 10), vy: vy, sway: 30, life: H / vy + 0.5, s: rnd(5, 9), col: pickOne(['#ffd1e6', '#fff0f6', '#ffe3ef']) }); } },
        { rate: 14, fn: function (c) { return sparkAround(c, ['#fff4c2', '#ffd1e6', '#ffffff']); } }
      ]
    },
    /* Inferno: 지옥불과 불씨 */
    inferno: {
      bg: function (c, t) {
        var f = 0.75 + 0.25 * Math.sin(t * 9) + 0.1 * Math.sin(t * 23);
        var g = ctx.createLinearGradient(0, H, 0, H * 0.35);
        g.addColorStop(0, 'rgba(255,90,20,.75)'); g.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.globalAlpha = f * 0.8; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        orb(c.x, c.y + c.h * 0.2, c.w * 1.2, 'rgba(255,70,20,.55)', 0.6 * f);
      },
      em: [
        { rate: 60, fn: function (c) { return mk({ k: 'flame', x: c.x + rnd(-c.w * 0.85, c.w * 0.85), y: Math.min(H, c.y + c.h * 0.58), vx: rnd(-14, 14), vy: rnd(-140, -70), life: rnd(0.7, 1.4), s: rnd(22, 44) }); } },
        { rate: 45, fn: function () { return mk({ k: 'flame', x: rnd(0, W), y: H + 6, vx: rnd(-10, 10), vy: rnd(-190, -90), life: rnd(0.8, 1.5), s: rnd(30, 60) }); } },
        { rate: 26, fn: function (c) { return mk({ k: 'ember', x: c.x + rnd(-c.w, c.w), y: c.y + c.h * 0.5, vx: 0, vy: rnd(-120, -60), sway: 40, life: rnd(1.2, 2.4), s: rnd(1.5, 3.5), col: '#ffb347' }); } }
      ]
    },
    /* Infinity: 무한대(∞) 궤도를 도는 무지개빛 */
    infinity: {
      bg: function (c, t) {
        orb(c.x, c.y, c.w * 1.5, 'hsla(' + ((t * 50) % 360) + ',100%,60%,.35)', 0.5);
        var a = Math.max(c.w * 1.25, 120);
        for (var i = 0; i < 70; i++) {
          var u = t * 1.4 - i * 0.05, d = 1 + Math.sin(u) * Math.sin(u);
          var x = c.x + a * Math.cos(u) / d, y = c.y + a * 1.5 * Math.sin(u) * Math.cos(u) / d;
          orb(x, y, 2 + (70 - i) / 70 * 7, 'hsla(' + ((u * 57 + t * 60) % 360) + ',100%,65%,1)', (1 - i / 70) * 0.9);
        }
      },
      em: [{ rate: 22, fn: function (c) { return sparkAround(c, ['hsl(' + Math.floor(rnd(0, 360)) + ',100%,75%)']); } }]
    },
    /* Godly: 눈부신 광채와 퍼지는 충격파 */
    godly: {
      bg: function (c, t) {
        orb(c.x, c.y, c.w * 1.9, 'rgba(255,215,90,.6)', 0.42 + 0.12 * Math.sin(t * 3));
        var n = 14, L = Math.max(W, H);
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(t * 0.35);
        for (var i = 0; i < n; i++) {
          var a = i * 6.2832 / n;
          var g = ctx.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
          g.addColorStop(0, 'rgba(255,230,140,.5)'); g.addColorStop(1, 'rgba(255,230,140,0)');
          ctx.globalAlpha = 0.35; ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, L, a - 0.07, a + 0.07); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        for (var k = 0; k < 3; k++) {
          var p = ((t * 0.7) + k / 3) % 1;
          ctx.globalAlpha = (1 - p) * 0.7; ctx.lineWidth = 3 + (1 - p) * 5; ctx.strokeStyle = '#fff0a8';
          ctx.beginPath(); ctx.arc(c.x, c.y, c.w * (0.5 + p * 2.2), 0, 6.2832); ctx.stroke();
        }
      },
      em: [
        { rate: 20, fn: function (c) { return sparkOutside(c, ['#fff7cf', '#ffd24a', '#ffffff']); } },
        { rate: 7, fn: function (c) { return mk({ k: 'orb', x: c.x + rnd(-c.w, c.w), y: c.y + c.h * 0.5, vx: 0, vy: rnd(-90, -40), life: rnd(1.2, 2.2), s: rnd(2, 4), col: '#ffe38a' }); } }
      ]
    }
  };

  function drawPart(p) {
    var u = p.age / p.life;
    if (p.k === 'spark') { var a = Math.sin(Math.PI * u); sparkle(p.x, p.y, p.s * (0.5 + 0.5 * a), a, p.col, p.age * 0.8); }
    else if (p.k === 'orb') { orb(p.x, p.y, p.s * 3, p.col, Math.sin(Math.PI * u) * 0.8); }
    else if (p.k === 'ember') { orb(p.x, p.y, p.s * 2.5, p.col, (1 - u) * 0.9); }
    else if (p.k === 'flame') { orb(p.x, p.y, p.s * (1 - 0.45 * u), 'hsl(' + (58 - 58 * u) + ',100%,' + (60 - 20 * u) + '%)', (1 - u) * 0.5); }
    else if (p.k === 'petal') {
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.85 * Math.min(1, (1 - u) * 4);
      ctx.translate(p.x, p.y); ctx.rotate(p.age * 1.5 + p.ph); ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.5, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    }
  }

  function frame(ts) {
    if (!fxName) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (ts - fxLast) / 1000); fxLast = ts;
    var t = (ts - fxStart) / 1000;
    var d = FXD[fxName], c = center();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    d.bg(c, t);
    var k = RM ? 0.3 : 1;
    d.em.forEach(function (e) {
      e.acc = (e.acc || 0) + e.rate * k * dt;
      while (e.acc >= 1) { e.acc -= 1; if (parts.length < 700) parts.push(e.fn(c)); }
    });
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.age += dt;
      if (p.age >= p.life) { parts.splice(i, 1); continue; }
      p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
      if (p.sway) p.x += Math.sin(p.age * 2 + p.ph) * p.sway * dt;
      drawPart(p);
    }
    ctx.globalAlpha = 1;
  }
  function startFx(name) {
    if (!FXD[name]) return;
    parts = [];
    FXD[name].em.forEach(function (e) { e.acc = 0; });
    sizeCanvas();
    fxName = name; fxStart = fxLast = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stopFx() {
    fxName = null; parts = [];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
  }
  window.addEventListener('resize', function () { if (fxName) sizeCanvas(); });

  function applyBlessing(b) {
    var n = b.n.toLowerCase();
    eggEl.style.setProperty('--fxc', b.c);
    eggEl.setAttribute('data-fx', n);
    stage.setAttribute('data-fx', n);
    stage.classList.remove('flash'); void stage.offsetWidth; stage.classList.add('flash');
    startFx(n);
  }

  function resetStage() {
    stopFx();
    ann.className = 'announce'; ann.style.removeProperty('--c');
    scoreEl.classList.remove('on'); scoreNum.textContent = '0'; scoreFormula.textContent = '';
    eggEl.removeAttribute('data-tier'); eggEl.style.removeProperty('--rc'); pedestal.removeAttribute('data-ench');
    gradeBadge.classList.remove('on'); gradeBadge.style.removeProperty('--c'); $('span', gradeBadge).textContent = '—';
    Object.keys(pills).forEach(function (key) {
      pills[key].classList.remove('on'); pills[key].style.removeProperty('--c'); pills[key].textContent = '—';
    });
    eggEl.className = 'egg-wrap';
    eggEl.removeAttribute('data-fx');
    eggEl.style.removeProperty('--fxc');
    stage.removeAttribute('data-fx');
    stage.classList.remove('flash');
  }

  async function cycleEgg(picked, ms) {
    var t0 = performance.now(), last = null;
    while (performance.now() - t0 < ms) {
      var c;
      do { c = chars[Math.floor(Math.random() * chars.length)]; } while (chars.length > 1 && c === last);
      last = c; showEgg(c); eggName.textContent = c.name;
      var p = (performance.now() - t0) / ms;
      await sleep(55 + p * p * 150);
    }
    showEgg(picked); eggName.textContent = picked.name;
    await sleep(380);
  }

  function settle(key, res) {
    if (key === 'grade') {
      $('span', gradeBadge).textContent = res.n;
      gradeBadge.style.setProperty('--c', res.c);
      gradeBadge.classList.add('on');
    } else {
      var pl = pills[key];
      pl.textContent = res.n; pl.style.setProperty('--c', res.c); pl.classList.add('on');
      if (key === 'enchant') pedestal.setAttribute('data-ench', ENCH[res.n] || '');
      if (key === 'rarity') {
        var idx = TABLES.rarity.indexOf(res);
        eggEl.style.setProperty('--rc', res.c);
        eggEl.setAttribute('data-tier', String(TABLES.rarity.length - 1 - idx));
      }
    }
  }

  /* 화면 가운데 자막: 하나가 뜨고 지나가면 다음 자막이 뜬다 */
  async function announce(label, names, final, ms, k, onSettle) {
    annK.textContent = label;
    ann.style.removeProperty('--c');
    ann.classList.remove('out', 'locked');
    ann.classList.add('on', 'spinning');
    var t0 = performance.now(), last = '';
    while (performance.now() - t0 < ms) {
      var n;
      do { n = names[Math.floor(Math.random() * names.length)]; } while (names.length > 1 && n === last);
      last = n; annV.textContent = n;
      var p = (performance.now() - t0) / ms;
      await sleep(55 + p * p * 150);
    }
    annV.textContent = final.n;
    ann.style.setProperty('--c', final.c);
    ann.classList.remove('spinning'); ann.classList.add('locked');
    await sleep(1000 * k + 200);
    if (onSettle) onSettle();
    ann.classList.remove('on', 'locked'); ann.classList.add('out');
    await sleep(380);
  }

  function rollScore(r) {
    var gr = SCORE.grade[r[0].n], rr = SCORE.rarity[r[1].n];
    var g = Math.round(rnd(gr[0], gr[1])), q = Math.round(rnd(rr[0], rr[1]));
    var em = SCORE.enchant[r[2].n], bm = SCORE.blessing[r[3].n];
    return { g: g, r: q, em: em, bm: bm, total: Math.round((g + q) * em * bm) };
  }
  async function countUp(el, to, ms) {
    var t0 = performance.now();
    for (;;) {
      var pr = Math.min(1, (performance.now() - t0) / ms);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - pr, 3))));
      if (pr >= 1) break;
      await sleep(30);
    }
  }

  /* ---------- 에그 보관함 ---------- */
  var vault = load('egg.vault', []);
  if (!Array.isArray(vault)) vault = [];
  var vaultSort = 'new', loadedId = null, delArm = null, delTimer = 0;
  vault.forEach(function (v) { if (!v.id) v.id = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); });
  function charById(id, name) { return chars.filter(function (c) { return c.id === id; })[0] || { name: name || '?', hue: 260 }; }
  function entryOf(key, n) { return TABLES[key].filter(function (x) { return x.n === n; })[0]; }
  function colorOf(key, n) { var t = TABLES[key].filter(function (x) { return x.n === n; })[0]; return t ? t.c : '#a8a1cf'; }
  function renderVault() {
    var list = vault.slice();
    if (vaultSort === 'score') list.sort(function (a, b) { return b.score - a.score; }); else list.reverse();
    $('#vaultEmpty').hidden = list.length > 0;
    $('#vaultCount').textContent = vault.length;
    var rarNames = TABLES.rarity.map(function (x) { return x.n; });
    $('#vault').innerHTML = list.map(function (v) {
      var c = charById(v.cid, v.cname), ri = rarNames.indexOf(v.r);
      var armed = v.id === delArm;
      return '<li class="egg-card' + (v.id === loadedId ? ' sel' : '') + '" data-id="' + v.id + '"><button type="button" class="ec-load" aria-label="' + esc(c.name) + ' 에그 불러오기">' +
        '<div class="egg-wrap mini-egg"' + (ri < 0 ? '' : ' data-tier="' + (rarNames.length - 1 - ri) + '"') + ' style="--rc:' + colorOf('rarity', v.r) + '">' + eggSVG(c) + '</div>' +
        '<div class="ec-info"><div class="ec-top"><b>' + esc(c.name) + '</b><span class="ec-grade" style="color:' + colorOf('grade', v.g) + '">' + esc(v.g) + '</span></div>' +
        '<div class="ec-tags"><span style="color:' + colorOf('rarity', v.r) + '">' + esc(v.r) + '</span><span style="color:' + colorOf('enchant', v.e) + '">' + esc(v.e) + '</span><span style="color:' + colorOf('blessing', v.b) + '">' + esc(v.b) + '</span></div>' +
        '<div class="ec-score">' + fmt(v.score) + '점</div></div></button>' +
        '<button type="button" class="ec-del' + (armed ? ' armed' : '') + '" aria-label="' + esc(c.name) + ' 에그 삭제">' + (armed ? '정말 삭제?' : '삭제') + '</button></li>';
    }).join('');
  }
  function updateStats() {
    var sum = 0, best = 0;
    vault.forEach(function (v) { sum += v.score; if (v.score > best) best = v.score; });
    $('#total').textContent = vault.length;
    $('#sumScore').textContent = fmt(sum);
    $('#bestScore').textContent = fmt(best);
  }
  function setSort(m) {
    vaultSort = m;
    $('#sortNew').setAttribute('aria-pressed', String(m === 'new'));
    $('#sortScore').setAttribute('aria-pressed', String(m === 'score'));
    renderVault();
  }
  $('#sortNew').addEventListener('click', function () { setSort('new'); });
  $('#sortScore').addEventListener('click', function () { setSort('score'); });
  /* 보관함의 에그를 부화장으로 불러오기 */
  function loadEgg(id) {
    if (busy) return;
    var v = vault.filter(function (x) { return x.id === id; })[0];
    if (!v) return;
    var g = entryOf('grade', v.g), r = entryOf('rarity', v.r), e = entryOf('enchant', v.e), b = entryOf('blessing', v.b);
    if (!g || !r || !e || !b) return;
    var c = charById(v.cid, v.cname);
    resetStage();
    showEgg(c); eggName.textContent = c.name;
    settle('grade', g); settle('rarity', r); settle('enchant', e);
    applyBlessing(b); settle('blessing', b);
    eggEl.classList.add('landed');
    scoreNum.textContent = fmt(v.score);
    scoreFormula.textContent = v.gs === undefined ? '' : '(' + fmt(v.gs) + ' + ' + fmt(v.rs) + ') × ' + SCORE.enchant[e.n] + ' × ' + SCORE.blessing[b.n];
    scoreEl.classList.add('on');
    loadedId = id; delArm = null; clearTimeout(delTimer);
    renderVault();
    stage.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  }
  $('#vault').addEventListener('click', function (e) {
    var li = e.target.closest('.egg-card');
    if (!li) return;
    var id = li.dataset.id;
    if (e.target.closest('.ec-del')) {
      clearTimeout(delTimer);
      if (delArm === id) {
        delArm = null;
        vault = vault.filter(function (x) { return x.id !== id; });
        save('egg.vault', vault);
        if (loadedId === id) { loadedId = null; if (!busy) showIdle(); }
        renderVault(); updateStats();
      } else {
        delArm = id;
        delTimer = setTimeout(function () { delArm = null; renderVault(); }, 3000);
        renderVault();
      }
      return;
    }
    loadEgg(id);
  });

  async function draw() {
    if (busy || !chars.length) return;
    busy = true;
    var btn = $('#drawBtn');
    btn.disabled = true; btn.textContent = '부화 중…';
    var k = $('#fast').checked ? 0.35 : 1;
    resetStage();
    loadedId = null; delArm = null;
    var picked = chars[Math.floor(Math.random() * chars.length)];

    /* 1. 에그 */
    eggEl.classList.add('wobble');
    await cycleEgg(picked, 1300 * k);

    /* 2~4. 등급, 레어도, 에그 인첸트 (가운데 자막, 결과는 에그 주변에 남김) */
    var keys = ['grade', 'rarity', 'enchant'], results = [];
    for (var i = 0; i < keys.length; i++) {
      var res = pick(keys[i]);
      results.push(res);
      await announce(LABELS[keys[i]], TABLES[keys[i]].map(function (x) { return x.n; }), res, (950 + i * 150) * k, k, (function (key, r) { return function () { settle(key, r); }; })(keys[i], res));
    }

    /* 5. 축복 (이펙트) */
    var bless = pick('blessing');
    results.push(bless);
    eggEl.classList.remove('wobble'); eggEl.classList.add('charge');
    await sleep(1100 * k);
    eggEl.classList.remove('charge');
    applyBlessing(bless);
    settle('blessing', bless);
    eggEl.classList.add('landed');
    await sleep(600);

    var sc = rollScore(results);
    scoreFormula.textContent = '(' + fmt(sc.g) + ' + ' + fmt(sc.r) + ') × ' + sc.em + ' × ' + sc.bm;
    scoreEl.classList.add('on');
    await countUp(scoreNum, sc.total, 1300 * k);

    var newId = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    vault.push({ id: newId, gs: sc.g, rs: sc.r, cid: picked.id, cname: picked.name, g: results[0].n, r: results[1].n, e: results[2].n, b: results[3].n, score: sc.total, t: Date.now() });
    if (vault.length > 300) vault.shift();
    save('egg.vault', vault);
    renderVault(); updateStats();
    busy = false;
    btn.disabled = !chars.length; btn.textContent = '에그 뽑기';
  }

  $('#drawBtn').addEventListener('click', draw);

  renderChars();
  renderOdds();
  renderVault();
  updateStats();
})();
