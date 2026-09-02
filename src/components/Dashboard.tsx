import { useState } from 'react';
import { useAppState, updateTodayLog } from '../state/AppStateContext';
import { usePreviewClock } from '../state/PreviewClock';
import { useSchedule } from '../lib/useSchedule';
import { useWindDownStage } from '../lib/useWindDownStage';
import { summarizeWeek } from '../lib/weekStats';
import { MOTIVATION_MESSAGE } from '../lib/motivation';
import { MOTIVATION_TAGS, type SleepOnsetRating } from '../types';
import { formatClock } from '../lib/time';
import type { TabId } from './NavTabs';

const STAGE_PILL: Record<string, string> = {
  normal: '🌤️ Nothing locked right now',
  nudge: '🔔 Wind-down starting soon',
  winddown: '🌇 Wind-down is active',
  locked: '🌙 Past bedtime',
};

const DRIFT_OPTIONS: { id: SleepOnsetRating; label: string }[] = [
  { id: 'ontime', label: 'On time' },
  { id: 'late', label: 'A bit late' },
  { id: 'very-late', label: 'Much later' },
];

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Winding down?';
}

export function Dashboard({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { state, setState, today } = useAppState();
  const { tickNow } = usePreviewClock();
  const schedule = useSchedule();
  const { stage } = useWindDownStage();
  const week = summarizeWeek(state);
  const primaryMotivation = state.profile.motivations[0];
  const motivationTag = MOTIVATION_TAGS.find((m) => m.id === primaryMotivation);
  const lowPressure = state.preferences.lowPressureMode;

  return (
    <div>
      <div className="dashboard-greeting">
        <h2>{greeting(tickNow)}</h2>
        <span className="dashboard-date">
          {tickNow.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {!today.checkedIn && <MorningCheckIn />}

      <div className="dashboard-grid">
        <div className="dashboard-card dashboard-card-wide">
          <span className={`dashboard-stage-pill stage-${stage}`}>{STAGE_PILL[stage]}</span>
          <h3>Tonight's plan</h3>
          <div className="schedule-highlight" style={{ padding: '6px 0' }}>
            <div>
              <div className="big-time">{formatClock(schedule.windDownStart)}</div>
              <div className="muted small">wind-down</div>
            </div>
            <div className="arrow">→</div>
            <div>
              <div className="big-time">{formatClock(schedule.bedtime)}</div>
              <div className="muted small">lights out</div>
            </div>
            <div className="arrow">→</div>
            <div>
              <div className="big-time">{formatClock(schedule.wakeTime)}</div>
              <div className="muted small">wake up</div>
            </div>
          </div>
          <button type="button" className="dashboard-card-action" onClick={() => onNavigate('winddown')}>
            Open wind-down
          </button>
        </div>

        <div className="dashboard-card">
          <h3>This week</h3>
          {lowPressure ? (
            <p className="muted small">
              {week.loggedDays === 0
                ? "You haven't logged anything yet this week — no pressure, start whenever."
                : `You've checked in ${week.loggedDays} day${week.loggedDays === 1 ? '' : 's'} this week.`}
            </p>
          ) : (
            <div className="stat-row" style={{ margin: 0 }}>
              <div className="stat-tile">
                <div className="stat-value stat-value-mint">{week.streak}d</div>
                <div className="stat-label">streak</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">{week.easyNights}</div>
                <div className="stat-label">easy nights</div>
              </div>
            </div>
          )}
          <button type="button" className="dashboard-card-action" onClick={() => onNavigate('trends')}>
            View trends
          </button>
        </div>

        <div className="dashboard-card">
          <h3>Quick log</h3>
          <p className="muted small">Feeds tonight's reminders — nothing here is graded.</p>
          <div className="dashboard-quick-actions">
            <button type="button" onClick={() => updateTodayLog(setState, { sunlightLogged: true })}>
              {today.sunlightLogged ? '☀️ Sunlight logged' : '☀️ Log sunlight'}
            </button>
            <button
              type="button"
              onClick={() => updateTodayLog(setState, { caffeineTime: tickNow.toTimeString().slice(0, 5) })}
            >
              ☕ Log caffeine now
            </button>
          </div>
          <button type="button" className="dashboard-card-action" onClick={() => onNavigate('reminders')}>
            Open reminders
          </button>
        </div>

        <div className="dashboard-card">
          <h3>New here?</h3>
          <p className="muted small">Watch a full day play out in an interactive sandbox — no setup needed.</p>
          <button type="button" className="dashboard-card-action" onClick={() => onNavigate('demo')}>
            ✨ Try the demo
          </button>
        </div>

        {motivationTag && (
          <div className="dashboard-card">
            <h3>Why you're doing this</h3>
            <p className="muted small">
              <strong>{motivationTag.label}:</strong> {MOTIVATION_MESSAGE[motivationTag.id]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One consolidated, one-tap-per-question prompt instead of scattering logging
 * across tabs — manual habit logging has notoriously low follow-through, and
 * tying it to the moment the teen opens the app (rather than requiring them to
 * remember to go find each toggle) is the difference between data that exists
 * and data that doesn't.
 */
function MorningCheckIn() {
  const { setState, today, yesterday } = useAppState();
  const [sunlightAnswered, setSunlightAnswered] = useState(false);

  function finishCheckIn() {
    updateTodayLog(setState, { checkedIn: true });
  }

  function answerSunlight(gotSunlight: boolean) {
    setSunlightAnswered(true);
    updateTodayLog(setState, { sunlightLogged: gotSunlight || today.sunlightLogged });
  }

  function rateWindDown(hard: boolean) {
    if (!yesterday) return;
    setState((prev) => ({
      ...prev,
      logs: { ...prev.logs, [yesterday.date]: { ...yesterday, windDownFeltHard: hard } },
    }));
  }

  function rateSleepOnset(rating: SleepOnsetRating) {
    if (!yesterday) return;
    setState((prev) => ({
      ...prev,
      logs: { ...prev.logs, [yesterday.date]: { ...yesterday, sleepOnsetDrift: rating } },
    }));
  }

  return (
    <div className="dashboard-card dashboard-card-wide checkin-card">
      <div className="row-between">
        <h3>Quick morning check-in</h3>
        <button type="button" className="link-btn" style={{ textDecoration: 'none' }} onClick={finishCheckIn}>
          Not now
        </button>
      </div>
      <p className="muted small">Three taps, then it's out of your way for the day.</p>

      <div className="checkin-row">
        <span className="checkin-label">Sunlight yet today?</span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${sunlightAnswered && today.sunlightLogged ? 'chip-active' : ''}`}
            onClick={() => answerSunlight(true)}
          >
            Yes
          </button>
          <button type="button" className={`chip ${sunlightAnswered && !today.sunlightLogged ? 'chip-active' : ''}`} onClick={() => answerSunlight(false)}>
            Not yet
          </button>
        </div>
      </div>

      {yesterday && (
        <>
          <div className="checkin-row">
            <span className="checkin-label">Wind-down last night?</span>
            <div className="chip-row">
              <button
                type="button"
                className={`chip ${yesterday.windDownFeltHard === false ? 'chip-active' : ''}`}
                onClick={() => rateWindDown(false)}
              >
                Easy
              </button>
              <button
                type="button"
                className={`chip ${yesterday.windDownFeltHard === true ? 'chip-active' : ''}`}
                onClick={() => rateWindDown(true)}
              >
                Hard
              </button>
            </div>
          </div>

          <div className="checkin-row">
            <span className="checkin-label">Fall asleep on time?</span>
            <div className="chip-row">
              {DRIFT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`chip ${yesterday.sleepOnsetDrift === opt.id ? 'chip-active' : ''}`}
                  onClick={() => rateSleepOnset(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button type="button" className="primary-btn" onClick={finishCheckIn}>
        Done for today
      </button>
    </div>
  );
}
