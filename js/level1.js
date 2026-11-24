/* =========================================================
   level1.js — 第一层：线粒体剖面（纯 SVG 绘制）
   ========================================================= */
(function () {
  'use strict';

  const MITO = window.MITO;

  const OUTER = 'M 132 328 C 132 196 268 142 512 142 C 760 142 892 202 896 328 C 892 454 760 514 512 514 C 268 514 132 460 132 328 Z';
  const INNER = 'M 156 328 C 156 212 282 162 512 162 C 748 162 870 216 874 328 C 870 440 748 496 512 496 C 282 496 156 444 156 328 Z';

  /* 标注位置：dot = 圆点，chip = 标签中心，leader = 引线起止 */
  const PINS = {
    outer:  { dot: [250, 177], chip: [150, 78],  leader: [150, 94, 241, 169] },
    ims:    { dot: [400, 159], chip: [400, 78],  leader: [400, 94, 400, 150] },
    crista: { dot: [610, 320], chip: [632, 78],  leader: [632, 94, 616, 307] },
    matrix: { dot: [235, 420], chip: [170, 572], leader: [170, 556, 228, 432] },
    inner:  { dot: [760, 464], chip: [840, 572], leader: [840, 556, 769, 472] }
  };

  const DUST = [
    [82, 176], [944, 248], [58, 486], [952, 528], [308, 58],
    [716, 40], [500, 606], [912, 612], [60, 96], [966, 92],
    [846, 124], [122, 614]
  ];

  const TOP_FOLDS = [292, 448, 604, 760];
  const BOTTOM_FOLDS = [370, 526, 682];

  function tag(name, x, y) {
    const w = name.length * 26 + 26;
    return '<g class="tag" transform="translate(' + x + ' ' + y + ')">' +
      '<rect x="' + (-w / 2) + '" y="-16" width="' + w + '" height="32" rx="16"/>' +
      '<text text-anchor="middle" dominant-baseline="central">' + name + '</text>' +
      '</g>';
  }

  function hotspot(id, name) {
    const p = PINS[id];
    return '<g class="hotspot" data-part="' + id + '" tabindex="0" role="button" aria-label="查看' + name + '">' +
      '<line class="leader" x1="' + p.leader[0] + '" y1="' + p.leader[1] + '" x2="' + p.leader[2] + '" y2="' + p.leader[3] + '"/>' +
      '<circle class="halo" cx="' + p.dot[0] + '" cy="' + p.dot[1] + '" r="15"/>' +
      '<circle class="halo halo--2" cx="' + p.dot[0] + '" cy="' + p.dot[1] + '" r="15"/>' +
      '<circle class="dot" cx="' + p.dot[0] + '" cy="' + p.dot[1] + '" r="5.5"/>' +
      tag(name, p.chip[0], p.chip[1]) +
      '<circle class="hit" cx="' + p.dot[0] + '" cy="' + p.dot[1] + '" r="28"/>' +
      '</g>';
  }

  function fold(cx, y, h) {
    return '<rect class="fold" x="' + (cx - 31) + '" y="' + y + '" width="62" height="' + h + '" rx="31"/>';
  }

  function beads(cx, y) {
    let s = '';
    for (let i = -1; i <= 1; i++) {
      s += '<circle class="bead" cx="' + (cx + i * 17) + '" cy="' + y + '" r="2.4"/>';
    }
    return s;
  }

  function buildSvg() {
    const folds =
      TOP_FOLDS.map(function (cx) { return fold(cx, 158, 208) + beads(cx, 350); }).join('') +
      BOTTOM_FOLDS.map(function (cx) { return fold(cx, 338, 176) + beads(cx, 353); }).join('');

    const dust = DUST.map(function (d, i) {
      return '<circle class="dust" cx="' + d[0] + '" cy="' + d[1] + '" r="' + (i % 3 === 0 ? 2.2 : 1.5) + '" style="animation-delay:' + (i * 0.7).toFixed(1) + 's"/>';
    }).join('');

    const pins = [
      hotspot('outer', '外膜'),
      hotspot('inner', '内膜'),
      hotspot('crista', '嵴'),
      hotspot('matrix', '基质'),
      hotspot('ims', '膜间隙')
    ].join('');

    return '' +
      '<svg class="scene scene-1" viewBox="0 0 1000 640" role="group" aria-label="线粒体剖面结构示意图">' +
        '<defs>' +
          '<linearGradient id="gOuterM" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#2c7fa6"/><stop offset=".45" stop-color="#5fd8e8"/><stop offset="1" stop-color="#2f9fb5"/>' +
          '</linearGradient>' +
          '<linearGradient id="gInnerM" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#8cf4e8"/><stop offset=".5" stop-color="#4de0d2"/><stop offset="1" stop-color="#2fb7b0"/>' +
          '</linearGradient>' +
          '<linearGradient id="gIms" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#12505d"/><stop offset=".5" stop-color="#0e3f4b"/><stop offset="1" stop-color="#12505d"/>' +
          '</linearGradient>' +
          '<radialGradient id="gMatrix" cx=".42" cy=".42" r=".72">' +
            '<stop offset="0" stop-color="#0e2f34"/><stop offset=".65" stop-color="#0a2128"/><stop offset="1" stop-color="#061419"/>' +
          '</radialGradient>' +
          '<linearGradient id="gFold" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#4de0d2" stop-opacity=".21"/>' +
            '<stop offset=".55" stop-color="#4de0d2" stop-opacity=".12"/>' +
            '<stop offset="1" stop-color="#4de0d2" stop-opacity=".04"/>' +
          '</linearGradient>' +
          '<radialGradient id="gHalo">' +
            '<stop offset="0" stop-color="#228c96" stop-opacity=".38"/>' +
            '<stop offset=".55" stop-color="#14606c" stop-opacity=".16"/>' +
            '<stop offset="1" stop-color="#0a2a33" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<filter id="fBlur" x="-30%" y="-30%" width="160%" height="160%">' +
            '<feGaussianBlur stdDeviation="26"/>' +
          '</filter>' +
          '<filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%">' +
            '<feGaussianBlur stdDeviation="7" result="b"/>' +
            '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
          '</filter>' +
          '<filter id="fSoftGlow" x="-50%" y="-50%" width="200%" height="200%">' +
            '<feGaussianBlur stdDeviation="3.2" result="b"/>' +
            '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
          '</filter>' +
          '<clipPath id="clipInner"><path d="' + INNER + '"/></clipPath>' +
        '</defs>' +

        /* 背景光晕与浮尘 */
        '<ellipse class="organelle-glow" cx="512" cy="330" rx="440" ry="240" fill="url(#gHalo)" filter="url(#fBlur)"/>' +
        '<g class="dust-layer" aria-hidden="true">' + dust + '</g>' +

        /* 膜间隙（内外膜之间的环形区域） */
        '<path class="structure ims-ring" data-struct="ims" d="' + OUTER + ' ' + INNER + '" fill-rule="evenodd" fill="url(#gIms)"/>' +

        /* 基质底色 */
        '<path class="base matrix-fill" data-struct="matrix" d="' + INNER + '" fill="url(#gMatrix)"/>' +

        /* 嵴（被内膜轮廓裁剪） */
        '<g class="structure folds" data-struct="crista" clip-path="url(#clipInner)">' + folds + '</g>' +

        /* 两层膜轮廓 */
        '<path class="structure membrane-outer" data-struct="outer" d="' + OUTER + '" fill="none" stroke="url(#gOuterM)" stroke-width="2.6" filter="url(#fSoftGlow)"/>' +
        '<path class="structure membrane-inner" data-struct="inner" d="' + INNER + '" fill="none" stroke="url(#gInnerM)" stroke-width="2.6" filter="url(#fSoftGlow)"/>' +

        /* 基质内容：线粒体 DNA（环状）与核糖体 */
        '<g class="matrix-content" aria-hidden="true">' +
          '<g class="dna" filter="url(#fGlow)">' +
            '<circle cx="205" cy="300" r="18"/>' +
            '<circle cx="205" cy="300" r="11" opacity=".45"/>' +
            '<path d="M 191 292 c 8 -8 20 8 28 0"/>' +
            '<circle cx="825" cy="332" r="17"/>' +
            '<circle cx="825" cy="332" r="10.5" opacity=".45"/>' +
            '<path d="M 812 325 c 8 -8 18 8 26 0"/>' +
          '</g>' +
          '<g class="ribosomes" fill="#f5c451">' +
            '<circle cx="204" cy="382" r="2.6"/><circle cx="217" cy="401" r="2.2"/><circle cx="194" cy="409" r="2"/><circle cx="224" cy="418" r="1.8"/>' +
            '<circle cx="812" cy="392" r="2.6"/><circle cx="828" cy="411" r="2.2"/><circle cx="806" cy="424" r="2"/><circle cx="836" cy="430" r="1.8"/>' +
          '</g>' +
        '</g>' +

        /* 标注与热区 */
        '<g class="pins">' + pins + '</g>' +
      '</svg>';
  }

  MITO.initLevel1 = function () {
    const host = document.getElementById('svg-1');
    const panel = document.getElementById('panel-1');
    if (!host || !panel) return;

    host.innerHTML = buildSvg();
    const root = host.querySelector('svg');
    const hotspots = Array.from(root.querySelectorAll('.hotspot'));
    const structures = Array.from(root.querySelectorAll('[data-struct]'));

    function litStruct(id, cls, on) {
      structures.forEach(function (s) {
        if (s.dataset.struct === id) s.classList.toggle(cls, on);
      });
    }

    function showEmpty() {
      MITO.renderEmpty(panel, {
        title: '选择一个结构',
        text: '把鼠标移到图上，或点击发光标记，右侧会显示它的结构与功能。',
        items: MITO.L1.map(function (c) {
          return { id: c.id, index: c.index, name: c.name, hint: c.en };
        })
      });
    }

    function clear() {
      root.classList.remove('has-selection');
      hotspots.forEach(function (g) {
        g.classList.remove('is-on');
        g.setAttribute('aria-pressed', 'false');
      });
      structures.forEach(function (s) { s.classList.remove('is-lit'); });
      showEmpty();
    }

    function select(id) {
      const card = MITO.L1.filter(function (c) { return c.id === id; })[0];
      if (!card) return;
      root.classList.add('has-selection');
      hotspots.forEach(function (g) {
        const on = g.dataset.part === id;
        g.classList.toggle('is-on', on);
        g.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      structures.forEach(function (s) {
        s.classList.toggle('is-lit', s.dataset.struct === id);
      });
      MITO.renderCard(panel, card, { type: '结构', onClose: clear });
    }

    hotspots.forEach(function (g) {
      const id = g.dataset.part;
      g.addEventListener('click', function () { select(id); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(id);
        }
      });
      g.addEventListener('mouseenter', function () { litStruct(id, 'is-hover', true); });
      g.addEventListener('mouseleave', function () { litStruct(id, 'is-hover', false); });
      g.setAttribute('aria-pressed', 'false');
    });

    panel.addEventListener('click', function (e) {
      const b = e.target.closest('[data-part]');
      if (b) select(b.dataset.part);
    });

    showEmpty();

    /* 供其他脚本调用 */
    MITO.level1Select = select;
    MITO.level1Clear = clear;
  };
})();
