// Procedural cartoon bust: flat shapes with angular shading, lip-sync, blinks, emotions.
// Coordinates: origin = base of the neck, head centre sits 230px above it.

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255];
  const f = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return `rgb(${ch.map(f).join(',')})`;
}

const EMO = {
  neutral: { lift: 0, tilt: 0, eye: 1, mouth: 'flat' },
  happy: { lift: -6, tilt: -2, eye: 0.85, mouth: 'smile', blush: true },
  scared: { lift: -14, tilt: -12, eye: 1.35, mouth: 'o-small', sweat: true },
  angry: { lift: 4, tilt: 16, eye: 0.7, mouth: 'tight' },
  sad: { lift: -4, tilt: -12, eye: 0.8, mouth: 'frown' },
  surprised: { lift: -22, tilt: 0, eye: 1.4, mouth: 'o' },
  smug: { lift: 0, tilt: 6, eye: 0.62, mouth: 'smirk', asym: -14 },
  confused: { lift: -4, tilt: 0, eye: 1, mouth: 'wavy', asym: -16 },
};
export const EMOTIONS = Object.keys(EMO);

function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967295; }

const HEAD = [[-125, -40], [-118, 60], [-80, 125], [0, 160], [80, 125], [118, 60], [125, -40], [110, -130], [0, -160], [-110, -130]];
const HEAD_SHADOW = [[50, -150], [110, -130], [125, -40], [118, 60], [80, 125], [25, 152], [62, 60], [72, -40]];
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

function torso(ctx, o) {
  const c = o.color || '#3b3f5c', dark = shade(c, -0.28);
  if (o.style === 'hoodie') { ctx.fillStyle = shade(c, -0.4); ctx.beginPath(); ctx.ellipse(0, 18, 165, 62, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(-310, 760); ctx.lineTo(-295, 180); ctx.quadraticCurveTo(-275, 62, -150, 32); ctx.lineTo(-60, 4);
  ctx.lineTo(60, 4); ctx.lineTo(150, 32); ctx.quadraticCurveTo(275, 62, 295, 180); ctx.lineTo(310, 760); ctx.closePath(); ctx.fill();
  ctx.fillStyle = dark; poly(ctx, [[60, 4], [150, 32], [270, 66], [295, 180], [310, 760], [130, 760], [105, 110]]); ctx.fill();
  if (o.style === 'jacket') {
    ctx.fillStyle = o.inner || '#f2efe6'; poly(ctx, [[-70, 4], [70, 4], [52, 760], [-52, 760]]); ctx.fill();
    ctx.strokeStyle = shade(c, -0.5); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-70, 4); ctx.lineTo(-40, 760); ctx.moveTo(70, 4); ctx.lineTo(40, 760); ctx.stroke();
    if (o.accent) { ctx.strokeStyle = o.accent; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-82, 8); ctx.lineTo(-50, 760); ctx.stroke(); }
  } else if (o.style === 'hoodie') {
    ctx.strokeStyle = o.inner || '#f2efe6'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-34, 40); ctx.lineTo(-40, 210); ctx.moveTo(34, 40); ctx.lineTo(42, 200); ctx.stroke();
    ctx.fillStyle = shade(c, -0.15); rr(ctx, -120, 330, 240, 120, 30); ctx.fill();
  } else {
    ctx.fillStyle = shade(c, -0.35); ctx.beginPath(); ctx.ellipse(0, 8, 70, 26, 0, 0, Math.PI); ctx.fill();
  }
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function hairBack(ctx, h) {
  ctx.fillStyle = shade(h.color, -0.2);
  if (h.style === 'long') { ctx.beginPath(); ctx.moveTo(-150, -120); ctx.quadraticCurveTo(-190, 150, -170, 330); ctx.lineTo(170, 330); ctx.quadraticCurveTo(190, 150, 150, -120); ctx.closePath(); ctx.fill(); }
  if (h.style === 'ponytail') { ctx.beginPath(); ctx.moveTo(110, -120); ctx.quadraticCurveTo(240, -60, 205, 170); ctx.quadraticCurveTo(170, 60, 120, -40); ctx.closePath(); ctx.fill(); }
  if (h.style === 'bun') { ctx.fillStyle = h.color; ctx.beginPath(); ctx.arc(0, -205, 58, 0, Math.PI * 2); ctx.fill(); }
}

function hairFront(ctx, h, t) {
  const c = h.color, hi = shade(c, 0.35);
  ctx.fillStyle = c;
  const cap = () => { ctx.beginPath(); ctx.moveTo(-132, -10); ctx.lineTo(-138, -110); ctx.quadraticCurveTo(-110, -190, 0, -192); ctx.quadraticCurveTo(110, -190, 138, -110); ctx.lineTo(132, -10); };
  switch (h.style) {
    case 'spiky': {
      cap(); for (let k = 0; k <= 8; k++) { const x = 130 - k * 32.5; ctx.lineTo(x, k % 2 ? -18 : -70); } ctx.closePath(); ctx.fill();
      [[-80, -175, -105, -255, -35, -188], [-10, -190, 15, -275, 50, -186], [60, -182, 115, -250, 110, -150]].forEach(([a, b, c2, d, e, f]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d); ctx.lineTo(e, f); ctx.fill(); });
      break;
    }
    case 'curly': {
      for (let k = 0; k <= 12; k++) { const a = Math.PI * (1.02 + k * 0.08); ctx.beginPath(); ctx.arc(Math.cos(a) * 128, Math.sin(a) * 135 - 40, 42, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(0, -110, 125, 80, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'buzz': { ctx.globalAlpha = 0.9; cap(); ctx.quadraticCurveTo(0, -120, -132, -10); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; break; }
    case 'long': {
      cap(); ctx.lineTo(118, 120); ctx.lineTo(96, 110); ctx.quadraticCurveTo(70, -40, 10, -95); ctx.quadraticCurveTo(-70, -40, -96, 110); ctx.lineTo(-118, 120); ctx.closePath(); ctx.fill();
      break;
    }
    default: { // short, bun, ponytail
      cap(); ctx.quadraticCurveTo(110, -60, 40, -95); ctx.quadraticCurveTo(-30, -60, -90, -80); ctx.quadraticCurveTo(-125, -50, -132, -10); ctx.closePath(); ctx.fill();
    }
  }
  ctx.strokeStyle = hi; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-10, -60, 120, Math.PI * 1.18, Math.PI * 1.42); ctx.stroke();
}

function eyes(ctx, ch, emo, t, look) {
  const seed = hash(ch.id || ch.name || 'x') * 10;
  const blinking = (t + seed) % 3.6 < 0.12;
  const open = blinking ? 0.08 : emo.eye;
  for (const s of [-1, 1]) {
    const cx = s * 50, cy = 0, w = 30, hgt = 15 * open;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - w, cy); ctx.quadraticCurveTo(cx, cy - hgt * 2, cx + w, cy); ctx.quadraticCurveTo(cx, cy + hgt * 1.6, cx - w, cy); ctx.closePath();
    ctx.fillStyle = '#fbf7ef'; ctx.fill(); ctx.clip();
    ctx.fillStyle = ch.eyes || '#2a1d16'; ctx.beginPath(); ctx.arc(cx + look * 9, cy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0d0907'; ctx.beginPath(); ctx.arc(cx + look * 9, cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + look * 9 + 4, cy - 4, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - w - 4, cy + 2); ctx.quadraticCurveTo(cx, cy - hgt * 2 - 2, cx + w + 2, cy - 1); ctx.stroke();
    // brows
    const asym = emo.asym && s === -1 ? emo.asym : 0;
    const outerY = -40 + emo.lift + asym, innerY = -42 + emo.lift + emo.tilt + asym;
    ctx.strokeStyle = shade(ch.hair?.color || '#2a1d16', -0.3); ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s * 82, outerY); ctx.lineTo(s * 24, innerY); ctx.stroke();
  }
}

function mouth(ctx, ch, emo, m) {
  const lip = shade(ch.skin, -0.45);
  ctx.save(); ctx.translate(0, 95);
  const base = emo.mouth;
  if (m > 0.1 || base === 'o' || base === 'o-small') {
    const w = (base === 'o' ? 26 : base === 'o-small' ? 18 : 40) + 14 * m;
    const h = 6 + 40 * m + (base === 'o' ? 22 : base === 'o-small' ? 12 : 0);
    const curve = base === 'smile' ? 10 : base === 'frown' ? -6 : 0;
    ctx.beginPath(); ctx.moveTo(-w, -curve * 0.3); ctx.quadraticCurveTo(0, -h * 0.35 + curve * 0.5, w, -curve * 0.3); ctx.quadraticCurveTo(0, h * 1.25 + curve, -w, -curve * 0.3); ctx.closePath();
    ctx.fillStyle = '#3b1513'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#f6f1e8'; ctx.fillRect(-w, -h, w * 2, h * 0.62);
    ctx.fillStyle = '#c4504a'; ctx.beginPath(); ctx.ellipse(0, h * 0.95, w * 0.6, h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    ctx.strokeStyle = lip; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
    if (base === 'smile') { ctx.moveTo(-42, -4); ctx.quadraticCurveTo(0, 22, 42, -4); }
    else if (base === 'frown') { ctx.moveTo(-34, 10); ctx.quadraticCurveTo(0, -12, 34, 10); }
    else if (base === 'tight') { ctx.moveTo(-26, 2); ctx.lineTo(26, 2); }
    else if (base === 'smirk') { ctx.moveTo(-32, 4); ctx.quadraticCurveTo(8, 10, 40, -12); }
    else if (base === 'wavy') { ctx.moveTo(-30, 2); ctx.quadraticCurveTo(-15, -6, 0, 2); ctx.quadraticCurveTo(15, 10, 30, 0); }
    else { ctx.moveTo(-30, 2); ctx.quadraticCurveTo(0, 8, 30, 2); }
    ctx.stroke();
  }
  ctx.restore();
}

function accessory(ctx, ch) {
  const a = ch.accessory, ac = ch.accent || '#ffd23f';
  if (a === 'headphones') {
    ctx.strokeStyle = '#2b2b31'; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -20, 168, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.fillStyle = s < 0 ? '#3a3a42' : '#24242a'; ctx.beginPath(); ctx.ellipse(s * 150, 10, 34, 62, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ac; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(s * 150 - s * 6, 10, 18, 40, 0, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (a === 'glasses') {
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 6;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(s * 50 - 40, -26, 80, 52, 14); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(0, -14, 10, -6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(s * 50 - 36, -22, 30, 44, 10); ctx.fill(); }
  } else if (a === 'cap') {
    ctx.fillStyle = ac; ctx.beginPath(); ctx.moveTo(-140, -90); ctx.quadraticCurveTo(-130, -205, 0, -208); ctx.quadraticCurveTo(130, -205, 140, -90); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(ac.startsWith('#') ? ac : '#ffd23f', -0.25); ctx.beginPath(); ctx.ellipse(10, -92, 170, 26, 0, 0, Math.PI * 2); ctx.fill();
  } else if (a === 'earring') {
    ctx.strokeStyle = ac; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-128, 48, 12, 0, Math.PI * 2); ctx.stroke();
  }
}

// state: { t, mouth 0..1, emotion, look -1..1, facing ±1 }
export function drawCharacter(ctx, ch, x, y, scale, state) {
  const emo = EMO[state.emotion] || EMO.neutral, m = state.mouth || 0, t = state.t;
  const skin = ch.skin || '#c68a5e', skinDark = shade(skin, -0.2);
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2.1 + x) * 4 * scale); ctx.scale(scale * (state.facing || 1), scale);
  torso(ctx, ch.outfit || {});
  ctx.fillStyle = skinDark; ctx.beginPath(); ctx.roundRect(-46, -70, 92, 100, 20); ctx.fill();
  ctx.fillStyle = shade(skin, -0.32); poly(ctx, [[-46, -40], [46, -40], [46, -10], [0, 10], [-46, -10]]); ctx.fill();

  ctx.save();
  ctx.translate(0, -230 - m * 4);
  ctx.rotate(Math.sin(t * 9) * 0.035 * m + Math.sin(t * 1.3 + x) * 0.02 + (state.tilt || 0));
  if (ch.hair) hairBack(ctx, ch.hair);
  ctx.fillStyle = skinDark; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 125, 10, 22, 34, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = skin; poly(ctx, HEAD); ctx.fill();
  ctx.fillStyle = shade(skin, -0.16); poly(ctx, HEAD_SHADOW); ctx.fill();
  if (emo.blush) { ctx.fillStyle = 'rgba(232,90,90,0.22)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 72, 48, 24, 13, 0, 0, Math.PI * 2); ctx.fill(); } }
  ctx.strokeStyle = shade(skin, -0.38); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(4, 10); ctx.lineTo(16, 55); ctx.lineTo(-2, 60); ctx.stroke();
  eyes(ctx, ch, emo, t, state.look || 0);
  mouth(ctx, ch, emo, m);
  if (ch.hair) hairFront(ctx, ch.hair, t);
  accessory(ctx, ch);
  if (emo.sweat) { ctx.fillStyle = 'rgba(150,200,255,0.85)'; ctx.beginPath(); ctx.moveTo(112, -96); ctx.quadraticCurveTo(126, -66, 112, -58); ctx.quadraticCurveTo(98, -66, 112, -96); ctx.fill(); }
  ctx.restore();
  ctx.restore();
}
