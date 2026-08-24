import { useEffect, useRef, useState } from 'react';
import { previewTone } from '../lib/sounds';

interface DemoApp {
  id: string;
  label: string;
  color: string;
  lockable: boolean;
}

const APPS: DemoApp[] = [
  { id: 'instagram', label: 'IG', color: '#e1306c', lockable: true },
  { id: 'tiktok', label: 'TT', color: '#1fd6c1', lockable: true },
  { id: 'youtube', label: 'YT', color: '#ff4d4d', lockable: true },
  { id: 'messages', label: '💬', color: '#2dd9b5', lockable: false },
  { id: 'notes', label: '📝', color: '#60a5fa', lockable: false },
  { id: 'clock', label: '⏰', color: '#ffc857', lockable: false },
];

interface Stage {
  id: string;
  label: string;
  time: string;
  caption: string;
  tint: number;
  locked: boolean;
}

const STAGES: Stage[] = [
  {
    id: 'day',
    label: 'Daytime',
    time: '3:15 PM',
    caption: 'Nothing is locked right now — your chosen apps stay wide open all day.',
    tint: 0,
    locked: false,
  },
  {
    id: 'nudge',
    label: 'Heads-up',
    time: '8:35 PM',
    caption: "30 minutes before wind-down, you get one gentle nudge. Still no locks — just a heads-up.",
    tint: 0,
    locked: false,
  },
  {
    id: 'winddown',
    label: 'Wind-down',
    time: '9:05 PM',
    caption: 'The screen warms up, and your chosen apps now take a short pause to open. Tap a locked icon below to try it.',
    tint: 0.4,
    locked: true,
  },
  {
    id: 'bedtime',
    label: 'Past bedtime',
    time: '9:45 PM',
    caption: "Still fully open — just a longer pause and a reason. This app never locks you out for good.",
    tint: 0.6,
    locked: true,
  },
  {
    id: 'wake',
    label: 'Wake-up',
    time: '6:45 AM',
    caption: 'Instead of a blast, a soft rising tone eases you up. Tap below to hear it.',
    tint: 0,
    locked: false,
  },
];

const AUTOPLAY_MS = 3400;

export function InteractiveDemo() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [modalApp, setModalApp] = useState<DemoApp | null>(null);
  const stage = STAGES[index];

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % STAGES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  function goTo(next: number) {
    setPlaying(false);
    setIndex(((next % STAGES.length) + STAGES.length) % STAGES.length);
  }

  function openApp(app: DemoApp) {
    if (stage.locked && app.lockable) {
      setPlaying(false);
      setModalApp(app);
    }
  }

  return (
    <div className="card">
      <div className="demo-intro">
        <h2>Try it — no setup needed</h2>
        <button type="button" onClick={() => setPlaying((p) => !p)} className="link-btn" style={{ textDecoration: 'none' }}>
          {playing ? '⏸ Pause autoplay' : '▶ Resume autoplay'}
        </button>
      </div>
      <p className="muted">
        This is a sandbox — it won't touch your real schedule or settings. Watch a full day play out, or jump to any
        moment yourself.
      </p>

      <div className="demo-layout">
        <div className="demo-phone">
          <div className="demo-phone-screen">
            {stage.tint > 0 && <div className="demo-phone-tint" style={{ opacity: stage.tint }} />}
            <div className="demo-phone-clock">{stage.time}</div>
            <div className="demo-app-grid">
              {APPS.map((app) => {
                const isLocked = stage.locked && app.lockable;
                return (
                  <button
                    key={app.id}
                    type="button"
                    className="demo-app-icon"
                    style={{ background: app.color }}
                    onClick={() => openApp(app)}
                  >
                    {app.label}
                    {isLocked && <span className="lock-badge">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="demo-panel">
          <p className="demo-stage-name">{stage.label}</p>
          <p className="demo-caption">{stage.caption}</p>

          {stage.id === 'wake' && (
            <button type="button" className="demo-tone-btn" onClick={() => previewTone('chime')}>
              🔔 Hear the wake-up tone
            </button>
          )}

          <div className="demo-controls">
            <button type="button" className="demo-step-btn" onClick={() => goTo(index - 1)} aria-label="Previous stage">
              ‹
            </button>
            <button
              type="button"
              className="demo-play-btn"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? '⏸' : '▶'}
            </button>
            <button type="button" className="demo-step-btn" onClick={() => goTo(index + 1)} aria-label="Next stage">
              ›
            </button>
            <div className="demo-dots">
              {STAGES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`demo-dot ${i === index ? 'demo-dot-active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Jump to ${s.label}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {modalApp && <DemoFrictionModal app={modalApp} onClose={() => setModalApp(null)} />}
    </div>
  );
}

function DemoFrictionModal({ app, onClose }: { app: DemoApp; onClose: () => void }) {
  const delaySeconds = 6;
  const [remaining, setRemaining] = useState(delaySeconds);
  const [reason, setReason] = useState('');
  const startedRef = useRef(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedRef.current) / 1000);
      setRemaining(Math.max(0, delaySeconds - elapsed));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const canProceed = remaining <= 0 && reason.trim().length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Open {app.label} anyway?</h3>
        <p className="muted">This is what a locked app feels like: a short pause, never a wall.</p>
        {remaining > 0 && <div className="countdown">{remaining}s</div>}
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">Why right now?</option>
          <option value="homework">Homework / school</option>
          <option value="family">Talking with family</option>
          <option value="emergency">Something urgent</option>
          <option value="just-want-to">Honestly, I just want to</option>
        </select>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Never mind
          </button>
          <button type="button" disabled={!canProceed} onClick={onClose} className="primary-btn">
            Open anyway
          </button>
        </div>
      </div>
    </div>
  );
}
