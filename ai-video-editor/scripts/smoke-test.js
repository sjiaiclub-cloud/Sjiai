// Renders a 2-second animated test clip: canvas frames piped into ffmpeg.
import { createCanvas } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';

const W = 1080, H = 1920, FPS = 30, FRAMES = 60;
const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', 'out/smoke-test.mp4'], { stdio: ['pipe', 'ignore', 'inherit'] });

const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
for (let f = 0; f < FRAMES; f++) {
  const t = f / (FRAMES - 1);
  ctx.fillStyle = '#f2efe9'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e8432f';
  ctx.beginPath(); ctx.arc(140 + t * (W - 280), H / 2 - Math.sin(t * Math.PI) * 500, 70, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = 'bold 90px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Setup works', W / 2, H - 300);
  if (!ff.stdin.write(canvas.toBuffer('image/png'))) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end();
ff.on('close', (c) => { console.log(c === 0 ? 'Rendered out/smoke-test.mp4' : `ffmpeg exited ${c}`); process.exitCode = c; });
