import { useAppState } from '../state/AppStateContext';
import { useSchedule } from '../lib/useSchedule';
import { formatClock } from '../lib/time';

export function SchedulePlanner() {
  const { state, setState } = useAppState();
  const { profile, isWeekend } = state;
  const goal = profile.sleepGoalHours;
  const schedule = useSchedule();

  function applyGoal(next: number) {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, sleepGoalHours: next } }));
  }

  return (
    <div className="card">
      <div className="row-between">
        <h2>Tonight's plan</h2>
        <div className="toggle-pair">
          <button
            className={!isWeekend ? 'toggle-active' : ''}
            onClick={() => setState((p) => ({ ...p, isWeekend: false }))}
          >
            School night
          </button>
          <button
            className={isWeekend ? 'toggle-active' : ''}
            onClick={() => setState((p) => ({ ...p, isWeekend: true }))}
          >
            Weekend
          </button>
        </div>
      </div>

      <div className="schedule-highlight">
        <div>
          <div className="big-time">{formatClock(schedule.windDownStart)}</div>
          <div className="muted">wind-down starts</div>
        </div>
        <div className="arrow">→</div>
        <div>
          <div className="big-time">{formatClock(schedule.bedtime)}</div>
          <div className="muted">lights out</div>
        </div>
        <div className="arrow">→</div>
        <div>
          <div className="big-time">{formatClock(schedule.wakeTime)}</div>
          <div className="muted">wake up</div>
        </div>
      </div>
      <p className="muted small">
        {schedule.cycles} sleep cycles ({schedule.hours}h), 90 minutes each — waking near a cycle boundary
        instead of mid-cycle is what actually cuts morning grogginess, not just total hours.
      </p>

      <label className="field">
        <span>Sleep goal: {goal}h</span>
        <input type="range" min={6} max={10} step={0.5} value={goal} onChange={(e) => applyGoal(Number(e.target.value))} />
      </label>

      <div className="field">
        <span>Other cycle options tonight</span>
        <div className="option-row">
          {schedule.options.map((opt) => (
            <div key={opt.cycles} className={`option-pill ${opt.hours === schedule.hours ? 'option-pill-active' : ''}`}>
              {formatClock(opt.bedtime)} · {opt.hours}h
            </div>
          ))}
        </div>
      </div>

      {schedule.warnings.length > 0 && (
        <div className="warning-box">
          {schedule.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}
