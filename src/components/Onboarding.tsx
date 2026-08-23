import { useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { CANDIDATE_APPS, MOTIVATION_TAGS } from '../types';

export function Onboarding() {
  const { state, setState } = useAppState();
  const [wakeWeekday, setWakeWeekday] = useState(state.profile.wakeWeekday);
  const [wakeWeekend, setWakeWeekend] = useState(state.profile.wakeWeekend);
  const [schoolStart, setSchoolStart] = useState(state.profile.schoolStartTime ?? '');
  const [hasSchool, setHasSchool] = useState(!!state.profile.schoolStartTime);
  const [sleepGoalHours, setSleepGoalHours] = useState(state.profile.sleepGoalHours);
  const [motivations, setMotivations] = useState<string[]>(state.profile.motivations);
  const [lockedApps, setLockedApps] = useState<string[]>(state.windDown.lockedApps);

  function toggle(list: string[], id: string, setList: (v: string[]) => void) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function finish() {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        wakeWeekday,
        wakeWeekend,
        schoolStartTime: hasSchool ? schoolStart || null : null,
        sleepGoalHours,
        motivations,
        onboarded: true,
      },
      windDown: { ...prev.windDown, lockedApps },
      alarm: { ...prev.alarm, wakeTime: wakeWeekday },
    }));
  }

  return (
    <div className="card onboarding">
      <h1>Let's set up your sleep</h1>
      <p className="muted">
        This is your app, not a parent's remote control — every setting here is yours to change any time.
        Defaults are already sensible, so skip anything you don't care about right now.
      </p>

      <label className="field">
        <span>What time do you want to wake up on school days?</span>
        <input type="time" value={wakeWeekday} onChange={(e) => setWakeWeekday(e.target.value)} />
      </label>

      <label className="field">
        <span>And on weekends / days off?</span>
        <input type="time" value={wakeWeekend} onChange={(e) => setWakeWeekend(e.target.value)} />
      </label>

      <label className="field checkbox">
        <input type="checkbox" checked={hasSchool} onChange={(e) => setHasSchool(e.target.checked)} />
        <span>I have a fixed school/commute start time</span>
      </label>
      {hasSchool && (
        <label className="field">
          <span>School start time</span>
          <input type="time" value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} />
        </label>
      )}

      <label className="field">
        <span>Sleep goal: {sleepGoalHours} hours</span>
        <input
          type="range"
          min={6}
          max={10}
          step={0.5}
          value={sleepGoalHours}
          onChange={(e) => setSleepGoalHours(Number(e.target.value))}
        />
      </label>

      <div className="field">
        <span>Why does sleep matter to you? (pick any — shows up in your reminders)</span>
        <div className="chip-row">
          {MOTIVATION_TAGS.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`chip ${motivations.includes(tag.id) ? 'chip-active' : ''}`}
              onClick={() => toggle(motivations, tag.id, setMotivations)}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Which apps pull you in most at night? (optional — you choose what gets "sticky")</span>
        <div className="chip-row">
          {CANDIDATE_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              className={`chip ${lockedApps.includes(app.id) ? 'chip-active' : ''}`}
              onClick={() => toggle(lockedApps, app.id, setLockedApps)}
            >
              {app.label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="primary-btn" onClick={finish}>
        Start — see it in action
      </button>
    </div>
  );
}
