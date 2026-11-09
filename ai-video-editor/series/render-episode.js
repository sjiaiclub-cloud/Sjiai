// Renders one cartoon episode from its JSON script.
//   node series/render-episode.js series/<slug>/part-1.json [--stills auto|t1,t2,...]
// See series/SCHEMA.md for the script format.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { W, H, DISPLAY, MONO, SANS, clamp, prog, ease, font, render } from '../lib/kit.js';
import { drawCharacter } from './engine/characters.js';
import { getSet } from './engine/sets.js';
import { speak, engineName, SR } from './engine/voice.js';
import { music, sfx } from './engine/score.js';

const Y = '#ffd23f', INK = '#141414', CREAM = '#f6f1e6', RED = '#e8432f';
const file = process.argv[2];
if (!file || file.startsWith('--')) { console.error('usage: node series/render-episode.js <episode.json> [--stills auto]'); process.exit(1); }
const ep = JSON.parse(readFileSync(file, 'utf8'));
const epDir = path.dirname(path.resolve(file));
const slug = ep.slug || path.basename(epDir);
const NAME = `${slug}-part-${ep.part}`;
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../out');
const CACHE = path.join(epDir, '.cache');

// ---------- characters ----------
const CH = {};
for (const [id, c] of Object.entries(ep.characters || {})) CH[id] = { id, ...c, voice: c.voice || {} };
const narrator = ep.narrator ? { id: 'narrator', name: 'Narrator', voice: ep.narrator.voice || ep.narrator } : null;
const need = (id, where) => { if (!CH[id]) throw new Error(`${where}: unknown character "${id}". Defined: ${Object.keys(CH).join(', ')}`); return CH[id]; };

// ---------- timeline ----------
console.log(`Voices: ${engineName()}`);
const beats = [], clips = [], cues = [];
let T = 0;
const threads = {};
for (const [si, scene] of ep.scenes.entries()) {
  scene.setObj = getSet(scene.set);
  scene.start = T;
  scene.order = [];
  const castAdd = (id) => { if (id && !scene.order.includes(id)) scene.order.push(id); };
  (scene.cast || []).forEach(castAdd);
  if (si > 0) cues.push({ t: T, sfx: 'whoosh' });
  for (const [bi, b] of scene.beats.entries()) {
    const beat = { ...b, scene, start: T, index: beats.length };
    const where = `scene ${si + 1} beat ${bi + 1}`;
    if (b.say || b.narrate) {
      const who = b.say ? need(b.say, where) : narrator;
      if (!who) throw new Error(`${where}: "narrate" needs a top-level "narrator" voice`);
      const text = b.line;
      if (!text) throw new Error(`${where}: missing "line"`);
      const clip = await speak(text, who.voice, { emotion: b.emotion, id: who.id }, CACHE);
      beat.who = who; beat.audioAt = T + 0.12; beat.clip = clip;
      beat.dur = b.dur ?? clip.dur + 0.38;
      clips.push({ at: beat.audioAt, samples: clip.samples });
      const words = text.split(/\s+/).filter(Boolean), wts = words.map((w) => w.replace(/[^\w]/g, '').length + 2), tot = wts.reduce((x, y) => x + y, 0);
      let acc = 0; beat.words = words.map((w, k) => { const s = (acc / tot) * clip.dur * 0.94; acc += wts[k]; return { w, s }; });
      if (b.say) { castAdd(b.say); [].concat(b.with || []).forEach((id) => { need(id, where); castAdd(id); }); }
    } else if (b.phone !== undefined) {
      const contact = b.phone || 'Unknown';
      const msgs = b.messages || [{ from: 'them', text: b.text }];
      const th = (threads[contact] ||= []);
      beat.prior = th.length; beat.contact = contact;
      let tt = 0.35; beat.msgTimes = [];
      for (const msg of msgs) {
        if (!msg.text) throw new Error(`${where}: phone message missing "text"`);
        if (msg.from !== 'me') tt += 0.5;
        beat.msgTimes.push(tt);
        if (msg.from !== 'me' && b.read) {
          const reader = b.read === 'narrator' ? narrator : need(b.read, where);
          const clip = await speak(msg.text, reader.voice, { emotion: b.emotion, fx: b.readFx ?? 'eerie', id: reader.id }, CACHE);
          clips.push({ at: T + tt + 0.1, samples: clip.samples });
          tt += clip.dur + 0.35;
        } else tt += 0.6 + msg.text.length * 0.045;
        if (b.sfx === undefined) cues.push({ t: T + beat.msgTimes.at(-1), sfx: msg.from === 'me' ? 'outgoing' : 'buzz' });
        th.push(msg);
      }
      beat.thread = th.slice();
      beat.dur = b.dur ?? tt + 0.7;
    } else if (b.card) {
      beat.dur = b.dur ?? 1.7;
      if (b.sfx === undefined && bi > 0) cues.push({ t: T, sfx: 'whoosh' });
    } else if (b.react) {
      need(b.react, where); castAdd(b.react); [].concat(b.with || []).forEach((id) => { need(id, where); castAdd(id); });
      beat.dur = b.dur ?? 1.3;
    } else throw new Error(`${where}: beat needs one of say / narrate / phone / card / react`);
    if (b.sfx) cues.push({ t: T + (b.sfxAt || 0), sfx: b.sfx });
    if (b.fx === 'blackout' && !b.sfx) cues.push({ t: T + 0.25, sfx: 'power-down' });
    beats.push(beat);
    T += beat.dur;
  }
  scene.end = T;
}
const vote = ep.vote;
if (!vote?.question || !vote.a || !vote.b) throw new Error('episode needs vote: { question, a, b }');
const VOTE_START = T;
let voteDur = vote.dur ?? 6.5;
cues.push({ t: VOTE_START, sfx: 'whoosh' }, { t: VOTE_START + 1.1, sfx: 'pop' }, { t: VOTE_START + 1.5, sfx: 'pop' }, { t: VOTE_START + 2.1, sfx: 'thud' });
if (narrator && vote.narrate !== false) {
  const clip = await speak(`${vote.question} ${vote.a}, or ${vote.b}?`, narrator.voice, { id: 'narrator' }, CACHE);
  clips.push({ at: VOTE_START + 0.3, samples: clip.samples });
  voteDur = Math.max(voteDur, clip.dur + 3);
}
const TOTAL = VOTE_START + voteDur;
const SCENE_STARTS = ep.scenes.slice(1).map((s) => s.start).concat(VOTE_START);

// ---------- drawing ----------
const layer = createCanvas(W, H), lctx = layer.getContext('2d');
const lastEmotion = {};

function wrap(ctx, text, maxW) {
  const out = []; let cur = '';
  for (const w of text.split(/\s+/)) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out;
}

function cast(beat, lt) {
  const sc = beat.scene, out = [];
  const focus = beat.say || beat.react;
  const mouthFor = (id) => {
    if (beat.say !== id || !beat.clip) return 0;
    const f = Math.floor((beat.start + lt - beat.audioAt) * 30);
    return f >= 0 && f < beat.clip.mouth.length ? beat.clip.mouth[f] : 0;
  };
  const emo = (id) => (id === focus ? beat.emotion : beat.listen?.[id]) || lastEmotion[id] || 'neutral';
  const shot = beat.shot || (beat.say || beat.react ? ([].concat(beat.with || []).length ? 'two' : 'close') : 'wide');
  if (shot === 'close' && focus) out.push({ id: focus, x: 540, y: 1270, s: 1.12, look: beat.look ?? 0.15 });
  else if (shot === 'two' && focus) {
    const ids = [focus, ...[].concat(beat.with || [])].slice(0, 2).sort((a, b) => sc.order.indexOf(a) - sc.order.indexOf(b));
    ids.forEach((id, k) => out.push({ id, x: k ? 790 : 290, y: 1360, s: 0.8, look: k ? -0.8 : 0.8 }));
  } else {
    const ids = beat.say || beat.react ? [focus, ...[].concat(beat.with || [])] : sc.order;
    ids.forEach((id, k) => out.push({ id, x: 540 + (k - (ids.length - 1) / 2) * 330, y: 1450, s: 0.55, look: 0 }));
  }
  return out.map((p) => ({ ...p, ch: CH[p.id], emotion: emo(p.id), mouth: mouthFor(p.id), dim: focus && p.id !== focus }));
}

function drawScene(ctx, beat, lt, t) {
  const sc = beat.scene, set = sc.setObj;
  const z = 1 + 0.035 * ease.inOut(prog(lt, 0, beat.dur));
  let sx = 0, sy = 0;
  if (beat.shake || ['thud', 'sting', 'knock'].includes(beat.sfx)) { const k = Math.max(0, 1 - (lt - (beat.sfxAt || 0)) * 3); if (k > 0 && lt >= (beat.sfxAt || 0)) { sx = Math.sin(t * 90) * 14 * k; sy = Math.cos(t * 70) * 10 * k; } }
  ctx.save(); ctx.translate(540 + sx, 960 + sy); ctx.scale(z, z); ctx.translate(-540, -960);
  set.draw(ctx, t);
  const people = beat.phone !== undefined || beat.card ? [] : cast(beat, lt);
  if (people.length) {
    lctx.clearRect(0, 0, W, H);
    for (const p of people) drawCharacter(lctx, p.ch, p.x, p.y, p.s, { t, mouth: p.mouth, emotion: p.emotion, look: p.look });
    if (set.tint) { lctx.globalCompositeOperation = 'source-atop'; lctx.fillStyle = set.tint; lctx.fillRect(0, 0, W, H); lctx.globalCompositeOperation = 'source-over'; }
    ctx.drawImage(layer, 0, 0);
  }
  ctx.restore();
  for (const p of people) if (p.id === (beat.say || beat.react)) lastEmotion[p.id] = p.emotion;
}

function darkness(ctx, beat, lt, t) {
  const sc = beat.scene;
  const bo = sc.beats.findIndex((b) => b.fx === 'blackout');
  const myIdx = beat.index - beats.indexOf(beats.find((b) => b.scene === sc));
  if (bo < 0 || myIdx < bo) return;
  let a = 0.8;
  if (myIdx === bo) {
    const x = lt - 0.25;
    if (x < 0) return;
    a = x < 0.7 ? ([0, 0.8, 0.1, 0.8, 0.3, 0.85][Math.floor(x / 0.12)] ?? 0.8) : 0.82;
  }
  ctx.fillStyle = `rgba(4,4,8,${a})`; ctx.fillRect(0, 0, W, H);
  if (a > 0.5) { const g = ctx.createRadialGradient(540, 1700, 50, 540, 1700, 1100); g.addColorStop(0, `rgba(232,40,30,${0.22 + 0.1 * Math.sin(t * 4)})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}

function chrome(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 760);
  font(ctx, 30, 600, MONO); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(`// ${ep.series.toUpperCase()}`, 90, 290);
  const label = `PART ${ep.part}`; font(ctx, 30, 800, MONO); const w = ctx.measureText(label).width + 36;
  ctx.fillStyle = Y; ctx.beginPath(); ctx.roundRect(990 - w, 252, w, 50, 12); ctx.fill(); ctx.fillStyle = INK; ctx.fillText(label, 990 - w + 18, 288);
}

function subtitles(ctx, beat, t) {
  if (!beat.words) return;
  const lt = t - beat.audioAt;
  if (beat.who && beat.who.id !== 'narrator') {
    const p = ease.back(prog(t - beat.start, 0, 0.25));
    font(ctx, 30, 800, MONO); const nm = beat.who.name.toUpperCase(), w = ctx.measureText(nm).width + 40;
    ctx.save(); ctx.translate(540, 395); ctx.scale(p, p);
    ctx.fillStyle = beat.who.accent || Y; ctx.beginPath(); ctx.roundRect(-w / 2, -28, w, 52, 26); ctx.fill();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(nm, 0, 9); ctx.restore();
  }
  const size = 76, lh = 88; font(ctx, size, 900, DISPLAY);
  const up = beat.words.map((x) => x.w.toUpperCase());
  const lines = []; let cur = [];
  for (let k = 0; k < up.length; k++) { const test = [...cur.map((i) => up[i]), up[k]].join(' '); if (ctx.measureText(test).width > 900 && cur.length) { lines.push(cur); cur = []; } cur.push(k); }
  if (cur.length) lines.push(cur);
  const active = beat.words.findLastIndex((x) => lt >= x.s);
  ctx.lineJoin = 'round'; ctx.textAlign = 'left';
  lines.forEach((ln, li) => {
    const full = ln.map((k) => up[k]).join(' '), sw = ctx.measureText(' ').width;
    let x = 540 - ctx.measureText(full).width / 2; const y = 500 + li * lh;
    for (const k of ln) {
      const ww = ctx.measureText(up[k]).width, st = beat.words[k].s;
      if (lt >= st) {
        const pop = 1 + 0.25 * (1 - ease.out(clamp((lt - st) / 0.14)));
        ctx.save(); ctx.translate(x + ww / 2, y - size * 0.35); ctx.scale(pop, pop); ctx.translate(-(x + ww / 2), -(y - size * 0.35));
        ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.strokeText(up[k], x, y);
        ctx.fillStyle = k === active ? Y : '#ffffff'; ctx.fillText(up[k], x, y);
        ctx.restore();
      }
      x += ww + sw;
    }
  });
}

function phone(ctx, beat, lt) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
  const pin = ease.out(prog(lt, 0, 0.35));
  const X = 200, Yp = 560 + (1 - pin) * 400, PW = 680, PH = 860;
  ctx.save(); ctx.globalAlpha = clamp(pin * 1.5);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(X + 10, Yp + 14, PW, PH, 64); ctx.fill();
  ctx.fillStyle = '#1e1e22'; ctx.beginPath(); ctx.roundRect(X, Yp, PW, PH, 64); ctx.fill();
  const sx = X + 18, sy = Yp + 18, sw = PW - 36, sh = PH - 36;
  ctx.save(); ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 48); ctx.clip();
  ctx.fillStyle = '#0f0f12'; ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(sx + sw / 2 - 70, sy + 14, 140, 34, 17); ctx.fill();
  ctx.fillStyle = '#3a3a42'; ctx.beginPath(); ctx.arc(sx + sw / 2, sy + 100, 34, 0, Math.PI * 2); ctx.fill();
  font(ctx, 34, 700, SANS); ctx.fillStyle = CREAM; ctx.textAlign = 'center'; ctx.fillText('?', sx + sw / 2, sy + 112);
  font(ctx, 28, 600, SANS); ctx.fillText(beat.contact, sx + sw / 2, sy + 168); ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(sx, sy + 192, sw, 2);
  // layout bubbles
  font(ctx, 40, 500, SANS);
  const items = [];
  beat.thread.forEach((m, k) => {
    const isNew = k >= beat.prior, ni = k - beat.prior, at = isNew ? beat.msgTimes[ni] : -1;
    const lines = wrap(ctx, m.text, 420), bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 52, bh = lines.length * 50 + 34;
    items.push({ m, lines, bw, bh, at, typingFrom: isNew && m.from !== 'me' ? at - 0.5 : null });
  });
  const visible = items.filter((it) => lt >= (it.typingFrom ?? it.at));
  let total = visible.reduce((a, it) => a + (lt >= it.at ? it.bh : 96) + 18, 0);
  let y = sy + 220 - Math.max(0, total - (sh - 250));
  for (const it of visible) {
    const right = it.m.from === 'me';
    if (lt < it.at) { // typing dots
      ctx.fillStyle = '#2c2c33'; ctx.beginPath(); ctx.roundRect(sx + 28, y, 150, 80, 40); ctx.fill();
      for (let k = 0; k < 3; k++) { const b = Math.max(0, Math.sin(lt * 10 - k * 0.8)); ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * b})`; ctx.beginPath(); ctx.arc(sx + 70 + k * 33, y + 40 - b * 7, 10, 0, Math.PI * 2); ctx.fill(); }
      y += 96 + 18; continue;
    }
    const p = it.at < 0 ? 1 : ease.back(prog(lt, it.at, 0.3));
    const bx = right ? sx + sw - 28 - it.bw : sx + 28;
    ctx.save(); ctx.translate(right ? bx + it.bw : bx, y + it.bh); ctx.scale(p, p); ctx.translate(-(right ? bx + it.bw : bx), -(y + it.bh));
    ctx.fillStyle = right ? Y : '#2c2c33'; ctx.beginPath(); ctx.roundRect(bx, y, it.bw, it.bh, 30); ctx.fill();
    font(ctx, 40, 500, SANS); ctx.fillStyle = right ? INK : CREAM; it.lines.forEach((l, k) => ctx.fillText(l, bx + 26, y + 58 + k * 50));
    ctx.restore();
    y += it.bh + 18;
  }
  ctx.restore(); ctx.restore();
}

function card(ctx, beat, lt) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
  const p = ease.back(prog(lt, 0.05, 0.35));
  ctx.save(); ctx.translate(540, 900); ctx.scale(p, p);
  font(ctx, 124, 900, DISPLAY); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  const lines = wrap(ctx, beat.card.toUpperCase(), 900);
  lines.forEach((l, k) => { const yy = (k - (lines.length - 1) / 2) * 130; ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.strokeText(l, 0, yy); ctx.fillStyle = '#fff'; ctx.fillText(l, 0, yy); });
  ctx.fillStyle = Y; ctx.fillRect(-120, lines.length * 65 + 10, 240, 14);
  if (beat.sub) { font(ctx, 36, 600, MONO); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText(beat.sub, 0, lines.length * 65 + 90); }
  ctx.restore();
}

function voteScreen(ctx, t) {
  const lt = t - VOTE_START, last = ep.scenes.at(-1);
  last.setObj.draw(ctx, t);
  ctx.fillStyle = 'rgba(8,8,12,0.82)'; ctx.fillRect(0, 0, W, H);
  chrome(ctx);
  const k = ease.out(prog(lt, 0.2, 0.4));
  font(ctx, 34, 700, MONO); ctx.fillStyle = Y; ctx.globalAlpha = k; ctx.fillText(`// PART ${ep.part + 1} IS UP TO YOU`, 90, 420); ctx.globalAlpha = 1;
  font(ctx, 92, 900, DISPLAY); ctx.lineJoin = 'round';
  const q = wrap(ctx, vote.question.toUpperCase(), 900);
  q.forEach((l, i) => { const p = ease.out(prog(lt, 0.35 + i * 0.12, 0.4)); if (p <= 0) return; ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 40); ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.strokeText(l, 90, 540 + i * 100); ctx.fillStyle = '#fff'; ctx.fillText(l, 90, 540 + i * 100); ctx.restore(); });
  const top = 560 + q.length * 100;
  [['A', vote.a, Y], ['B', vote.b, RED]].forEach(([L, text, col], i) => {
    const p = ease.back(prog(lt, 1.1 + i * 0.4, 0.4)); if (p <= 0) return;
    const y = top + i * 215;
    ctx.save(); ctx.translate(90 + (1 - p) * 300, y); ctx.globalAlpha = clamp(p * 2);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(10, 12, 830, 180, 30); ctx.fill();
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.roundRect(0, 0, 830, 180, 30); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(28, 30, 120, 120, 24); ctx.fill();
    font(ctx, 90, 900, DISPLAY); ctx.fillStyle = L === 'A' ? INK : '#fff'; ctx.textAlign = 'center'; ctx.fillText(L, 88, 122); ctx.textAlign = 'left';
    font(ctx, 44, 700, SANS); ctx.fillStyle = INK; const ls = wrap(ctx, text, 620).slice(0, 2);
    ls.forEach((l, j) => ctx.fillText(l, 180, 90 - (ls.length - 1) * 26 + j * 54 + 6));
    ctx.restore();
  });
  const cp = ease.out(prog(lt, 2.1, 0.4));
  if (cp > 0) {
    const y = top + 2 * 215 + 90;
    ctx.save(); ctx.globalAlpha = cp;
    font(ctx, 80, 900, DISPLAY); ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.strokeText('COMMENT A OR B', 90, y); ctx.fillStyle = Y; ctx.fillText('COMMENT A OR B', 90, y);
    const ax = 90 + ctx.measureText('COMMENT A OR B').width + 30, by = Math.sin(t * 6) * 10;
    ctx.fillStyle = Y; ctx.beginPath(); ctx.moveTo(ax, y - 60 + by); ctx.lineTo(ax + 50, y - 60 + by); ctx.lineTo(ax + 25, y - 20 + by); ctx.fill();
    ctx.restore();
  }
}

function wipe(ctx, t) {
  for (const b of SCENE_STARTS) {
    const d = 0.22; let x0, x1;
    if (t >= b - d && t < b) { x0 = 0; x1 = ease.inOut((t - (b - d)) / d) * W; }
    else if (t >= b && t < b + d) { x0 = ease.inOut((t - b) / d) * W; x1 = W; }
    else continue;
    ctx.fillStyle = Y; ctx.fillRect(x0, 0, x1 - x0, H); ctx.fillStyle = INK; ctx.fillRect(x1 - 22, 0, 22, H);
  }
}

function drawFrame(ctx, t) {
  if (t >= VOTE_START) { voteScreen(ctx, t); wipe(ctx, t); return; }
  const beat = beats.findLast((b) => t >= b.start) || beats[0], lt = t - beat.start;
  drawScene(ctx, beat, lt, t);
  darkness(ctx, beat, lt, t);
  chrome(ctx);
  if (beat.phone !== undefined) phone(ctx, beat, lt);
  else if (beat.card) card(ctx, beat, lt);
  else subtitles(ctx, beat, t);
  wipe(ctx, t);
}

// ---------- audio ----------
function audio(m) {
  const N = m.N, D = new Float32Array(N), ML = new Float32Array(N), MR = new Float32Array(N);
  for (const c of clips) { const i0 = Math.floor(c.at * SR); for (let k = 0; k < c.samples.length && i0 + k < N; k++) D[i0 + k] += c.samples[k]; }
  for (const sc of ep.scenes) music(ML, MR, m.rnd, sc.start, sc.end + 0.15, sc.music || ep.music || 'mystery');
  music(ML, MR, m.rnd, VOTE_START, TOTAL, ep.voteMusic || ep.music || 'mystery');
  // duck music under dialogue
  let env = 0; const att = Math.exp(-1 / (0.03 * SR)), rel = Math.exp(-1 / (0.35 * SR));
  let dPeak = 1e-6; for (let i = 0; i < N; i++) dPeak = Math.max(dPeak, Math.abs(D[i]));
  const dGain = 0.75 / dPeak;
  for (let i = 0; i < N; i++) {
    const x = Math.abs(D[i] * dGain); env = x > env ? att * env + (1 - att) * x : rel * env + (1 - rel) * x;
    const g = 1 - 0.65 * Math.min(1, env * 5);
    m.L[i] += ML[i] * g + D[i] * dGain * 0.5; m.R[i] += MR[i] * g + D[i] * dGain * 0.5;
  }
  for (const c of cues) {
    if (c.sfx === 'outgoing') m.blip(c.t, 1200, 0.06);
    else if (c.sfx === 'pop') m.blip(c.t, 800, 0.08);
    else sfx(m, c.sfx, c.t);
  }
}

// ---------- go ----------
const si = process.argv.indexOf('--stills');
if (si > -1 && (process.argv[si + 1] || 'auto') === 'auto') {
  const ts = beats.map((b) => b.start + b.dur * 0.75).concat(VOTE_START + voteDur - 0.6).map((x) => x.toFixed(2));
  process.argv[si + 1] = ts.join(',');
  console.log(`still times: ${ts.join(', ')}`);
}
console.log(`${NAME}: ${beats.length} beats, ${TOTAL.toFixed(1)}s`);
await render({ name: NAME, total: TOTAL, drawFrame, audio, outDir: OUT });
if (si < 0) {
  const caption = `${ep.series} — Part ${ep.part}${ep.title ? `: ${ep.title}` : ''}\n\n${vote.question}\nA) ${vote.a}\nB) ${vote.b}\n\nComment A or B. Most votes decides Part ${ep.part + 1}.\n\n${(ep.hashtags || ['animation', 'story', 'series', 'cartoon']).map((h) => '#' + h).join(' ')}\n`;
  writeFileSync(path.join(OUT, `${NAME}-caption.txt`), caption);
  console.log(`Caption: out/${NAME}-caption.txt`);
}
