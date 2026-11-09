// "Case file" motion graphics for mystery Shorts. Each visual draws into the upper zone (y ≈ 330–1150) of a 1080×1920 frame.
import { clamp, prog, ease, font, DISPLAY, MONO, SANS } from '../lib/kit.js';

export const P = { bg: '#0d0c0a', paper: '#efe6d2', paperDark: '#d9cdb2', ink: '#1b1712', red: '#d63a2f', cream: '#f4ecdc', mute: '#8c8273', manila: '#c9a45c', green: '#5dff9a', yellow: '#ffd23f' };
const R = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function paper(ctx, x, y, w, h, rot = 0, color = P.paper) {
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-w / 2 + 14, -h / 2 + 18, w, h);
  ctx.fillStyle = color; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = 'rgba(120,90,40,0.06)'; for (let i = 0; i < 40; i++) ctx.fillRect(-w / 2 + R(i) * w, -h / 2 + R(i + 9) * h, 3 + R(i + 3) * 30, 2);
  ctx.restore();
}
export function stamp(ctx, text, x, y, rot, p, color = P.red, size = 86) {
  if (p <= 0) return;
  const s = 1.9 - 0.9 * ease.back(clamp(p)); font(ctx, size, 900, DISPLAY);
  const w = ctx.measureText(text).width + 60, h = size + 40;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3) * 0.92;
  ctx.strokeStyle = color; ctx.lineWidth = 9; ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, 0, size * 0.36);
  ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 60; i++) { ctx.fillRect(-w / 2 + R(i) * w, -h / 2 + R(i + 50) * h, 4, 3); }
  ctx.restore();
}
const typed = (str, lt, start, cps = 28) => str.slice(0, Math.max(0, Math.floor((lt - start) * cps)));

// ---------- icons (centered at 0,0, ~300px) ----------
export const ICONS = {

  boots(ctx, t, o = {}) {
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 75, 0); ctx.scale(s, 1);
      ctx.fillStyle = '#6b4a2c'; ctx.beginPath(); ctx.moveTo(-45, -150); ctx.lineTo(25, -150); ctx.lineTo(30, 40); ctx.quadraticCurveTo(110, 50, 115, 110); ctx.lineTo(-50, 110); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3e2a18'; ctx.fillRect(-55, 100, 175, 26); ctx.fillRect(-48, -160, 76, 22);
      if (o.muddy) { ctx.fillStyle = '#4a3a22'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(-40 + (i * 37) % 150, 60 + (i * 23) % 50, 10 + (i % 3) * 5, 0, Math.PI * 2); ctx.fill(); } }
      else { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-30, -120, 10, 120); }
      ctx.restore();
    }
    if (!o.muddy) for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1, x = Math.cos(k * 2.3) * 140, y = -60 + Math.sin(k * 1.7) * 90, s = 16 + 10 * Math.abs(Math.sin(a)); ctx.fillStyle = P.cream; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill(); }
  },
  clock(ctx, t, o = {}) {
    ctx.fillStyle = P.paper; ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 18; ctx.stroke();
    for (let k = 0; k < 12; k++) { ctx.save(); ctx.rotate(k * Math.PI / 6); ctx.fillStyle = P.ink; ctx.fillRect(-4, -130, 8, 22); ctx.restore(); }
    const [h, m] = (o.time || '11:15').split(':').map(Number);
    ctx.lineCap = 'round'; ctx.strokeStyle = P.ink; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 0); const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2 - Math.PI / 2; ctx.lineTo(Math.cos(ha) * 70, Math.sin(ha) * 70); ctx.stroke();
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); const ma = m / 60 * Math.PI * 2 - Math.PI / 2; ctx.lineTo(Math.cos(ma) * 110, Math.sin(ma) * 110); ctx.stroke();
    ctx.fillStyle = P.red; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
  },
  cup(ctx, t) {
    ctx.fillStyle = P.cream; ctx.beginPath(); ctx.moveTo(-110, -60); ctx.lineTo(110, -60); ctx.lineTo(85, 110); ctx.lineTo(-85, 110); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = P.cream; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(120, 10, 40, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.ellipse(0, -60, 110, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(244,236,220,0.5)'; ctx.lineWidth = 6; for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let y = 0; y < 90; y += 6) ctx.lineTo(-40 + k * 40 + Math.sin(y * 0.1 + t * 3 + k) * 10, -90 - y); ctx.stroke(); }
  },
  key(ctx, t) {
    ctx.save(); ctx.rotate(-0.5 + Math.sin(t * 2) * 0.05); ctx.strokeStyle = P.yellow; ctx.fillStyle = P.yellow; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.arc(-110, 0, 60, 0, Math.PI * 2); ctx.stroke(); ctx.fillRect(-50, -11, 230, 22); ctx.fillRect(130, 0, 22, 55); ctx.fillRect(170, 0, 22, 40); ctx.restore();
  },
  dish(ctx, t) {
    ctx.strokeStyle = P.cream; ctx.fillStyle = P.cream; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.save(); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, -20, 150, 60, 0, 0, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-150, -20); ctx.lineTo(150, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(0, -110); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -120, 14, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(-70, 180); ctx.moveTo(0, 60); ctx.lineTo(70, 180); ctx.moveTo(-110, 180); ctx.lineTo(110, 180); ctx.stroke();
    for (let k = 0; k < 3; k++) { const r = ((t * 0.8 + k / 3) % 1); ctx.strokeStyle = `rgba(214,58,47,${1 - r})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-70, -150, 40 + r * 160, -Math.PI * 0.9, -Math.PI * 0.4); ctx.stroke(); }
  },
  burst(ctx, t) {
    const s = 1 + 0.08 * Math.sin(t * 6);
    ctx.save(); ctx.scale(s, s); ctx.fillStyle = P.yellow; ctx.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 60 : 130; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 45, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  },
  cloud(ctx, t) {
    ctx.fillStyle = 'rgba(140,190,255,0.85)';
    [[-80, 10, 70], [0, -30, 90], [85, 5, 70], [0, 40, 80]].forEach(([x, y, r], i) => { ctx.beginPath(); ctx.arc(x + Math.sin(t + i) * 6, y + Math.cos(t * 1.3 + i) * 6, r, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-20, -40, 30, 0, Math.PI * 2); ctx.fill();
  },
  earth(ctx, t) {
    ctx.fillStyle = '#2f6fd6'; ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#4fb36a';
    const o = (t * 30) % 480; [[-60, -40, 70, 50], [60, 30, 50, 70], [-20, 70, 60, 30]].forEach(([x, y, w, h]) => { for (const d of [0, 480]) { ctx.beginPath(); ctx.ellipse(x - o + d - 120, y, w, h, 0.4, 0, Math.PI * 2); ctx.fill(); } });
    ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 128, 0, Math.PI * 2); ctx.stroke();
  },
  ship(ctx, t) {
    const b = Math.sin(t * 2) * 8; ctx.save(); ctx.translate(0, b); ctx.rotate(Math.sin(t * 1.5) * 0.04);
    ctx.fillStyle = P.cream; ctx.beginPath(); ctx.moveTo(-170, 40); ctx.lineTo(170, 40); ctx.lineTo(130, 110); ctx.lineTo(-140, 110); ctx.fill();
    ctx.fillRect(-6, -200, 12, 240); ctx.fillRect(-96, -150, 8, 190);
    ctx.fillStyle = 'rgba(244,236,220,0.85)'; ctx.beginPath(); ctx.moveTo(10, -190); ctx.quadraticCurveTo(110, -100, 10, 20); ctx.fill(); ctx.beginPath(); ctx.moveTo(-84, -140); ctx.quadraticCurveTo(-10, -70, -84, 20); ctx.fill();
    ctx.restore(); ctx.strokeStyle = 'rgba(140,190,255,0.6)'; ctx.lineWidth = 6; for (let r = 0; r < 3; r++) { ctx.beginPath(); for (let x = -220; x <= 220; x += 10) ctx.lineTo(x, 130 + r * 26 + Math.sin(x * 0.04 + t * 3 + r) * 8); ctx.stroke(); }
  },
  book(ctx, t) {
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-170, -120, 340, 240); ctx.fillStyle = P.paper; ctx.fillRect(-160, -110, 155, 220); ctx.fillRect(5, -110, 155, 220);
    ctx.strokeStyle = 'rgba(27,23,18,0.7)'; ctx.lineWidth = 3; for (let s of [-1, 1]) for (let r = 0; r < 8; r++) { ctx.beginPath(); for (let x = 0; x < 120; x += 8) ctx.lineTo(s < 0 ? -145 + x : 20 + x, -85 + r * 24 + Math.sin(x * 0.3 + r * 2) * 3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(80,140,60,0.8)'; ctx.beginPath(); ctx.arc(80, 40, 28 + Math.sin(t * 2) * 3, 0, Math.PI * 2); ctx.fill();
  },
  question(ctx, t) {
    font(ctx, 360, 900, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = P.red; ctx.save(); ctx.rotate(Math.sin(t * 2) * 0.06); ctx.fillText('?', 0, 125); ctx.restore(); ctx.textAlign = 'left';
  },
  wave(ctx, t) {
    ctx.strokeStyle = P.green; ctx.lineWidth = 8; ctx.beginPath();
    for (let x = -200; x <= 200; x += 4) { const env = Math.exp(-((x / 120) ** 2)); ctx.lineTo(x, Math.sin(x * 0.15 + t * 10) * 110 * env); }
    ctx.stroke();
  },
};


// Faceless suspect silhouette. look: gardener (cap) | niece (long hair) | butler (bow tie) | chef (tall hat) | glasses | plain
function silhouette(ctx, x, y, look = 'plain', t = 0) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 2) * 3); ctx.fillStyle = '#0c0c10';
  if (look === 'niece') { ctx.beginPath(); ctx.ellipse(0, -215, 105, 150, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-230, 120); ctx.quadraticCurveTo(-220, -40, -90, -70); ctx.lineTo(90, -70); ctx.quadraticCurveTo(220, -40, 230, 120); ctx.fill();
  ctx.fillRect(-35, -110, 70, 50); ctx.beginPath(); ctx.ellipse(0, -200, 82, 100, 0, 0, Math.PI * 2); ctx.fill();
  if (look === 'gardener') { ctx.beginPath(); ctx.ellipse(0, -265, 92, 45, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-10, -268, 150, 22); }
  if (look === 'butler') { ctx.fillStyle = P.red; ctx.beginPath(); ctx.moveTo(0, -55); ctx.lineTo(-45, -80); ctx.lineTo(-45, -30); ctx.closePath(); ctx.moveTo(0, -55); ctx.lineTo(45, -80); ctx.lineTo(45, -30); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#0c0c10'; }
  if (look === 'chef') { ctx.fillStyle = '#e9e6dd'; ctx.fillRect(-70, -390, 140, 110); ctx.beginPath(); ctx.arc(-40, -390, 45, 0, Math.PI * 2); ctx.arc(40, -390, 45, 0, Math.PI * 2); ctx.arc(0, -410, 50, 0, Math.PI * 2); ctx.fill(); }
  if (look === 'glasses') { ctx.strokeStyle = '#9a9aa5'; ctx.lineWidth = 7; ctx.strokeRect(-62, -215, 52, 34); ctx.strokeRect(10, -215, 52, 34); }
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; const blink = (t % 3.3) < 0.12 ? 0.15 : 1;
  ctx.beginPath(); ctx.ellipse(-30, -200, 10, 6 * blink, 0, 0, Math.PI * 2); ctx.ellipse(30, -200, 10, 6 * blink, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------- visuals ----------
export const VISUALS = {

  scene(ctx, v, lt, dur, t) {
    const flash = v.lightning !== false && (lt % 3.2) > 0.5 && (lt % 3.2) < 0.62;
    const g = ctx.createLinearGradient(0, 380, 0, 1150); g.addColorStop(0, flash ? '#6f6a8a' : '#151827'); g.addColorStop(1, '#0b0c12'); ctx.fillStyle = g; ctx.fillRect(90, 380, 900, 770);
    ctx.save(); ctx.beginPath(); ctx.rect(90, 380, 900, 770); ctx.clip();
    ctx.fillStyle = '#e9e2c8'; ctx.beginPath(); ctx.arc(820, 500, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#07080c'; ctx.beginPath(); ctx.moveTo(180, 1150); ctx.lineTo(180, 760); ctx.lineTo(330, 640); ctx.lineTo(480, 760); ctx.lineTo(480, 700); ctx.lineTo(700, 560); ctx.lineTo(900, 700); ctx.lineTo(900, 1150); ctx.fill();
    ctx.fillRect(760, 560, 40, 90);
    [[230, 820], [380, 820], [560, 760], [720, 760], [820, 760], [560, 900], [720, 900], [820, 900], [230, 950], [380, 950]].forEach(([x, y], i) => { const lit = v.lit ? v.lit.includes(i) : i === 6; ctx.fillStyle = lit ? '#ffcf6b' : '#1c1e29'; ctx.fillRect(x, y, 50, 70); if (lit) { ctx.fillStyle = 'rgba(255,207,107,0.15)'; ctx.beginPath(); ctx.arc(x + 25, y + 35, 90, 0, Math.PI * 2); ctx.fill(); } });
    ctx.strokeStyle = 'rgba(180,190,230,0.35)'; ctx.lineWidth = 3; for (let i = 0; i < 70; i++) { const x = 90 + ((i * 131) % 900), y = 380 + ((t * 900 + i * 97) % 770); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 36); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 14; ctx.strokeRect(83, 373, 914, 784);
    if (v.label) { ctx.globalAlpha = ease.out(prog(lt, 0.3, 0.4)); font(ctx, 40, 700, MONO); ctx.fillStyle = P.cream; ctx.textAlign = 'center'; ctx.fillText(v.label.toUpperCase(), 540, 1110 - 40); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  },
  suspect(ctx, v, lt, dur, t) {
    const p = ease.back(prog(lt, 0, 0.4)), col = { A: P.yellow, B: '#7fc8ff', C: P.red }[v.letter] || P.yellow;
    ctx.save(); ctx.translate(540 + (1 - p) * 600, 700); ctx.rotate(-0.03);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-300, -310, 620, 640); ctx.fillStyle = P.paper; ctx.fillRect(-310, -320, 620, 640);
    ctx.fillStyle = '#2b2b33'; ctx.fillRect(-270, -280, 540, 400);
    ctx.save(); ctx.beginPath(); ctx.rect(-270, -280, 540, 400); ctx.clip(); silhouette(ctx, 0, 120, v.look, t); ctx.restore();
    for (let y = -280; y < 120; y += 50) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(-270, y, 540, 2); }
    ctx.fillStyle = col; ctx.fillRect(-310, -320, 110, 110); font(ctx, 90, 900, DISPLAY); ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.fillText(v.letter || 'A', -255, -232);
    font(ctx, 64, 900, DISPLAY); ctx.fillText((v.name || '').toUpperCase(), 0, 210); ctx.textAlign = 'left';
    ctx.restore();
    if (v.alibi) {
      const q = ease.back(prog(lt, 0.5, 0.35)); if (q > 0) { ctx.save(); ctx.translate(540, 1080); ctx.scale(q, q); font(ctx, 42, 700, SANS); const w = ctx.measureText(`“${v.alibi}”`).width + 70;
        ctx.fillStyle = P.cream; ctx.beginPath(); ctx.roundRect(-w / 2, -50, w, 90, 45); ctx.fill(); ctx.beginPath(); ctx.moveTo(-30, -50); ctx.lineTo(0, -85); ctx.lineTo(25, -50); ctx.fill();
        ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.fillText(`“${v.alibi}”`, 0, 8); ctx.textAlign = 'left'; ctx.restore(); }
    }
  },
  lineup(ctx, v, lt, dur, t) {
    const list = v.suspects || [];
    if (v.title) { ctx.globalAlpha = ease.out(prog(lt, 0, 0.3)); font(ctx, 84, 900, DISPLAY); ctx.fillStyle = P.cream; ctx.textAlign = 'center'; ctx.fillText(v.title.toUpperCase(), 540, 470); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    list.forEach((s, i) => {
      const p = ease.back(prog(lt, 0.15 + i * 0.2, 0.35)); if (p <= 0) return;
      const col = [P.yellow, '#7fc8ff', P.red][i], x = 540 + (i - 1) * 300, bob = Math.sin(t * 3 + i) * 6;
      ctx.save(); ctx.translate(x, 790 + bob); ctx.scale(p, p);
      ctx.fillStyle = P.paper; ctx.fillRect(-135, -230, 270, 430); ctx.fillStyle = '#2b2b33'; ctx.fillRect(-115, -210, 230, 280);
      ctx.save(); ctx.beginPath(); ctx.rect(-115, -210, 230, 280); ctx.clip(); ctx.scale(0.5, 0.5); silhouette(ctx, 0, 140, s.look, t); ctx.restore();
      ctx.fillStyle = col; ctx.fillRect(-135, -230, 70, 70); font(ctx, 56, 900, DISPLAY); ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.fillText('ABC'[i], -100, -176);
      font(ctx, 34, 900, DISPLAY); ctx.fillText((s.name || '').toUpperCase(), 0, 140); ctx.textAlign = 'left';
      ctx.restore();
    });
    const q = 0.5 + 0.5 * Math.sin(t * 5); font(ctx, 60, 900, DISPLAY); ctx.fillStyle = `rgba(255,210,63,${0.6 + 0.4 * q})`; ctx.textAlign = 'center'; ctx.fillText(v.question || 'A, B OR C?', 540, 1110); ctx.textAlign = 'left';
  },
  clue(ctx, v, lt, dur, t) {
    const p = ease.back(prog(lt, 0, 0.4));
    ctx.save(); ctx.translate(540, 730); ctx.scale(p, p); ctx.rotate(-0.04);
    ctx.fillStyle = 'rgba(210,225,235,0.18)'; ctx.fillRect(-330, -330, 660, 640); ctx.strokeStyle = 'rgba(230,240,250,0.5)'; ctx.lineWidth = 6; ctx.strokeRect(-330, -330, 660, 640);
    ctx.fillStyle = P.red; ctx.fillRect(-330, -330, 660, 70); font(ctx, 36, 800, MONO); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(`EVIDENCE #${v.n || 1}`, 0, -283); ctx.textAlign = 'left';
    ctx.save(); ctx.translate(0, 40); (ICONS[v.icon] || ICONS.question)(ctx, t, v.iconOpts || {}); ctx.restore();
    ctx.restore();
    const mp = prog(lt, 0.5, 1.2); if (mp > 0) { const a = Math.PI * 0.9 + mp * Math.PI * 1.3, mx = 540 + Math.cos(a) * 230, my = 760 + Math.sin(a) * 200; ctx.strokeStyle = '#c9a45c'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(mx, my, 95, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx + 68, my + 68); ctx.lineTo(mx + 160, my + 160); ctx.stroke(); }
    if (v.label) { ctx.globalAlpha = ease.out(prog(lt, 0.6, 0.4)); font(ctx, 42, 700, MONO); ctx.fillStyle = P.yellow; ctx.textAlign = 'center'; ctx.fillText(v.label.toUpperCase(), 540, 1110); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  },
  title(ctx, v, lt) {
    const p = ease.out(prog(lt, 0, 0.45));
    ctx.save(); ctx.translate(0, (1 - p) * 700);
    ctx.fillStyle = P.manila; ctx.save(); ctx.translate(540, 760); ctx.rotate(-0.03);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-400, -330, 820, 700);
    ctx.fillStyle = '#b38f48'; ctx.fillRect(-420, -350, 820, 700); ctx.fillRect(-420, -410, 300, 70);
    font(ctx, 34, 700, MONO); ctx.fillStyle = P.ink; ctx.fillText(`CASE ${v.case || '001'}`, -395, -362);
    ctx.restore();
    paper(ctx, 150, 470, 780, 560, 0.02);
    ctx.save(); ctx.translate(540, 750); ctx.rotate(0.02);
    font(ctx, 30, 600, MONO); ctx.fillStyle = P.mute; ctx.fillText('FILE:', -340, -190);
    font(ctx, 92, 900, DISPLAY); ctx.fillStyle = P.ink;
    const lines = (v.title || '').toUpperCase().split('\n');
    lines.forEach((l, i) => ctx.fillText(typed(l, lt, 0.35 + i * 0.4, 22), -340, -90 + i * 100));
    font(ctx, 34, 500, MONO); ctx.fillStyle = P.ink; ctx.fillText(typed(v.sub || '', lt, 0.9, 30), -340, 150);
    ctx.restore();
    ctx.restore();
    stamp(ctx, v.stamp || 'UNSOLVED', 640, 990, -0.15, prog(lt, 0.6, 0.3), P.red, (v.stamp || 'UNSOLVED').length > 9 ? 66 : 86);
  },
  date(ctx, v, lt) {
    const p = ease.back(prog(lt, 0, 0.4));
    const [mon, day, year] = (v.date || 'JAN 1 1900').split(' ');
    ctx.save(); ctx.translate(540, 720); ctx.scale(p, p); ctx.rotate(-0.04);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-250, -260, 520, 560);
    ctx.fillStyle = P.paper; ctx.fillRect(-260, -280, 520, 560); ctx.fillStyle = P.red; ctx.fillRect(-260, -280, 520, 130);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-200 + k * 80, -280, 14, 0, Math.PI * 2); ctx.fill(); }
    font(ctx, 80, 900, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = P.cream; ctx.fillText(mon, 0, -185);
    const n = Math.min(+day, Math.max(1, Math.round(+day * ease.out(prog(lt, 0.15, 0.7)))));
    font(ctx, 250, 900, DISPLAY); ctx.fillStyle = P.ink; ctx.fillText(String(n), 0, 90);
    font(ctx, 64, 700, MONO); ctx.fillStyle = P.red; ctx.fillText(year, 0, 200);
    ctx.restore(); ctx.textAlign = 'left';
    if (v.place) { const q = ease.out(prog(lt, 0.7, 0.4)); ctx.globalAlpha = q; font(ctx, 44, 700, MONO); ctx.fillStyle = P.cream; ctx.textAlign = 'center'; ctx.fillText(`● ${v.place.toUpperCase()}`, 540, 1100); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  },
  signal(ctx, v, lt, dur, t) {
    const x0 = 110, y0 = 420, w = 860, h = 620, spikeAt = v.spikeAt ?? 0.8;
    ctx.fillStyle = '#04140b'; ctx.fillRect(x0, y0, w, h); ctx.strokeStyle = 'rgba(93,255,154,0.15)'; ctx.lineWidth = 2;
    for (let x = x0; x <= x0 + w; x += 86) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke(); }
    for (let y = y0; y <= y0 + h; y += 78) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke(); }
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    ctx.strokeStyle = P.green; ctx.lineWidth = 5; ctx.shadowColor = P.green; ctx.shadowBlur = 18; ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const tau = lt - (w - x) / 420; let y = (R(Math.floor(x + t * 300)) - 0.5) * 30;
      if (tau > spikeAt) { const k = tau - spikeAt; y -= Math.exp(-((x - w * 0.55 + (lt - spikeAt) * 0) ** 2) / 9000) * 0 + Math.sin(k * 40) * 230 * Math.exp(-k * 0.6) * (k < 2.5 ? 1 : 0.2); }
      ctx.lineTo(x0 + x, y0 + h / 2 + y);
    }
    ctx.stroke(); ctx.restore();
    ctx.strokeStyle = '#2a3a30'; ctx.lineWidth = 14; ctx.strokeRect(x0 - 7, y0 - 7, w + 14, h + 14);
    font(ctx, 36, 700, MONO);
    if (lt > spikeAt && Math.floor(lt * 3) % 2 === 0) { ctx.fillStyle = P.red; ctx.fillText(`● ${(v.label || 'SIGNAL DETECTED').toUpperCase()}`, x0 + 30, y0 + 60); }
    else { ctx.fillStyle = 'rgba(93,255,154,0.6)'; ctx.fillText(v.idle || 'SCANNING...', x0 + 30, y0 + 60); }
    if (v.freq) { ctx.fillStyle = 'rgba(93,255,154,0.8)'; ctx.textAlign = 'right'; ctx.fillText(v.freq, x0 + w - 30, y0 + h - 30); ctx.textAlign = 'left'; }
  },
  stat(ctx, v, lt) {
    const target = parseFloat(v.value), isNum = !isNaN(target);
    const p = ease.out(prog(lt, 0.1, 0.9));
    const shown = isNum ? String(Math.round(target * p)) : v.value;
    ctx.save(); ctx.translate(540, 720);
    ctx.strokeStyle = 'rgba(244,236,220,0.12)'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = P.red; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 300, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.stroke();
    font(ctx, shown.length > 3 ? 190 : 260, 900, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = P.cream; ctx.fillText(shown, 0, 80);
    font(ctx, 60, 800, MONO); ctx.fillStyle = P.red; ctx.fillText((v.unit || '').toUpperCase(), 0, 175);
    ctx.restore();
    if (v.note) { const q = ease.out(prog(lt, 0.9, 0.4)); ctx.globalAlpha = q; font(ctx, 44, 600, MONO); ctx.fillStyle = P.mute; ctx.textAlign = 'center'; ctx.fillText(v.note, 540, 1110); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  },
  document(ctx, v, lt) {
    const x = 150, y = 400, w = 780, h = 700;
    paper(ctx, x, y, w, h, -0.015, '#f3f0e4');
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(-0.015); ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.fillStyle = 'rgba(120,170,140,0.18)'; for (let r = 0; r < 14; r += 2) ctx.fillRect(x, y + 40 + r * 46, w, 46);
    for (let r = 0; r < 14; r++) { ctx.fillStyle = '#cfc8b5'; ctx.beginPath(); ctx.arc(x + 24, y + 60 + r * 46, 9, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + w - 24, y + 60 + r * 46, 9, 0, Math.PI * 2); ctx.fill(); }
    const code = (v.code || '6EQUJ5').split(''), col = v.column ?? 6, row0 = v.row ?? 4, chars = '1111211131112111121';
    font(ctx, 34, 500, MONO); ctx.fillStyle = '#3a3a3a';
    const rowsShown = Math.floor(clamp(lt / 0.6) * 14);
    for (let r = 0; r < rowsShown; r++) for (let c = 0; c < 14; c++) {
      let ch = chars[Math.floor(R(r * 31 + c * 7) * chars.length)]; if (R(r * 13 + c) > 0.82) ch = ' ';
      if (c === col && r >= row0 && r < row0 + code.length) ch = code[r - row0];
      ctx.fillText(ch, x + 70 + c * 47, y + 72 + r * 46);
    }
    const cx = x + 70 + col * 47 + 11, cy = y + 72 + row0 * 46 + ((code.length - 1) * 46) / 2 - 13;
    if (v.circle) {
      const cp = ease.inOut(prog(lt, v.circleAt ?? 0.5, 0.6));
      ctx.strokeStyle = P.red; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(cx, cy, 40, code.length * 25, 0.03, -Math.PI / 2, -Math.PI / 2 + cp * Math.PI * 2.08); ctx.stroke();
    }
    if (v.note) {
      const np = ease.out(prog(lt, v.noteAt ?? 1.1, 0.35));
      if (np > 0) { ctx.save(); ctx.translate(cx + 70, cy - 40); ctx.rotate(-0.12); ctx.transform(1, 0, -0.28, 1, 0, 0); ctx.globalAlpha = np; font(ctx, 110 * (0.6 + 0.4 * np), 900, DISPLAY); ctx.fillStyle = P.red; ctx.fillText(v.note, 0, 0); ctx.restore(); }
    }
    ctx.restore();
  },
  word(ctx, v, lt) {
    const p = ease.back(prog(lt, 0, 0.35));
    ctx.save(); ctx.translate(540, 760); ctx.rotate(-0.1); ctx.scale(p, p); ctx.transform(1, 0, -0.25, 1, 0, 0);
    font(ctx, v.size || 230, 900, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = v.color || P.red; ctx.shadowColor = 'rgba(214,58,47,0.5)'; ctx.shadowBlur = 40; ctx.fillText(v.text, 0, 100); ctx.shadowBlur = 0;
    const up = ease.inOut(prog(lt, 0.35, 0.4)); const w = ctx.measureText(v.text).width;
    ctx.strokeStyle = v.color || P.red; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-w / 2, 160); ctx.quadraticCurveTo(0, 190, -w / 2 + w * up, 150); ctx.stroke();
    ctx.restore(); ctx.textAlign = 'left';
  },
  radar(ctx, v, lt, dur, t) {
    const cx = 540, cy = 700, r = 330;
    ctx.fillStyle = '#04140b'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(93,255,154,0.25)'; ctx.lineWidth = 3; for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, (r * k) / 3, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    const a = t * 2.2; const g = ctx.createConicGradient ? ctx.createConicGradient(a - 0.8, cx, cy) : null;
    ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a - 0.7, a); ctx.closePath(); ctx.fillStyle = 'rgba(93,255,154,0.25)'; ctx.fill(); ctx.restore(); void g;
    ctx.strokeStyle = P.green; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke();
    ctx.strokeStyle = '#2a3a30'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();
    font(ctx, 40, 700, MONO); ctx.textAlign = 'center';
    const yrs = Math.round((v.years || 40) * ease.out(prog(lt, 0.2, 1.2)));
    ctx.fillStyle = P.cream; ctx.fillText(`${(v.label || 'YEARS SEARCHING').toUpperCase()}: ${yrs}`, 540, 1100);
    ctx.fillStyle = P.red; ctx.fillText(`${(v.result || 'SIGNAL FOUND AGAIN').toUpperCase()}: 0`, 540, 1160);
    ctx.textAlign = 'left';
  },
  diagram(ctx, v, lt, dur, t) {
    const nodes = v.nodes || [], n = nodes.length, y = 700;
    nodes.forEach((nd, i) => {
      const x = 540 + (i - (n - 1) / 2) * 330, p = ease.back(prog(lt, 0.2 + i * 0.45, 0.4));
      if (i > 0) { const lp = ease.out(prog(lt, i * 0.45, 0.4)), px = 540 + (i - 1 - (n - 1) / 2) * 330; ctx.strokeStyle = 'rgba(244,236,220,0.35)'; ctx.setLineDash([14, 14]); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px + 110, y); ctx.lineTo(px + 110 + (x - px - 220) * lp, y); ctx.stroke(); ctx.setLineDash([]);
        const k = ((t * 0.9 + i * 0.3) % 1); if (lp >= 1) { ctx.fillStyle = P.yellow; ctx.beginPath(); ctx.arc(px + 110 + (x - px - 220) * k, y, 10, 0, Math.PI * 2); ctx.fill(); } }
      if (p <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(p * 0.62, p * 0.62); (ICONS[nd.icon] || ICONS.question)(ctx, t); ctx.restore();
      ctx.globalAlpha = clamp(p); font(ctx, 36, 700, MONO); ctx.fillStyle = P.cream; ctx.textAlign = 'center';
      (nd.label || '').toUpperCase().split('\n').forEach((l, j) => ctx.fillText(l, x, y + 170 + j * 44)); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    });
    if (v.title) { font(ctx, 40, 700, MONO); ctx.fillStyle = P.red; ctx.textAlign = 'center'; ctx.globalAlpha = ease.out(prog(lt, 0, 0.3)); ctx.fillText(v.title.toUpperCase(), 540, 450); ctx.globalAlpha = 1; ctx.textAlign = 'left'; }
  },
  icon(ctx, v, lt, dur, t) {
    const p = ease.back(prog(lt, 0, 0.4));
    ctx.save(); ctx.translate(540, 720); ctx.scale(p * (v.scale || 1.2), p * (v.scale || 1.2)); (ICONS[v.icon] || ICONS.question)(ctx, t); ctx.restore();
    if (v.label) { ctx.globalAlpha = ease.out(prog(lt, 0.4, 0.4)); font(ctx, 44, 700, MONO); ctx.fillStyle = P.cream; ctx.textAlign = 'center'; ctx.fillText(v.label.toUpperCase(), 540, 1110); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  },
  versus(ctx, v, lt) {
    [[v.a, P.cream, P.ink, -1], [v.b, P.red, P.cream, 1]].forEach(([txt, bg, fg, s], i) => {
      const p = ease.back(prog(lt, 0.1 + i * 0.35, 0.4)); if (p <= 0) return;
      ctx.save(); ctx.translate(540 + s * 215, 720); ctx.rotate(s * 0.05); ctx.scale(p, p);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-190, -250, 400, 520); ctx.fillStyle = bg; ctx.fillRect(-200, -260, 400, 520);
      font(ctx, 150, 900, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = fg; ctx.globalAlpha = 0.25; ctx.fillText(i ? 'B' : 'A', 0, -60); ctx.globalAlpha = 1;
      font(ctx, 50, 900, DISPLAY); (txt || '').toUpperCase().split('\n').forEach((l, j) => ctx.fillText(l, 0, 60 + j * 60));
      ctx.restore();
    });
    const q = ease.back(prog(lt, 0.8, 0.3)); if (q > 0) { ctx.save(); ctx.translate(540, 720); ctx.scale(q, q); ctx.fillStyle = P.bg; ctx.beginPath(); ctx.arc(0, 0, 75, 0, Math.PI * 2); ctx.fill(); font(ctx, 64, 900, DISPLAY); ctx.fillStyle = P.yellow; ctx.textAlign = 'center'; ctx.fillText('OR', 0, 23); ctx.restore(); ctx.textAlign = 'left'; }
  },
  cta(ctx, v, lt, dur, t) {
    const p = ease.out(prog(lt, 0, 0.4));
    ctx.globalAlpha = p; font(ctx, 96, 900, DISPLAY); ctx.fillStyle = P.cream; ctx.textAlign = 'center';
    (v.text || 'Comment your theory').toUpperCase().split('\n').forEach((l, i) => ctx.fillText(l, 540, 600 + i * 108));
    font(ctx, 42, 700, MONO); ctx.fillStyle = P.red; ctx.fillText((v.next || 'CASE 002').includes(':') ? v.next.toUpperCase() : `NEXT: ${(v.next || 'CASE 002').toUpperCase()}`, 540, 950);
    const b = Math.sin(t * 6) * 12; ctx.fillStyle = P.yellow; ctx.beginPath(); ctx.moveTo(510, 1010 + b); ctx.lineTo(570, 1010 + b); ctx.lineTo(540, 1060 + b); ctx.fill();
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    stamp(ctx, v.stamp || 'STILL OPEN', 540, 380, -0.08, prog(lt, 0.5, 0.3), P.red, 70);
  },
};
export const VISUAL_NAMES = Object.keys(VISUALS);
