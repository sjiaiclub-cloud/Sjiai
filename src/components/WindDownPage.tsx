import { useEffect, useRef, useState } from 'react';
import { useAppState, updateTodayLog } from '../state/AppStateContext';
import { useWindDownStage } from '../lib/useWindDownStage';
import { AMBIENT_SOUNDS, playAmbientSound, type AmbientId } from '../lib/sounds';
import { previewStreakAfterBypass } from '../lib/bypassPatterns';
import { CANDIDATE_APPS, type LockStrictness } from '../types';

const STAGE_COPY: Record<string, { title: string; body: string }> = {
  normal: { title: 'Nothing locked right now', body: 'Chosen apps are wide open until wind-down starts.' },
  nudge: {
    title: 'Heads up — wind-down soon',
    body: 'This is your only gentle nudge before things get stickier. No locks yet.',
  },
  winddown: {
    title: 'Wind-down is active',
    body: "Your screen is warming up. Chosen apps now take a moment of friction to open — never a hard wall.",
  },
  locked: {
    title: 'Past bedtime',
    body: 'Still fully accessible with a short pause and a reason — this app never locks you out completely.',
  },
};

const STRICTNESS_COPY: Record<LockStrictness, { delaySeconds: number; needsReason: boolean; label: string }> = {
  off: { delaySeconds: 0, needsReason: false, label: 'Off — no friction at all' },
  gentle: { delaySeconds: 10, needsReason: false, label: 'Gentle — a 10s pause to open' },
  firm: { delaySeconds: 30, needsReason: true, label: 'Firm — 30s pause + a reason' },
};

export function WindDownPage({ onOpenDemo }: { onOpenDemo: () => void }) {
  const { state, setState } = useAppState();
  const { windDown } = state;
  const { stage } = useWindDownStage();
  const [playingAmbient, setPlayingAmbient] = useState(false);
  const ambientStopRef = useRef<{ stop: () => void } | null>(null);

  const isLockActive = (stage === 'winddown' || stage === 'locked') && windDown.strictness !== 'off';

  useEffect(() => {
    return () => ambientStopRef.current?.stop();
  }, []);

  function toggleAmbientPlayback() {
    if (playingAmbient) {
      ambientStopRef.current?.stop();
      ambientStopRef.current = null;
      setPlayingAmbient(false);
      return;
    }
    if (windDown.ambientSound === 'none') return;
    ambientStopRef.current = playAmbientSound(windDown.ambientSound);
    setPlayingAmbient(true);
  }

  function selectAmbientSound(sound: AmbientId | 'none') {
    setState((prev) => ({ ...prev, windDown: { ...prev.windDown, ambientSound: sound } }));
    if (playingAmbient) {
      ambientStopRef.current?.stop();
      if (sound === 'none') {
        ambientStopRef.current = null;
        setPlayingAmbient(false);
      } else {
        ambientStopRef.current = playAmbientSound(sound);
      }
    }
  }

  function toggleApp(id: string) {
    setState((prev) => ({
      ...prev,
      windDown: {
        ...prev.windDown,
        lockedApps: prev.windDown.lockedApps.includes(id)
          ? prev.windDown.lockedApps.filter((a) => a !== id)
          : [...prev.windDown.lockedApps, id],
      },
    }));
  }

  function unlockApp(id: string) {
    setState((prev) => ({
      ...prev,
      windDown: { ...prev.windDown, lockedApps: prev.windDown.lockedApps.filter((a) => a !== id) },
    }));
  }

  function setStrictness(s: LockStrictness) {
    setState((prev) => ({ ...prev, windDown: { ...prev.windDown, strictness: s } }));
  }

  function setLead(min: number) {
    setState((prev) => ({ ...prev, windDown: { ...prev.windDown, leadMinutes: min } }));
  }

  return (
    <div className="card">
      <div className="demo-intro">
        <h2>Forced wind-down</h2>
        <button type="button" className="link-btn" style={{ textDecoration: 'none' }} onClick={onOpenDemo}>
          ✨ Try it in the demo
        </button>
      </div>
      <p className="muted">
        You picked which apps get "sticky" and how firm the friction is — this never locks you out for good,
        it just adds a pause so late-night scrolling is a choice, not a reflex.
      </p>

      <div className={`stage-banner stage-${stage}`}>
        <strong>{STAGE_COPY[stage].title}</strong>
        <p>{STAGE_COPY[stage].body}</p>
      </div>

      <div className="field">
        <span>Sleep sounds (optional — helps with falling asleep, separate from the alarm tones)</span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${windDown.ambientSound === 'none' ? 'chip-active' : ''}`}
            onClick={() => selectAmbientSound('none')}
          >
            None
          </button>
          {AMBIENT_SOUNDS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip ${windDown.ambientSound === s.id ? 'chip-active' : ''}`}
              onClick={() => selectAmbientSound(s.id)}
            >
              {s.label}
            </button>
          ))}
          {windDown.ambientSound !== 'none' && (
            <button type="button" className="chip" onClick={toggleAmbientPlayback}>
              {playingAmbient ? '⏸ Stop' : '▶ Play'}
            </button>
          )}
        </div>
      </div>

      <div className="field">
        <span>Wind-down lead time: {windDown.leadMinutes} min before bedtime</span>
        <input type="range" min={15} max={60} step={5} value={windDown.leadMinutes} onChange={(e) => setLead(Number(e.target.value))} />
      </div>

      <div className="field">
        <span>How firm should the lock be?</span>
        <div className="chip-row">
          {(Object.keys(STRICTNESS_COPY) as LockStrictness[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${windDown.strictness === s ? 'chip-active' : ''}`}
              onClick={() => setStrictness(s)}
            >
              {STRICTNESS_COPY[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Apps you want to make sticky during wind-down</span>
        <div className="app-grid">
          {CANDIDATE_APPS.map((app) => (
            <AppTile
              key={app.id}
              id={app.id}
              label={app.label}
              selected={windDown.lockedApps.includes(app.id)}
              onToggleSelected={() => toggleApp(app.id)}
              onUnlock={() => unlockApp(app.id)}
              locked={isLockActive && windDown.lockedApps.includes(app.id)}
              strictness={windDown.strictness}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppTile({
  id,
  label,
  selected,
  onToggleSelected,
  onUnlock,
  locked,
  strictness,
}: {
  id: string;
  label: string;
  selected: boolean;
  onToggleSelected: () => void;
  onUnlock: () => void;
  locked: boolean;
  strictness: LockStrictness;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className={`app-tile ${selected ? 'app-tile-selected' : ''}`}>
      <button type="button" className="app-tile-main" onClick={() => (locked ? setModalOpen(true) : undefined)}>
        <span>{label}</span>
        {locked && <span className="lock-badge">🔒</span>}
      </button>
      <label className="app-tile-toggle">
        <input type="checkbox" checked={selected} onChange={onToggleSelected} />
        <span>track this app</span>
      </label>
      {modalOpen && (
        <FrictionModal appId={id} label={label} strictness={strictness} onUnlock={onUnlock} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

function FrictionModal({
  appId,
  label,
  strictness,
  onUnlock,
  onClose,
}: {
  appId: string;
  label: string;
  strictness: LockStrictness;
  onUnlock: () => void;
  onClose: () => void;
}) {
  const { state, setState, today } = useAppState();
  const config = STRICTNESS_COPY[strictness];
  const [remaining, setRemaining] = useState(config.delaySeconds);
  const [reason, setReason] = useState('');
  const [streakPrompt, setStreakPrompt] = useState<number | null>(null);
  const startedRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedRef.current) / 1000);
      setRemaining(Math.max(0, config.delaySeconds - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, [config.delaySeconds]);

  function proceed() {
    const streak = previewStreakAfterBypass(state, today, appId);
    const alreadyBypassedTonight = today.bypassedApps.includes(appId);
    updateTodayLog(setState, {
      bypassCount: today.bypassCount + 1,
      bypassedApps: alreadyBypassedTonight ? today.bypassedApps : [...today.bypassedApps, appId],
    });
    if (streak >= 3) {
      setStreakPrompt(streak);
    } else {
      onClose();
    }
  }

  const canProceed = remaining <= 0 && (!config.needsReason || reason.trim().length > 0);

  if (streakPrompt !== null) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>That's {streakPrompt} nights running</h3>
          <p className="muted">
            You've opened {label} during wind-down {streakPrompt} nights in a row. That's not a willpower
            problem — it probably just means this lock doesn't fit right now. Want to stop locking it, or
            keep it as-is?
          </p>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Keep it locked
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                onUnlock();
                onClose();
              }}
            >
              Unlock {label}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Open {label} anyway?</h3>
        <p className="muted">
          It's wind-down time. You can still open it — this is just a pause, not a lock.
        </p>
        {remaining > 0 && <div className="countdown">{remaining}s</div>}
        {config.needsReason && (
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Why right now?</option>
            <option value="homework">Homework / school</option>
            <option value="family">Talking with family</option>
            <option value="emergency">Something urgent</option>
            <option value="just-want-to">Honestly, I just want to</option>
          </select>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Never mind, I'll wind down
          </button>
          <button type="button" disabled={!canProceed} onClick={proceed} className="primary-btn">
            Open anyway
          </button>
        </div>
      </div>
    </div>
  );
}
