/* 巨魔怪的故事 — 投影用繪本（分拍版） */
(function () {
  'use strict';

  var BOOK = window.BOOK || { pages: [] };
  var PAGES = BOOK.pages;
  var N = PAGES.length;

  var stage = document.getElementById('stage');
  var hud = document.getElementById('hud');
  var counter = document.getElementById('counter');
  stage.appendChild(hud);

  var IMG_H = 0.68;      // 圖片區佔舞台高度
  var PANEL_H = 0.32;    // 文字面板佔舞台高度
  var LH = 1.25;         // 行高
  var PAD_T = 0.8;       // 面板上 padding（單位 u）
  var PAD_B = 1.8;       // 面板下 padding（單位 u，留給拍點）
  var PAD_X = 3.0;       // 面板左右 padding（單位 u）

  var slides = [];
  var cur = 0;
  var beat = 0;

  /* ---------- 資料 ---------- */
  function imgName(id) { return 'img/p' + (id < 10 ? '0' + id : id) + '.jpg'; }

  // 以「頁」為單位追蹤引號狀態：遇到「進入引用，遇到」離開，
  // 中間所有行（含沒帶引號的）都算對話行。
  function markDialogue(beats) {
    var inQuote = false, out = [];
    beats.forEach(function (b) {
      var row = [];
      b.forEach(function (line) {
        var isDlg = inQuote || line.indexOf('「') >= 0;
        for (var i = 0; i < line.length; i++) {
          if (line[i] === '「') inQuote = true;
          else if (line[i] === '」') inQuote = false;
        }
        row.push({ t: line, dlg: isDlg });
      });
      out.push(row);
    });
    return out;
  }

  function beatsOf(p) {
    var kind = p.kind || 'normal';
    if (kind === 'lessons') return (p.items || []).map(function (x) { return [x]; });
    if (kind === 'cover') return [[]];
    return p.beats || [];
  }
  function beatCount(i) {
    var p = PAGES[i], kind = p.kind || 'normal';
    if (kind === 'cover') return 1;
    if (kind === 'lessons') return (p.items || []).length;
    return (p.beats || []).length || 1;
  }

  /* ---------- 建立頁面 ---------- */
  function buildSlide(p) {
    var kind = p.kind || 'normal';
    var s = document.createElement('section');
    s.className = 'slide';
    s.setAttribute('data-kind', kind);

    var wrap = document.createElement('div');
    wrap.className = 'imgwrap';
    var img = document.createElement('img');
    img.alt = ''; img.decoding = 'async'; img.className = 'hide';
    var ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = '第 ' + p.id + ' 頁圖片';
    img.addEventListener('load', function () { img.classList.remove('hide'); ph.style.display = 'none'; });
    img.addEventListener('error', function () { img.classList.add('hide'); ph.style.display = ''; });
    wrap.appendChild(img); wrap.appendChild(ph);
    s.appendChild(wrap);

    if (kind === 'cover') {
      var ct = document.createElement('div');
      ct.className = 'cover-text';
      var t = document.createElement('div');
      t.className = 'cover-title'; t.textContent = p.title;
      ct.appendChild(t);
      if (p.subtitle) {
        var sb = document.createElement('div');
        sb.className = 'cover-sub'; sb.textContent = p.subtitle;
        ct.appendChild(sb);
      }
      s.appendChild(ct);
      s._beats = [];
    } else {
      var panel = document.createElement('div');
      panel.className = 'panel';
      var content = document.createElement('div');
      content.className = 'pcontent';

      if (kind === 'lessons') {
        var lt = document.createElement('div');
        lt.className = 'lessons-title'; lt.textContent = p.title;
        content.appendChild(lt);
        var box = document.createElement('div');
        box.className = 'items';
        (p.items || []).forEach(function (txt, k) {
          var it = document.createElement('div');
          it.className = 'item';
          var n = document.createElement('span');
          n.className = 'num'; n.textContent = String(k + 1);
          var tx = document.createElement('span');
          tx.className = 'txt'; tx.textContent = txt;
          it.appendChild(n); it.appendChild(tx);
          box.appendChild(it);
        });
        content.appendChild(box);
        s._items = box.querySelectorAll('.item');
        s._beats = [];
      } else {
        if (kind === 'end' && p.title) {
          var et = document.createElement('div');
          et.className = 'end-title'; et.textContent = p.title;
          content.appendChild(et);
        }
        var wrapB = document.createElement('div');
        wrapB.className = 'beats';
        var marked = markDialogue(p.beats || []);
        marked.forEach(function (rows) {
          var bd = document.createElement('div');
          bd.className = 'beat';
          rows.forEach(function (r) {
            var d = document.createElement('div');
            d.className = 'line' + (r.dlg ? ' dlg' : '');
            d.textContent = r.t;
            bd.appendChild(d);
          });
          wrapB.appendChild(bd);
        });
        content.appendChild(wrapB);
        s._beats = wrapB.querySelectorAll('.beat');

        if (kind === 'end') {
          var a = document.createElement('a');
          a.className = 'btn'; a.href = 'worksheet.pdf';
          a.target = '_blank'; a.rel = 'noopener';
          a.textContent = '下載學習單 PDF';
          content.appendChild(a);
        }
      }

      panel.appendChild(content);

      var dots = document.createElement('div');
      dots.className = 'dots';
      var cnt = kind === 'lessons' ? (p.items || []).length : (p.beats || []).length;
      for (var k = 0; k < cnt; k++) dots.appendChild(document.createElement('i'));
      if (cnt < 2) dots.classList.add('hide');
      panel.appendChild(dots);
      s._dots = dots.querySelectorAll('i');
      s._panel = panel;
      s._content = content;
      s.appendChild(panel);
    }

    s._img = img;
    s._kind = kind;
    s._src = imgName(p.id);
    stage.insertBefore(s, hud);
    return s;
  }

  PAGES.forEach(function (p) { slides.push(buildSlide(p)); });

  /* ---------- 字級計算 ---------- */
  function setVar(name, px) { document.documentElement.style.setProperty(name, px + 'px'); }

  // 把「這一組」所有狀態逐一擺出來，回傳檢查函式用的狀態走訪器
  function eachState(kinds, fn) {
    for (var i = 0; i < N; i++) {
      var s = slides[i];
      if (kinds.indexOf(s._kind) < 0) continue;
      if (s._kind === 'lessons') {
        applyLessons(i, beatCount(i) - 1);   // 全部點出＝最高的狀態
        if (fn(s, i) === false) return false;
      } else {
        for (var b = 0; b < s._beats.length; b++) {
          showBeatEl(s, b);
          if (fn(s, i) === false) return false;
        }
      }
    }
    return true;
  }

  function panelFits(s) {
    var panel = s._panel;
    if (!panel) return true;
    if (panel.scrollHeight > panel.clientHeight + 1) return false;
    if (panel.scrollWidth > panel.clientWidth + 1) return false;
    var els = panel.querySelectorAll('.beat.on .line, .item, .lessons-title, .end-title, .btn');
    for (var i = 0; i < els.length; i++) {
      var e = els[i];
      if (e.scrollWidth > e.clientWidth + 1) return false;
      if (e.getClientRects().length !== 1) return false;
    }
    return true;
  }

  // 用 100px 參考字級量一次，直接換算出「不溢出的最大字級」，再實測校正
  var REF = 100;
  // 在目前字級 curFs 下量測，回推「剛好不溢出」的字級
  function measureGroup(kinds, availH, availW, curFs) {
    var best = Infinity;
    eachState(kinds, function (s) {
      var c = s._content;
      if (!c) return;
      var h = c.getBoundingClientRect().height;
      if (h > 0) best = Math.min(best, curFs * availH / h);
      var maxW = c.scrollWidth;
      var els = c.querySelectorAll('.beat.on .line, .item, .lessons-title, .end-title, .btn');
      for (var i = 0; i < els.length; i++) {
        maxW = Math.max(maxW, els[i].scrollWidth, els[i].offsetWidth);
      }
      if (maxW > 0) best = Math.min(best, curFs * availW / maxW);
    });
    return best;
  }

  function bestFit(kinds, varName, availH, availW) {
    setVar(varName, REF);
    var est = measureGroup(kinds, availH, availW, REF);
    if (!isFinite(est)) est = 40;
    var fs = Math.max(8, Math.floor(est));
    for (var k = 0; k < 6; k++) {
      setVar(varName, fs);
      if (eachState(kinds, function (s) { return panelFits(s); })) break;
      var re = Math.floor(measureGroup(kinds, availH, availW, fs));
      fs = Math.max(8, Math.min(fs - 1, isFinite(re) ? re : fs - 1));
    }
    return fs;
  }

  function computeSizes() {
    var t0 = (window.performance || Date).now();
    document.documentElement.classList.add('measuring');
    try {
      var rect = stage.getBoundingClientRect();
      var W = rect.width, H = rect.height, u = W / 100;
      document.documentElement.style.setProperty('--u', u + 'px');

      var availH = H * PANEL_H - (PAD_T + PAD_B) * u;
      var availW = W - 2 * PAD_X * u;

      // 故事頁（normal + question）：全站所有拍取同一個字級，翻頁不跳動
      var fsA = bestFit(['normal', 'question'], '--fs', availH, availW);
      // 啟發頁、結尾頁有標題／按鈕，內容高度不同，各自一組
      var fsL = bestFit(['lessons'], '--fsL', availH, availW);
      var fsE = bestFit(['end'], '--fsE', availH, availW);

      sizes = { fs: fsA, fsL: fsL, fsE: fsE, stage: [W, H], availH: availH, availW: availW,
                ms: Math.round((window.performance || Date).now() - t0) };
    } finally {
      document.documentElement.classList.remove('measuring');
      restore();
    }
    return sizes;
  }
  var sizes = null;

  /* ---------- 顯示 ---------- */
  function showBeatEl(s, b) {
    for (var i = 0; i < s._beats.length; i++) s._beats[i].classList.toggle('on', i === b);
  }
  function applyLessons(i, b) {
    var s = slides[i];
    if (!s._items) return;
    for (var k = 0; k < s._items.length; k++) {
      s._items[k].classList.toggle('show', k <= b);
      s._items[k].classList.toggle('past', k < b);
    }
  }
  function applyDots(i, b) {
    var s = slides[i];
    if (!s._dots) return;
    for (var k = 0; k < s._dots.length; k++) s._dots[k].classList.toggle('on', k === b);
  }
  function restore() { render(); }

  function render() {
    var s = slides[cur];
    if (s._kind === 'lessons') applyLessons(cur, beat);
    else if (s._beats && s._beats.length) showBeatEl(s, beat);
    applyDots(cur, beat);
    // 其他頁把拍歸零，避免測量後殘留
    for (var i = 0; i < N; i++) {
      if (i === cur) continue;
      var o = slides[i];
      if (o._kind === 'lessons') applyLessons(i, -1);
      else if (o._beats && o._beats.length) showBeatEl(o, 0);
      applyDots(i, 0);
    }
  }

  function loadImg(i) {
    var s = slides[i];
    if (!s || s._img.getAttribute('src')) return;
    s._img.src = s._src;
  }

  function show(i, b) {
    i = Math.max(0, Math.min(N - 1, i));
    if (i !== cur) slides[cur].classList.remove('on');
    cur = i;
    var cnt = beatCount(i);
    beat = b === 'last' ? cnt - 1 : Math.max(0, Math.min(cnt - 1, b || 0));
    render();
    loadImg(cur); loadImg(cur + 1); loadImg(cur - 1);
    slides[cur].classList.add('on');
    counter.textContent = (cur + 1) + ' / ' + N;
    var h = '#p' + (cur + 1);
    if (location.hash !== h) {
      try { history.replaceState(null, '', h); } catch (e) { location.hash = h; }
    }
  }

  function next() {
    if (beat < beatCount(cur) - 1) { beat++; render(); return; }
    if (cur < N - 1) show(cur + 1, 0);
  }
  function prev() {
    if (beat > 0) { beat--; render(); return; }
    if (cur > 0) show(cur - 1, 'last');
  }

  /* ---------- 操作 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var k = e.key, c = e.code;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar' ||
        c === 'Space' || k === 'PageDown' || k === 'Enter') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); show(0, 0); }
    else if (k === 'End') { e.preventDefault(); show(N - 1, 'last'); }
    else if (k === 'f' || k === 'F') { e.preventDefault(); toggleFull(); }
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
      if (e.cancelable) e.preventDefault();
      if (dx < 0) next(); else prev();
    }
  }, { passive: false });

  function toggleFull() {
    try {
      var el = document.documentElement, p;
      if (!document.fullscreenElement) {
        p = (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
      } else {
        p = (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
      }
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* 全螢幕被擋下不影響翻頁 */ }
  }

  window.addEventListener('resize', function () {
    clearTimeout(window.__rt);
    window.__rt = setTimeout(computeSizes, 80);
  });

  window.addEventListener('hashchange', function () {
    var m = /^#p(\d+)$/.exec(location.hash);
    if (m) {
      var n = parseInt(m[1], 10) - 1;
      if (n >= 0 && n < N && n !== cur) show(n, 0);
    }
  });

  /* ---------- 啟動 ---------- */
  function start() {
    var m = /^#p(\d+)$/.exec(location.hash);
    var i = m ? Math.min(N - 1, Math.max(0, parseInt(m[1], 10) - 1)) : 0;
    cur = i; beat = 0;
    computeSizes();
    show(i, 0);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
    setTimeout(function () { if (!sizes) start(); }, 2500);
  } else { start(); }

  /* 測試用 */
  window.__deck = {
    go: function (n, b) { show(n, b || 0); },
    next: next, prev: prev,
    state: function () { return { cur: cur, beat: beat, beats: beatCount(cur), n: N }; },
    sizes: function () { return sizes; },
    recompute: function () { return computeSizes(); },
    beatCount: beatCount,
    slides: slides
  };
})();
