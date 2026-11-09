// "What if you could live in a movie for one month?" - 1080x1920 reel.
// Frames are drawn with canvas, music + SFX are synthesized here, ffmpeg muxes it all.
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../out');
mkdirSync(OUT, { recursive: true });

const W = 1080, H = 1920, FPS = 30;
const C = { bg: '#f3efe7', ink: '#141414', red: '#e8432f', mute: '#8a857c', card: '#ffffff', dark: '#1c1c1f', cream: '#f3efe7' };
const DISPLAY = '"Inter Display"', MONO = '"JetBrains Mono"';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const prog = (t, s, d) => clamp((t - s) / d);
const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

// ---------- timeline ----------
const GENRE_DUR = 3.9;
const GENRES = [
  { name: 'Space Epic', file: 'space_epic.mp4', icon: planet, pro: 'Zero-gravity mornings', con: 'One toilet. 400 crew.' },
  { name: 'Fantasy Kingdom', file: 'fantasy_kingdom.mp4', icon: castle, pro: 'You get a dragon', con: 'No wifi. No dentists.' },
  { name: 'Heist Thriller', file: 'heist.mp4', icon: diamond, pro: 'Everyone looks this cool', con: 'You trip the alarm.' },
  { name: 'Rainy Rom-Com', file: 'rom_com.mp4', icon: heart, pro: 'Rain is always romantic', con: 'Constant airport sprints' },
  { name: 'Dinosaur Island', file: 'dino_island.mp4', icon: footprint, pro: 'Real dinosaurs.', con: 'Real dinosaurs.' },
];
const SCENES = [
  { dur: 4.5, draw: hook },
  { dur: 5.5, draw: rules },
  { dur: GENRE_DUR * GENRES.length, draw: picks },
  { dur: 6, draw: twist, dark: true },
  { dur: 6, draw: cta },
];
let acc = 0;
for (const s of SCENES) { s.start = acc; acc += s.dur; }
const TOTAL = acc;
const BOUNDARIES = SCENES.slice(1).map((s) => s.start);

// ---------- drawing helpers ----------
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function font(ctx, size, weight = 900, family = DISPLAY) { ctx.font = `${weight} ${size}px ${family}`; }

// Masked slide-up text reveal. `segs` is a string or [{s, c}] for mixed colours.
function line(ctx, segs, x, y, t, delay, o = {}) {
  const { size = 120, weight = 900, family = DISPLAY, color = C.ink, dur = 0.5, align = 'left' } = o;
  const p = ease.out(prog(t, delay, dur));
  if (p <= 0) return;
  if (typeof segs === 'string') segs = [{ s: segs, c: color }];
  font(ctx, size, weight, family);
  const total = segs.reduce((a, g) => a + ctx.measureText(g.s).width, 0);
  let cx = align === 'center' ? x - total / 2 : x;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, y - size * 1.05, W, size * 1.35); ctx.clip();
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const dy = (1 - p) * size * 1.25;
  for (const g of segs) { ctx.fillStyle = g.c || color; ctx.fillText(g.s, cx, y + dy); cx += ctx.measureText(g.s).width; }
  ctx.restore();
}

function kicker(ctx, str, t, color = C.mute) {
  const p = ease.out(prog(t, 0, 0.4));
  ctx.save(); ctx.globalAlpha = p; font(ctx, 34, 500, MONO); ctx.fillStyle = color; ctx.fillText(str, 90 - (1 - p) * 30, 300); ctx.restore();
}

let halftoneLight, halftoneDark;
function makeHalftone(color) {
  const c = createCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = color;
  for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) { g.beginPath(); g.arc(x, y, 1.5, 0, Math.PI * 2); g.fill(); }
  return c;
}
function background(ctx, dark) {
  ctx.fillStyle = dark ? C.ink : C.bg; ctx.fillRect(0, 0, W, H);
  halftoneLight ??= makeHalftone('rgba(0,0,0,0.045)');
  halftoneDark ??= makeHalftone('rgba(255,255,255,0.05)');
  ctx.drawImage(dark ? halftoneDark : halftoneLight, 0, 0);
}

function shadowCard(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = 'rgba(20,20,20,0.9)'; rr(ctx, x + 10, y + 12, w, h, r); ctx.fill();
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.stroke();
}

function windowCard(ctx, x, y, w, h, title) {
  shadowCard(ctx, x, y, w, h, 28, C.dark);
  ['#5a5a5e', '#5a5a5e', '#5a5a5e'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 44 + i * 30, y + 42, 9, 0, Math.PI * 2); ctx.fill(); });
  font(ctx, 28, 500, MONO); ctx.fillStyle = 'rgba(243,239,231,0.75)'; ctx.fillText(title, x + 150, y + 52);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 3, y + 80, w - 6, 2);
}

function tag(ctx, label, x, y, fill) {
  font(ctx, 30, 700, MONO);
  const w = ctx.measureText(label).width + 36;
  ctx.fillStyle = fill; rr(ctx, x, y - 40, w, 54, 12); ctx.fill();
  ctx.fillStyle = C.cream; ctx.fillText(label, x + 18, y - 3);
  return w;
}

// ---------- icons (drawn on the dark window card) ----------
function planet(ctx, cx, cy, t) {
  for (let i = 0; i < 46; i++) {
    const sx = cx - 340 + ((i * 137) % 680), sy = cy - 200 + ((i * 89) % 400);
    ctx.fillStyle = `rgba(243,239,231,${0.25 + 0.75 * Math.abs(Math.sin(t * 2 + i))})`; ctx.fillRect(sx, sy, 4, 4);
  }
  cy += Math.sin(t * 2) * 10;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.35);
  ctx.strokeStyle = C.cream; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.ellipse(0, 0, 230, 58, 0, Math.PI, 2 * Math.PI); ctx.stroke();
  const g = ctx.createRadialGradient(-50, -50, 10, 0, 0, 150); g.addColorStop(0, '#ff8a6a'); g.addColorStop(1, C.red);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 135, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-135, -20, 270, 14); ctx.fillRect(-120, 35, 240, 10);
  ctx.beginPath(); ctx.ellipse(0, 0, 230, 58, 0, 0, Math.PI); ctx.stroke();
  ctx.restore();
  const a = t * 1.6;
  ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 300, cy - 60 + Math.sin(a) * 80, 20, 0, Math.PI * 2); ctx.fill();
}

function castle(ctx, cx, cy, t) {
  ctx.fillStyle = 'rgba(243,239,231,0.9)'; ctx.beginPath(); ctx.arc(cx + 210, cy - 150, 50, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.dark; ctx.beginPath(); ctx.arc(cx + 235, cy - 165, 46, 0, Math.PI * 2); ctx.fill();
  const base = cy + 200;
  ctx.save(); ctx.translate(cx, base); ctx.scale(0.82, 0.82); ctx.translate(-cx, -base);
  ctx.fillStyle = C.cream;
  const block = (x, w, h) => {
    ctx.fillRect(x, base - h, w, h);
    for (let i = 0; i < w; i += 36) ctx.fillRect(x + i, base - h - 26, 20, 26);
  };
  block(cx - 230, 110, 300); block(cx + 120, 110, 300); block(cx - 130, 260, 200);
  [cx - 175, cx + 175].forEach((fx, i) => {
    ctx.fillStyle = C.cream; ctx.fillRect(fx - 3, base - 400, 6, 76);
    const wave = Math.sin(t * 6 + i) * 10;
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(fx + 3, base - 400); ctx.quadraticCurveTo(fx + 40, base - 390 + wave, fx + 80, base - 382 + wave); ctx.lineTo(fx + 3, base - 360); ctx.fill();
  });
  ctx.fillStyle = C.dark; ctx.beginPath(); ctx.moveTo(cx - 45, base); ctx.lineTo(cx - 45, base - 80); ctx.arc(cx, base - 80, 45, Math.PI, 0); ctx.lineTo(cx + 45, base); ctx.fill();
  const glow = 0.6 + 0.4 * Math.sin(t * 4);
  ctx.fillStyle = `rgba(232,67,47,${glow})`; ctx.fillRect(cx - 190, base - 220, 30, 44); ctx.fillRect(cx + 160, base - 220, 30, 44);
  ctx.restore();
}

function diamond(ctx, cx, cy, t) {
  ctx.save(); ctx.strokeStyle = 'rgba(232,67,47,0.7)'; ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const off = ((t * 120 + i * 170) % 680) - 340;
    ctx.beginPath(); ctx.moveTo(cx - 360, cy + off - 120); ctx.lineTo(cx + 360, cy + off + 120); ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.translate(cx, cy + Math.sin(t * 2.5) * 8); ctx.rotate(Math.sin(t * 1.5) * 0.06);
  const P = [[-160, -50], [-85, -130], [85, -130], [160, -50], [0, 150]];
  const g = ctx.createLinearGradient(-160, -130, 160, 150); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#bfe3f0');
  ctx.fillStyle = g; ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.dark; ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-160, -50); ctx.lineTo(160, -50);
  [[-85, -130, -50], [85, -130, 50]].forEach(([x, y, m]) => { ctx.moveTo(x, y); ctx.lineTo(m, -50); ctx.lineTo(0, 150); });
  ctx.moveTo(-160, -50); ctx.lineTo(0, 150); ctx.moveTo(160, -50); ctx.lineTo(0, 150);
  ctx.stroke(); ctx.restore();
  for (let i = 0; i < 3; i++) {
    const s = 22 + 18 * Math.abs(Math.sin(t * 3 + i * 2));
    const [sx, sy] = [[cx + 190, cy - 140], [cx - 210, cy + 60], [cx + 150, cy + 130]][i];
    ctx.fillStyle = C.cream; ctx.beginPath();
    ctx.moveTo(sx, sy - s); ctx.quadraticCurveTo(sx, sy, sx + s, sy); ctx.quadraticCurveTo(sx, sy, sx, sy + s);
    ctx.quadraticCurveTo(sx, sy, sx - s, sy); ctx.quadraticCurveTo(sx, sy, sx, sy - s); ctx.fill();
  }
}

function heart(ctx, cx, cy, t) {
  ctx.strokeStyle = 'rgba(243,239,231,0.45)'; ctx.lineWidth = 3;
  for (let i = 0; i < 36; i++) {
    const x = cx - 350 + ((i * 97) % 700), y = cy - 220 + ((t * 700 + i * 131) % 440);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 30); ctx.stroke();
  }
  const s = 1 + 0.08 * Math.pow(Math.max(0, Math.sin(t * 7)), 4);
  ctx.save(); ctx.translate(cx, cy + 10); ctx.scale(s * 1.25, s * 1.25);
  ctx.fillStyle = C.red; ctx.beginPath();
  ctx.moveTo(0, 50); ctx.bezierCurveTo(-130, -30, -80, -140, 0, -70); ctx.bezierCurveTo(80, -140, 130, -30, 0, 50);
  ctx.moveTo(0, 50); ctx.lineTo(0, 120);
  ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 105); ctx.bezierCurveTo(-120, 25, -105, -125, 0, -70); ctx.bezierCurveTo(105, -125, 120, 25, 0, 105); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-50, -50, 18, 28, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function footprint(ctx, cx, cy, t) {
  const beat = (t % 0.9) / 0.9, thump = Math.max(0, 1 - beat * 4);
  for (let k = 0; k < 2; k++) {
    const r = ((beat + k * 0.5) % 1) * 330;
    ctx.strokeStyle = `rgba(243,239,231,${0.35 * (1 - r / 330)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy + 40, r, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
  }
  const sx = (Math.sin(t * 90) * 10) * thump, sy = (Math.cos(t * 70) * 8) * thump;
  ctx.save(); ctx.translate(cx + sx, cy + sy); ctx.fillStyle = C.cream;
  ctx.beginPath(); ctx.ellipse(0, 80, 85, 70, 0, 0, Math.PI * 2); ctx.fill();
  [[-95, -40, -0.5], [0, -90, 0], [95, -40, 0.5]].forEach(([x, y, a]) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-30, 50); ctx.quadraticCurveTo(-34, -40, 0, -80); ctx.quadraticCurveTo(34, -40, 30, 50); ctx.closePath(); ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

// ---------- scenes ----------
function hook(ctx, t) {
  kicker(ctx, '// a thought experiment', t);
  line(ctx, 'What if you', 90, 520, t, 0.15);
  line(ctx, 'could live', 90, 650, t, 0.35);
  line(ctx, [{ s: 'inside a ' }, { s: 'movie', c: C.red }], 90, 780, t, 0.55);
  line(ctx, 'of your choice...', 90, 880, t, 0.9, { size: 60, weight: 600, color: C.mute });

  const p = prog(t, 1.8, 0.45);
  if (p > 0) {
    const s = 1.8 - 0.8 * ease.back(p);
    ctx.save(); ctx.translate(540, 1030); ctx.rotate(-0.05); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3);
    font(ctx, 96, 900); const label = 'FOR ONE MONTH?'; const w = ctx.measureText(label).width + 70;
    ctx.fillStyle = C.ink; rr(ctx, -w / 2 + 10, -70 + 12, w, 135, 18); ctx.fill();
    ctx.fillStyle = C.red; rr(ctx, -w / 2, -70, w, 135, 18); ctx.fill();
    ctx.fillStyle = C.cream; ctx.textAlign = 'center'; ctx.fillText(label, 0, 32);
    ctx.restore();
  }
  // scrolling film strip
  const fp = ease.out(prog(t, 0.3, 0.6));
  ctx.save(); ctx.globalAlpha = fp; ctx.translate(0, (1 - fp) * 60);
  const y0 = 1200, hh = 150;
  ctx.fillStyle = C.ink; ctx.fillRect(0, y0, W, hh);
  const off = -(t * 220) % 200;
  const fills = [C.red, C.cream, C.mute, '#d9a441'];
  for (let x = off - 200, i = 0; x < W + 200; x += 200, i++) {
    ctx.fillStyle = C.bg; for (let k = 0; k < 4; k++) { ctx.fillRect(x + 16 + k * 48, y0 + 10, 26, 16); ctx.fillRect(x + 16 + k * 48, y0 + hh - 26, 26, 16); }
    ctx.fillStyle = fills[(i + Math.floor(t * 220 / 200)) % 4 + 0 < 4 ? (i + Math.floor(t * 220 / 200)) % 4 : 0];
    rr(ctx, x + 14, y0 + 36, 172, hh - 72, 8); ctx.fill();
  }
  ctx.restore();
}

function rules(ctx, t) {
  kicker(ctx, '// 01 · the rules', t);
  line(ctx, 'Three rules.', 90, 470, t, 0.1);
  const items = [
    ['30 days', "Then you're pulled back out."],
    ["You're an extra", 'Not the hero. Just... there.'],
    ["Can't change the plot", 'The ending happens anyway.'],
  ];
  items.forEach(([title, sub], i) => {
    const p = prog(t, 0.6 + i * 0.75, 0.55);
    if (p <= 0) return;
    const x = 90 + (1 - ease.back(p)) * 900, y = 560 + i * 225;
    ctx.save(); ctx.globalAlpha = clamp(p * 2);
    shadowCard(ctx, x, y, 820, 190, 26, C.card);
    ctx.fillStyle = i === 2 ? C.red : C.ink; rr(ctx, x + 30, y + 35, 120, 120, 20); ctx.fill();
    font(ctx, 90, 900); ctx.fillStyle = C.cream; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x + 90, y + 128); ctx.textAlign = 'left';
    font(ctx, 58, 900); ctx.fillStyle = C.ink; ctx.fillText(title, x + 185, y + 92);
    font(ctx, 36, 500); ctx.fillStyle = C.mute; ctx.fillText(sub, x + 185, y + 145);
    ctx.restore();
  });
}

function picks(ctx, t) {
  kicker(ctx, '// 02 · pick your movie', t);
  const i = Math.min(GENRES.length - 1, Math.floor(t / GENRE_DUR));
  const lt = t - i * GENRE_DUR, g = GENRES[i];

  // counter badge
  const bp = ease.back(prog(lt, 0, 0.35));
  ctx.save(); ctx.translate(900, 290); ctx.scale(0.6 + 0.4 * bp, 0.6 + 0.4 * bp);
  ctx.fillStyle = C.ink; rr(ctx, -60, -70, 120, 140, 22); ctx.fill();
  font(ctx, 80, 900); ctx.fillStyle = C.cream; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), 0, 22);
  for (let k = 0; k < GENRES.length; k++) { ctx.fillStyle = k === i ? C.red : k < i ? C.cream : '#55555a'; ctx.beginPath(); ctx.arc(-32 + k * 16, 48, 5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();

  const pin = ease.out(prog(lt, 0, 0.45));
  const pout = ease.in(prog(lt, GENRE_DUR - 0.3, 0.3));
  const dx = (1 - pin) * W * 0.9 - (i < GENRES.length - 1 ? pout * W : 0);
  ctx.save(); ctx.translate(dx, 0);
  windowCard(ctx, 90, 400, 810, 540, g.file);
  ctx.save(); ctx.beginPath(); rr(ctx, 93, 483, 804, 454, 26); ctx.clip();
  g.icon(ctx, 495, 700, lt);
  ctx.restore();
  ctx.restore();

  ctx.save(); ctx.translate(Math.min(0, dx), 0);
  line(ctx, g.name, 90, 1085, lt, 0.25, { size: 104 });
  const lineIn = (label, fill, text, y, d) => {
    const p = ease.out(prog(lt, d, 0.4)); if (p <= 0) return;
    const shake = label === 'CON' ? Math.sin(lt * 60) * 8 * Math.max(0, 1 - (lt - d) * 4) : 0;
    ctx.save(); ctx.globalAlpha = p; ctx.translate((1 - p) * 40 + shake, 0);
    const w = tag(ctx, label, 90, y, fill);
    font(ctx, 52, 700); ctx.fillStyle = C.ink; ctx.fillText(text, 90 + w + 22, y);
    ctx.restore();
  };
  lineIn('PRO', C.ink, g.pro, 1185, 1.0);
  lineIn('CON', C.red, g.con, 1275, 1.9);
  ctx.restore();
}

function twist(ctx, t) {
  kicker(ctx, '// 03 · the catch', t, 'rgba(243,239,231,0.5)');
  line(ctx, "But here's", 90, 560, t, 0.2, { color: C.cream, size: 130 });
  line(ctx, 'the catch.', 90, 700, t, 0.45, { color: C.cream, size: 130 });
  line(ctx, 'When the month ends,', 90, 860, t, 1.6, { color: 'rgba(243,239,231,0.7)', size: 62, weight: 600 });
  line(ctx, 'you remember everything.', 90, 945, t, 2.2, { color: C.cream, size: 62, weight: 700 });
  const shake = Math.sin(t * 70) * 10 * Math.max(0, 1 - (t - 3.3) * 3) * (t > 3.3 ? 1 : 0);
  ctx.save(); ctx.translate(shake, 0);
  line(ctx, 'Nobody else', 90, 1130, t, 3.3, { color: C.red, size: 120, dur: 0.35 });
  line(ctx, 'does.', 90, 1255, t, 3.45, { color: C.red, size: 120, dur: 0.35 });
  ctx.restore();
}

function cta(ctx, t) {
  kicker(ctx, '// 04 · your turn', t);
  line(ctx, 'So...', 90, 460, t, 0.1, { size: 80, weight: 600, color: C.mute });
  line(ctx, 'Which movie', 90, 610, t, 0.45, { size: 135 });
  line(ctx, 'are you', 90, 750, t, 0.7, { size: 135 });
  line(ctx, 'picking?', 90, 890, t, 0.95, { size: 135, color: C.red });

  const p = ease.out(prog(t, 1.8, 0.5));
  if (p > 0) {
    ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 80);
    font(ctx, 34, 500, MONO); ctx.fillStyle = C.mute; ctx.fillText('drop it in the comments', 90, 1080);
    const by = Math.sin(t * 6) * 10;
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(560, 1050 + by); ctx.lineTo(600, 1050 + by); ctx.lineTo(580, 1080 + by); ctx.fill();
    shadowCard(ctx, 90, 1120, 820, 130, 65, C.dark);
    const msg = 'dinosaur island. obviously.';
    const n = Math.floor(clamp((t - 2.4) / 0.06, 0, msg.length));
    font(ctx, 46, 500); ctx.fillStyle = n ? C.cream : 'rgba(243,239,231,0.45)';
    const shown = n ? msg.slice(0, n) : 'Add comment...';
    ctx.fillText(shown, 145, 1200);
    if (n && Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = C.red; ctx.fillRect(150 + ctx.measureText(shown).width, 1160, 5, 52); }
    ctx.restore();
  }
}

// ---------- frame compositor ----------
function wipe(ctx, t) {
  for (const b of BOUNDARIES) {
    const d = 0.28;
    let x0, x1;
    if (t >= b - d && t < b) { const p = ease.inOut((t - (b - d)) / d); x0 = 0; x1 = p * W; }
    else if (t >= b && t < b + d) { const p = ease.inOut((t - b) / d); x0 = p * W; x1 = W; }
    else continue;
    ctx.fillStyle = C.red; ctx.fillRect(x0, 0, x1 - x0, H);
    ctx.fillStyle = C.ink; ctx.fillRect(x1 - 24, 0, 24, H);
  }
}

function drawFrame(ctx, t) {
  const scene = SCENES.findLast((s) => t >= s.start) ?? SCENES[0];
  background(ctx, scene.dark);
  scene.draw(ctx, t - scene.start);
  wipe(ctx, t);
  const fade = clamp((TOTAL - t) / 0.5);
  if (fade < 1) { ctx.fillStyle = `rgba(243,239,231,${1 - fade})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- audio: original synth bed + SFX ----------
function renderAudio(file) {
  const SR = 44100, N = Math.ceil(TOTAL * SR), L = new Float32Array(N), R = new Float32Array(N);
  const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan) ; R[i] += v * (1 + pan); } };
  const BEAT = 0.6; // 100 bpm
  const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
  const twistS = SCENES[3].start, twistE = twistS + SCENES[3].dur;
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

  // pad + bass
  for (let i = 0; i < N; i++) {
    const t = i / SR, ci = Math.floor(t / (BEAT * 8)) % 4, ch = chords[ci];
    const local = (t % (BEAT * 8)) / (BEAT * 8);
    const env = Math.min(1, local * 6) * (0.75 + 0.25 * Math.cos(local * Math.PI * 2));
    let v = 0;
    for (const f of ch) v += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * t) + 0.15 * Math.sin(2 * Math.PI * f * 0.997 * t);
    const bass = Math.sin(2 * Math.PI * (ch[0] / 2) * t) * 0.9;
    const s = (v * 0.022 + bass * 0.05 * (t > twistS && t < twistE ? 0.4 : 1)) * env;
    add(i, s, Math.sin(t * 0.7) * 0.2);
  }
  // arpeggio (eighth notes), kick, hats
  for (let b = 0; b * BEAT < TOTAL; b += 0.5) {
    const t0 = b * BEAT, ci = Math.floor(t0 / (BEAT * 8)) % 4, ch = chords[ci];
    const inTwist = t0 >= twistS && t0 < twistE;
    const f = ch[[0, 1, 2, 1][Math.round(b * 2) % 4]] * 2;
    const len = Math.floor(0.35 * SR), i0 = Math.floor(t0 * SR);
    for (let k = 0; k < len; k++) {
      const tt = k / SR, e = Math.exp(-tt * 9);
      add(i0 + k, Math.sin(2 * Math.PI * f * tt) * e * (inTwist ? 0.035 : 0.05), (Math.round(b * 2) % 2 ? 0.3 : -0.3));
    }
    if (inTwist || t0 < 0.6) continue;
    if (Number.isInteger(b)) {
      for (let k = 0; k < 0.25 * SR; k++) {
        const tt = k / SR, f2 = 50 + 90 * Math.exp(-tt * 30);
        add(i0 + k, Math.sin(2 * Math.PI * f2 * tt) * Math.exp(-tt * 14) * 0.32);
      }
    } else {
      for (let k = 0; k < 0.05 * SR; k++) add(i0 + k, rnd() * Math.exp(-k / SR * 80) * 0.05, 0.2);
    }
  }
  // SFX
  const whoosh = (tc) => {
    const d = 0.5, i0 = Math.floor((tc - d * 0.6) * SR); let y = 0;
    for (let k = 0; k < d * SR; k++) {
      const p = k / (d * SR), a = 0.02 + 0.25 * Math.sin(p * Math.PI);
      y += a * (rnd() - y); add(i0 + k, y * Math.sin(p * Math.PI) * 0.6, (p - 0.5) * 1.2);
    }
  };
  const blip = (tc, f = 880, vol = 0.12) => {
    const i0 = Math.floor(tc * SR);
    for (let k = 0; k < 0.12 * SR; k++) { const tt = k / SR; add(i0 + k, Math.sin(2 * Math.PI * (f + 400 * Math.exp(-tt * 40)) * tt) * Math.exp(-tt * 30) * vol); }
  };
  const thud = (tc) => {
    const i0 = Math.floor(tc * SR);
    for (let k = 0; k < 0.5 * SR; k++) { const tt = k / SR; add(i0 + k, (Math.sin(2 * Math.PI * (40 + 120 * Math.exp(-tt * 20)) * tt) * 0.5 + rnd() * 0.15 * Math.exp(-tt * 40)) * Math.exp(-tt * 7)); }
  };
  BOUNDARIES.forEach(whoosh);
  [0.15, 0.35, 0.55].forEach((x) => blip(x, 660, 0.07));
  thud(1.8);
  [0.6, 1.35, 2.1].forEach((x) => blip(SCENES[1].start + x, 740));
  GENRES.forEach((_, i) => {
    const s = SCENES[2].start + i * GENRE_DUR;
    if (i) whoosh(s);
    blip(s + 1.0, 880); blip(s + 1.9, 520, 0.16);
  });
  thud(twistS + 3.3);
  [0.45, 0.7, 0.95].forEach((x) => blip(SCENES[4].start + x, 700, 0.07));
  for (let c = 0; c < 27; c++) blip(SCENES[4].start + 2.4 + c * 0.06, 2400 + (c % 3) * 300, 0.025);

  // master: fade, normalize, write 16-bit WAV
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, g = Math.min(1, t / 0.3) * Math.min(1, (TOTAL - t) / 1.5);
    L[i] *= g; R[i] *= g; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const norm = 0.89 / peak, buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4); }
  writeFileSync(file, buf);
}

// ---------- main ----------
const stillsAt = process.argv.includes('--stills') ? [2.6, 8, 12.5, 16.5, 20, 24, 28, 34, 39.5] : null;
const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
if (stillsAt) {
  stillsAt.forEach((t, k) => { drawFrame(ctx, t); writeFileSync(path.join(OUT, `still-${k}.png`), canvas.toBuffer('image/png')); });
  console.log('stills written');
} else {
  const wav = path.join(OUT, 'movie-month.wav'), mp4 = path.join(OUT, 'movie-month.mp4');
  renderAudio(wav);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(TOTAL * FPS);
  for (let f = 0; f < frames; f++) {
    drawFrame(ctx, f / FPS);
    const data = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(data.buffer, data.byteOffset, data.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  ff.on('close', (c) => console.log(c === 0 ? `Rendered ${mp4} (${TOTAL.toFixed(1)}s)` : `ffmpeg exited ${c}`));
}
