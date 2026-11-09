// "Check my setup": verifies Node (animate), ffmpeg (render), and the ElevenLabs key (voice).
import { execSync } from 'node:child_process';
import 'dotenv/config';

const ok = (m) => console.log(`✔ ${m}`);
const bad = (m) => { console.log(`✘ ${m}`); process.exitCode = 1; };

const major = Number(process.versions.node.split('.')[0]);
major >= 18 ? ok(`Node.js v${process.versions.node} (animate)`) : bad(`Node.js v${process.versions.node} is too old, need 18+`);

try { await import('@napi-rs/canvas'); ok('@napi-rs/canvas (animate)'); }
catch { bad('@napi-rs/canvas missing: run npm install'); }

try { ok(execSync('ffmpeg -version').toString().split('\n')[0] + ' (render)'); }
catch { bad('ffmpeg not found: install it (apt-get install ffmpeg / brew install ffmpeg)'); }

try {
  execSync('espeak-ng --version', { stdio: 'ignore' });
  const mb = execSync('espeak-ng --voices=mb').toString();
  ok('espeak-ng (offline voice fallback, robotic; avoid mb-* MBROLA voices for posted videos: non-commercial licence)'); void mb;
} catch { console.log('! espeak-ng missing (offline voices): apt-get install -y espeak-ng'); }

try { const { ensureKokoro } = await import('../series/engine/kokoro-setup.js'); ensureKokoro() ? ok('Kokoro neural voices (offline, Apache-2.0)') : console.log('! Kokoro not installed: npm install'); }
catch (e) { console.log(`! Kokoro unavailable: ${e.message}`); }

const key = process.env.ELEVENLABS_API_KEY;
if (!key) console.log('! ELEVENLABS_API_KEY not set: using Kokoro offline voices (add the key for ElevenLabs voices)');
else {
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/user', { headers: { 'xi-api-key': key } });
    r.ok ? ok('ElevenLabs key valid (voice)') : bad(`ElevenLabs key rejected (HTTP ${r.status})`);
  } catch (e) { bad(`Could not reach ElevenLabs: ${e.message}`); }
}
