// Procedural backgrounds. Each set: { draw(ctx, t), tint } where tint (optional) is laid over characters for mood lighting.
const W = 1080, H = 1920;
const R = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const grad = (ctx, stops, y0 = 0, y1 = H) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
const glow = (ctx, x, y, r, color) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
const stars = (ctx, x0, y0, w, h, n, t) => { for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + i))})`; ctx.fillRect(x0 + R(i) * w, y0 + R(i + 99) * h, 3, 3); } };

export const SETS = {
  'hallway-night': {
    tint: 'rgba(20,30,70,0.25)',
    draw(ctx, t) {
      ctx.fillStyle = '#0c0f1c'; ctx.fillRect(0, 0, W, H);
      const vx = 540, vy = 900;
      ctx.fillStyle = '#141a2e'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(vx - 150, vy - 260); ctx.lineTo(vx - 150, vy + 260); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = '#10152a'; ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(vx + 150, vy - 260); ctx.lineTo(vx + 150, vy + 260); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = '#0a0d18'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(vx - 150, vy + 260); ctx.lineTo(vx + 150, vy + 260); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = '#1b2240'; ctx.fillRect(vx - 150, vy - 260, 300, 520);
      ctx.fillStyle = '#2a2140'; ctx.fillRect(vx - 80, vy - 150, 160, 410); ctx.fillStyle = '#c9a45c'; ctx.beginPath(); ctx.arc(vx + 55, vy + 60, 8, 0, Math.PI * 2); ctx.fill();
      const flick = 0.75 + 0.25 * Math.sin(t * 11) * Math.sin(t * 3.7);
      ctx.fillStyle = `rgba(255,190,120,${0.5 * flick})`; ctx.fillRect(vx - 80, vy + 255, 160, 6);
      glow(ctx, vx, vy + 262, 160, `rgba(255,170,90,${0.25 * flick})`);
      [[150, 520, 0.12], [930, 600, 0.1]].forEach(([x, y, a]) => { ctx.fillStyle = `rgba(160,180,255,${a})`; ctx.fillRect(x - 60, y - 80, 120, 160); });
      ctx.fillStyle = 'rgba(190,205,255,0.05)'; ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(260, 380); ctx.lineTo(420, 1900); ctx.lineTo(0, 1900); ctx.fill();
    },
  },
  'kids-room-night': {
    tint: 'rgba(30,40,100,0.2)',
    draw(ctx, t) {
      ctx.fillStyle = grad(ctx, ['#1c2244', '#11152b']); ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 24; i++) { ctx.fillStyle = `rgba(255,240,180,${0.2 + 0.2 * Math.sin(t + i)})`; const x = 60 + (i * 211) % 960, y = 200 + (i * 137) % 600; ctx.beginPath(); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); ctx.lineTo(x + Math.cos(a + 0.63) * 6, y + Math.sin(a + 0.63) * 6); } ctx.fill(); }
      glow(ctx, 900, 1300, 300, 'rgba(255,200,120,0.3)'); ctx.fillStyle = '#ffcf6b'; ctx.beginPath(); ctx.arc(900, 1300, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0d1022'; ctx.fillRect(0, 1450, W, 470);
      ctx.fillStyle = '#3a2f62'; ctx.beginPath(); ctx.roundRect(120, 1180, 720, 200, 30); ctx.fill();
      ctx.fillStyle = '#e9d6ff'; ctx.beginPath(); ctx.roundRect(150, 1130, 220, 90, 40); ctx.fill();
      ctx.fillStyle = '#5a4a8f'; ctx.beginPath(); ctx.ellipse(560, 1180, 230, 70, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#05060c'; ctx.fillRect(140, 1380, 680, 90);
      ctx.fillStyle = '#2b2350'; ctx.fillRect(120, 1380, 20, 140); ctx.fillRect(820, 1380, 20, 140);
    },
  },
  'bedroom-night': {
    tint: 'rgba(40,50,120,0.16)',
    draw(ctx, t) {
      ctx.fillStyle = grad(ctx, ['#232a4d', '#161b33']); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0e1224'; ctx.fillRect(590, 290, 390, 560);
      ctx.fillStyle = grad(ctx, ['#1b2550', '#33427a'], 300, 840); ctx.fillRect(610, 310, 350, 520);
      stars(ctx, 610, 310, 350, 400, 30, t);
      ctx.fillStyle = '#f4ecd2'; ctx.beginPath(); ctx.arc(860, 430, 48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0e1224'; ctx.fillRect(778, 310, 14, 520); ctx.fillRect(610, 560, 350, 14);
      ctx.fillStyle = '#3d3268'; ctx.beginPath(); ctx.moveTo(560, 270); ctx.lineTo(650, 270); ctx.quadraticCurveTo(610, 600, 640, 900); ctx.lineTo(560, 900); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1010, 270); ctx.lineTo(930, 270); ctx.quadraticCurveTo(970, 600, 940, 900); ctx.lineTo(1010, 900); ctx.fill();
      ctx.fillStyle = 'rgba(190,205,255,0.06)'; ctx.beginPath(); ctx.moveTo(610, 830); ctx.lineTo(960, 830); ctx.lineTo(700, 1900); ctx.lineTo(80, 1900); ctx.fill();
      ctx.save(); ctx.translate(170, 460); ctx.rotate(-0.06); ctx.fillStyle = '#e8432f'; ctx.fillRect(-80, -110, 170, 230); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(5, -10, 50, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(360, 420); ctx.rotate(0.05); ctx.fillStyle = '#5ab0a0'; ctx.fillRect(-60, -80, 120, 160); ctx.restore();
      glow(ctx, 160, 1120, 520, 'rgba(255,190,110,0.28)');
      ctx.fillStyle = '#0f1326'; ctx.fillRect(0, 1450, W, 470);
      ctx.fillStyle = '#2c2a55'; ctx.beginPath(); ctx.roundRect(-40, 1380, 760, 260, 40); ctx.fill();
      ctx.fillStyle = '#e8e2f5'; ctx.beginPath(); ctx.roundRect(20, 1340, 260, 110, 40); ctx.fill();
    },
  },
  'mall-night': {
    tint: 'rgba(20,40,90,0.2)',
    draw(ctx, t) {
      ctx.fillStyle = grad(ctx, ['#0b0e14', '#141924', '#0c0f15']); ctx.fillRect(0, 0, W, H);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(120,160,255,0.08)'; ctx.beginPath(); ctx.moveTo(80 + k * 250, 120); ctx.lineTo(260 + k * 250, 120); ctx.lineTo(240 + k * 250, 260); ctx.lineTo(100 + k * 250, 260); ctx.fill(); }
      const signs = ['#3fd1c4', '#ff5fa2', '#ffd23f'];
      for (let k = 0; k < 3; k++) {
        const x = 40 + k * 350, y = 480;
        ctx.fillStyle = '#1b2130'; ctx.fillRect(x, y, 320, 760);
        const flick = k === 1 && Math.sin(t * 23) > 0.6 ? 0.25 : 1;
        ctx.globalAlpha = flick; ctx.fillStyle = signs[k]; ctx.fillRect(x + 40, y + 40, 240, 50); glow(ctx, x + 160, y + 65, 220, signs[k] + '33'); ctx.globalAlpha = 1;
        ctx.fillStyle = '#262d3e'; ctx.fillRect(x + 20, y + 130, 280, 600);
        ctx.strokeStyle = '#1a1f2c'; ctx.lineWidth = 4; for (let yy = y + 150; y + 130 + 380 > yy; yy += 22) { ctx.beginPath(); ctx.moveTo(x + 20, yy); ctx.lineTo(x + 300, yy); ctx.stroke(); }
        ctx.fillStyle = 'rgba(120,160,255,0.07)'; ctx.fillRect(x + 20, y + 520, 280, 210);
      }
      ctx.fillStyle = grad(ctx, ['#171c27', '#0b0d12'], 1240, H); ctx.fillRect(0, 1240, W, H - 1240);
      for (let k = 0; k < 3; k++) { ctx.fillStyle = signs[k] + '22'; ctx.fillRect(80 + k * 350, 1290, 240, 30); }
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2; for (let k = -6; k < 12; k++) { ctx.beginPath(); ctx.moveTo(540, 1240); ctx.lineTo(540 + k * 160, H); ctx.stroke(); }
      for (let k = 0; k < 5; k++) { const on = Math.sin(t * 4 + k) > 0; ctx.fillStyle = on ? '#ff3b30' : '#5a1512'; ctx.beginPath(); ctx.arc(110 + k * 215, 430, 9, 0, Math.PI * 2); ctx.fill(); if (on) glow(ctx, 110 + k * 215, 430, 60, 'rgba(255,59,48,0.35)'); }
    },
  },
  'school-hallway': {
    draw(ctx, t) {
      const vx = 540, vy = 860;
      ctx.fillStyle = '#e4dccb'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#cfc6b3'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(vx - 120, vy - 140); ctx.lineTo(vx + 120, vy - 140); ctx.lineTo(W, 0); ctx.fill();
      ctx.fillStyle = '#b8ae9a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(vx - 120, vy + 120); ctx.lineTo(vx + 120, vy + 120); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = '#efe9dc'; ctx.fillRect(vx - 120, vy - 140, 240, 260);
      for (const s of [-1, 1]) {
        for (let k = 0; k < 9; k++) {
          const p0 = k / 9, p1 = (k + 0.85) / 9;
          const xa = s < 0 ? p0 * (vx - 120) : W - p0 * (W - vx - 120), xb = s < 0 ? p1 * (vx - 120) : W - p1 * (W - vx - 120);
          const ta = 380 + p0 * (vy - 120 - 380), tb = 380 + p1 * (vy - 120 - 380), ba = 1500 - p0 * (1500 - vy - 90), bb = 1500 - p1 * (1500 - vy - 90);
          ctx.fillStyle = k % 2 ? '#3a6db3' : '#3466a9'; ctx.beginPath(); ctx.moveTo(xa, ta); ctx.lineTo(xb, tb); ctx.lineTo(xb, bb); ctx.lineTo(xa, ba); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; const mx = xa + (xb - xa) * 0.2, my = ta + (tb - ta) * 0.2 + (ba - ta) * 0.12; ctx.fillRect(mx, my, (xb - xa) * 0.5, 6);
        }
      }
      for (let k = 0; k < 4; k++) { const p = k / 4, y = 120 + p * (vy - 260), w = 300 * (1 - p * 0.8); const fl = k === 2 && Math.sin(t * 31) > 0.85 ? 0.3 : 1; ctx.fillStyle = `rgba(255,255,245,${0.9 * fl})`; ctx.fillRect(vx - w / 2, y, w, 26 * (1 - p * 0.7)); }
    },
  },
  'street-night': {
    tint: 'rgba(30,30,90,0.18)',
    draw(ctx, t) {
      ctx.fillStyle = grad(ctx, ['#0d1030', '#2a2350', '#3b2a4a']); ctx.fillRect(0, 0, W, H);
      stars(ctx, 0, 0, W, 500, 40, t);
      for (let k = 0; k < 7; k++) {
        const x = k * 165 - 30, h = 500 + R(k) * 500, w = 170;
        ctx.fillStyle = k % 2 ? '#151630' : '#1b1b3a'; ctx.fillRect(x, 1250 - h, w, h);
        for (let r = 0; r < h / 70 - 1; r++) for (let c = 0; c < 3; c++) if (R(k * 31 + r * 7 + c) > 0.55) { ctx.fillStyle = R(r + c + k) > 0.5 ? '#ffd27a' : '#ffb35c'; ctx.fillRect(x + 22 + c * 48, 1250 - h + 40 + r * 70, 26, 36); }
      }
      ctx.fillStyle = '#121320'; ctx.fillRect(0, 1250, W, H - 1250);
      ctx.fillStyle = '#e8e2cf'; for (let k = 0; k < 6; k++) ctx.fillRect(k * 200 - ((t * 0) % 200), 1560, 110, 12);
      ctx.fillStyle = '#2b2b3d'; ctx.fillRect(880, 520, 18, 900);
      ctx.fillStyle = '#ffe2a0'; ctx.beginPath(); ctx.ellipse(840, 525, 60, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,226,160,0.12)'; ctx.beginPath(); ctx.moveTo(790, 530); ctx.lineTo(890, 530); ctx.lineTo(1080, 1400); ctx.lineTo(540, 1400); ctx.fill();
      glow(ctx, 840, 530, 200, 'rgba(255,226,160,0.4)');
    },
  },
  'kitchen-day': {
    draw(ctx) {
      ctx.fillStyle = '#f3e8d4'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#9fc4b2'; for (let k = 0; k < 4; k++) { ctx.fillRect(30 + k * 260, 180, 230, 330); ctx.fillStyle = '#8bb3a0'; ctx.fillRect(40 + k * 260, 190, 6, 310); ctx.fillStyle = '#9fc4b2'; }
      ctx.fillStyle = '#bfe2ff'; ctx.fillRect(330, 600, 420, 380); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(650, 700, 50, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 16; ctx.strokeRect(330, 600, 420, 380); ctx.beginPath(); ctx.moveTo(540, 600); ctx.lineTo(540, 980); ctx.stroke();
      ctx.fillStyle = '#e9e9ec'; ctx.beginPath(); ctx.roundRect(820, 520, 260, 1000, 24); ctx.fill(); ctx.fillStyle = '#c9c9d0'; ctx.fillRect(840, 900, 230, 6); ctx.fillRect(850, 600, 10, 120);
      ctx.fillStyle = '#d7c3a0'; ctx.fillRect(0, 1180, W, 60); ctx.fillStyle = '#8fb5a3'; ctx.fillRect(0, 1240, W, 680);
    },
  },
  'park-day': {
    draw(ctx, t) {
      ctx.fillStyle = grad(ctx, ['#8fcbff', '#dff2ff'], 0, 1200); ctx.fillRect(0, 0, W, H);
      for (let k = 0; k < 4; k++) { const x = ((k * 340 + t * 18) % 1400) - 200, y = 200 + k * 110; ctx.fillStyle = 'rgba(255,255,255,0.9)'; [[0, 0, 60], [55, -20, 70], [120, 0, 55]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill(); }); }
      ctx.fillStyle = '#9ccf7a'; ctx.beginPath(); ctx.ellipse(250, 1150, 700, 260, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#86c065'; ctx.beginPath(); ctx.ellipse(950, 1180, 600, 240, 0, 0, Math.PI * 2); ctx.fill();
      for (const [x, s] of [[120, 1], [900, 1.2], [560, 0.7]]) { ctx.fillStyle = '#6b4a32'; ctx.fillRect(x - 14 * s, 980 - 40 * s, 28 * s, 260 * s); ctx.fillStyle = '#4f9a4a'; [[0, -200, 120], [-80, -130, 90], [80, -130, 95]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, 980 + dy * s, r * s, 0, Math.PI * 2); ctx.fill(); }); }
      ctx.fillStyle = '#74b257'; ctx.fillRect(0, 1250, W, H - 1250);
      ctx.fillStyle = '#e6d7b5'; ctx.beginPath(); ctx.moveTo(420, 1250); ctx.lineTo(660, 1250); ctx.lineTo(900, H); ctx.lineTo(180, H); ctx.fill();
    },
  },
  classroom: {
    draw(ctx, t) {
      ctx.fillStyle = '#ece4d2'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#6b4a32'; ctx.fillRect(120, 300, 840, 520); ctx.fillStyle = '#2f4a3a'; ctx.fillRect(140, 320, 800, 480);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let r = 0; r < 4; r++) { ctx.beginPath(); for (let x = 0; x < 400 + R(r) * 260; x += 12) ctx.lineTo(200 + x, 400 + r * 90 + Math.sin(x * 0.15 + r) * 6); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(900, 180, 60, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#141414'; ctx.lineWidth = 6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(900, 180); ctx.lineTo(900 + Math.cos(t * 0.5) * 40, 180 + Math.sin(t * 0.5) * 40); ctx.moveTo(900, 180); ctx.lineTo(900, 140); ctx.stroke();
      ctx.fillStyle = '#c7b48f'; ctx.fillRect(0, 1250, W, H - 1250);
      for (let k = 0; k < 3; k++) { ctx.fillStyle = '#a0784f'; ctx.fillRect(40 + k * 360, 1300, 300, 40); ctx.fillStyle = '#7d5c3c'; ctx.fillRect(60 + k * 360, 1340, 16, 200); ctx.fillRect(320 + k * 360, 1340, 16, 200); }
    },
  },
  'rooftop-sunset': {
    draw(ctx) {
      ctx.fillStyle = grad(ctx, ['#5b3f8f', '#e86a5a', '#ffb066', '#ffd98a'], 0, 1300); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff1c2'; ctx.beginPath(); ctx.arc(540, 1050, 150, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 9; k++) { const x = k * 125 - 20, h = 180 + R(k + 5) * 340; ctx.fillStyle = '#4a2f5e'; ctx.fillRect(x, 1250 - h, 120, h); }
      ctx.fillStyle = '#2e1f3d'; ctx.fillRect(0, 1250, W, H - 1250);
      ctx.strokeStyle = '#1d1428'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 1180); ctx.lineTo(W, 1180); ctx.stroke(); for (let x = 20; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 1180); ctx.lineTo(x, 1260); ctx.stroke(); }
    },
  },
  'forest-night': {
    tint: 'rgba(20,60,70,0.2)',
    draw(ctx, t) {
      ctx.fillStyle = grad(ctx, ['#08131a', '#123038', '#0b1a1f']); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e9f0dc'; ctx.beginPath(); ctx.arc(780, 330, 70, 0, Math.PI * 2); ctx.fill(); glow(ctx, 780, 330, 300, 'rgba(220,240,220,0.18)');
      for (const [n, base, col, sc] of [[9, 1050, '#16353b', 0.8], [7, 1250, '#0f262b', 1.1], [5, 1500, '#081a1e', 1.6]]) for (let k = 0; k < n; k++) { const x = (k + 0.5) * (W / n) + (R(k + base) - 0.5) * 80; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, base - 520 * sc); ctx.lineTo(x - 110 * sc, base); ctx.lineTo(x + 110 * sc, base); ctx.fill(); }
      ctx.fillStyle = 'rgba(200,230,220,0.07)'; for (let k = 0; k < 3; k++) ctx.fillRect(0, 1080 + k * 140 + Math.sin(t + k) * 10, W, 60);
      for (let k = 0; k < 18; k++) { const x = (R(k) * W + Math.sin(t * 0.7 + k) * 40), y = 700 + R(k + 40) * 800 + Math.cos(t * 0.9 + k) * 30, a = 0.5 + 0.5 * Math.sin(t * 3 + k * 2); ctx.fillStyle = `rgba(255,230,120,${a})`; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); glow(ctx, x, y, 30, `rgba(255,230,120,${a * 0.3})`); }
      ctx.fillStyle = '#050e10'; ctx.fillRect(0, 1500, W, H - 1500);
    },
  },
};

// "void" or "void:#hex" -> plain dramatic gradient
export function getSet(name) {
  if (SETS[name]) return SETS[name];
  if (name?.startsWith('void')) {
    const c = name.split(':')[1] || '#2a2340';
    return { draw(ctx) { const g = ctx.createRadialGradient(540, 900, 50, 540, 900, 1300); g.addColorStop(0, c); g.addColorStop(1, '#07070a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } };
  }
  throw new Error(`Unknown set "${name}". Available: ${Object.keys(SETS).join(', ')}, void[:#hex]`);
}
