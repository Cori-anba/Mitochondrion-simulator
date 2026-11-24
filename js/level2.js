/* =========================================================
   level2.js — 第二层：嵴 / 内膜上的电子传递链（纯 SVG 绘制）
   ========================================================= */
(function () {
  'use strict';

  const MITO = window.MITO;

  const BLOB = 'M -42 -52 C -12 -70 34 -66 46 -34 C 58 -4 50 30 34 52 C 18 74 -18 78 -36 58 C -54 38 -62 8 -56 -18 C -52 -36 -52 -44 -42 -52 Z';

  const ELEC_D =
    'M 72 505 C 110 480 150 445 185 415 ' +
    'C 260 382 330 377 400 376 ' +
    'C 440 375 480 420 512 427 ' +
    'C 550 436 590 330 612 265 ' +
    'C 630 254 650 280 668 330 ' +
    'C 684 378 694 400 703 412 ' +
    'C 730 440 790 300 812 205';

  const FADH_D = 'M 252 516 C 282 492 306 476 328 458 C 350 432 380 405 402 386';

  const HPLUS = [
    [72, 300], [106, 214], [152, 300], [240, 190], [282, 302], [352, 256],
    [396, 206], [452, 300], [482, 226], [556, 192], [592, 300], [642, 292],
    [682, 216], [722, 300], [762, 252], [802, 300], [846, 220], [922, 270],
    [954, 200], [530, 170], [300, 172], [872, 320], [126, 250], [430, 176],
    [776, 172]
  ];

  function textW(name) {
    let w = 0;
    for (const ch of name) w += /[一-龥]/.test(ch) ? 26 : 14;
    return w + 28;
  }

  function tag(name, x, y, cls) {
    const w = textW(name);
    return '<g class="tag ' + (cls || '') + '" transform="translate(' + x + ' ' + y + ')">' +
      '<rect x="' + (-w / 2) + '" y="-16" width="' + w + '" height="32" rx="16"/>' +
      '<text text-anchor="middle" dominant-baseline="central">' + name + '</text>' +
      '</g>';
  }

  function complexGroup(o) {
    return '<g class="hotspot2" data-part="' + o.id + '" tabindex="0" role="button" aria-label="查看' + o.name + '">' +
      '<use class="blob-shadow" href="#blobShape" transform="translate(' + o.x + ' ' + (o.y + 10) + ') scale(' + o.s + ')" fill="#000" opacity=".4" filter="url(#fBlurS)"/>' +
      '<use class="blob-body" href="#blobShape" transform="translate(' + o.x + ' ' + o.y + ') scale(' + o.s + ')" fill="url(#' + o.grad + ')"/>' +
      '<use class="blob-hi" href="#blobShape" transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.s * 0.82).toFixed(2) + ')" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.3"/>' +
      '<line class="leader" x1="' + o.lx1 + '" y1="' + o.ly1 + '" x2="' + o.lx2 + '" y2="' + o.ly2 + '"/>' +
      tag(o.name, o.tag[0], o.tag[1]) +
      '</g>';
  }

  function buildSvg() {
    const ions = HPLUS.map(function (p, i) {
      return '<circle class="h-ion" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 4 === 0 ? 3.6 : 2.8) + '" style="animation-delay:' + (i * 0.37).toFixed(2) + 's"/>';
    }).join('');

    const electrons =
      [0, 3, 6].map(function (begin) {
        return '<circle class="electron-dot" r="4.2">' +
          '<animateMotion dur="9s" begin="' + begin + 's" repeatCount="indefinite"><mpath href="#electronPath"/></animateMotion>' +
          '</circle>';
      }).join('') +
      '<circle class="electron-dot electron-dot--dim" r="3.2">' +
        '<animateMotion dur="7s" repeatCount="indefinite"><mpath href="#fadhPath"/></animateMotion>' +
      '</circle>';

    const groups =
      complexGroup({ id: 'complex1', name: '复合体Ⅰ', x: 190, y: 375, s: 1.0, grad: 'gBlue', tag: [140, 542], lx1: 150, ly1: 526, lx2: 176, ly2: 442 }) +
      complexGroup({ id: 'complex2', name: '复合体Ⅱ', x: 330, y: 404, s: 0.7, grad: 'gBlue', tag: [330, 542], lx1: 328, ly1: 526, lx2: 330, ly2: 462 }) +
      complexGroup({ id: 'complex3', name: '复合体Ⅲ', x: 520, y: 385, s: 0.95, grad: 'gBlue', tag: [530, 542], lx1: 524, ly1: 526, lx2: 520, ly2: 448 }) +
      complexGroup({ id: 'complex4', name: '复合体Ⅳ', x: 700, y: 390, s: 0.92, grad: 'gBlue', tag: [742, 542], lx1: 736, ly1: 526, lx2: 712, ly2: 448 }) +
      /* 辅酶 Q：脂双层中的移动载体 */
      '<g class="hotspot2" data-part="coq" tabindex="0" role="button" aria-label="查看辅酶Q">' +
        '<g class="coq-mol" filter="url(#fSoftGlow2)">' +
          '<circle cx="398" cy="374" r="5.5" fill="#a8ef7a"/>' +
          '<circle cx="410" cy="368" r="5.5" fill="#a8ef7a"/>' +
          '<circle cx="422" cy="376" r="5.5" fill="#a8ef7a"/>' +
          '<path d="M402 372 L407 370 M415 369 L418 373" stroke="#d8ffbe" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>' +
        '<line class="leader" x1="414" y1="454" x2="412" y2="390"/>' +
        tag('辅酶 Q', 420, 470) +
      '</g>' +
      /* 细胞色素 c：膜间隙中的游离载体 */
      '<g class="hotspot2" data-part="cytc" tabindex="0" role="button" aria-label="查看细胞色素c">' +
        '<g class="cytc-mol" filter="url(#fSoftGlow2)">' +
          '<circle cx="615" cy="255" r="13" fill="url(#gLime)"/>' +
          '<circle cx="611" cy="251" r="4" fill="#e2ffc7" opacity=".75"/>' +
        '</g>' +
        '<line class="leader" x1="640" y1="198" x2="624" y2="240"/>' +
        tag('细胞色素 c', 650, 182) +
      '</g>' +
      /* ATP 合酶 */
      '<g class="hotspot2" data-part="atpsynthase" tabindex="0" role="button" aria-label="查看ATP合酶">' +
        '<rect class="fo-bar" x="874" y="330" width="8" height="92" rx="4" fill="url(#gSynth)"/>' +
        '<rect class="fo-bar" x="898" y="330" width="8" height="92" rx="4" fill="url(#gSynth)"/>' +
        '<rect class="stalk" x="886" y="414" width="8" height="64" rx="4" fill="url(#gSynth)"/>' +
        '<g class="f1" filter="url(#fGlow2)">' +
          '<circle cx="890" cy="500" r="27" fill="url(#gSynth)"/>' +
          '<circle cx="890" cy="500" r="17" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.4"/>' +
          '<path d="M890 500 L890 476 M890 500 L911 488 M890 500 L911 512 M890 500 L890 524 M890 500 L869 512 M890 500 L869 488" stroke="rgba(255,255,255,.45)" stroke-width="1.6" stroke-linecap="round"/>' +
          '<circle cx="890" cy="500" r="4" fill="#eafffb"/>' +
        '</g>' +
        '<path class="h-down" d="M890 240 L890 322 M884 312 L890 324 L896 312"/>' +
        '<text class="h-label" x="904" y="284">H⁺</text>' +
        '<text class="atp-reaction" x="890" y="548" text-anchor="middle">ADP + Pi → ATP</text>' +
        tag('ATP 合酶', 890, 592) +
      '</g>';

    return '' +
      '<svg class="scene scene-2" viewBox="0 0 1000 640" role="group" aria-label="内膜电子传递链示意图">' +
        '<defs>' +
          '<linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#82caff"/><stop offset=".5" stop-color="#3f93da"/><stop offset="1" stop-color="#184a72"/>' +
          '</linearGradient>' +
          '<linearGradient id="gLime" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#d6ffae"/><stop offset=".55" stop-color="#8fdd5f"/><stop offset="1" stop-color="#3d7a2c"/>' +
          '</linearGradient>' +
          '<linearGradient id="gSynth" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#9bf7ec"/><stop offset=".55" stop-color="#36b9b1"/><stop offset="1" stop-color="#11615f"/>' +
          '</linearGradient>' +
          '<linearGradient id="gMembrane" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#0d3038"/><stop offset=".5" stop-color="#08222a"/><stop offset="1" stop-color="#0d3038"/>' +
          '</linearGradient>' +
          '<linearGradient id="gOuterBand" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#5ab8ff" stop-opacity=".05"/><stop offset=".5" stop-color="#5ab8ff" stop-opacity=".16"/><stop offset="1" stop-color="#5ab8ff" stop-opacity=".05"/>' +
          '</linearGradient>' +
          '<radialGradient id="gImsBg" cx=".5" cy=".15" r=".9">' +
            '<stop offset="0" stop-color="#0b2c3a"/><stop offset="1" stop-color="#071820"/>' +
          '</radialGradient>' +
          '<radialGradient id="gMatrixBg" cx=".5" cy=".1" r="1">' +
            '<stop offset="0" stop-color="#0a2429"/><stop offset="1" stop-color="#051216"/>' +
          '</radialGradient>' +
          '<filter id="fBlurS" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>' +
          '<filter id="fGlow2" x="-60%" y="-60%" width="220%" height="220%">' +
            '<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
          '</filter>' +
          '<filter id="fSoftGlow2" x="-60%" y="-60%" width="220%" height="220%">' +
            '<feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
          '</filter>' +
          '<path id="blobShape" d="' + BLOB + '"/>' +
          '<path id="electronPath" d="' + ELEC_D + '" fill="none" stroke="none"/>' +
          '<path id="fadhPath" d="' + FADH_D + '" fill="none" stroke="none"/>' +
          '<pattern id="lipid" width="16" height="86" patternUnits="userSpaceOnUse">' +
            '<circle cx="8" cy="6" r="3.8" fill="#7fe9e0" opacity=".45"/>' +
            '<path d="M6.6 11 C5.2 19 10 23 7.6 32 M9.4 11 C10.8 19 6 23 8.4 32" stroke="#4de0d2" stroke-opacity=".22" stroke-width="1" fill="none"/>' +
            '<circle cx="8" cy="80" r="3.8" fill="#7fe9e0" opacity=".45"/>' +
            '<path d="M6.6 75 C5.2 67 10 63 7.6 54 M9.4 75 C10.8 67 6 63 8.4 54" stroke="#4de0d2" stroke-opacity=".22" stroke-width="1" fill="none"/>' +
          '</pattern>' +
        '</defs>' +

        /* 背景：膜间隙 / 基质 */
        '<rect x="0" y="0" width="1000" height="332" fill="url(#gImsBg)"/>' +
        '<rect x="0" y="418" width="1000" height="222" fill="url(#gMatrixBg)"/>' +

        /* 外侧（远处）的外膜 + 膜间隙标注 */
        '<rect x="0" y="108" width="1000" height="18" fill="url(#gOuterBand)"/>' +
        '<line x1="0" y1="110" x2="1000" y2="110" stroke="#5ab8ff" stroke-opacity=".55" stroke-width="1.6"/>' +
        '<line x1="0" y1="124" x2="1000" y2="124" stroke="#5ab8ff" stroke-opacity=".28" stroke-width="1.2"/>' +

        /* 图例 */
        '<g class="svg-legend">' +
          '<line x1="28" y1="42" x2="62" y2="42" stroke="#8ff4ff" stroke-opacity=".8" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round"/>' +
          '<text x="72" y="42">电子流向</text>' +
          '<circle cx="186" cy="42" r="4.2" fill="#bff6ff"/>' +
          '<text x="198" y="42">H⁺</text>' +
          '<circle cx="258" cy="42" r="4.2" fill="#f5c451"/>' +
          '<text x="270" y="42">ATP</text>' +
        '</g>' +

        /* 区域标注 */
        '<text class="zone-label" x="28" y="92">外膜</text>' +
        '<text class="zone-label" x="28" y="238">膜间隙</text>' +
        '<text class="zone-label" x="972" y="320" text-anchor="end">内膜</text>' +
        '<text class="zone-label" x="28" y="620">基质</text>' +

        /* 内膜磷脂双分子层 */
        '<rect x="0" y="332" width="1000" height="86" fill="url(#gMembrane)"/>' +
        '<rect x="0" y="332" width="1000" height="86" fill="url(#lipid)"/>' +
        '<line x1="0" y1="333" x2="1000" y2="333" stroke="#8cf4e8" stroke-opacity=".65" stroke-width="1.8" filter="url(#fSoftGlow2)"/>' +
        '<line x1="0" y1="417" x2="1000" y2="417" stroke="#8cf4e8" stroke-opacity=".65" stroke-width="1.8" filter="url(#fSoftGlow2)"/>' +

        /* 膜间隙中的 H⁺ */
        '<g class="h-ions">' + ions + '</g>' +

        /* 电子传递链 */
        '<path class="electron-trail" d="' + ELEC_D + '" fill="none" stroke="#8ff4ff" stroke-opacity=".52" stroke-width="1.8" stroke-dasharray="3 8" stroke-linecap="round"/>' +
        '<path class="electron-trail electron-trail--dim" d="' + FADH_D + '" fill="none" stroke="#9ee870" stroke-opacity=".28" stroke-width="1.6" stroke-dasharray="3 8" stroke-linecap="round"/>' +

        /* 底物与产物 */
        '<text class="molecule-label" x="30" y="522">NADH</text>' +
        '<circle cx="58" cy="505" r="5" fill="#8ff4ff" opacity=".8" filter="url(#fSoftGlow2)"/>' +
        '<text class="molecule-label molecule-label--dim" x="234" y="506">FADH₂</text>' +
        '<text class="molecule-label" x="838" y="182">O₂</text>' +
        '<text class="molecule-label molecule-label--gold" x="838" y="208">→ H₂O</text>' +

        /* 质子泵 */
        '<path class="h-up" d="M190 320 L190 270 M184 280 L190 268 L196 280"/>' +
        '<path class="h-up" d="M520 320 L520 270 M514 280 L520 268 L526 280"/>' +
        '<path class="h-up" d="M700 320 L700 270 M694 280 L700 268 L706 280"/>' +
        '<text class="h-pump-label" x="204" y="292">4H⁺</text>' +
        '<text class="h-pump-label" x="534" y="292">4H⁺</text>' +
        '<text class="h-pump-label" x="714" y="292">2H⁺</text>' +

        /* 七个可点击的蛋白质 */
        groups +

        /* 电子（画在蛋白质之上，进入复合体时不被遮住） */
        '<g class="electrons">' + electrons + '</g>' +
      '</svg>';
  }

  MITO.initLevel2 = function () {
    const host = document.getElementById('svg-2');
    const panel = document.getElementById('panel-2');
    if (!host || !panel) return;

    host.innerHTML = buildSvg();
    const root = host.querySelector('svg');
    const groups = Array.from(root.querySelectorAll('.hotspot2'));

    const HINTS = {
      complex1: 'NADH 入口 · 泵 4H⁺',
      complex2: '不泵质子',
      coq: '移动载体',
      complex3: '泵 4H⁺',
      cytc: '移动载体',
      complex4: '终点 · 泵 2H⁺',
      atpsynthase: '质子回流的涡轮'
    };

    function showEmpty() {
      MITO.renderEmpty(panel, {
        title: '点一个“零件”',
        text: '这里展示的是内膜上的电子传递链。每个复合体、每个载体各管一段，右侧会显示它的工作内容。',
        items: MITO.L2.map(function (c) {
          return { id: c.id, index: c.index, name: c.name, hint: HINTS[c.id] || c.en };
        })
      });
    }

    function clear() {
      root.classList.remove('has-selection');
      groups.forEach(function (g) {
        g.classList.remove('is-on');
        g.setAttribute('aria-pressed', 'false');
      });
      showEmpty();
    }

    function select(id) {
      const card = MITO.L2.filter(function (c) { return c.id === id; })[0];
      if (!card) return;
      root.classList.add('has-selection');
      groups.forEach(function (g) {
        const on = g.dataset.part === id;
        g.classList.toggle('is-on', on);
        g.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      MITO.renderCard(panel, card, { type: '电子传递链', onClose: clear });
    }

    groups.forEach(function (g) {
      const id = g.dataset.part;
      g.addEventListener('click', function () { select(id); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(id);
        }
      });
      g.setAttribute('aria-pressed', 'false');
    });

    panel.addEventListener('click', function (e) {
      const b = e.target.closest('[data-part]');
      if (b) select(b.dataset.part);
    });

    showEmpty();
  };
})();
