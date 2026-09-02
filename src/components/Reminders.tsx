import { useAppState, updateTodayLog } from '../state/AppStateContext';
import { useSchedule } from '../lib/useSchedule';
import { getReminders } from '../lib/reminders';
import { usePreviewClock } from '../state/PreviewClock';
import type { SleepOnsetRating } from '../types';

const TONE_ICON: Record<string, string> = { info: 'ℹ️', warning: '⚠️', insight: '💡' };

const DRIFT_OPTIONS: { id: SleepOnsetRating; label: string }[] = [
  { id: 'ontime', label: 'On time' },
  { id: 'late', label: 'A bit late' },
  { id: 'very-late', label: 'Much later' },
];

export function Reminders() {
  const { state, setState, today, yesterday } = useAppState();
  const schedule = useSchedule();
  const { tickNow } = usePreviewClock();
  const reminders = getReminders(schedule, state, today, yesterday, tickNow);

  function unlockApp(appId: string) {
    setState((prev) => ({
      ...prev,
      windDown: { ...prev.windDown, lockedApps: prev.windDown.lockedApps.filter((a) => a !== appId) },
    }));
  }

  return (
    <div className="card">
      <h2>Reminders that fit tonight</h2>
      <p className="muted">
        These come from what you actually logged, not a fixed checklist — the goal is a nudge that makes
        sense, not noise you learn to ignore.
      </p>

      <div className="field-row">
        <label className="field">
          <span>Last caffeine today</span>
          <input
            type="time"
            value={today.caffeineTime ?? ''}
            onChange={(e) => updateTodayLog(setState, { caffeineTime: e.target.value || null })}
          />
        </label>
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={today.sunlightLogged}
            onChange={(e) => updateTodayLog(setState, { sunlightLogged: e.target.checked })}
          />
          <span>Got morning sunlight</span>
        </label>
      </div>

      <div className="field">
        <span>How did wind-down feel last night?</span>
        <RateWindDown />
      </div>

      <div className="field">
        <span>Did you fall asleep around when planned last night?</span>
        <RateSleepOnset />
      </div>

      <div className="reminder-list">
        {reminders.length === 0 && <p className="muted">Nothing to flag right now — you're on track.</p>}
        {reminders.map((r) => (
          <div key={r.id} className={`reminder reminder-${r.tone}`}>
            <span className="reminder-icon">{TONE_ICON[r.tone]}</span>
            <span>
              {r.text}
              {r.action?.type === 'unlock-app' && (
                <button type="button" className="reminder-action" onClick={() => unlockApp(r.action!.appId)}>
                  Unlock {r.action.label}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateWindDown() {
  const { setState, yesterday } = useAppState();
  if (!yesterday) return <p className="muted small">No log from last night yet.</p>;
  return (
    <div className="chip-row">
      <button
        type="button"
        className={`chip ${yesterday.windDownFeltHard === false ? 'chip-active' : ''}`}
        onClick={() =>
          setState((prev) => ({
            ...prev,
            logs: { ...prev.logs, [yesterday.date]: { ...yesterday, windDownFeltHard: false } },
          }))
        }
      >
        Easy
      </button>
      <button
        type="button"
        className={`chip ${yesterday.windDownFeltHard === true ? 'chip-active' : ''}`}
        onClick={() =>
          setState((prev) => ({
            ...prev,
            logs: { ...prev.logs, [yesterday.date]: { ...yesterday, windDownFeltHard: true } },
          }))
        }
      >
        Hard
      </button>
    </div>
  );
}

function RateSleepOnset() {
  const { setState, yesterday } = useAppState();
  if (!yesterday) return <p className="muted small">No log from last night yet.</p>;
  return (
    <div className="chip-row">
      {DRIFT_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`chip ${yesterday.sleepOnsetDrift === opt.id ? 'chip-active' : ''}`}
          onClick={() =>
            setState((prev) => ({
              ...prev,
              logs: { ...prev.logs, [yesterday.date]: { ...yesterday, sleepOnsetDrift: opt.id } },
            }))
          }
        >
          {opt.label}
        </button>
      ))}
      <p className="muted small" style={{ width: '100%', margin: '4px 0 0' }}>
        Feeds the alarm's wake-window estimate — it adjusts if you're consistently falling asleep later than
        planned, instead of assuming the plan always holds.
      </p>
    </div>
  );
}
