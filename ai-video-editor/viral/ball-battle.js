// "Ball Escape Battle": 4 balls bounce inside spinning rings. Escaping through a gap shatters the ring and scores a point.
//   node viral/ball-battle.js --search          find seeds that give a close, exciting race
//   node viral/ball-battle.js --seed 42 [--stills auto]
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { W, H, DISPLAY, MONO, clamp, prog, ease, font, render, SR } from '../lib/kit.js';
import { speak } from '../series/engine/voice.js';

const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../out');
const CX = 540, CY = 960, FPS = 30, SUB = 8, DT = 1 / (FPS * SUB);
const BALLS = [{ name: 'RED', c: '#ff3b4f' }, { name: 'BLUE', c: '#3b8bff' }, { name: 'GREEN', c: '#2fe07a' }, { name: 'YELLOW', c: '#ffd23f' }];
const RINGS = 10, R0 = 120, DR = 36, RW = 8, BR = 18, G = 520, VMAX = 1250, VMIN = 520, INTRO = 3.0, OUTRO = 4.2;
const ringR = (k) => R0 + k * DR;
const gapAng = (k) => 0.62;
const ringSpin = (k) => (k % 2 ? -1 : 1) * (1.5 + 0.05 * k);

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };

function simulate(seed, maxT = 75) {
  const r = rng(seed);
  const balls = BALLS.map((b, i) => { const a = (i / 4) * Math.PI * 2 + r(); return { x: CX + Math.cos(a) * 45, y: CY + Math.sin(a) * 45, vx: (r() - 0.5) * 900, vy: (r() - 0.5) * 900, score: 0 }; });
  const ringPhase = Array.from({ length: RINGS }, () => r() * Math.PI * 2);
  let active = 0, t = 0; const frames = [], events = [];
  let leadChanges = 0, leader = -1;
  while (active < RINGS && t < maxT) {
    for (let s = 0; s < SUB; s++) {
      t += DT;
      for (const b of balls) { b.vy += G * DT; b.x += b.vx * DT; b.y += b.vy * DT; }
      // ball-ball
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        const a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < BR * 2 && d > 0) { const nx = dx / d, ny = dy / d, rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rel < 0) { a.vx += rel * nx; a.vy += rel * ny; b.vx -= rel * nx; b.vy -= rel * ny; events.push({ t, type: 'clack' }); } const o = (BR * 2 - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; }
      }
      const R = ringR(active), phase = ringPhase[active] + ringSpin(active) * t, half = gapAng(active) / 2;
      for (const [bi, b] of balls.entries()) {
        const dx = b.x - CX, dy = b.y - CY, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
        const inGap = Math.abs(wrap(th - phase)) < half - (BR / R) * 0.9;
        if (d - BR > R + RW / 2 && inGap) { // escaped
          b.score++; events.push({ t, type: 'break', ball: bi, ring: active });
          active++;
          const sc = balls.map((x) => x.score), top = Math.max(...sc), lead = sc.filter((x) => x === top).length === 1 ? sc.indexOf(top) : leader;
          if (lead !== leader) { if (leader !== -1) leadChanges++; leader = lead; }
          break;
        }
        if (d + BR > R - RW / 2 && !inGap) {
          const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
          if (vn > 0) {
            b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny;
            const tx = -ny, ty = nx, kick = (r() - 0.5) * 160; b.vx += tx * kick; b.vy += ty * kick;
            events.push({ t, type: 'bounce', ball: bi, v: Math.abs(vn) });
          }
          b.x = CX + nx * (R - RW / 2 - BR); b.y = CY + ny * (R - RW / 2 - BR);
        }
        const sp = Math.hypot(b.vx, b.vy); if (sp > VMAX) { b.vx *= VMAX / sp; b.vy *= VMAX / sp; } if (sp < VMIN && sp > 0) { b.vx *= VMIN / sp; b.vy *= VMIN / sp; }
      }
    }
    frames.push({ t, active, balls: balls.map((b) => ({ x: b.x, y: b.y, score: b.score })), phases: ringPhase.map((p, k) => p + ringSpin(k) * t) });
  }
  const scores = balls.map((b) => b.score), top = Math.max(...scores), sorted = [...scores].sort((a, b) => b - a);
  const lastBreak = events.filter((e) => e.type === 'break').at(-1);
  const winner = scores.filter((s) => s === top).length === 1 ? scores.indexOf(top) : lastBreak?.ball;
  return { seed, done: active >= RINGS, dur: t, frames, events, scores, winner, margin: sorted[0] - sorted[1], leadChanges, zeroes: scores.filter((s) => s === 0).length };
}

const args = process.argv;
if (args.includes('--debug')) {
  for (let k = 1; k <= 10; k++) { const r = simulate(k, 120); console.log(k, r.done, r.dur.toFixed(1), r.scores.join('-'), 'breaks', r.events.filter((e) => e.type === 'break').map((e) => e.t.toFixed(1)).join(',')); }
  process.exit(0);
}
if (args.includes('--search')) {
  const res = [];
  for (let s = 1; s <= 400; s++) { const r = simulate(s); if (r.done && r.dur > 24 && r.dur < 42) res.push(r); }
  const decisive = (r) => { const br = r.events.filter((e) => e.type === 'break'), last = br.at(-1), before = [0, 0, 0, 0]; br.slice(0, -1).forEach((e) => before[e.ball]++); const top = Math.max(...before); return r.margin === 1 && before[last.ball] === top && before.filter((x) => x === top).length >= 2; };
  const good = res.filter(decisive);
  good.sort((a, b) => (b.leadChanges - a.leadChanges) || (a.zeroes - b.zeroes) || (Math.abs(a.dur - 30) - Math.abs(b.dur - 30)));
  res.length = 0; res.push(...good);
  for (const r of res.slice(0, 12)) console.log(`seed ${r.seed}: ${r.dur.toFixed(1)}s scores ${r.scores.join('-')} winner ${BALLS[r.winner].name} margin ${r.margin} leadChanges ${r.leadChanges}`);
  process.exit(0);
}
const seed = +(args[args.indexOf('--seed') + 1] || 1);
const sim = simulate(seed);
if (!sim.done) { console.error('seed did not finish'); process.exit(1); }
const SIM_DUR = sim.dur, TOTAL = INTRO + SIM_DUR + OUTRO;
const W_ = BALLS[sim.winner];
console.log(`seed ${seed}: sim ${SIM_DUR.toFixed(1)}s, total ${TOTAL.toFixed(1)}s, scores ${sim.scores.join('-')}, winner ${W_.name}`);
const breaks = sim.events.filter((e) => e.type === 'break');

// ---------- drawing ----------
const bgc = createCanvas(W, H), bg = bgc.getContext('2d');
{ const g = bg.createRadialGradient(CX, CY, 50, CX, CY, 1300); g.addColorStop(0, '#16112a'); g.addColorStop(1, '#030308'); bg.fillStyle = g; bg.fillRect(0, 0, W, H);
  const r = rng(7); for (let i = 0; i < 160; i++) { bg.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.4})`; bg.fillRect(r() * W, r() * H, 2, 2); } }
const hue = (k) => `hsl(${(k * 29 + 280) % 360}, 95%, 62%)`;
const frameAt = (st) => sim.frames[clamp(Math.floor(st * FPS), 0, sim.frames.length - 1)];

function scoreboard(ctx, scores, t) {
  const lead = Math.max(...scores);
  BALLS.forEach((b, i) => {
    const x = 90 + i * 232, y = 250, isLead = scores[i] === lead && lead > 0;
    const hit = breaks.findLast((e) => e.ball === i && INTRO + e.t <= t), pop = hit ? 1 + 0.25 * Math.max(0, 1 - (t - INTRO - hit.t) * 4) : 1;
    ctx.save(); ctx.translate(x + 100, y); ctx.scale(pop, pop);
    ctx.fillStyle = isLead ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(-100, -45, 200, 90, 45); ctx.fill();
    if (isLead) { ctx.strokeStyle = b.c; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(-55, 0, 24, 0, Math.PI * 2); ctx.fill();
    font(ctx, 56, 900, DISPLAY); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(String(scores[i]), 30, 20); ctx.textAlign = 'left';
    ctx.restore();
  });
}

const particles = [];
function spawnShatter(ring, phase, color) {
  const R = ringR(ring), r = rng(ring * 97 + 3);
  for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, sp = 200 + r() * 500; particles.push({ born: null, a, R, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c: hue(ring), life: 0.9 + r() * 0.6, ring }); }
}

function drawFrame(ctx, t) {
  ctx.drawImage(bgc, 0, 0);
  const st = clamp(t - INTRO, 0, SIM_DUR), f = frameAt(st), started = t >= INTRO, ended = t >= INTRO + SIM_DUR;
  const active = Math.min(f.active, RINGS - 1);
  // camera zoom follows the active ring
  const targetR = ringR(Math.min(f.active, RINGS - 1)), z = clamp(470 / (targetR + 40), 1, 3.2);
  ctx.save(); ctx.translate(CX, CY); ctx.scale(z, z); ctx.translate(-CX, -CY);
  // rings
  for (let k = RINGS - 1; k >= f.active; k--) {
    const R = ringR(k), ph = f.phases[k], half = gapAng(k) / 2, isAct = k === f.active;
    ctx.lineCap = 'round';
    ctx.strokeStyle = hue(k); ctx.globalAlpha = isAct ? 0.25 : 0.1; ctx.lineWidth = (RW + 14) / z * z; ctx.beginPath(); ctx.arc(CX, CY, R, ph + half, ph - half + Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = isAct ? 1 : 0.55; ctx.lineWidth = RW; ctx.beginPath(); ctx.arc(CX, CY, R, ph + half, ph - half + Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // shatter particles
  for (const e of breaks) {
    const age = t - INTRO - e.t; if (age < 0 || age > 1.6) continue;
    const R = ringR(e.ring), r = rng(e.ring * 131 + 7);
    for (let i = 0; i < 60; i++) {
      const a = r() * Math.PI * 2, sp = 150 + r() * 420, life = 0.8 + r() * 0.8; if (age > life) continue;
      const d = R + sp * age, x = CX + Math.cos(a) * d, y = CY + Math.sin(a) * d + 300 * age * age;
      ctx.globalAlpha = 1 - age / life; ctx.fillStyle = hue(e.ring); ctx.fillRect(x - 4, y - 4, 8, 8);
    }
    ctx.globalAlpha = 1;
  }
  // balls with trails
  BALLS.forEach((b, i) => {
    if (started) for (let k = 10; k >= 1; k--) { const pf = frameAt(st - k / FPS).balls[i]; ctx.globalAlpha = (1 - k / 11) * 0.35; ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(pf.x, pf.y, BR * (1 - k / 22), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    const p = f.balls[i]; const bounce = sim.events.findLast((e) => e.type === 'bounce' && e.ball === i && e.t <= st), pulse = bounce && started ? 1 + 0.35 * Math.max(0, 1 - (st - bounce.t) * 8) : 1;
    let bx = p.x, by = p.y, s = pulse;
    if (!started) { const a = (i / 4) * Math.PI * 2 + t * 1.2; bx = CX + Math.cos(a) * 55; by = CY + Math.sin(a) * 55; }
    const vis = BR * Math.max(1, 1.3 / z); ctx.fillStyle = b.c; ctx.shadowColor = b.c; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(bx, by, vis * s, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(bx - vis * 0.35, by - vis * 0.35, vis * 0.3, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();

  scoreboard(ctx, started ? f.balls.map((b) => b.score) : [0, 0, 0, 0], t);
  // ring counter
  font(ctx, 34, 700, MONO); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'center';
  ctx.fillText(`RINGS LEFT: ${RINGS - f.active}`, CX, 1520); ctx.textAlign = 'left';

  // intro: pick a color + countdown
  if (!started) {
    font(ctx, 110, 900, DISPLAY); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 14; ctx.strokeText('PICK A COLOR', CX, 470); ctx.fillStyle = '#fff'; ctx.fillText('PICK A COLOR', CX, 470);
    const n = 3 - Math.floor((t - 0.0) / 1.0); if (t > 0) { const lt = t % 1, s = 1.6 - 0.6 * ease.out(clamp(lt / 0.3)); ctx.save(); ctx.translate(CX, 700); ctx.scale(s, s); ctx.globalAlpha = 1 - clamp((lt - 0.7) / 0.3); font(ctx, 200, 900, DISPLAY); ctx.strokeStyle = '#000'; ctx.lineWidth = 18; ctx.strokeText(String(Math.max(1, n)), 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(String(Math.max(1, n)), 0, 0); ctx.restore(); }
    font(ctx, 40, 700, MONO); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText('MOST RINGS BROKEN WINS', CX, 1600); ctx.textAlign = 'left';
  } else if (t < INTRO + 0.6) {
    const lt = t - INTRO; ctx.save(); ctx.globalAlpha = 1 - lt / 0.6; ctx.translate(CX, CY); ctx.scale(1 + lt, 1 + lt); font(ctx, 220, 900, DISPLAY); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('GO!', 0, 80); ctx.restore(); ctx.textAlign = 'left';
  }
  // outro: winner
  if (ended) {
    const lt = t - INTRO - SIM_DUR, p = ease.back(clamp(lt / 0.5));
    ctx.fillStyle = `rgba(0,0,0,${0.55 * clamp(lt / 0.4)})`; ctx.fillRect(0, 0, W, H);
    const r = rng(99); for (let i = 0; i < 140; i++) { const x = r() * W, sp = 300 + r() * 500, y = -50 + ((lt * sp + r() * 600) % (H + 100)), c = BALLS[i % 4].c; ctx.save(); ctx.translate(x + Math.sin(lt * 3 + i) * 30, y); ctx.rotate(lt * 4 + i); ctx.fillStyle = c; ctx.fillRect(-8, -4, 16, 8); ctx.restore(); }
    ctx.save(); ctx.translate(CX, CY - 80); ctx.scale(p, p);
    ctx.fillStyle = W_.c; ctx.shadowColor = W_.c; ctx.shadowBlur = 60; ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-50, -50, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-90, -150); ctx.lineTo(-90, -230); ctx.lineTo(-45, -185); ctx.lineTo(0, -250); ctx.lineTo(45, -185); ctx.lineTo(90, -230); ctx.lineTo(90, -150); ctx.closePath(); ctx.fill();
    ctx.restore();
    const tp = ease.out(clamp((lt - 0.3) / 0.4));
    ctx.globalAlpha = tp; font(ctx, 150, 900, DISPLAY); ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = 16;
    ctx.strokeText(`${W_.name} WINS!`, CX, CY + 230); ctx.fillStyle = W_.c; ctx.fillText(`${W_.name} WINS!`, CX, CY + 230);
    font(ctx, 54, 800, DISPLAY); ctx.fillStyle = '#fff'; ctx.fillText('Did you pick right?', CX, CY + 330);
    font(ctx, 40, 700, MONO); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText('COMMENT YOUR COLOR', CX, CY + 400); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    const fo = clamp((lt - (OUTRO - 0.5)) / 0.5); if (fo > 0) { ctx.fillStyle = `rgba(3,3,8,${fo})`; ctx.fillRect(0, 0, W, H); }
  }
}

// ---------- audio ----------
const MELODY = [57, 60, 62, 64, 67, 69, 67, 64, 62, 64, 67, 72, 69, 67, 64, 62, 60, 62, 64, 67, 69, 72, 74, 72, 69, 67, 64, 67];
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const voiceClips = [];
async function prepVoice() {
  const v = { kokoro: 'af_heart', kokoroSpeed: 1.1 };
  const cache = path.resolve(OUT, '../viral/.cache');
  voiceClips.push({ at: 0.15, clip: await speak('Pick a color!', v, { emotion: 'happy' }, cache) });
  voiceClips.push({ at: INTRO + SIM_DUR + 0.4, clip: await speak(`${W_.name.toLowerCase()} wins!`, v, { emotion: 'happy' }, cache) });
}
function audio(m) {
  const N = m.N;
  const pluck = (tc, f, vol, pan) => { const i0 = Math.floor(tc * SR); for (let k = 0; k < 0.35 * SR; k++) { const tt = k / SR, e = Math.exp(-tt * 9); m.add(i0 + k, (Math.sin(2 * Math.PI * f * tt) * 0.7 + Math.sin(2 * Math.PI * f * 2 * tt) * 0.2 * Math.exp(-tt * 20) + Math.sin(2 * Math.PI * f * 3.01 * tt) * 0.1 * Math.exp(-tt * 30)) * e * vol, pan); } };
  // countdown beeps
  [0.05, 1.05, 2.05].forEach((x) => m.tone(x, 660, 0.15, 0.12)); m.tone(INTRO, 1320, 0.3, 0.14);
  // drone + beat that speeds up as rings break
  for (let i = Math.floor(INTRO * SR); i < Math.floor((INTRO + SIM_DUR) * SR); i++) { const t = i / SR; m.add(i, (Math.sin(2 * Math.PI * 55 * t) * 0.5 + Math.sin(2 * Math.PI * 82.4 * t) * 0.3) * 0.05 * Math.min(1, (t - INTRO) / 0.5)); }
  for (let t = INTRO; t < INTRO + SIM_DUR; ) { const prog_ = (t - INTRO) / SIM_DUR, bpm = 110 + prog_ * 50; m.thud(t, 0.35); for (let k = 0; k < 0.04 * SR; k++) m.add(Math.floor((t + 30 / bpm) * SR) + k, m.rnd() * Math.exp(-k / SR * 90) * 0.05, 0.2); t += 60 / bpm; }
  // bounces play the melody (rate limited)
  let last = -1, note = 0;
  for (const e of sim.events) {
    if (e.type !== 'bounce') continue; const tc = INTRO + e.t; if (tc - last < 0.075) continue; last = tc;
    pluck(tc, NOTE(MELODY[note++ % MELODY.length] + 12), 0.1 * clamp(e.v / 700, 0.5, 1.2), (e.ball - 1.5) * 0.3);
  }
  // ring breaks
  for (const e of breaks) {
    const tc = INTRO + e.t, i0 = Math.floor(tc * SR); let y = 0;
    for (let k = 0; k < 0.35 * SR; k++) { y = 0.6 * y + 0.4 * m.rnd(); const hp = m.rnd() - y; m.add(i0 + k, hp * 0.35 * Math.exp(-k / SR * 9)); }
    const f = NOTE(72 + (e.ring % 8) * 2); m.tone(tc, f, 0.18, 0.1); m.tone(tc + 0.06, f * 1.5, 0.25, 0.08);
  }
  // win fanfare
  const wt = INTRO + SIM_DUR; [[0, 72], [0.12, 76], [0.24, 79], [0.36, 84]].forEach(([o, n]) => pluck(wt + o, NOTE(n), 0.22, 0)); [72, 76, 79].forEach((n) => m.tone(wt + 0.5, NOTE(n), 1.6, 0.05, { attack: 0.02, release: 1 }));
  for (const v of voiceClips) { const i0 = Math.floor(v.at * SR); for (let k = 0; k < v.clip.samples.length; k++) m.add(i0 + k, v.clip.samples[k] * 0.9); }
  void N;
}

// ---------- go ----------
await prepVoice();
const si = args.indexOf('--stills');
if (si > -1 && (args[si + 1] || 'auto') === 'auto') args[si + 1] = [1.5, INTRO + 2, INTRO + SIM_DUR * 0.3, INTRO + SIM_DUR * 0.6, INTRO + SIM_DUR * 0.9, INTRO + SIM_DUR + 1.5].map((x) => x.toFixed(2)).join(',');
const name = `ball-battle-${seed}`;
await render({ name, total: TOTAL, drawFrame, audio, outDir: OUT });
// cover
if (si < 0) {
  const c = createCanvas(W, H), ctx = c.getContext('2d'); drawFrame(ctx, INTRO + SIM_DUR * 0.45);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
  font(ctx, 150, 900, DISPLAY); ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = 20;
  ['PICK A', 'COLOR'].forEach((l, i) => { ctx.strokeText(l, CX, 560 + i * 160); ctx.fillStyle = i ? '#ffd23f' : '#fff'; ctx.fillText(l, CX, 560 + i * 160); });
  writeFileSync(path.join(OUT, `${name}-cover.png`), c.toBuffer('image/png'));
  writeFileSync(path.join(OUT, `${name}-upload.txt`), `TITLE:\nPick A Color Before It Starts 🔴🔵🟢🟡 #shorts\n\nDESCRIPTION:\nFour balls. Ten spinning rings. Every escape shatters a ring. Most rings broken wins. Which color did you pick?\n\n#shorts #satisfying #ballrace #pickacolor #simulation #asmr\n\nPINNED COMMENT:\nWhich color did you pick? 🔴🔵🟢🟡 Winner was ${W_.name} 🏆\n`);
  console.log(`Winner: ${W_.name}. Cover + upload text written.`);
}
