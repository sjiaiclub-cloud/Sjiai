// Renders one mystery Short from its JSON script → MP4 + cover PNG + upload text (title, description, hashtags).
//   node shorts/render-short.js shorts/channel/episodes/001-wow-signal.json [--stills auto]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { W, H, DISPLAY, MONO, clamp, prog, ease, font, render } from '../lib/kit.js';
import { speak, engineName, SR } from '../series/engine/voice.js';
import { music, sfx } from '../series/engine/score.js';
import { VISUALS, ICONS, P, stamp } from './visuals.js';

const file = process.argv[2];
if (!file || file.startsWith('--')) { console.error('usage: node shorts/render-short.js <episode.json> [--stills auto]'); process.exit(1); }
const ep = JSON.parse(readFileSync(file, 'utf8'));
const epDir = path.dirname(path.resolve(file));
const channel = JSON.parse(readFileSync(path.resolve(epDir, ep.channelFile || '../channel.json'), 'utf8'));
const NAME = path.basename(file, '.json');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../out');
const CACHE = path.resolve(epDir, '../.cache');
mkdirSync(OUT, { recursive: true });

// ---------- timeline ----------
console.log(`Voice: ${engineName()}`);
const voice = ep.voice || channel.voice;
const beats = [], clips = [], cues = [];
let T = 0.15;
for (const [i, b] of ep.beats.entries()) {
  if (!b.line) throw new Error(`beat ${i + 1}: missing "line"`);
  const v = b.visual || { type: 'icon', icon: 'question' };
  if (!VISUALS[v.type]) throw new Error(`beat ${i + 1}: unknown visual "${v.type}". Use: ${Object.keys(VISUALS).join(', ')}`);
  const clip = await speak(b.line, voice, { emotion: b.emotion, id: 'narrator' }, CACHE);
  const beat = { ...b, v, start: T, audioAt: T + 0.08, clip };
  beat.dur = b.dur ?? clip.dur + (b.pause ?? 0.22);
  clips.push({ at: beat.audioAt, samples: clip.samples });
  const words = b.line.split(/\s+/).filter(Boolean), wts = words.map((w) => w.replace(/[^\w]/g, '').length + 2), tot = wts.reduce((a, c) => a + c, 0);
  let acc = 0; beat.words = words.map((w, k) => { const s = (acc / tot) * clip.dur * 0.94; acc += wts[k]; return { w, s }; });
  // automatic sound design per visual
  const at = (x) => T + x;
  ({ title: () => cues.push({ t: at(0.6), sfx: 'thud' }, { t: at(0.35), sfx: 'type', dur: 0.9 }),
    date: () => cues.push({ t: at(0.15), sfx: 'tick', dur: 0.7 }),
    signal: () => cues.push({ t: at(v.spikeAt ?? 0.8), sfx: 'static' }, { t: at(v.spikeAt ?? 0.8), sfx: 'sting' }),
    stat: () => cues.push({ t: at(0.1), sfx: 'tick', dur: 0.9 }),
    document: () => cues.push({ t: at(0.05), sfx: 'type', dur: 0.6 }),
    word: () => cues.push({ t: at(0), sfx: 'thud' }),
    radar: () => cues.push({ t: at(0.2), sfx: 'ping', dur: beat.dur }),
    diagram: () => cues.push({ t: at(0.2), sfx: 'whoosh' }),
    versus: () => cues.push({ t: at(0.1), sfx: 'pop' }, { t: at(0.45), sfx: 'pop' }, { t: at(0.8), sfx: 'thud' }),
    cta: () => cues.push({ t: at(0.5), sfx: 'thud' }),
    scene: () => cues.push({ t: at(0.5), sfx: 'thud' }),
    suspect: () => cues.push({ t: at(0), sfx: 'swish' }, { t: at(0.5), sfx: 'pop' }),
    lineup: () => cues.push({ t: at(0.15), sfx: 'pop' }, { t: at(0.35), sfx: 'pop' }, { t: at(0.55), sfx: 'pop' }),
    clue: () => cues.push({ t: at(0), sfx: 'sting' }),
  }[v.type] || (() => {}))();
  if (i > 0 && !['title', 'word'].includes(v.type)) cues.push({ t: T, sfx: 'swish' });
  if (b.sfx) cues.push({ t: T + (b.sfxAt || 0), sfx: b.sfx });
  beats.push(beat);
  T += beat.dur;
}
const TOTAL = T + 0.6;

// ---------- frame ----------
const grain = createCanvas(W, H), gctx = grain.getContext('2d');
function background(ctx, t) {
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(540, 760, 100, 540, 900, 1250); g.addColorStop(0, '#2a2119'); g.addColorStop(1, '#070605'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) { const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * W + Math.sin(t * 0.3 + i) * 30, y = ((Math.sin(i * 47.3) * 0.5 + 0.5) * H - t * (10 + (i % 5) * 6)) % H; ctx.fillStyle = 'rgba(255,240,210,0.12)'; ctx.fillRect(x, y < 0 ? y + H : y, 3, 3); }
}
function grainOverlay(ctx, t) {
  const f = Math.floor(t * 24);
  gctx.clearRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { const r = Math.sin((i + f * 1000) * 12.9898) * 43758.5453; const x = (r - Math.floor(r)) * W, r2 = Math.sin((i + f * 1000) * 78.233) * 43758.5453, y = (r2 - Math.floor(r2)) * H; gctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'; gctx.fillRect(x, y, 2, 2); }
  ctx.drawImage(grain, 0, 0);
}
function header(ctx) {
  font(ctx, 32, 800, MONO); ctx.fillStyle = P.red; ctx.fillText(`CASE ${ep.case || '001'}`, 90, 250);
  const w = ctx.measureText(`CASE ${ep.case || '001'}`).width;
  font(ctx, 32, 500, MONO); ctx.fillStyle = 'rgba(244,236,220,0.7)'; ctx.fillText(` · ${channel.name.toUpperCase()}`, 90 + w, 250);
}
function captions(ctx, beat, t) {
  const lt = t - beat.audioAt, size = 78, lh = 90;
  font(ctx, size, 900, DISPLAY);
  const up = beat.words.map((x) => x.w.toUpperCase()), lines = []; let cur = [];
  for (let k = 0; k < up.length; k++) { const test = [...cur.map((i) => up[i]), up[k]].join(' '); if (ctx.measureText(test).width > 880 && cur.length) { lines.push(cur); cur = []; } cur.push(k); }
  if (cur.length) lines.push(cur);
  const active = beat.words.findLastIndex((x) => lt >= x.s);
  // show two lines at a time (Shorts-style paging)
  const pageOf = (k) => Math.floor(lines.findIndex((ln) => ln.includes(k)) / 2);
  const page = active < 0 ? 0 : pageOf(active), shown = lines.slice(page * 2, page * 2 + 2), y0 = 1290 - ((shown.length - 1) * lh) / 2;
  shown.forEach((ln, li) => {
    const full = ln.map((k) => up[k]).join(' '), sp = ctx.measureText(' ').width;
    let x = 540 - ctx.measureText(full).width / 2; const y = y0 + li * lh;
    for (const k of ln) {
      const ww = ctx.measureText(up[k]).width, st = beat.words[k].s;
      if (lt >= st) {
        const pop = 1 + 0.22 * (1 - ease.out(clamp((lt - st) / 0.12)));
        ctx.save(); ctx.translate(x + ww / 2, y - size * 0.35); ctx.scale(pop, pop); ctx.translate(-(x + ww / 2), -(y - size * 0.35));
        ctx.strokeStyle = '#000'; ctx.lineWidth = 14; ctx.strokeText(up[k], x, y);
        ctx.fillStyle = k === active ? P.yellow : '#fff'; ctx.fillText(up[k], x, y);
        ctx.restore();
      }
      x += ww + sp;
    }
  });
}
function drawFrame(ctx, t) {
  background(ctx, t);
  const beat = beats.findLast((b) => t >= b.start) || beats[0], lt = t - beat.start;
  const flash = Math.max(0, 1 - lt * 6);
  ctx.save();
  const z = 1 + 0.03 * ease.inOut(clamp(lt / beat.dur)); ctx.translate(540, 760); ctx.scale(z, z); ctx.translate(-540, -760);
  VISUALS[beat.v.type](ctx, beat.v, lt, beat.dur, t);
  ctx.restore();
  header(ctx);
  if (t < beat.audioAt + beat.clip.dur + 0.4) captions(ctx, beat, t);
  if (beat !== beats[0] && flash > 0) { ctx.fillStyle = `rgba(255,245,230,${flash * 0.25})`; ctx.fillRect(0, 0, W, H); }
  grainOverlay(ctx, t);
  const vig = ctx.createRadialGradient(540, 960, 500, 540, 960, 1250); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  const end = clamp((t - (TOTAL - 0.5)) / 0.5); if (end > 0) { ctx.fillStyle = `rgba(0,0,0,${end})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- audio ----------
function audio(m) {
  const N = m.N, D = new Float32Array(N), ML = new Float32Array(N), MR = new Float32Array(N);
  for (const c of clips) { const i0 = Math.floor(c.at * SR); for (let k = 0; k < c.samples.length && i0 + k < N; k++) D[i0 + k] += c.samples[k]; }
  music(ML, MR, m.rnd, 0, TOTAL, ep.music || channel.music || 'mystery');
  let env = 0, peak = 1e-6; const att = Math.exp(-1 / (0.03 * SR)), rel = Math.exp(-1 / (0.35 * SR));
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(D[i]));
  const dg = 0.8 / peak;
  for (let i = 0; i < N; i++) { const x = Math.abs(D[i] * dg); env = x > env ? att * env + (1 - att) * x : rel * env + (1 - rel) * x; const g = 1 - 0.6 * Math.min(1, env * 5); m.L[i] += ML[i] * g * 0.9 + D[i] * dg * 0.55; m.R[i] += MR[i] * g * 0.9 + D[i] * dg * 0.55; }
  for (const c of cues) {
    const i0 = Math.floor(c.t * SR);
    if (c.sfx === 'type') { for (let x = 0; x < (c.dur || 0.6); x += 0.07 + Math.abs(m.rnd()) * 0.05) { const s = Math.floor((c.t + x) * SR); for (let j = 0; j < 0.012 * SR; j++) m.add(s + j, m.rnd() * Math.exp(-j / SR * 400) * 0.12, 0.1); } }
    else if (c.sfx === 'tick') { for (let x = 0; x < (c.dur || 0.6); x += 0.06) m.blip(c.t + x, 2200, 0.02); }
    else if (c.sfx === 'ping') { for (let x = 0; x < (c.dur || 2); x += 1.4) { const s = Math.floor((c.t + x) * SR); for (let j = 0; j < 0.9 * SR; j++) { const tt = j / SR; m.add(s + j, Math.sin(2 * Math.PI * 1250 * tt) * Math.exp(-tt * 5) * 0.05); } } }
    else if (c.sfx === 'pop') m.blip(c.t, 800, 0.08);
    else if (c.sfx === 'swish') m.whoosh(c.t + 0.15, 0.3, 0.3);
    else sfx(m, c.sfx, c.t);
    void i0;
  }
}

// ---------- cover + upload text ----------
function cover() {
  const c = createCanvas(W, H), ctx = c.getContext('2d'), cv = ep.cover || {};
  background(ctx, 0.5);
  ctx.save(); ctx.translate(540, 1050); ctx.scale(1.5, 1.5); (ICONS[cv.icon || 'question'] || ICONS.question)(ctx, 1.2); ctx.restore();
  font(ctx, 150, 900, DISPLAY); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  (cv.lines || [ep.title]).forEach((l, i) => { const y = 470 + i * 165; font(ctx, 150, 900, DISPLAY); const fw = ctx.measureText(l.toUpperCase()).width; if (fw > 940) font(ctx, Math.floor(150 * 940 / fw), 900, DISPLAY); ctx.strokeStyle = '#000'; ctx.lineWidth = 20; ctx.strokeText(l.toUpperCase(), 540, y); ctx.fillStyle = i === (cv.highlight ?? 1) ? P.red : '#fff'; ctx.fillText(l.toUpperCase(), 540, y); });
  ctx.textAlign = 'left';
  stamp(ctx, cv.stamp || 'UNSOLVED', 560, 1420, -0.12, 1, P.red, 90);
  font(ctx, 40, 800, MONO); ctx.fillStyle = P.red; ctx.fillText(`CASE ${ep.case || '001'}`, 90, 250);
  writeFileSync(path.join(OUT, `${NAME}-cover.png`), c.toBuffer('image/png'));
}
function uploadText() {
  const u = ep.upload || {};
  const tags = [...new Set([...(u.hashtags || []), ...(channel.hashtags || [])])];
  const txt = [
    `TITLE (${(u.title || '').length}/100 chars):`, u.title || ep.title, '',
    'DESCRIPTION:', u.description || '', '',
    ep.sources?.length ? 'Sources:\n' + ep.sources.map((s) => `- ${s}`).join('\n') + '\n' : '',
    tags.map((h) => '#' + h).join(' '), '',
    'TAGS (paste into YouTube Studio > Tags):', (u.tags || []).join(', '), '',
    `PINNED COMMENT: ${u.pinned || 'What do you think really happened? 👇'}`,
  ].join('\n');
  writeFileSync(path.join(OUT, `${NAME}-upload.txt`), txt);
}

// ---------- go ----------
const si = process.argv.indexOf('--stills');
if (si > -1 && (process.argv[si + 1] || 'auto') === 'auto') { process.argv[si + 1] = beats.map((b) => (b.start + b.dur * 0.8).toFixed(2)).join(','); }
console.log(`${NAME}: ${beats.length} beats, ${TOTAL.toFixed(1)}s`);
if (TOTAL > 60) console.warn(`⚠ ${TOTAL.toFixed(1)}s is over 60s. Fine for Shorts (up to 3 min), but shorter usually retains better.`);
await render({ name: NAME, total: TOTAL, drawFrame, audio, outDir: OUT });
cover(); uploadText();
console.log(`Cover: out/${NAME}-cover.png  Upload text: out/${NAME}-upload.txt`);
