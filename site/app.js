/* 巨魔怪的故事 — 投影用繪本 */
(function () {
  'use strict';

  var BOOK = window.BOOK || { pages: [] };
  var PAGES = BOOK.pages;
  var N = PAGES.length;

  var stage = document.getElementById('stage');
  var hud = document.getElementById('hud');
  var counter = document.getElementById('counter');
  stage.appendChild(hud);

  var slides = [];
  var cur = 0;
  var step = 0;          // 啟發頁已點出的條目數
  var fitted = [];       // 已完成字級計算的頁

  /* ---------- 建立頁面 ---------- */
  function imgName(id) {
    return 'img/p' + (id < 10 ? '0' + id : id) + '.jpg';
  }

  function isDialogue(s) {
    return s.indexOf('「') >= 0 || s.indexOf('」') >= 0;
  }

  function makeBlock(lines, cls) {
    var b = document.createElement('div');
    b.className = 'block' + (cls ? ' ' + cls : '');
    lines.forEach(function (t) {
      var d = document.createElement('div');
      d.className = 'line' + (isDialogue(t) ? ' dlg' : '');
      d.textContent = t;
      b.appendChild(d);
    });
    return b;
  }

  function buildSlide(p, i) {
    var kind = p.kind || 'normal';
    var s = document.createElement('section');
    s.className = 'slide' + (kind === 'cover' || kind === 'question' ? ' overlay' : '');
    s.setAttribute('data-kind', kind);

    var wrap = document.createElement('div');
    wrap.className = 'imgwrap';
    var img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.className = 'hide';
    var ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = '第 ' + p.id + ' 頁圖片';
    img.addEventListener('load', function () {
      img.classList.remove('hide');
      ph.style.display = 'none';
    });
    img.addEventListener('error', function () {
      img.classList.add('hide');
      ph.style.display = '';
    });
    wrap.appendChild(img);
    wrap.appendChild(ph);
    s.appendChild(wrap);

    var panel = document.createElement('div');
    panel.className = 'panel';

    if (kind === 'cover') {
      var t = document.createElement('div');
      t.className = 'cover-title';
      t.textContent = p.title;
      panel.appendChild(t);
      if (p.subtitle) {
        var sub = document.createElement('div');
        sub.className = 'cover-sub';
        sub.textContent = p.subtitle;
        panel.appendChild(sub);
      }
    } else if (kind === 'lessons') {
      var lt = document.createElement('div');
      lt.className = 'lessons-title';
      lt.textContent = p.title;
      panel.appendChild(lt);
      (p.items || []).forEach(function (txt, k) {
        var it = document.createElement('div');
        it.className = 'item';
        var n = document.createElement('span');
        n.className = 'num';
        n.textContent = String(k + 1);
        var tx = document.createElement('span');
        tx.className = 'txt';
        tx.textContent = txt;
        it.appendChild(n);
        it.appendChild(tx);
        panel.appendChild(it);
      });
    } else {
      if (kind === 'end' && p.title) {
        var et = document.createElement('div');
        et.className = 'end-title';
        et.textContent = p.title;
        panel.appendChild(et);
      }
      if (p.text) panel.appendChild(makeBlock(p.text, 'block1'));
      if (p.text2) panel.appendChild(makeBlock(p.text2, 'block2'));
      if (kind === 'end') {
        var a = document.createElement('a');
        a.className = 'btn';
        a.href = 'worksheet.pdf';
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = '下載學習單 PDF';
        panel.appendChild(a);
      }
    }

    s.appendChild(panel);
    s._img = img;
    s._panel = panel;
    s._kind = kind;
    s._src = imgName(p.id);
    stage.insertBefore(s, hud);
    return s;
  }

  PAGES.forEach(function (p, i) { slides.push(buildSlide(p, i)); });

  /* ---------- 尺寸與字級 ---------- */
  var RANGE = {
    normal:   { max: 3.30, min: 2.35, h: 0.505 },
    end:      { max: 3.30, min: 2.40, h: 0.545 },
    lessons:  { max: 3.30, min: 2.20, h: 0.545 },
    cover:    { max: 3.10, min: 2.00, h: 0.62 },
    question: { max: 8.60, min: 4.00, h: 0.80 }
  };

  function setU() {
    var r = stage.getBoundingClientRect();
    document.documentElement.style.setProperty('--u', (r.width / 100) + 'px');
    return r;
  }

  function fits(s, maxH) {
    var panel = s._panel;
    if (panel.scrollWidth > panel.clientWidth + 1) return false;
    if (panel.offsetHeight > maxH + 0.5) return false;
    var els = panel.querySelectorAll('.line,.cover-title,.cover-sub,.lessons-title,.end-title,.txt,.btn');
    for (var i = 0; i < els.length; i++) {
      var e = els[i];
      if (e.scrollWidth > e.clientWidth + 1) return false;
      if (e.getBoundingClientRect().width > panel.clientWidth + 1) return false;
    }
    return true;
  }

  function fit(idx) {
    var s = slides[idx];
    if (!s) return;
    var rect = stage.getBoundingClientRect();
    var u = rect.width / 100;
    var cfg = RANGE[s._kind] || RANGE.normal;
    var maxH = rect.height * cfg.h;
    var panel = s._panel;
    var wasHidden = !s.classList.contains('on');
    if (wasHidden) { s.style.visibility = 'hidden'; s.style.opacity = '0'; s.style.display = 'flex'; s.classList.add('measuring'); }
    var f = cfg.max, best = cfg.min;
    while (f >= cfg.min - 0.001) {
      panel.style.setProperty('--fs', (f * u) + 'px');
      if (fits(s, maxH)) { best = f; break; }
      f -= 0.04;
    }
    panel.style.setProperty('--fs', (best * u) + 'px');
    if (wasHidden) { s.style.visibility = ''; s.style.opacity = ''; s.style.display = ''; s.classList.remove('measuring'); }
    fitted[idx] = rect.width;
  }

  function ensureFit(idx) {
    var w = stage.getBoundingClientRect().width;
    if (fitted[idx] !== w) fit(idx);
  }

  function relayout() {
    setU();
    fitted = [];
    ensureFit(cur);
    ensureFit(cur + 1);
    ensureFit(cur - 1);
  }

  /* ---------- 圖片載入 ---------- */
  function loadImg(idx) {
    var s = slides[idx];
    if (!s || s._img.getAttribute('src')) return;
    s._img.src = s._src;
  }
  function preload(idx) {
    var s = slides[idx];
    if (!s) return;
    loadImg(idx);
  }

  /* ---------- 顯示 ---------- */
  function applyLessons(idx) {
    var s = slides[idx];
    if (!s || s._kind !== 'lessons') return;
    var items = s._panel.querySelectorAll('.item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('show', i < step);
    }
  }

  function show(idx, opt) {
    idx = Math.max(0, Math.min(N - 1, idx));
    var back = opt && opt.back;
    if (idx !== cur || (opt && opt.force)) {
      slides[cur].classList.remove('on');
      cur = idx;
    }
    var s = slides[cur];
    if (s._kind === 'lessons') {
      if (opt && opt.keepStep) { /* 保留 */ }
      else step = back ? (PAGES[cur].items || []).length : 0;
      applyLessons(cur);
    }
    loadImg(cur);
    ensureFit(cur);
    s.classList.add('on');
    counter.textContent = (cur + 1) + ' / ' + N;
    var h = '#p' + (cur + 1);
    if (location.hash !== h) {
      try { history.replaceState(null, '', h); } catch (e) { location.hash = h; }
    }
    // 預載前後
    preload(cur + 1);
    preload(cur - 1);
    setTimeout(function () { ensureFit(cur + 1); ensureFit(cur - 1); }, 60);
  }

  function next() {
    var s = slides[cur];
    if (s._kind === 'lessons') {
      var total = (PAGES[cur].items || []).length;
      if (step < total) { step++; applyLessons(cur); return; }
    }
    if (cur < N - 1) show(cur + 1);
  }

  function prev() {
    var s = slides[cur];
    if (s._kind === 'lessons') {
      if (step > 0) { step--; applyLessons(cur); return; }
    }
    if (cur > 0) show(cur - 1, { back: true });
  }

  /* ---------- 操作 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var k = e.key, c = e.code;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar' ||
        c === 'Space' || k === 'PageDown' || k === 'Enter') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(N - 1); }
    else if (k === 'f' || k === 'F') { e.preventDefault(); toggleFull(); }
    else if (k === 'Escape' && document.fullscreenElement) { /* 瀏覽器自行處理 */ }
  });

  stage.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a,button')) return;
    var r = stage.getBoundingClientRect();
    if (e.clientX - r.left > r.width / 2) next(); else prev();
  });

  var tx = 0, ty = 0, tmoved = false;
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    tx = e.touches[0].clientX; ty = e.touches[0].clientY; tmoved = true;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!tmoved) return;
    tmoved = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - tx, dy = t.clientY - ty;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (e.target.closest && e.target.closest('a,button')) return;
      e.preventDefault();
      if (dx < 0) next(); else prev();
    }
  }, { passive: false });

  function toggleFull() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    } else {
      document.exitFullscreen();
    }
  }

  window.addEventListener('resize', function () {
    clearTimeout(window.__rt);
    window.__rt = setTimeout(relayout, 80);
  });

  window.addEventListener('hashchange', function () {
    var m = /^#p(\d+)$/.exec(location.hash);
    if (m) {
      var n = parseInt(m[1], 10) - 1;
      if (n >= 0 && n < N && n !== cur) show(n);
    }
  });

  /* ---------- 啟動 ---------- */
  function start() {
    setU();
    var m = /^#p(\d+)$/.exec(location.hash);
    var i = m ? Math.min(N - 1, Math.max(0, parseInt(m[1], 10) - 1)) : 0;
    show(i, { force: true });
    setTimeout(function () { for (var k = 0; k < N; k++) ensureFit(k); }, 200);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
    setTimeout(function () { if (fitted.length === 0) start(); }, 2500);
  } else {
    start();
  }

  // 供測試使用
  window.__deck = {
    go: function (n) { show(n); },
    next: next, prev: prev,
    state: function () { return { cur: cur, step: step, n: N }; },
    fitAll: function () { for (var k = 0; k < N; k++) ensureFit(k); }
  };
})();
