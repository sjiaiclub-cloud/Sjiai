// Shared building blocks for reels: palette, easing, text reveals, cards, wipes, audio synth, render loop.
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const W = 1080, H = 1920, FPS = 30, SR = 44100;
export const C = { bg: '#f3efe7', ink: '#141414', red: '#e8432f', mute: '#8a857c', card: '#ffffff', dark: '#1c1c1f', cream: '#f3efe7', gold: '#ffcf6b' };
export const DISPLAY = '"Inter Display"', MONO = '"JetBrains Mono"', SANS = 'Inter';

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const prog = (t, s, d) => clamp((t - s) / d);
export const lerp = (a, b, p) => a + (b - a) * p;
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function font(ctx, size, weight = 900, family = DISPLAY) { ctx.font = `${weight} ${size}px ${family}`; }

// Masked slide-up text reveal. `segs` is a string or [{s, c}] for mixed colours.
export function line(ctx, segs, x, y, t, delay, o = {}) {
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

export function kicker(ctx, str, t, color = C.mute) {
  const p = ease.out(prog(t, 0, 0.4));
  ctx.save(); ctx.globalAlpha = p; font(ctx, 34, 500, MONO); ctx.fillStyle = color; ctx.fillText(str, 90 - (1 - p) * 30, 300); ctx.restore();
}

const halftones = {};
export function background(ctx, dark) {
  ctx.fillStyle = dark ? C.ink : C.bg; ctx.fillRect(0, 0, W, H);
  const key = dark ? 'd' : 'l';
  if (!halftones[key]) {
    const c = createCanvas(W, H), g = c.getContext('2d');
    g.fillStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.045)';
    for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) { g.beginPath(); g.arc(x, y, 1.5, 0, Math.PI * 2); g.fill(); }
    halftones[key] = c;
  }
  ctx.drawImage(halftones[key], 0, 0);
}

export function shadowCard(ctx, x, y, w, h, r, fill, stroke = C.ink) {
  ctx.fillStyle = 'rgba(20,20,20,0.9)'; rr(ctx, x + 10, y + 12, w, h, r); ctx.fill();
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke();
}

// Red/ink bar that sweeps across at each scene boundary.
export function wipe(ctx, t, boundaries, d = 0.28) {
  for (const b of boundaries) {
    let x0, x1;
    if (t >= b - d && t < b) { x0 = 0; x1 = ease.inOut((t - (b - d)) / d) * W; }
    else if (t >= b && t < b + d) { x0 = ease.inOut((t - b) / d) * W; x1 = W; }
    else continue;
    ctx.fillStyle = C.red; ctx.fillRect(x0, 0, x1 - x0, H);
    ctx.fillStyle = C.ink; ctx.fillRect(x1 - 24, 0, 24, H);
  }
}

// Comment box with a typed message: used for CTAs.
export function commentBox(ctx, t, msg, { y = 1120, dark = false, start = 0 } = {}) {
  shadowCard(ctx, 90, y, 820, 130, 65, dark ? '#2a2a2e' : C.dark, dark ? '#000' : C.ink);
  const n = Math.floor(clamp((t - start) / 0.06, 0, msg.length));
  font(ctx, 46, 500, SANS); ctx.fillStyle = n ? C.cream : 'rgba(243,239,231,0.45)';
  const shown = n ? msg.slice(0, n) : 'Add comment...';
  ctx.fillText(shown, 145, y + 80);
  if (n && Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = C.red; ctx.fillRect(150 + ctx.measureText(shown).width, y + 40, 5, 52); }
}

// ---------- audio ----------
export function mixer(total) {
  const N = Math.ceil(total * SR), L = new Float32Array(N), R = new Float32Array(N);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan); R[i] += v * (1 + pan); } };
  const m = {
    N, L, R, rnd, add,
    blip(tc, f = 880, vol = 0.12) { const i0 = Math.floor(tc * SR); for (let k = 0; k < 0.12 * SR; k++) { const tt = k / SR; add(i0 + k, Math.sin(2 * Math.PI * (f + 400 * Math.exp(-tt * 40)) * tt) * Math.exp(-tt * 30) * vol); } },
    thud(tc, vol = 1) { const i0 = Math.floor(tc * SR); for (let k = 0; k < 0.5 * SR; k++) { const tt = k / SR; add(i0 + k, vol * (Math.sin(2 * Math.PI * (40 + 120 * Math.exp(-tt * 20)) * tt) * 0.5 + rnd() * 0.15 * Math.exp(-tt * 40)) * Math.exp(-tt * 7)); } },
    whoosh(tc, d = 0.5, vol = 0.6) { const i0 = Math.floor((tc - d * 0.6) * SR); let y = 0; for (let k = 0; k < d * SR; k++) { const p = k / (d * SR), a = 0.02 + 0.25 * Math.sin(p * Math.PI); y += a * (rnd() - y); add(i0 + k, y * Math.sin(p * Math.PI) * vol, (p - 0.5) * 1.2); } },
    tone(tc, f, d, vol = 0.1, { attack = 0.005, release = 0.05, type = 'sine' } = {}) {
      const i0 = Math.floor(tc * SR), n = Math.floor(d * SR);
      for (let k = 0; k < n; k++) {
        const tt = k / SR, env = Math.min(1, tt / attack) * Math.min(1, (d - tt) / release);
        let s = Math.sin(2 * Math.PI * f * tt);
        if (type === 'square') s = Math.sign(s) * 0.6;
        add(i0 + k, s * env * vol);
      }
    },
    write(file, total) {
      let peak = 0;
      for (let i = 0; i < N; i++) { const t = i / SR, g = Math.min(1, t / 0.2) * Math.min(1, (total - t) / 1.2); L[i] *= g; R[i] *= g; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
      const norm = 0.89 / peak, buf = Buffer.alloc(44 + N * 4);
      buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
      buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
      buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
      for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4); }
      writeFileSync(file, buf);
    },
  };
  return m;
}

// ---------- render loop ----------
// `--stills 1,2.5,7` writes PNGs at those times instead of the full video.
export async function render({ name, total, drawFrame, audio, outDir }) {
  mkdirSync(outDir, { recursive: true });
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  const si = process.argv.indexOf('--stills');
  if (si > -1) {
    process.argv[si + 1].split(',').map(Number).forEach((t, k) => { drawFrame(ctx, t); writeFileSync(path.join(outDir, `still-${k}.png`), canvas.toBuffer('image/png')); });
    return console.log('stills written');
  }
  const wav = path.join(outDir, `${name}.wav`), mp4 = path.join(outDir, `${name}.mp4`);
  const m = mixer(total); audio(m); m.write(wav, total);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(total * FPS);
  for (let f = 0; f < frames; f++) {
    drawFrame(ctx, f / FPS);
    const data = ctx.getImageData(0, 0, W, H).data;
    if (!ff.stdin.write(Buffer.from(data.buffer, data.byteOffset, data.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', (c) => { console.log(c === 0 ? `Rendered ${mp4} (${total.toFixed(1)}s)` : `ffmpeg exited ${c}`); r(); }));
}
