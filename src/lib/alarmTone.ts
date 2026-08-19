let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/**
 * Plays a soft, ascending melodic chime instead of a jarring alarm tone,
 * fading in gradually to ease sleep inertia. Returns a stop() to cancel it.
 */
export function playSoftAlarm(): { stop: () => void } {
  const audioCtx = getContext();
  const notes = [261.63, 329.63, 392.0, 523.25]; // C4 E4 G4 C5 - gentle major chord arpeggio
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  const startTime = audioCtx.currentTime;
  const rampSeconds = 90; // fades in over 1.5 minutes to ease morning grogginess
  const loopSeconds = 2.2;
  const loops = Math.ceil(rampSeconds / loopSeconds) + 4;

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(0.18, startTime + rampSeconds);
  masterGain.connect(audioCtx.destination);

  for (let i = 0; i < loops; i++) {
    const note = notes[i % notes.length];
    const t = startTime + i * loopSeconds;
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = note;
    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(1, t + 0.3);
    noteGain.gain.linearRampToValueAtTime(0, t + loopSeconds - 0.1);
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    osc.start(t);
    osc.stop(t + loopSeconds);
    oscillators.push(osc);
    gains.push(noteGain);
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

/** A single short preview chime, used for "Preview tone" buttons. */
export function previewChime() {
  const audioCtx = getContext();
  const notes = [261.63, 329.63, 392.0, 523.25];
  const t0 = audioCtx.currentTime;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, t0);
  gain.connect(audioCtx.destination);
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const noteGain = audioCtx.createGain();
    const t = t0 + i * 0.28;
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(1, t + 0.05);
    noteGain.gain.linearRampToValueAtTime(0, t + 0.26);
    osc.connect(noteGain);
    noteGain.connect(gain);
    osc.start(t);
    osc.stop(t + 0.28);
  });
}
