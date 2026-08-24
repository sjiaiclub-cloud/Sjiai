let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export type ToneId = 'chime' | 'piano' | 'marimba' | 'birdsong';
export type AmbientId = 'rain' | 'waves' | 'whitenoise';

export const TONES: { id: ToneId; label: string }[] = [
  { id: 'chime', label: 'Chime' },
  { id: 'piano', label: 'Piano' },
  { id: 'marimba', label: 'Marimba' },
  { id: 'birdsong', label: 'Birdsong' },
];

export const AMBIENT_SOUNDS: { id: AmbientId; label: string }[] = [
  { id: 'rain', label: 'Rain' },
  { id: 'waves', label: 'Ocean waves' },
  { id: 'whitenoise', label: 'White noise' },
];

const CHIME_NOTES = [261.63, 329.63, 392.0, 523.25]; // C4 E4 G4 C5, gentle major arpeggio
const PIANO_NOTES = [220.0, 261.63, 329.63, 440.0]; // A3 C4 E4 A4, soft minor-ish arpeggio
const MARIMBA_NOTES = [349.23, 440.0, 523.25, 659.25, 523.25, 440.0]; // F4 A4 C5 E5 C5 A4

function playArpeggio(
  notes: number[],
  { waveform, noteSeconds, rampSeconds }: { waveform: OscillatorType; noteSeconds: number; rampSeconds: number },
): { stop: () => void } {
  const audioCtx = getContext();
  const startTime = audioCtx.currentTime;
  const loops = Math.ceil(rampSeconds / (noteSeconds * notes.length)) + 4;

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(0.18, startTime + rampSeconds);
  masterGain.connect(audioCtx.destination);

  const oscillators: OscillatorNode[] = [];
  let t = startTime;
  for (let i = 0; i < loops * notes.length; i++) {
    const note = notes[i % notes.length];
    const osc = audioCtx.createOscillator();
    osc.type = waveform;
    osc.frequency.value = note;
    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(1, t + noteSeconds * 0.15);
    noteGain.gain.linearRampToValueAtTime(0, t + noteSeconds - noteSeconds * 0.05);
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    osc.start(t);
    osc.stop(t + noteSeconds);
    oscillators.push(osc);
    t += noteSeconds;
  }

  return {
    stop: () => {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
      });
    },
  };
}

function playBirdsong(rampSeconds: number): { stop: () => void } {
  const audioCtx = getContext();
  const startTime = audioCtx.currentTime;
  const chirpEvery = 0.8;
  const loops = Math.ceil(rampSeconds / chirpEvery) + 6;

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(0.15, startTime + rampSeconds);
  masterGain.connect(audioCtx.destination);

  const oscillators: OscillatorNode[] = [];
  for (let i = 0; i < loops; i++) {
    const t = startTime + i * chirpEvery;
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    const base = 1800 + Math.sin(i * 1.3) * 400;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.09);
    osc.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.16);
    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(1, t + 0.03);
    noteGain.gain.linearRampToValueAtTime(0, t + 0.18);
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
    oscillators.push(osc);
  }

  return {
    stop: () => {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
      });
    },
  };
}

/** Plays a chosen wake tone, fading in over `rampSeconds` to ease sleep inertia. */
export function playAlarmTone(tone: ToneId, rampSeconds: number): { stop: () => void } {
  switch (tone) {
    case 'chime':
      return playArpeggio(CHIME_NOTES, { waveform: 'sine', noteSeconds: 2.2, rampSeconds });
    case 'piano':
      return playArpeggio(PIANO_NOTES, { waveform: 'triangle', noteSeconds: 1.6, rampSeconds });
    case 'marimba':
      return playArpeggio(MARIMBA_NOTES, { waveform: 'triangle', noteSeconds: 0.5, rampSeconds });
    case 'birdsong':
      return playBirdsong(rampSeconds);
  }
}

/** A short (~1.5s) preview of a tone, for "preview" buttons in settings. */
export function previewTone(tone: ToneId) {
  const stopper = playAlarmTone(tone, 0.05);
  window.setTimeout(() => stopper.stop(), 1600);
}

function makeNoiseBuffer(audioCtx: AudioContext): AudioBuffer {
  const bufferSeconds = 2;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * bufferSeconds, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Loops an ambient bed of sound to help with falling asleep — separate from
 * the alarm tones above, since the goal here is the opposite (staying calm
 * and drowsy, not waking up). Keeps playing until `stop()` is called.
 */
export function playAmbientSound(sound: AmbientId): { stop: () => void } {
  const audioCtx = getContext();
  const source = audioCtx.createBufferSource();
  source.buffer = makeNoiseBuffer(audioCtx);
  source.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = sound === 'whitenoise' ? 4000 : sound === 'rain' ? 1200 : 500;

  const gain = audioCtx.createGain();
  const targetVolume = sound === 'whitenoise' ? 0.08 : 0.16;
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(targetVolume, audioCtx.currentTime + 1.2);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();

  let lfo: OscillatorNode | null = null;
  if (sound === 'waves') {
    lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = targetVolume * 0.6;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
  }

  return {
    stop: () => {
      gain.gain.cancelScheduledValues(audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
      window.setTimeout(() => {
        source.stop();
        lfo?.stop();
      }, 550);
    },
  };
}
