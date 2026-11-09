// Original synthesized score + sound effects, mixed into a kit mixer.
const SR = 44100;
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const MOODS = {
  mystery: { bpm: 80, chords: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]], pluck: 1, drone: 0.9, drums: 0, bell: 1 },
  tense: { bpm: 112, chords: [[57, 60, 64], [57, 60, 63], [55, 58, 62], [56, 59, 62]], pluck: 0.6, drone: 1, pulse: 1, drums: 0.4 },
  comedy: { bpm: 124, chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], pluck: 1.2, drone: 0, bounce: 1, drums: 0.6 },
  warm: { bpm: 88, chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], pluck: 0.8, drone: 0.6, pad: 1, drums: 0.3 },
  action: { bpm: 140, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]], pluck: 0.7, drone: 0.5, pulse: 1, drums: 1 },
};
export const MOOD_NAMES = Object.keys(MOODS);

// Writes music into separate buffers so it can be ducked under dialogue later.
export function music(L, R, rnd, from, to, moodName) {
  const md = MOODS[moodName] || MOODS.mystery, beat = 60 / md.bpm, N = L.length;
  const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan); R[i] += v * (1 + pan); } };
  const fadeIn = 0.25, fadeOut = 0.35;
  const env = (t) => Math.min(1, (t - from) / fadeIn) * Math.min(1, (to - t) / fadeOut);
  const chordAt = (t) => md.chords[Math.floor((t - from) / (beat * 4)) % md.chords.length];
  // drone / pad
  if (md.drone || md.pad) for (let i = Math.floor(from * SR); i < Math.min(N, to * SR); i++) {
    const t = i / SR, ch = chordAt(t);
    let v = md.drone ? Math.sin(2 * Math.PI * NOTE(ch[0] - 24) * t) * 0.5 * md.drone + Math.sin(2 * Math.PI * NOTE(ch[0] - 12) * t) * 0.25 * md.drone : 0;
    if (md.pad) for (const n of ch) v += (Math.sin(2 * Math.PI * NOTE(n) * t) + 0.3 * Math.sin(2 * Math.PI * NOTE(n) * 2.004 * t)) * 0.18;
    add(i, v * 0.06 * env(t), Math.sin(t * 0.6) * 0.2);
  }
  for (let b = 0; from + b * beat * 0.5 < to; b++) {
    const t0 = from + b * beat * 0.5, ch = chordAt(t0), i0 = Math.floor(t0 * SR), e = env(t0);
    if (e <= 0) continue;
    const onBeat = b % 2 === 0, bar = b % 8;
    // plucks
    if (md.pluck && (md.bounce ? !onBeat : onBeat || rnd() > 0.4)) {
      const n = ch[Math.min(2, Math.floor(((rnd() + 1) / 2) * 3))] + 12, f = NOTE(n);
      for (let k = 0; k < 0.4 * SR; k++) { const tt = k / SR; add(i0 + k, Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * (md.bounce ? 14 : 7)) * 0.05 * md.pluck * e, b % 4 < 2 ? -0.3 : 0.3); }
    }
    if (md.bell && bar === 0 && rnd() > 0.3) { const f = NOTE(ch[2] + 24); for (let k = 0; k < 1.2 * SR; k++) { const tt = k / SR; add(i0 + k, (Math.sin(2 * Math.PI * f * tt) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * tt)) * Math.exp(-tt * 3) * 0.025 * e, 0.4); } }
    if (md.pulse) { const f = NOTE(ch[0] - 12); for (let k = 0; k < 0.12 * SR; k++) { const tt = k / SR; add(i0 + k, Math.sign(Math.sin(2 * Math.PI * f * tt)) * Math.exp(-tt * 18) * 0.03 * e); } }
    if (md.bounce && onBeat) { const f = NOTE(ch[(b / 2) % 2 ? 2 : 0] - 12); for (let k = 0; k < 0.18 * SR; k++) { const tt = k / SR; add(i0 + k, Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 16) * 0.12 * e); } }
    if (md.drums) {
      if (onBeat && (bar === 0 || bar === 4 || md.drums >= 1)) for (let k = 0; k < 0.25 * SR; k++) { const tt = k / SR; add(i0 + k, Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-tt * 30)) * tt) * Math.exp(-tt * 14) * 0.25 * md.drums * e); }
      if (bar === 2 || bar === 6) for (let k = 0; k < 0.15 * SR; k++) add(i0 + k, rnd() * Math.exp(-k / SR * 25) * 0.08 * md.drums * e);
      if (!onBeat) for (let k = 0; k < 0.04 * SR; k++) add(i0 + k, rnd() * Math.exp(-k / SR * 90) * 0.035 * md.drums * e, 0.2);
    }
  }
}

export function sfx(m, name, tc) {
  const add = m.add, rnd = m.rnd, i0 = Math.floor(tc * SR);
  const tone = (start, f, d, vol, sq) => { const s0 = Math.floor(start * SR); for (let k = 0; k < d * SR; k++) { const tt = k / SR; let v = Math.sin(2 * Math.PI * f * tt); if (sq) v = Math.sign(v) * 0.5; add(s0 + k, v * vol * Math.min(1, tt / 0.005) * Math.min(1, (d - tt) / 0.03)); } };
  switch (name) {
    case 'buzz': for (const off of [0, 0.32]) tone(tc + off, 165, 0.22, 0.12, true); break;
    case 'ding': tone(tc, 1318.5, 0.12, 0.12); tone(tc + 0.1, 1760, 0.3, 0.1); break;
    case 'knock': for (const off of [0, 0.22, 0.44]) m.thud(tc + off, 0.6); break;
    case 'thud': m.thud(tc, 1); break;
    case 'whoosh': m.whoosh(tc + 0.3); break;
    case 'steps': for (let k = 0; k < 4; k++) { const s0 = Math.floor((tc + k * 0.38) * SR); for (let j = 0; j < 0.1 * SR; j++) { const tt = j / SR; add(s0 + j, (Math.sin(2 * Math.PI * 90 * tt) * 0.4 + rnd() * 0.3) * Math.exp(-tt * 40) * 0.35, k % 2 ? 0.3 : -0.3); } } break;
    case 'heartbeat': for (let k = 0; k < 4; k++) for (const [o, v] of [[0, 0.5], [0.14, 0.3]]) { const s0 = Math.floor((tc + k * 0.75 + o) * SR); for (let j = 0; j < 0.18 * SR; j++) { const tt = j / SR; add(s0 + j, Math.sin(2 * Math.PI * (48 + 30 * Math.exp(-tt * 25)) * tt) * Math.exp(-tt * 22) * v); } } break;
    case 'static': for (let k = 0; k < 0.7 * SR; k++) add(i0 + k, rnd() * 0.18 * (0.5 + 0.5 * Math.sin(k / SR * 60)) * Math.min(1, (0.7 - k / SR) / 0.2)); break;
    case 'power-down': { for (let k = 0; k < 1.2 * SR; k++) { const tt = k / SR, f = 220 * Math.exp(-tt * 2.2); add(i0 + k, Math.sin(2 * Math.PI * f * tt * 2) * 0.15 * (1 - tt / 1.2)); } m.thud(tc + 0.05, 0.8); break; }
    case 'door': for (let k = 0; k < 0.9 * SR; k++) { const tt = k / SR, f = 300 + 180 * Math.sin(tt * 9); add(i0 + k, (Math.sin(2 * Math.PI * f * tt) * 0.5 + Math.sin(2 * Math.PI * f * 2.01 * tt) * 0.3) * 0.07 * Math.sin(Math.PI * tt / 0.9)); } break;
    case 'gasp': { let y = 0; for (let k = 0; k < 0.35 * SR; k++) { const p = k / (0.35 * SR); y += 0.3 * (rnd() - y); add(i0 + k, y * 0.35 * Math.sin(Math.PI * p)); } break; }
    case 'sting': tone(tc, 110, 0.5, 0.08, true); m.thud(tc, 0.9); tone(tc, 1760, 0.9, 0.04); break;
    default: console.warn(`unknown sfx "${name}"`);
  }
}
export const SFX_NAMES = ['buzz', 'ding', 'knock', 'thud', 'whoosh', 'steps', 'heartbeat', 'static', 'power-down', 'door', 'gasp', 'sting'];
