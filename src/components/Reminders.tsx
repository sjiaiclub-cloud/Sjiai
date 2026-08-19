import { useAppState, updateTodayLog } from '../state/AppStateContext';
import { useSchedule } from '../lib/useSchedule';
import { getReminders } from '../lib/reminders';
import { usePreviewClock } from '../state/PreviewClock';

const TONE_ICON: Record<string, string> = { info: 'ℹ️', warning: '⚠️', insight: '💡' };

export function Reminders() {
  const { setState, today, yesterday } = useAppState();
  const schedule = useSchedule();
  const { tickNow } = usePreviewClock();
  const reminders = getReminders(schedule, today, yesterday, tickNow);

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
        <RateLastNight />
      </div>

      <div className="reminder-list">
        {reminders.length === 0 && <p className="muted">Nothing to flag right now — you're on track.</p>}
        {reminders.map((r) => (
          <div key={r.id} className={`reminder reminder-${r.tone}`}>
            <span className="reminder-icon">{TONE_ICON[r.tone]}</span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateLastNight() {
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
