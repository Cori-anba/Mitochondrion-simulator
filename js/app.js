/* =========================================================
   app.js — 导航、全屏、键盘、知识卡渲染
   ========================================================= */
(function () {
  'use strict';

  const MITO = window.MITO || (window.MITO = {});
  const views = Array.from(document.querySelectorAll('.view'));
  const steps = Array.from(document.querySelectorAll('.step'));
  const callbacks = [];
  const state = { view: 1 };

  /* ---------- 视图切换 ---------- */
  function goView(n, opts) {
    opts = opts || {};
    n = Math.max(1, Math.min(3, Number(n) || 1));
    if (n === state.view && !opts.force) return;
    state.view = n;

    views.forEach(function (v) {
      v.classList.toggle('is-active', Number(v.dataset.viewId) === n);
    });
    steps.forEach(function (s) {
      const on = Number(s.dataset.view) === n;
      s.classList.toggle('is-active', on);
      if (on) s.setAttribute('aria-current', 'step');
      else s.removeAttribute('aria-current');
    });

    if (!opts.silent) {
      try { history.replaceState(null, '', '#step' + n); } catch (e) { /* file:// 下忽略 */ }
    }

    callbacks.forEach(function (fn) { fn(n); });

    const heading = document.querySelector('#view-' + n + ' h1');
    if (heading && opts.focus !== false) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  MITO.goView = goView;
  MITO.onView = function (fn) { callbacks.push(fn); };
  MITO.currentView = function () { return state.view; };

  /* ---------- 知识卡 ---------- */
  function renderCard(panel, card, opts) {
    opts = opts || {};
    const facts = (card.facts || []).map(function (f) {
      return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>';
    }).join('');
    const points = (card.points || []).map(function (p) {
      return '<li>' + p + '</li>';
    }).join('');

    panel.innerHTML =
      '<article class="card" data-tone="' + (card.tone || 'teal') + '">' +
        '<header class="card-head">' +
          '<span class="card-index">' + (card.index || '01') + '</span>' +
          '<span class="card-type">' + (opts.type || '结构') + '</span>' +
          '<button class="card-x" data-card-close aria-label="关闭知识卡">×</button>' +
        '</header>' +
        '<h2 class="card-title">' + card.name + '</h2>' +
        (card.en ? '<p class="card-en">' + card.en + '</p>' : '') +
        (card.tagline ? '<p class="card-tagline">' + card.tagline + '</p>' : '') +
        (card.electron
          ? '<div class="flow-block"><span class="flow-label">' + (card.flowLabel || '电子流向') + '</span><code>' + card.electron + '</code></div>'
          : '') +
        (card.pump
          ? '<div class="pump-block"><span class="pump-label">' + (card.pumpLabel || '质子泵') + '</span><b>' + card.pump + '</b></div>'
          : '') +
        (card.desc ? '<p class="card-desc">' + card.desc + '</p>' : '') +
        (facts ? '<dl class="facts">' + facts + '</dl>' : '') +
        (points ? '<ul class="points">' + points + '</ul>' : '') +
        (card.exam ? '<div class="exam"><span class="exam-label">考点</span><p>' + card.exam + '</p></div>' : '') +
        (card.tip ? '<div class="tip"><span class="tip-label">教学提示</span><p>' + card.tip + '</p></div>' : '') +
        (card.cta ? '<button class="cta" data-view="' + card.cta.view + '"><span>' + card.cta.label + '</span><i aria-hidden="true">→</i></button>' : '') +
      '</article>';

    panel.scrollTop = 0;
    const x = panel.querySelector('[data-card-close]');
    if (x && opts.onClose) x.addEventListener('click', opts.onClose);
  }

  function renderEmpty(panel, opts) {
    const items = (opts.items || []).map(function (it) {
      return '<button class="empty-item" data-part="' + it.id + '">' +
        '<span class="ei-index">' + it.index + '</span>' +
        '<span class="ei-text"><b>' + it.name + '</b>' + (it.hint ? '<small>' + it.hint + '</small>' : '') + '</span>' +
        '<span class="ei-arrow" aria-hidden="true">→</span>' +
      '</button>';
    }).join('');

    panel.innerHTML =
      '<div class="empty">' +
        '<div class="empty-orb" aria-hidden="true"><i></i><i></i><span></span></div>' +
        '<h2>' + opts.title + '</h2>' +
        '<p>' + opts.text + '</p>' +
        (items ? '<div class="empty-list">' + items + '</div>' : '') +
      '</div>';
  }

  MITO.renderCard = renderCard;
  MITO.renderEmpty = renderEmpty;

  /* ---------- 全局点击 ---------- */
  document.addEventListener('click', function (e) {
    const nav = e.target.closest('[data-view]');
    if (nav) {
      e.preventDefault();
      goView(Number(nav.dataset.view));
      return;
    }
    const close = e.target.closest('[data-close]');
    if (close) {
      const dlg = close.closest('dialog');
      if (dlg) dlg.close();
    }
  });

  /* ---------- 全屏 ---------- */
  const fsBtn = document.getElementById('btn-fullscreen');
  const fsLabel = fsBtn ? fsBtn.querySelector('span') : null;
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  function syncFsLabel() {
    if (fsLabel) fsLabel.textContent = document.fullscreenElement ? '退出全屏' : '全屏演示';
  }
  if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', syncFsLabel);

  /* ---------- 机制小结弹窗 ---------- */
  const theoryBtn = document.getElementById('btn-theory');
  const dialog = document.getElementById('theory-dialog');
  if (theoryBtn && dialog) {
    theoryBtn.addEventListener('click', function () {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
  }

  /* ---------- 键盘 ---------- */
  document.addEventListener('keydown', function (e) {
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;

    if (e.key === '1' || e.key === '2' || e.key === '3') {
      goView(Number(e.key));
    } else if (e.key === 'ArrowRight') {
      if (state.view < 3) goView(state.view + 1);
    } else if (e.key === 'ArrowLeft') {
      if (state.view > 1) goView(state.view - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  });

  /* ---------- 深链接 #step2 ---------- */
  function readHash() {
    const m = location.hash.match(/^#step([1-3])$/);
    if (m) goView(Number(m[1]), { silent: true, focus: false });
  }
  window.addEventListener('hashchange', readHash);

  /* ---------- 初始化各层 ---------- */
  if (typeof MITO.initLevel1 === 'function') MITO.initLevel1();
  if (typeof MITO.initLevel2 === 'function') MITO.initLevel2();
  if (typeof MITO.initLevel3 === 'function') MITO.initLevel3();

  const initial = location.hash.match(/^#step([1-3])$/);
  if (initial) {
    goView(Number(initial[1]), { silent: true, force: true, focus: false });
  } else {
    callbacks.forEach(function (fn) { fn(state.view); });
  }
})();
