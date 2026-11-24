/* =========================================================
   level3.js — 第三层：化学渗透实时模拟
   规则模型（非定量）：质子泵 → 梯度 → 回流 → 转子 → ATP
   ========================================================= */
(function () {
  'use strict';

  const MITO = window.MITO;
  const TAU = Math.PI * 2;

  const PUMP_K = 30;     // 满泵、满供体时的泵出速率（质子/秒）
  const RETURN_K = 55;   // 回流系数
  const LEAK_K = 220;    // 漏回系数
  const HILL = 1.5;
  const POOL = 130;      // 质子总数（示意）

  MITO.initLevel3 = function () {
    const canvas = document.getElementById('sim-canvas');
    const stage = canvas ? canvas.parentElement : null;
    if (!canvas || !stage) return;

    const ctx = canvas.getContext('2d');
    const pumpEl = document.getElementById('pump');
    const pumpVal = document.getElementById('pump-val');
    const segs = Array.from(document.querySelectorAll('.seg'));
    const presetsEl = document.getElementById('presets');
    const noteEl = document.getElementById('note');
    const feedbackEl = document.getElementById('feedback-text');
    const causeEl = document.getElementById('cause-chain');
    const statG = document.getElementById('stat-gradient');
    const statR = document.getElementById('stat-rotor');
    const statA = document.getElementById('stat-atp');
    const atpRateEl = document.getElementById('atp-rate');
    const meterG = document.getElementById('meter-gradient');
    const meterR = document.getElementById('meter-rotor');
    const meterA = document.getElementById('meter-atp');
    const resetBtn = document.getElementById('btn-reset');

    const state = { pump: 100, donor: 'high', leak: 'intact', synthase: 'normal' };

    let w = 0, h = 0, dpr = 1;
    let geo = null;
    let protons = [];
    let atps = [];
    let ripples = [];
    let pumpAcc = 0, returnAcc = 0, leakAcc = 0;
    let atpCounter = 0;
    let pumpPhase = 0;
    let running = false;
    let rafId = null;
    let lastTs = 0;
    let lastReadoutTs = 0;
    let lastChainSig = '';
    let lastFeedback = '';
    let presetBtns = [];

    const M = {
      g: 0, gSmooth: 0,
      flow: 0, flowSmooth: 0,
      omega: 0
    };

    /* ---------------- 几何 ---------------- */
    function computeGeo() {
      geo = {
        memTop: h * 0.40,
        memBot: h * 0.55,
        imsTop: h * 0.09,
        pumps: [0.10, 0.19, 0.28].map(function (f) { return f * w; }),
        rotors: [0.56, 0.70, 0.84].map(function (f) { return f * w; }),
        holes: [0.36, 0.475].map(function (f) { return f * w; }),
        lipids: [],
        angles: [0, 0, 0]
      };
      for (let x = 8; x < w; x += 16) geo.lipids.push(x);
    }

    function imsZone() { return { top: geo.imsTop + 26, bot: geo.memTop - 26 }; }
    function matrixZone() { return { top: geo.memBot + 26, bot: h - 12 }; }

    function initProtons() {
      if (protons.length) {
        protons.forEach(function (p) {
          p.x = Math.min(Math.max(p.x, 8), w - 8);
          const z = p.st === 'ims' ? imsZone() : matrixZone();
          p.y = Math.min(Math.max(p.y, z.top), z.bot);
        });
        return;
      }
      const z = matrixZone();
      for (let i = 0; i < POOL; i++) {
        protons.push({
          x: 10 + Math.random() * (w - 20),
          y: z.top + Math.random() * (z.bot - z.top),
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.5) * 12,
          st: 'matrix',
          t: 0, dur: 1,
          x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0
        });
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      w = rect.width; h = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeGeo();
      initProtons();
    }

    /* ---------------- 粒子状态机 ---------------- */
    function qbez(p, t) {
      const it = 1 - t;
      return {
        x: it * it * p.x0 + 2 * it * t * p.cx + t * t * p.x1,
        y: it * it * p.y0 + 2 * it * t * p.cy + t * t * p.y1
      };
    }

    function pick(list, st) {
      const pool = protons.filter(function (p) { return p.st === st; });
      if (!pool.length) return null;
      return pool[(Math.random() * pool.length) | 0];
    }

    function launch(p, st, x1, y1, cx, cy, dur) {
      p.st = st;
      p.t = 0;
      p.dur = dur;
      p.x0 = p.x; p.y0 = p.y;
      p.x1 = x1; p.y1 = y1;
      p.cx = cx; p.cy = cy;
    }

    function spawnUp() {
      const p = pick(null, 'matrix');
      if (!p) return false;
      const px = geo.pumps[(Math.random() * geo.pumps.length) | 0];
      const y1 = geo.memTop - 34 - Math.random() * 44;
      launch(p, 'up', px + (Math.random() - 0.5) * 16, y1, px, p.y - 26, 0.85 + Math.random() * 0.25);
      return true;
    }

    function spawnDown() {
      const p = pick(null, 'ims');
      if (!p) return false;
      const i = (Math.random() * geo.rotors.length) | 0;
      const rx = geo.rotors[i];
      const y1 = geo.memBot + 66 + Math.random() * 40;
      launch(p, 'down', rx + (Math.random() - 0.5) * 14, y1, rx, p.y + 26, 0.8 + Math.random() * 0.2);
      p.rotor = i;
      return true;
    }

    function spawnLeak() {
      const p = pick(null, 'ims');
      if (!p) return false;
      const hx = geo.holes[(Math.random() * geo.holes.length) | 0];
      const y1 = geo.memBot + 34 + Math.random() * 30;
      launch(p, 'leak', hx + (Math.random() - 0.5) * 18, y1, hx, p.y + 26, 0.7 + Math.random() * 0.2);
      p.hole = hx;
      return true;
    }

    function arrive(p) {
      if (p.st === 'up') {
        p.st = 'ims';
        const dir = Math.random() < 0.5 ? -1 : 1;
        p.vx = dir * (22 + Math.random() * 34);
        p.vy = (Math.random() - 0.5) * 18;
      } else if (p.st === 'down') {
        p.st = 'matrix';
        p.vx = (Math.random() - 0.5) * 30;
        p.vy = (Math.random() - 0.5) * 18;
        atpCounter++;
        if (atpCounter % 3 === 0) {
          atps.push({
            x: geo.rotors[p.rotor] + (Math.random() - 0.5) * 30,
            y: geo.memBot + 88 + Math.random() * 24,
            vx: (Math.random() < 0.5 ? -1 : 1) * (34 + Math.random() * 50),
            vy: 16 + Math.random() * 18,
            age: 0,
            life: 1.9
          });
          if (atps.length > 22) atps.shift();
        }
      } else if (p.st === 'leak') {
        p.st = 'matrix';
        p.vx = (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 40);
        p.vy = 8 + Math.random() * 22;
        if (atpCounter % 3 === 0) {
          ripples.push({
            x: p.hole + (Math.random() - 0.5) * 26,
            y: (geo.memTop + geo.memBot) / 2,
            r: 4,
            a: 0.6
          });
          if (ripples.length > 10) ripples.shift();
        }
      }
    }

    function advance(p, dt) {
      if (p.st === 'up' || p.st === 'down' || p.st === 'leak') {
        p.t += dt / p.dur;
        if (p.t >= 1) {
          p.x = p.x1; p.y = p.y1;
          arrive(p);
        } else {
          const q = qbez(p, p.t);
          p.x = q.x; p.y = q.y;
        }
        return;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const z = p.st === 'ims' ? imsZone() : matrixZone();
      if (p.x < 8) { p.x = 8; p.vx = Math.abs(p.vx); }
      if (p.x > w - 8) { p.x = w - 8; p.vx = -Math.abs(p.vx); }
      if (p.y < z.top) { p.y = z.top; p.vy = Math.abs(p.vy); }
      if (p.y > z.bot) { p.y = z.bot; p.vy = -Math.abs(p.vy); }
    }

    /* ---------------- 物理步进 ---------------- */
    function step(dt) {
      const donorFactor = state.donor === 'low' ? 0.25 : 1;
      const pumpStrength = state.pump / 100;
      const pumpRate = PUMP_K * pumpStrength * donorFactor;
      const leaky = state.leak === 'leaky';
      const inhibited = state.synthase === 'inhibited';

      let imsCount = 0, matCount = 0;
      for (let i = 0; i < protons.length; i++) {
        const st = protons[i].st;
        if (st === 'ims') imsCount++;
        else if (st === 'matrix') matCount++;
      }
      const base = imsCount + matCount;
      const gVal = base ? imsCount / base : 0;
      M.g = gVal;

      const returnRate = (leaky || inhibited) ? 0 : RETURN_K * Math.pow(gVal, HILL);
      const leakRate = leaky ? LEAK_K * gVal : 0;

      M.flow += (returnRate - M.flow) * Math.min(1, dt * 8);

      pumpAcc = Math.min(pumpAcc + pumpRate * dt, 2);
      returnAcc = Math.min(returnAcc + returnRate * dt, 2);
      leakAcc = Math.min(leakAcc + leakRate * dt, 2);

      while (pumpAcc >= 1) {
        if (!spawnUp()) { pumpAcc = 0; break; }
        pumpAcc -= 1;
      }
      while (returnAcc >= 1) {
        if (!spawnDown()) { returnAcc = 0; break; }
        returnAcc -= 1;
      }
      while (leakAcc >= 1) {
        if (!spawnLeak()) { leakAcc = 0; break; }
        leakAcc -= 1;
      }

      pumpPhase += dt * (3 + pumpStrength * 26);

      const omegaTarget = (leaky || inhibited) ? 0 : M.flow * 0.12;
      M.omega += (omegaTarget - M.omega) * Math.min(1, dt * 2.6);
      if (geo) {
        for (let i = 0; i < geo.angles.length; i++) {
          geo.angles[i] += M.omega * dt * (0.88 + i * 0.07);
        }
      }
    }

    /* ---------------- 绘制工具 ---------------- */
    function rr(x, y, ww, hh, r) {
      const radius = Math.min(r, ww / 2, hh / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + ww - radius, y);
      ctx.quadraticCurveTo(x + ww, y, x + ww, y + radius);
      ctx.lineTo(x + ww, y + hh - radius);
      ctx.quadraticCurveTo(x + ww, y + hh, x + ww - radius, y + hh);
      ctx.lineTo(x + radius, y + hh);
      ctx.quadraticCurveTo(x, y + hh, x, y + hh - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    function dot(x, y, r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }

    function label(text, x, y, color, align) {
      ctx.font = '600 13px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = align || 'left';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(4,14,18,.85)';
      ctx.strokeText(text, x, y);
      ctx.fillStyle = color || 'rgba(166,193,202,.85)';
      ctx.fillText(text, x, y);
    }

    /* ---------------- 绘制 ---------------- */
    function drawBg() {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#081d29');
      g.addColorStop(0.38, '#081a24');
      g.addColorStop(0.56, '#07141c');
      g.addColorStop(1, '#04100f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const rg = ctx.createRadialGradient(w * 0.28, h * 0.16, 0, w * 0.28, h * 0.16, Math.max(w, h) * 0.55);
      rg.addColorStop(0, 'rgba(77,224,210,.10)');
      rg.addColorStop(1, 'rgba(77,224,210,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }

    function drawOuterMembrane() {
      const y = geo.imsTop;
      const band = ctx.createLinearGradient(0, y - 8, 0, y + 8);
      band.addColorStop(0, 'rgba(90,184,255,.03)');
      band.addColorStop(0.5, 'rgba(90,184,255,.14)');
      band.addColorStop(1, 'rgba(90,184,255,.03)');
      ctx.fillStyle = band;
      ctx.fillRect(0, y - 8, w, 16);
      ctx.strokeStyle = 'rgba(90,184,255,.42)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(w, y);
      ctx.stroke();
    }

    function drawInnerMembrane() {
      const top = geo.memTop, bot = geo.memBot;
      const g = ctx.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, '#0b2b34');
      g.addColorStop(0.5, '#071d24');
      g.addColorStop(1, '#0b2b34');
      ctx.fillStyle = g;
      ctx.fillRect(0, top, w, bot - top);

      ctx.fillStyle = 'rgba(127,233,224,.22)';
      for (let i = 0; i < geo.lipids.length; i++) {
        const x = geo.lipids[i];
        dot(x, top + 5, 1.9);
        dot(x, bot - 5, 1.9);
      }

      ctx.save();
      ctx.shadowColor = 'rgba(140,244,232,.5)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(140,244,232,.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, top); ctx.lineTo(w, top);
      ctx.moveTo(0, bot); ctx.lineTo(w, bot);
      ctx.stroke();
      ctx.restore();
    }

    function drawETC() {
      const top = geo.memTop, bot = geo.memBot;
      const band = bot - top;

      for (let i = 0; i < geo.pumps.length; i++) {
        const x = geo.pumps[i];
        const grad = ctx.createLinearGradient(x - 20, 0, x + 20, 0);
        grad.addColorStop(0, '#2a6f9d');
        grad.addColorStop(0.45, '#5fa9dd');
        grad.addColorStop(1, '#173f5c');
        rr(x - 19, top - 20, 38, band + 46, 18);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(150,220,255,.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        rr(x - 12, top - 10, 7, band + 24, 4);
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.fill();

        /* 泵质子：动画虚线向上 */
        ctx.save();
        ctx.strokeStyle = 'rgba(140,244,232,.5)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([5, 8]);
        ctx.lineDashOffset = -pumpPhase;
        ctx.beginPath();
        ctx.moveTo(x, bot + 10);
        ctx.lineTo(x, top - 30);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = 'rgba(180,250,240,.8)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x - 5, top - 24); ctx.lineTo(x, top - 32); ctx.lineTo(x + 5, top - 24);
        ctx.stroke();
      }

      label('电子传递链', geo.pumps[1], bot + 44, 'rgba(140,220,238,.8)', 'center');
    }

    function drawHoles() {
      const top = geo.memTop, bot = geo.memBot;
      const cy = (top + bot) / 2;
      for (let i = 0; i < geo.holes.length; i++) {
        const hx = geo.holes[i];
        const glow = ctx.createRadialGradient(hx, cy, 2, hx, cy, 34);
        glow.addColorStop(0, 'rgba(255,139,114,.2)');
        glow.addColorStop(1, 'rgba(255,139,114,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(hx - 36, top - 26, 72, (bot - top) + 52);

        ctx.fillStyle = '#04121a';
        ctx.fillRect(hx - 9, top - 1, 18, bot - top + 2);

        ctx.strokeStyle = 'rgba(255,139,114,.62)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(hx - 9, top); ctx.lineTo(hx - 9, bot);
        ctx.moveTo(hx + 9, top); ctx.lineTo(hx + 9, bot);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    function drawRotors() {
      const top = geo.memTop, bot = geo.memBot;
      const band = bot - top;

      for (let i = 0; i < geo.rotors.length; i++) {
        const x = geo.rotors[i];
        const f1y = bot + 62;

        /* Fo 质子通道 */
        const ch = ctx.createLinearGradient(0, top, 0, bot);
        ch.addColorStop(0, '#9bf7ec');
        ch.addColorStop(0.5, '#36b9b1');
        ch.addColorStop(1, '#0f5b58');
        ctx.fillStyle = ch;
        rr(x - 17, top + 3, 8, band - 6, 4); ctx.fill();
        rr(x + 9, top + 3, 8, band - 6, 4); ctx.fill();

        /* 中央轴 */
        rr(x - 3.5, bot - 4, 7, 42, 3.5);
        ctx.fillStyle = '#2aa9a2';
        ctx.fill();

        /* F1 头部 */
        const rg = ctx.createRadialGradient(x - 8, f1y - 8, 2, x, f1y, 26);
        rg.addColorStop(0, '#b6fbf2');
        rg.addColorStop(0.55, '#3cc2b9');
        rg.addColorStop(1, '#0d5451');
        ctx.save();
        ctx.shadowColor = 'rgba(77,224,210,.45)';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(x, f1y, 24, 0, TAU);
        ctx.fillStyle = rg;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(190,255,246,.45)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        /* 旋转辐条 */
        const a = geo.angles[i];
        ctx.strokeStyle = 'rgba(255,255,255,.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const th = a + k * Math.PI / 3;
          ctx.moveTo(x, f1y);
          ctx.lineTo(x + Math.cos(th) * 21, f1y + Math.sin(th) * 21);
        }
        ctx.stroke();
        ctx.fillStyle = '#eafffb';
        dot(x, f1y, 3.6);
      }

      label('ATP 合酶', geo.rotors[1], top - 18, 'rgba(140,220,238,.8)', 'center');
    }

    function drawProtons() {
      for (let i = 0; i < protons.length; i++) {
        const p = protons[i];
        ctx.fillStyle = 'rgba(150,240,255,.16)';
        dot(p.x, p.y, 7);
        ctx.fillStyle = '#d8fbff';
        dot(p.x, p.y, 2.5);
      }
    }

    function drawAtps() {
      for (let i = 0; i < atps.length; i++) {
        const a = atps[i];
        const alpha = Math.min(1, (a.life - a.age) / 0.7) * Math.min(1, a.age / 0.15);
        ctx.globalAlpha = Math.max(0, alpha);

        ctx.fillStyle = 'rgba(245,196,81,.16)';
        dot(a.x, a.y, 13);
        rr(a.x - 18, a.y - 8, 36, 16, 8);
        ctx.fillStyle = 'rgba(245,196,81,.16)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(245,196,81,.65)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#f5c451';
        ctx.font = '700 9px ui-monospace,Consolas,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ATP', a.x, a.y + 0.5);
        ctx.globalAlpha = 1;
      }
    }

    function drawRipples() {
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        ctx.strokeStyle = 'rgba(255,139,114,' + r.a.toFixed(3) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, TAU);
        ctx.stroke();
      }
    }

    function drawLabels() {
      label('膜间隙', 16, geo.imsTop + 34);
      label('基质', 16, h - 16);
      label('内膜', w - 16, geo.memTop - 10, 'rgba(140,220,238,.75)', 'right');
      label('外膜', 16, geo.imsTop - 16);
    }

    function draw() {
      if (!w || !geo) return;
      ctx.clearRect(0, 0, w, h);
      drawBg();
      drawOuterMembrane();
      drawInnerMembrane();
      drawETC();
      if (state.leak === 'leaky') drawHoles();
      drawRotors();
      drawProtons();
      drawAtps();
      drawRipples();
      drawLabels();

      /* 抑制状态：在合酶上画一条“堵住”标记 */
      if (state.synthase === 'inhibited') {
        for (let i = 0; i < geo.rotors.length; i++) {
          const x = geo.rotors[i];
          const y = geo.memTop + 4;
          ctx.strokeStyle = 'rgba(255,139,114,.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 12, y - 4); ctx.lineTo(x + 12, y + 12);
          ctx.moveTo(x + 12, y - 4); ctx.lineTo(x - 12, y + 12);
          ctx.stroke();
        }
      }
    }

    /* ---------------- 读数与文案 ---------------- */
    function gradientLabel(g) {
      if (g >= 0.52) return '高';
      if (g >= 0.30) return '中';
      if (g >= 0.06) return '低';
      return '无';
    }

    function chainStatus(g, flow, atp) {
      const s = ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'];
      if (state.donor === 'low') s[0] = 'weak';
      if (state.pump === 0) s[1] = 'broken';
      else if (state.pump < 70) s[1] = 'weak';

      if (g < 0.06) s[2] = 'broken';
      else if (g < 0.30) s[2] = 'weak';

      if (state.leak === 'leaky' || state.synthase === 'inhibited') s[3] = 'broken';
      else if (g < 0.30) s[3] = 'weak';

      if (state.leak === 'leaky' || state.synthase === 'inhibited') s[4] = 'broken';
      else if (flow < 18) s[4] = 'weak';

      if (state.leak === 'leaky' || state.synthase === 'inhibited') s[5] = 'broken';
      else if (atp < 7) s[5] = 'weak';
      return s;
    }

    function renderChain(status) {
      const sig = status.join(',');
      if (sig === lastChainSig) return;
      lastChainSig = sig;
      const names = ['电子供体', '质子泵', '质子梯度', '质子回流', '转子', 'ATP'];
      const firstBreak = status.indexOf('broken');
      let html = '<span class="cause-label">因果链</span><div class="cause-steps">';
      for (let i = 0; i < names.length; i++) {
        html += '<span class="cause-step is-' + status[i] + (i === firstBreak ? ' is-break' : '') + '">' + names[i] + '</span>';
        if (i < names.length - 1) html += '<i class="cause-arrow" aria-hidden="true">→</i>';
      }
      html += '</div>';
      causeEl.innerHTML = html;
    }

    function feedbackText(g) {
      if (state.leak === 'leaky' && state.synthase === 'inhibited') {
        return '涡轮机被堵住，内膜上又有孔：质子从孔里直接漏回基质，梯度同样维持不住，ATP 产量为零。';
      }
      if (state.leak === 'leaky') {
        return '内膜有孔，质子直接漏回基质，绕过了涡轮机——梯度被“短路”，能量变成热，ATP 产量为零。';
      }
      if (state.synthase === 'inhibited') {
        return '质子被泵到膜间隙，却被堵死的涡轮机挡住去路——梯度越积越高，但没有一个 ATP 被合成。';
      }
      if (state.pump === 0) {
        return '质子泵停转，膜间隙里的质子顺着梯度回流、逐渐耗尽，涡轮机也随之停转。';
      }
      if (state.donor === 'low') {
        return '电子供体不足：泵出的质子变少，梯度变小，回流变慢，ATP 产量下降。';
      }
      if (state.pump < 70) {
        return '质子泵活性降低：跨膜梯度变小，回流速度和 ATP 产量一起下降。';
      }
      if (g < 0.3) {
        return '梯度还在建立：质子正被泵入膜间隙，稍等片刻观察回流与 ATP 的变化。';
      }
      return '电子供体充足、泵送正常：质子被持续泵到膜间隙，再经涡轮机回流，ATP 稳定合成。';
    }

    function setFeedback(text) {
      if (text === lastFeedback) return;
      lastFeedback = text;
      feedbackEl.textContent = text;
    }

    function refreshReadouts() {
      const g = M.gSmooth;
      const flow = M.flowSmooth;
      const atp = flow / 3;

      const gl = gradientLabel(g);
      const rl = flow >= 18 ? '快' : flow >= 2 ? '慢' : '停';
      const al = atp >= 7 ? '高' : atp >= 0.6 ? '低' : '零';

      statG.textContent = gl;
      statR.textContent = rl;
      statA.textContent = al;
      atpRateEl.textContent = atp.toFixed(1) + ' /s';

      statG.dataset.level = gl === '高' ? 'high' : gl === '无' ? 'none' : gl === '低' ? 'low' : 'mid';
      statR.dataset.level = rl === '快' ? 'high' : rl === '停' ? 'none' : 'mid';
      statA.dataset.level = al === '高' ? 'high' : al === '零' ? 'none' : 'mid';

      meterG.style.width = Math.max(0, Math.min(100, g * 100)).toFixed(1) + '%';
      meterR.style.width = Math.max(0, Math.min(100, flow / 30 * 100)).toFixed(1) + '%';
      meterA.style.width = Math.max(0, Math.min(100, atp / 12 * 100)).toFixed(1) + '%';

      renderChain(chainStatus(g, flow, atp));
      setFeedback(feedbackText(g));
    }

    /* ---------------- 主循环 ---------------- */
    function update(dt) {
      step(dt);
      for (let i = 0; i < protons.length; i++) advance(protons[i], dt);

      for (let i = atps.length - 1; i >= 0; i--) {
        const a = atps[i];
        a.age += dt;
        a.x += (a.vx + Math.sin(a.age * 3) * 12) * dt;
        a.y += a.vy * dt;
        if (a.age >= a.life) atps.splice(i, 1);
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += 34 * dt;
        r.a -= 1.4 * dt;
        if (r.a <= 0) ripples.splice(i, 1);
      }

      let ims = 0, mat = 0;
      for (let i = 0; i < protons.length; i++) {
        if (protons[i].st === 'ims') ims++;
        else if (protons[i].st === 'matrix') mat++;
      }
      const base = ims + mat;
      const target = base ? ims / base : 0;
      M.gSmooth += (target - M.gSmooth) * Math.min(1, dt * 2.2);
      M.flowSmooth += (M.flow - M.flowSmooth) * Math.min(1, dt * 3);
    }

    function loop(ts) {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (!w) resize();
      if (w) {
        update(dt);
        draw();
        if (ts - lastReadoutTs > 140) {
          lastReadoutTs = ts;
          refreshReadouts();
        }
      }
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      lastTs = 0;
      resize();
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    /* ---------------- 控制面板 ---------------- */
    function markPreset(id) {
      presetBtns.forEach(function (b) {
        const on = b.dataset.preset === id;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function updateNote() {
      let key = 'normal';
      if (state.leak === 'leaky') key = 'uncouple';
      else if (state.synthase === 'inhibited') key = 'oligomycin';
      else if (state.pump === 0) key = 'nopump';
      else if (state.donor === 'low') key = 'hypoxia';
      noteEl.textContent = MITO.L3.notes[key] || '';
    }

    function syncUI() {
      pumpEl.value = state.pump;
      pumpVal.innerHTML = state.pump + '<small>%</small>';
      pumpEl.style.setProperty('--p', state.pump + '%');
      segs.forEach(function (seg) {
        const v = state[seg.dataset.key];
        seg.querySelectorAll('button').forEach(function (b) {
          const on = b.dataset.value === v;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
      updateNote();
    }

    function applyState(s, presetId) {
      state.pump = s.pump;
      state.donor = s.donor;
      state.leak = s.leak;
      state.synthase = s.synthase;
      syncUI();
      markPreset(presetId || null);
      lastChainSig = '';
      lastFeedback = '';
    }

    presetsEl.innerHTML = MITO.L3.presets.map(function (p) {
      return '<button class="preset" data-preset="' + p.id + '" aria-pressed="false"><b>' + p.name + '</b><small>' + p.sub + '</small></button>';
    }).join('');
    presetBtns = Array.from(presetsEl.querySelectorAll('.preset'));

    presetsEl.addEventListener('click', function (e) {
      const b = e.target.closest('[data-preset]');
      if (!b) return;
      const p = MITO.L3.presets.filter(function (x) { return x.id === b.dataset.preset; })[0];
      if (p) applyState(p.state, p.id);
    });

    pumpEl.addEventListener('input', function () {
      state.pump = Number(pumpEl.value) || 0;
      pumpVal.innerHTML = state.pump + '<small>%</small>';
      pumpEl.style.setProperty('--p', state.pump + '%');
      markPreset(null);
      updateNote();
      lastChainSig = '';
    });

    segs.forEach(function (seg) {
      seg.addEventListener('click', function (e) {
        const b = e.target.closest('button');
        if (!b) return;
        state[seg.dataset.key] = b.dataset.value;
        seg.querySelectorAll('button').forEach(function (x) {
          const on = x === b;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        markPreset(null);
        updateNote();
        lastChainSig = '';
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        applyState(MITO.L3.presets[0].state, 'normal');
      });
    }

    /* ---------------- 启动 ---------------- */
    if (window.ResizeObserver) {
      new ResizeObserver(function () { resize(); }).observe(stage);
    } else {
      window.addEventListener('resize', resize);
    }

    MITO.onView(function (n) {
      if (n === 3) start();
      else stop();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (MITO.currentView && MITO.currentView() === 3) start();
    });

    applyState(MITO.L3.presets[0].state, 'normal');
    refreshReadouts();
  };
})();
