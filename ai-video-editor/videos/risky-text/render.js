// "The 7 seconds after you send a risky text" - second-by-second breakdown reel.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W, H, C, DISPLAY, MONO, SANS, clamp, prog, lerp, ease, rr, font, line, kicker, background, shadowCard, wipe, commentBox, render } from '../../lib/kit.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- timeline ----------
const STAGES = [
  { dur: 2.8, bpm: 82, cap: ['You hit send.'] },
  { dur: 2.8, bpm: 104, cap: ['Instant regret.'] },
  { dur: 3.2, bpm: 112, cap: ['You reread it', '14 times.'] },
  { dur: 3.0, bpm: 120, cap: ['You spot', [{ s: 'a ' }, { s: 'typo.', c: C.red }]] },
  { dur: 2.8, bpm: 150, cap: [[{ s: 'Read.', c: C.red }]] },
  { dur: 2.8, bpm: 162, cap: ["They're", 'typing...'] },
  { dur: 2.6, bpm: 178, cap: ['They stopped', 'typing.'] },
  { dur: 3.8, bpm: 178, cap: [[{ s: '"k"', c: C.red }]] },
];
let a = 0; for (const s of STAGES) { s.start = a; a += s.dur; }
const MAIN_DUR = a;
const K_AT = 0.5; // seconds into the last stage when "k" arrives
const SCENES = [{ dur: 4, draw: hook }, { dur: MAIN_DUR, draw: main }, { dur: 6.5, draw: cta, dark: true }];
a = 0; for (const s of SCENES) { s.start = a; a += s.dur; }
const TOTAL = a, MS = SCENES[1].start, BOUNDARIES = [SCENES[1].start, SCENES[2].start];
const FLAT_AT = STAGES[7].start + K_AT;

// heart rate (main-scene time) and its integrated phase, shared by the ECG and the heartbeat audio
function bpmAt(t) {
  const i = STAGES.findLastIndex((s) => t >= s.start);
  if (i < 0) return STAGES[0].bpm;
  if (t >= FLAT_AT) return 0;
  const prev = i ? STAGES[i - 1].bpm : 72;
  return lerp(prev, STAGES[i].bpm, ease.out(prog(t - STAGES[i].start, 0, 0.6)));
}
const PH_RATE = 200, PHASE = new Float64Array(Math.ceil((MAIN_DUR + 1) * PH_RATE) + 2);
for (let k = 1; k < PHASE.length; k++) PHASE[k] = PHASE[k - 1] + bpmAt(k / PH_RATE) / 60 / PH_RATE;
const phaseAt = (t) => PHASE[clamp(Math.floor(t * PH_RATE), 0, PHASE.length - 1)];

// ---------- hook ----------
function hook(ctx, t) {
  kicker(ctx, '// a second-by-second breakdown', t);
  line(ctx, 'The 7 seconds', 90, 520, t, 0.15);
  line(ctx, 'after you send', 90, 650, t, 0.35);
  line(ctx, [{ s: 'a ' }, { s: 'risky text', c: C.red }], 90, 780, t, 0.55);
  line(ctx, "(we've all been there)", 90, 880, t, 0.9, { size: 56, weight: 600, color: C.mute });
  const p = prog(t, 1.2, 0.5);
  if (p > 0) {
    const s = ease.back(p);
    ctx.save(); ctx.translate(540, 1110); ctx.scale(s, s);
    ctx.fillStyle = C.ink; rr(ctx, -40, -205, 80, 40, 10); ctx.fill(); ctx.fillRect(-12, -175, 24, 30);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(10, 12, 150, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.card; ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.stroke();
    for (let k = 0; k < 12; k++) { ctx.save(); ctx.rotate(k * Math.PI / 6); ctx.fillStyle = k % 3 ? C.mute : C.ink; ctx.fillRect(-3, -130, 6, k % 3 ? 14 : 24); ctx.restore(); }
    const sweep = clamp((t - 1.5) / 2.4) * 7 / 60 * Math.PI * 2 * 8;
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 110, -Math.PI / 2, -Math.PI / 2 + sweep); ctx.closePath(); ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.rotate(sweep); ctx.fillStyle = C.red; rr(ctx, -5, -120, 10, 130, 5); ctx.fill(); ctx.restore();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ---------- main: phone + heart monitor ----------
const PH = { x: 110, y: 735, w: 740, h: 1040 };
const BF = 48, LH = 60;
const SCR = { x: PH.x + 20, y: PH.y + 20, w: PH.w - 40, h: PH.h - 40 };
const MY_LINES = ['honestly i miss', 'talkign to you'];

function ecg(ctx, t) {
  const x0 = 90, x1 = 900, yMid = 660, amp = 46, pxPerSec = 260;
  const flat = t >= FLAT_AT;
  const bpm = Math.round(bpmAt(t));
  font(ctx, 30, 700, MONO); ctx.textAlign = 'right';
  ctx.fillStyle = flat ? (Math.floor(t * 3) % 2 ? C.red : C.ink) : C.ink;
  ctx.fillText(flat ? 'BPM ---' : `BPM ${bpm}`, x1, 600);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.red; const beat = flat ? 0 : Math.max(0, 1 - (phaseAt(t) % 1) * 5);
  const hs = 1 + beat * 0.3; ctx.save(); ctx.translate(x1 - 210, 590); ctx.scale(hs, hs);
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-18, -4, -10, -18, 0, -9); ctx.bezierCurveTo(10, -18, 18, -4, 0, 8); ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(20,20,20,0.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, yMid); ctx.lineTo(x1, yMid); ctx.stroke();
  ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = C.red;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 3) {
    const tau = t - (x1 - x) / pxPerSec;
    let y = 0;
    if (tau >= 0 && tau < FLAT_AT) {
      const f = phaseAt(tau) % 1;
      if (f < 0.06) y = -0.15 * Math.sin(f / 0.06 * Math.PI);
      else if (f < 0.09) y = 0.2 * Math.sin((f - 0.06) / 0.03 * Math.PI);
      else if (f < 0.13) y = -1 * Math.sin((f - 0.09) / 0.04 * Math.PI);
      else if (f < 0.17) y = 0.45 * Math.sin((f - 0.13) / 0.04 * Math.PI);
      else if (f > 0.3 && f < 0.42) y = -0.25 * Math.sin((f - 0.3) / 0.12 * Math.PI);
    }
    x === x0 ? ctx.moveTo(x, yMid + y * amp) : ctx.lineTo(x, yMid + y * amp);
  }
  ctx.stroke();
  const g = ctx.createLinearGradient(x0, 0, x0 + 200, 0); g.addColorStop(0, C.bg); g.addColorStop(1, 'rgba(243,239,231,0)');
  ctx.fillStyle = g; ctx.fillRect(x0 - 5, yMid - 70, 205, 140);
}

function bubble(ctx, lines, right, y, fill, color, scale = 1) {
  font(ctx, BF, 500, SANS);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 60, h = lines.length * LH + 38;
  const x = right ? SCR.x + SCR.w - 30 - w : SCR.x + 30;
  ctx.save(); ctx.translate(right ? x + w : x, y + h); ctx.scale(scale, scale); ctx.translate(right ? -(x + w) : -x, -(y + h));
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, 34); ctx.fill();
  ctx.fillStyle = color; lines.forEach((l, i) => ctx.fillText(l, x + 30, y + 70 + i * LH));
  ctx.restore();
  return { x, y, w, h };
}

function main(ctx, t) {
  const i = Math.max(0, STAGES.findLastIndex((s) => t >= s.start)), st = STAGES[i], lt = t - st.start;
  kicker(ctx, '// t+' + i + 's', t);

  // seconds badge
  const bp = ease.back(prog(lt, 0, 0.3));
  ctx.save(); ctx.translate(875, 285); ctx.scale(0.6 + 0.4 * bp, 0.6 + 0.4 * bp);
  ctx.fillStyle = i === 7 ? C.red : C.ink; rr(ctx, -85, -65, 170, 130, 24); ctx.fill();
  font(ctx, 84, 900); ctx.fillStyle = C.cream; ctx.textAlign = 'center'; ctx.fillText(`${i}s`, 0, 30); ctx.textAlign = 'left';
  ctx.restore();

  // caption
  const shake = i === 7 ? Math.sin(lt * 70) * 12 * Math.max(0, 1 - (lt - K_AT) * 3) * (lt > K_AT ? 1 : 0) : 0;
  ctx.save(); ctx.translate(shake, 0);
  const capDelay = i === 7 ? K_AT : 0.05;
  if (st.cap.length === 1) line(ctx, st.cap[0], 90, 505, lt, capDelay, { size: i === 7 ? 130 : 108, dur: 0.4 });
  else { line(ctx, st.cap[0], 90, 445, lt, capDelay, { size: 92, dur: 0.4 }); line(ctx, st.cap[1], 90, 540, lt, capDelay + 0.12, { size: 92, dur: 0.4 }); }
  ctx.restore();

  ecg(ctx, t);

  // phone
  const pin = ease.out(prog(t, 0, 0.5));
  ctx.save(); ctx.translate(0, (1 - pin) * 500);
  ctx.fillStyle = C.ink; rr(ctx, PH.x + 12, PH.y + 14, PH.w, PH.h, 70); ctx.fill();
  ctx.fillStyle = '#26262a'; rr(ctx, PH.x, PH.y, PH.w, PH.h, 70); ctx.fill();
  ctx.save(); rr(ctx, SCR.x, SCR.y, SCR.w, SCR.h, 52); ctx.clip();
  ctx.fillStyle = '#fbfaf7'; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
  // header
  ctx.fillStyle = C.ink; rr(ctx, SCR.x + SCR.w / 2 - 70, SCR.y + 16, 140, 36, 18); ctx.fill();
  font(ctx, 44, 400, SANS); ctx.fillStyle = C.red; ctx.fillText('‹', SCR.x + 30, SCR.y + 128);
  ctx.fillStyle = '#c9c3b8'; ctx.beginPath(); ctx.arc(SCR.x + 105, SCR.y + 112, 30, 0, Math.PI * 2); ctx.fill();
  font(ctx, 30, 700, SANS); ctx.fillStyle = C.cream; ctx.textAlign = 'center'; ctx.fillText('?', SCR.x + 105, SCR.y + 123); ctx.textAlign = 'left';
  font(ctx, 36, 700, SANS); ctx.fillStyle = C.ink; ctx.fillText('them', SCR.x + 150, SCR.y + 108);
  font(ctx, 26, 500, SANS); ctx.fillStyle = C.mute; ctx.fillText(i >= 4 && t < FLAT_AT ? 'active now' : 'last seen 2h ago', SCR.x + 150, SCR.y + 140);
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(SCR.x, SCR.y + 170, SCR.w, 2);
  // older context
  font(ctx, 24, 600, SANS); ctx.fillStyle = C.mute; ctx.textAlign = 'center'; ctx.fillText('3 weeks ago', SCR.x + SCR.w / 2, SCR.y + 220); ctx.textAlign = 'left';
  bubble(ctx, ['ok goodnight'], false, SCR.y + 245, '#e7e3da', C.ink);

  // my risky text
  const fly = ease.back(prog(t, 0.2, 0.45));
  let mine = null;
  if (fly > 0) {
    ctx.save(); ctx.globalAlpha = clamp(fly * 2); ctx.translate(0, (1 - fly) * 300);
    mine = bubble(ctx, MY_LINES, true, SCR.y + 400, C.red, C.cream, 0.7 + 0.3 * fly);
    ctx.restore();
  }
  if (mine) {
    // status line
    let status = t < 1.0 ? 'Sending...' : 'Delivered', sc = C.mute, sw = 500;
    if (i >= 4) { status = 'Read 11:42 PM'; sc = C.red; sw = 700; }
    font(ctx, 26, sw, SANS); ctx.fillStyle = sc; ctx.textAlign = 'right'; ctx.fillText(status, mine.x + mine.w, mine.y + mine.h + 38); ctx.textAlign = 'left';

    // typo marker (from stage 3 on)
    if (i >= 3) {
      font(ctx, BF, 500, SANS);
      const tw = ctx.measureText('talkign').width, tx = mine.x + 30, ty = mine.y + 70 + LH + 10;
      ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.beginPath();
      for (let x = 0; x <= tw; x += 4) ctx.lineTo(tx + x, ty + Math.sin(x * 0.5) * 4);
      ctx.stroke();
      if (i === 3) {
        const cp = ease.inOut(prog(lt, 0.5, 0.5));
        ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath();
        ctx.ellipse(tx + tw / 2, ty - 20, tw / 2 + 40, 50, -0.08, -Math.PI * 0.6, -Math.PI * 0.6 + cp * Math.PI * 2.1); ctx.stroke();
      }
    }
    // reread scanner
    if (i === 2) {
      const count = Math.min(14, Math.floor(lt * 5.2) + 1), sp = (lt * 5.2) % 1;
      ctx.save(); rr(ctx, mine.x, mine.y, mine.w, mine.h, 34); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(mine.x, mine.y + sp * mine.h - 20, mine.w, 40); ctx.restore();
      const pp = 1 + 0.25 * Math.max(0, 1 - sp * 4);
      ctx.save(); ctx.translate(mine.x - 90, mine.y + mine.h / 2); ctx.scale(pp, pp);
      ctx.fillStyle = C.ink; rr(ctx, -70, -36, 140, 72, 36); ctx.fill();
      font(ctx, 38, 700, MONO); ctx.fillStyle = C.cream; ctx.textAlign = 'center'; ctx.fillText(`x${count}`, 0, 13); ctx.textAlign = 'left';
      ctx.restore();
    }
  }

  // typing indicator
  const typingVisible = (i === 5 && lt > 0.25) || (i === 6 && lt < 0.7);
  if (typingVisible) {
    const s = i === 6 ? 1 - ease.in(prog(lt, 0.45, 0.25)) : ease.back(prog(lt, 0.25, 0.3));
    const bx = SCR.x + 30, by = SCR.y + 640;
    ctx.save(); ctx.translate(bx, by + 100); ctx.scale(s, s); ctx.translate(-bx, -(by + 100));
    ctx.fillStyle = '#e7e3da'; rr(ctx, bx, by, 190, 100, 50); ctx.fill();
    for (let k = 0; k < 3; k++) { const b = Math.max(0, Math.sin(t * 9 - k * 0.8)); ctx.fillStyle = `rgba(20,20,20,${0.3 + 0.5 * b})`; ctx.beginPath(); ctx.arc(bx + 55 + k * 40, by + 50 - b * 8, 12, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  // the reply
  if (i === 7 && lt >= K_AT) {
    const s = ease.back(prog(lt, K_AT, 0.35));
    const kb = bubble(ctx, ['k'], false, SCR.y + 640, '#e7e3da', C.ink, s);
    const rp = (lt - K_AT) % 1.2 / 1.2;
    ctx.strokeStyle = `rgba(232,67,47,${1 - rp})`; ctx.lineWidth = 6; rr(ctx, kb.x - rp * 30, kb.y - rp * 30, kb.w + rp * 60, kb.h + rp * 60, 40 + rp * 30); ctx.stroke();
    const lp = ease.out(prog(lt, K_AT + 0.9, 0.4));
    if (lp > 0) { ctx.globalAlpha = lp; font(ctx, 34, 700, MONO); ctx.fillStyle = C.ink; ctx.fillText("← that's the whole reply.", kb.x + kb.w + 30 - (1 - lp) * 30, kb.y + 68); ctx.globalAlpha = 1; }
  }
  // read flash
  if (i === 4) { const f = Math.max(0, 1 - lt * 2.5); if (f > 0) { ctx.fillStyle = `rgba(232,67,47,${0.35 * f})`; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); } }
  ctx.restore(); // screen clip

  // "unsend?" popup + stamp
  if (i === 1) {
    const pp = ease.back(prog(lt, 0.3, 0.35));
    if (pp > 0) {
      ctx.save(); ctx.translate(480, 1300); ctx.scale(pp, pp);
      shadowCard(ctx, -230, -150, 460, 300, 30, C.card);
      font(ctx, 40, 600, SANS);
      ['Copy', 'Reply', 'Unsend'].forEach((o, k) => {
        ctx.fillStyle = k === 2 ? C.red : C.ink; ctx.fillText(o, -180, -70 + k * 90);
        if (k < 2) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(-200, -45 + k * 90, 400, 2); }
      });
      ctx.restore();
      const sp = prog(lt, 1.1, 0.3);
      if (sp > 0) {
        const s = 1.8 - 0.8 * ease.back(sp);
        ctx.save(); ctx.translate(560, 1400); ctx.rotate(-0.1); ctx.scale(s, s); ctx.globalAlpha = clamp(sp * 3);
        ctx.fillStyle = C.red; rr(ctx, -190, -56, 380, 112, 14); ctx.fill();
        font(ctx, 76, 900); ctx.fillStyle = C.cream; ctx.textAlign = 'center'; ctx.fillText('TOO LATE', 0, 27);
        ctx.restore();
      }
    }
  }
  ctx.restore(); // phone slide
}

// ---------- CTA ----------
function cta(ctx, t) {
  kicker(ctx, '// your turn', t, 'rgba(243,239,231,0.5)');
  line(ctx, 'Send this to', 90, 560, t, 0.2, { color: C.cream, size: 124 });
  line(ctx, 'someone who', 90, 695, t, 0.45, { color: C.cream, size: 124 });
  line(ctx, [{ s: 'replies ', c: C.cream }, { s: '"k"', c: C.red }], 90, 830, t, 0.7, { size: 124 });
  const p = ease.out(prog(t, 1.8, 0.5));
  if (p > 0) {
    ctx.save(); ctx.globalAlpha = p; ctx.translate(0, (1 - p) * 80);
    font(ctx, 34, 500, MONO); ctx.fillStyle = 'rgba(243,239,231,0.6)'; ctx.fillText('worst reply you ever got?', 90, 1060);
    const by = Math.sin(t * 6) * 10;
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(640, 1030 + by); ctx.lineTo(680, 1030 + by); ctx.lineTo(660, 1060 + by); ctx.fill();
    commentBox(ctx, t, '"who is this?"', { y: 1100, dark: true, start: 2.5 });
    ctx.restore();
  }
}

function drawFrame(ctx, t) {
  const scene = SCENES.findLast((s) => t >= s.start) ?? SCENES[0];
  background(ctx, scene.dark);
  scene.draw(ctx, t - scene.start);
  wipe(ctx, t, BOUNDARIES);
}

// ---------- audio ----------
function audio(m) {
  const SR = 44100, BEAT = 0.6;
  const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
  const music = (from, to, drums) => {
    for (let b = Math.ceil(from / (BEAT / 2)) * 0.5; b * BEAT < to; b += 0.5) {
      const t0 = b * BEAT, ch = chords[Math.floor(t0 / (BEAT * 8)) % 4], f = ch[[0, 1, 2, 1][Math.round(b * 2) % 4]] * 2, i0 = Math.floor(t0 * SR);
      for (let k = 0; k < 0.35 * SR; k++) { const tt = k / SR; m.add(i0 + k, Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 9) * 0.05, Math.round(b * 2) % 2 ? 0.3 : -0.3); }
      if (!drums) continue;
      if (Number.isInteger(b)) for (let k = 0; k < 0.25 * SR; k++) { const tt = k / SR; m.add(i0 + k, Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-tt * 30)) * tt) * Math.exp(-tt * 14) * 0.3); }
      else for (let k = 0; k < 0.05 * SR; k++) m.add(i0 + k, m.rnd() * Math.exp(-k / SR * 80) * 0.05, 0.2);
    }
  };
  // hook
  music(0, MS, false);
  [0.15, 0.35, 0.55].forEach((x) => m.blip(x, 660, 0.07));
  m.thud(1.2, 0.8);
  for (let x = 1.5; x < MS - 0.2; x += 0.25) m.blip(x, 2600, 0.03);
  m.whoosh(MS);
  // main: drone that tightens with each stage, cut when "k" lands
  const kT = MS + FLAT_AT;
  for (let n = Math.floor(MS * SR); n < Math.floor(kT * SR); n++) {
    const t = n / SR, mt = t - MS, inten = clamp(mt / MAIN_DUR);
    const trem = 1 + 0.3 * Math.sin(2 * Math.PI * (2 + inten * 6) * t);
    let v = Math.sin(2 * Math.PI * 55 * t) * 0.5 + Math.sin(2 * Math.PI * 82.41 * t) * 0.35 + Math.sin(2 * Math.PI * 110 * t) * 0.15;
    v += inten > 0.45 ? Math.sin(2 * Math.PI * 880 * t) * 0.06 * (inten - 0.45) * 2 * trem : 0;
    const env = Math.min(1, mt / 0.8) * Math.min(1, (kT - t) / 0.03);
    m.add(n, v * (0.05 + inten * 0.07) * env);
  }
  // heartbeat (lub-dub) on every phase crossing
  for (let k = 1; k < PHASE.length; k++) {
    if (Math.floor(PHASE[k]) > Math.floor(PHASE[k - 1])) {
      const tc = MS + k / PH_RATE; if (tc >= kT) break;
      for (const [off, vol] of [[0, 0.5], [0.13, 0.32]]) {
        const i0 = Math.floor((tc + off) * SR);
        for (let j = 0; j < 0.18 * SR; j++) { const tt = j / SR; m.add(i0 + j, Math.sin(2 * Math.PI * (48 + 30 * Math.exp(-tt * 25)) * tt) * Math.exp(-tt * 22) * vol); }
      }
    }
  }
  const S = (i, x) => MS + STAGES[i].start + x;
  // 0 send
  for (let j = 0; j < 0.25 * SR; j++) { const tt = j / SR, f = 400 + 3200 * tt; m.add(Math.floor(S(0, 0.2) * SR) + j, Math.sin(2 * Math.PI * f * tt) * 0.06 * (1 - tt / 0.25)); }
  m.blip(S(0, 1.0), 1400, 0.05);
  // 1 regret
  m.blip(S(1, 0.3), 900, 0.07); m.thud(S(1, 1.1), 0.9); m.tone(S(1, 1.1), 110, 0.4, 0.06, { type: 'square' });
  // 2 rereads
  for (let c = 1; c < 14; c++) m.blip(S(2, c / 5.2), 1500 + c * 40, 0.035);
  // 3 typo
  m.tone(S(3, 0.6), 150, 0.16, 0.09, { type: 'square' }); m.tone(S(3, 0.82), 150, 0.16, 0.09, { type: 'square' });
  // 4 read
  m.thud(S(4, 0)); m.tone(S(4, 0.05), 1760, 0.8, 0.05, { release: 0.6 });
  // 5-6 typing clicks
  const click = (tc) => { const i0 = Math.floor(tc * SR); for (let j = 0; j < 0.015 * SR; j++) m.add(i0 + j, m.rnd() * Math.exp(-j / SR * 300) * 0.08, 0.1); };
  for (let x = S(5, 0.3); x < S(6, 0.6); x += 0.09 + Math.abs(m.rnd()) * 0.08) click(x);
  // 7 "k" ding, then flatline
  m.tone(kT, 1318.5, 0.12, 0.13); m.tone(kT + 0.1, 1760, 0.25, 0.13, { release: 0.2 });
  m.tone(kT + 0.6, 1000, 2.4, 0.07, { attack: 0.01, release: 0.5 });
  // CTA
  const cs = SCENES[2].start;
  m.whoosh(cs);
  music(cs + 0.2, TOTAL, true);
  [0.2, 0.45, 0.7].forEach((x) => m.blip(cs + x, 700, 0.07));
  for (let c = 0; c < 14; c++) m.blip(cs + 2.5 + c * 0.06, 2400 + (c % 3) * 300, 0.025);
}

await render({ name: 'risky-text', total: TOTAL, drawFrame, audio, outDir: path.resolve(HERE, '../../out') });
