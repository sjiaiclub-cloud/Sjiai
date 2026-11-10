// Creepy loop-story Shorts: deep narrator, huge kinetic words, dark illustrated scenes, a hidden detail and a loop ending.
//   node viral/story.js viral/stories/001-three-am.json [--stills auto]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { W, H, DISPLAY, MONO, SANS, clamp, prog, ease, font, render, SR } from '../lib/kit.js';
import { getSet } from '../series/engine/sets.js';
import { speak, engineName } from '../series/engine/voice.js';
import { sfx } from '../series/engine/score.js';
import { ICONS } from '../shorts/visuals.js';

const file = process.argv[2];
const story = JSON.parse(readFileSync(file, 'utf8'));
const NAME = path.basename(file, '.json');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../out');
const CACHE = path.resolve(path.dirname(file), '.cache');

console.log(`Voice: ${engineName()}`);
const beats = []; let T = 0;
for (const b of story.beats) {
  const plain = b.line.replace(/\*/g, '');
  const clip = await speak(plain, story.voice, { emotion: b.emotion, id: 'narrator' }, CACHE);
  // words with highlight flags
  let hot = false; const words = [];
  for (const raw of b.line.split(/\s+/).filter(Boolean)) { const starts = raw.startsWith('*') || raw.startsWith('"*'); if (starts) hot = true; words.push({ w: raw.replace(/\*/g, ''), hot }); if (raw.replace(/["”.,!?—]+$/, '').endsWith('*')) hot = false; }
  const wts = words.map((x) => x.w.replace(/[^\w]/g, '').length + 2), tot = wts.reduce((a, c) => a + c, 0);
  let acc = 0; words.forEach((x, k) => { x.s = (acc / tot) * clip.dur * 0.95; acc += wts[k]; });
  // group into chunks of up to 3 words / ~16 chars
  const chunks = []; let cur = [];
  for (const x of words) { const len = [...cur, x].map((y) => y.w).join(' ').length; if (cur.length && (cur.length >= 3 || len > 16)) { chunks.push(cur); cur = []; } cur.push(x); if (/[.?!,—"]$/.test(x.w) && cur.length) { chunks.push(cur); cur = []; } }
  if (cur.length) chunks.push(cur);
  const dur = b.cut ? clip.dur * 0.92 : clip.dur + (b.pause ?? 0) + 0.3;
  beats.push({ ...b, clip, chunks, start: T, audioAt: T + 0.1, dur, set: getSet(b.scene) });
  T += dur;
}
const TOTAL = T;
console.log(`${NAME}: ${beats.length} beats, ${TOTAL.toFixed(1)}s`);

let noWords = false;
const layer = createCanvas(W, H), lctx = layer.getContext('2d');
const grain = createCanvas(W, H), gctx = grain.getContext('2d');

function drawEyes(ctx, x, y, t, a) {
  if (a <= 0) return;
  const blink = (t % 2.1) < 0.1 ? 0.15 : 1;
  ctx.save(); ctx.globalAlpha = a;
  for (const dx of [-26, 26]) { const g = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, 30); g.addColorStop(0, 'rgba(255,240,200,0.9)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(x + dx - 30, y - 30, 60, 60); ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.ellipse(x + dx, y, 9, 6 * blink, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

function phone(ctx, p, lt) {
  const s = ease.out(prog(lt, 0, 0.4));
  ctx.save(); ctx.translate(540, 760 + (1 - s) * 500); ctx.scale(1.55, 1.55);
  ctx.shadowColor = 'rgba(120,160,255,0.5)'; ctx.shadowBlur = 60; ICONS.phone(ctx, lt, { title: p.title, lines: p.lines.slice(0, 1 + Math.floor(clamp((lt - 0.3) / 0.5) * p.lines.length)) }); ctx.shadowBlur = 0;
  ctx.restore();
}

function words(ctx, b, t) {
  const lt = t - b.audioAt; if (lt < 0) return;
  const idx = b.chunks.findLastIndex((c) => lt >= c[0].s); if (idx < 0) return;
  const chunk = b.chunks[idx], age = lt - chunk[0].s;
  const y = b.prop ? 1330 : 1150;
  font(ctx, 124, 900, DISPLAY); ctx.lineJoin = 'round';
  const parts = chunk.map((x) => ({ ...x, u: x.w.toUpperCase() })), sp = ctx.measureText(' ').width;
  let total = parts.reduce((a, x) => a + ctx.measureText(x.u).width, 0) + sp * (parts.length - 1);
  const sc = total > 960 ? 960 / total : 1;
  const pop = 1 + 0.18 * (1 - ease.out(clamp(age / 0.12)));
  ctx.save(); ctx.translate(540, y); ctx.scale(sc * pop, sc * pop);
  let x = -total / 2;
  for (const p of parts) { const w = ctx.measureText(p.u).width; ctx.strokeStyle = '#000'; ctx.lineWidth = 16; ctx.strokeText(p.u, x, 40); ctx.fillStyle = p.hot ? '#ff3b3b' : '#fff'; ctx.fillText(p.u, x, 40); x += w + sp; }
  ctx.restore();
}

function drawFrame(ctx, t) {
  const b = beats.findLast((x) => t >= x.start) || beats[0], lt = t - b.start, p = clamp(lt / b.dur);
  // camera
  let z = 1 + 0.07 * p, fx = 540, fy = 960;
  if (b.zoom === 'underbed') { z = 1.9 + 0.25 * p; fx = 480; fy = 1420; }
  const shake = b.sfx === 'sting' ? Math.max(0, 1 - lt * 2.5) : 0;
  ctx.save(); ctx.translate(540 + Math.sin(t * 80) * 14 * shake, 960 + Math.cos(t * 70) * 10 * shake); ctx.scale(z, z); ctx.translate(-fx, -fy);
  b.set.draw(ctx, t);
  if (b.eyes) drawEyes(ctx, 480, 1425, t, clamp((lt - b.dur * 0.45) / 0.15) * (1 - clamp((lt - b.dur * 0.45 - 0.55) / 0.15)));
  ctx.restore();
  if (b.set.tint) { ctx.fillStyle = b.set.tint; ctx.fillRect(0, 0, W, H); }
  // heavy vignette + grain
  const v = ctx.createRadialGradient(540, 960, 300, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const f = Math.floor(t * 24); gctx.clearRect(0, 0, W, H);
  for (let i = 0; i < 1100; i++) { const r1 = Math.sin((i + f * 977) * 12.9898) * 43758.5453, r2 = Math.sin((i + f * 977) * 78.233) * 43758.5453; gctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)'; gctx.fillRect((r1 - Math.floor(r1)) * W, (r2 - Math.floor(r2)) * H, 2, 2); }
  ctx.drawImage(grain, 0, 0);
  if (b.prop?.type === 'phone') phone(ctx, b.prop, lt);
  if (!noWords) words(ctx, b, t);
  // cut-in flash between beats
  const fl = Math.max(0, 1 - lt * 8); if (b !== beats[0] && fl > 0) { ctx.fillStyle = `rgba(0,0,0,${fl * 0.6})`; ctx.fillRect(0, 0, W, H); }
}

function audio(m) {
  const N = m.N, D = new Float32Array(N);
  for (const b of beats) { const i0 = Math.floor(b.audioAt * SR), n = b.cut ? Math.floor(b.dur * SR) - Math.floor(0.1 * SR) : b.clip.samples.length; for (let k = 0; k < n && i0 + k < N; k++) D[i0 + k] += b.clip.samples[k] * (b.cut && k > n - 400 ? (n - k) / 400 : 1); }
  let peak = 1e-6; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(D[i]));
  const twist = beats.findIndex((b) => b.sfx === 'sting'), tw = twist >= 0 ? beats[twist].start : TOTAL;
  // eerie drone: low fifth + slow dissonant beating, dropping out just before the twist
  for (let i = 0; i < N; i++) {
    const t = i / SR, gap = t > tw - 0.6 && t < tw ? 0 : 1, after = t >= tw ? 1.4 : 1;
    const v = Math.sin(2 * Math.PI * 55 * t) * 0.45 + Math.sin(2 * Math.PI * 82.4 * t) * 0.25 + Math.sin(2 * Math.PI * 116.5 * t) * 0.12 * (0.5 + 0.5 * Math.sin(t * 0.9)) + Math.sin(2 * Math.PI * 880.6 * t) * 0.02 * (0.5 + 0.5 * Math.sin(t * 0.37));
    m.add(i, v * 0.06 * gap * after * Math.min(1, t / 1.5), Math.sin(t * 0.4) * 0.3);
    m.add(i, D[i] / peak * 0.8);
  }
  // heartbeat from the "remembered something" beat onwards
  const hb = beats.findIndex((b) => /remembered/i.test(b.line));
  if (hb >= 0) for (let t = beats[hb].start; t < tw - 0.6; t += 0.85) sfx(m, 'heartbeat', t);
  for (const b of beats) if (b.sfx) sfx(m, b.sfx, b.start + (b.sfxAt || 0));
}

const si = process.argv.indexOf('--stills');
if (si > -1 && (process.argv[si + 1] || 'auto') === 'auto') process.argv[si + 1] = beats.map((b) => (b.start + Math.min(b.dur * 0.6, b.dur - 0.05)).toFixed(2)).join(',');
await render({ name: NAME, total: TOTAL, drawFrame, audio, outDir: OUT });
if (si < 0) {
  const c = createCanvas(W, H), ctx = c.getContext('2d'), eb = beats.find((b) => b.eyes) || beats[0];
  const ct = eb.start + eb.dur * 0.6; noWords = true; drawFrame(ctx, ct);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = 18;
  ['NEVER CHECK', 'UNDER THE BED'].forEach((l, i) => { font(ctx, 140, 900, DISPLAY); const fw = ctx.measureText(l).width; if (fw > 940) font(ctx, Math.floor(140 * 940 / fw), 900, DISPLAY); const y = 520 + i * 160; ctx.strokeText(l, 540, y); ctx.fillStyle = i ? '#ff3b3b' : '#fff'; ctx.fillText(l, 540, y); });
  writeFileSync(path.join(OUT, `${NAME}-cover.png`), c.toBuffer('image/png'));
  const u = story.upload; writeFileSync(path.join(OUT, `${NAME}-upload.txt`), `TITLE:\n${u.title}\n\nDESCRIPTION:\n${u.description}\n\n${u.hashtags.map((h) => '#' + h).join(' ')}\n\nPINNED COMMENT:\n${u.pinned}\n`);
}
