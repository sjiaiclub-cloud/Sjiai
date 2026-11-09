// Character voices: ElevenLabs when ELEVENLABS_API_KEY is set, else Kokoro (offline neural, Apache-2.0) if installed, else espeak-ng.
// Avoid MBROLA (mb-*) voices for anything you post: their voice databases are licensed for non-commercial use only.
// Returns mono 44.1kHz Float32 samples plus a per-frame mouth envelope for lip-sync. Results are cached on disk.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { ensureKokoro, MODEL_ROOT, MODEL_ID } from './kokoro-setup.js';

export const SR = 44100;
const KEY = process.env.ELEVENLABS_API_KEY;
const EMO_ESPEAK = { happy: [1.05, 8], scared: [1.15, 12], angry: [1.05, -6], sad: [0.85, -8], surprised: [1.1, 16], smug: [0.95, -2], confused: [0.95, 6] };

let mbVoices = null;
function hasVoice(v) {
  if (!v.startsWith('mb-')) return true;
  if (mbVoices === null) { try { mbVoices = execFileSync('espeak-ng', ['--voices=mb']).toString(); } catch { mbVoices = ''; } }
  return mbVoices.includes(`mb/${v}`) && existsSync(`/usr/share/mbrola/${v.slice(3)}`);
}

function espeak(text, voice, emotion, tmpDir) {
  const [sm, pa] = EMO_ESPEAK[emotion] || [1, 0];
  let v = voice.espeak || (voice.gender === 'female' ? 'en-us+f3' : 'en-us+m3');
  if (!hasVoice(v)) v = voice.gender === 'female' ? 'en-us+f3' : 'en-us';
  const wav = path.join(tmpDir, 'e.wav'), raw = path.join(tmpDir, 'e.raw');
  execFileSync('espeak-ng', ['-v', v, '-s', String(Math.round((voice.speed || 160) * sm)), '-p', String(clampN((voice.pitch ?? 50) + pa, 0, 99)), '-a', '170', '-w', wav, text]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', wav, '-af', 'highpass=f=90,lowpass=f=7500,acompressor=threshold=-20dB:ratio=3', '-ar', String(SR), '-ac', '1', '-f', 's16le', raw]);
  return readFileSync(raw);
}
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

let elevenVoices = null;
async function pickElevenVoice(voice, id) {
  if (voice.eleven) return voice.eleven;
  if (!elevenVoices) {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': KEY } });
    if (!r.ok) throw new Error(`voices HTTP ${r.status}`);
    elevenVoices = (await r.json()).voices || [];
  }
  const pool = elevenVoices.filter((v) => !voice.gender || (v.labels?.gender || '').toLowerCase() === voice.gender);
  const list = pool.length ? pool : elevenVoices;
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return list[h % list.length].voice_id;
}

async function eleven(text, voice, emotion, id) {
  const vid = await pickElevenVoice(voice, id);
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=pcm_44100`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: voice.model || 'eleven_multilingual_v2', voice_settings: { stability: 0.4, similarity_boost: 0.8, style: emotion && emotion !== 'neutral' ? 0.45 : 0.15 } }),
  });
  if (!r.ok) throw new Error(`tts HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

function eerie(s) {
  const out = new Float32Array(s.length + Math.floor(0.6 * SR));
  for (let i = 0; i < s.length; i++) out[i] += s[i] * 0.8;
  for (const [d, g] of [[0.09, 0.45], [0.17, 0.3], [0.29, 0.2], [0.43, 0.12]]) { const o = Math.floor(d * SR); for (let i = 0; i < s.length; i++) out[i + o] += s[i] * g; }
  return out;
}

// ---------- Kokoro (Apache-2.0, offline neural voices) ----------
const EMO_SPEED = { scared: 1.08, angry: 1.04, sad: 0.9, surprised: 1.06, smug: 0.96, happy: 1.03 };
let kokoro = null, kokoroOk = null;
function kokoroAvailable() { if (kokoroOk === null) { try { kokoroOk = ensureKokoro(); } catch (e) { console.warn(e.message); kokoroOk = false; } } return kokoroOk; }
async function kokoroTTS(text, voice, emotion, tmpDir) {
  if (!kokoro) {
    const { env } = await import('@huggingface/transformers');
    const { KokoroTTS } = await import('kokoro-js');
    env.localModelPath = MODEL_ROOT + '/'; env.allowRemoteModels = false; env.allowLocalModels = true;
    kokoro = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8', device: 'cpu' });
  }
  const v = voice.kokoro || (voice.gender === 'female' ? 'af_heart' : 'am_michael');
  const audio = await kokoro.generate(text, { voice: v, speed: (voice.kokoroSpeed || 1) * (EMO_SPEED[emotion] || 1) });
  const f32 = path.join(tmpDir, 'k.f32'), raw = path.join(tmpDir, 'k.raw');
  writeFileSync(f32, Buffer.from(audio.audio.buffer, audio.audio.byteOffset, audio.audio.byteLength));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(audio.sampling_rate), '-ac', '1', '-i', f32, '-ar', String(SR), '-ac', '1', '-f', 's16le', raw]);
  return readFileSync(raw);
}

export function engineName() { return KEY ? 'elevenlabs' : kokoroAvailable() ? 'kokoro' : 'espeak-ng'; }

// voice: { espeak, pitch, speed, gender, eleven }  opts: { emotion, fx: 'eerie', id }
export async function speak(text, voice, opts, cacheDir) {
  mkdirSync(cacheDir, { recursive: true });
  const engine = voice.engine === 'espeak' ? 'espeak' : KEY && voice.engine !== 'kokoro' ? 'eleven' : kokoroAvailable() ? 'kokoro' : 'espeak';
  const key = createHash('sha1').update(JSON.stringify([engine, voice, text, opts.emotion, opts.id])).digest('hex').slice(0, 16);
  const file = path.join(cacheDir, `${key}.pcm`);
  let pcm;
  if (existsSync(file)) pcm = readFileSync(file);
  else {
    if (engine === 'eleven') {
      try { pcm = await eleven(text, voice, opts.emotion, opts.id); }
      catch (e) { console.warn(`ElevenLabs failed (${e.message}); using espeak-ng for: "${text.slice(0, 40)}"`); }
    }
    if (!pcm && (engine === 'kokoro' || (engine === 'eleven' && kokoroAvailable()))) {
      const tmp = path.join(cacheDir, `tmp-${key}`); mkdirSync(tmp, { recursive: true });
      try { pcm = await kokoroTTS(text, voice, opts.emotion, tmp); } catch (e) { console.warn(`Kokoro failed (${e.message}); using espeak-ng`); }
      rmSync(tmp, { recursive: true, force: true });
    }
    if (!pcm) { const tmp = path.join(cacheDir, `tmp-${key}`); mkdirSync(tmp, { recursive: true }); pcm = espeak(text, voice, opts.emotion, tmp); rmSync(tmp, { recursive: true, force: true }); }
    writeFileSync(file, pcm);
  }
  let s = new Float32Array(pcm.length / 2);
  for (let i = 0; i < s.length; i++) s[i] = pcm.readInt16LE(i * 2) / 32768;
  if (opts.fx === 'eerie') s = eerie(s);
  // trim silence + speech bounds for subtitle timing
  let a = 0, b = s.length - 1; const th = 0.02;
  while (a < s.length && Math.abs(s[a]) < th) a++;
  while (b > a && Math.abs(s[b]) < th) b--;
  a = Math.max(0, a - Math.floor(0.03 * SR)); b = Math.min(s.length - 1, b + Math.floor(0.08 * SR));
  s = s.slice(a, b + 1);
  // mouth envelope at 30fps
  const step = SR / 30, env = [];
  let peak = 1e-6;
  for (let f = 0; f * step < s.length; f++) { let sum = 0, n = 0; for (let i = Math.floor(f * step); i < Math.min(s.length, (f + 1) * step); i++) { sum += s[i] * s[i]; n++; } const v = Math.sqrt(sum / Math.max(1, n)); env.push(v); peak = Math.max(peak, v); }
  const mouth = env.map((v) => Math.min(1, Math.max(0, (v / peak - 0.12) * 1.5)));
  return { samples: s, dur: s.length / SR, mouth };
}
