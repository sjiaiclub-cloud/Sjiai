import { useEffect, useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { usePreviewClock } from '../state/PreviewClock';
import { useSchedule } from '../lib/useSchedule';
import { estimateWakeWindow } from '../lib/wakeWindow';
import { estimateSleepOnsetDrift } from '../lib/adaptive';
import { formatClock, nowMinutes, toMinutes, fromMinutes } from '../lib/time';
import { playAlarmTone, previewTone, TONES, type ToneId } from '../lib/sounds';
import type { AlarmActiveDays } from '../types';

const RAMP_OPTIONS: { seconds: number; label: string }[] = [
  { seconds: 30, label: 'Quick — 30s fade-in' },
  { seconds: 90, label: 'Gentle — 90s fade-in' },
  { seconds: 180, label: 'Very gradual — 3min fade-in' },
];

const SNOOZE_OPTIONS = [5, 10, 15];

const ACTIVE_DAYS_COPY: Record<AlarmActiveDays, string> = {
  everyday: 'Every day',
  school: 'School days only',
  weekend: 'Weekends only',
};

function matchesActiveDays(days: AlarmActiveDays, date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;
  if (days === 'everyday') return true;
  if (days === 'school') return !isWeekend;
  return isWeekend;
}

export function SmartAlarm() {
  const { state, setState } = useAppState();
  const { alarm } = state;
  const schedule = useSchedule();
  const { tickNow } = usePreviewClock();
  const [ringing, setRinging] = useState(false);
  const stopRef = useRef<{ stop: () => void } | null>(null);
  const firedRef = useRef<string | null>(null);

  const drift = estimateSleepOnsetDrift(state);
  const effectiveBedtime = fromMinutes(toMinutes(schedule.bedtime) + drift.minutes);
  const target = estimateWakeWindow(effectiveBedtime, schedule.wakeTime, alarm.wakeWindowMinutes);
  const activeToday = matchesActiveDays(alarm.activeDays, tickNow);

  useEffect(() => {
    if (!alarm.enabled || !activeToday) return;
    const nowKey = tickNow.toISOString().slice(0, 13); // dedupe within the same hour-tick
    const now = nowMinutes(tickNow);
    const targetMin = toMinutes(target.time);
    const withinFireWindow = Math.abs(now - targetMin) <= 1;
    if (withinFireWindow && firedRef.current !== nowKey && !ringing) {
      firedRef.current = nowKey;
      setRinging(true);
      stopRef.current = playAlarmTone(alarm.tone, alarm.rampSeconds);
    }
  }, [tickNow, alarm.enabled, activeToday, alarm.tone, alarm.rampSeconds, target.time, ringing]);

  function dismiss() {
    stopRef.current?.stop();
    stopRef.current = null;
    setRinging(false);
  }

  function snooze() {
    dismiss();
    window.setTimeout(() => {
      setRinging(true);
      stopRef.current = playAlarmTone(alarm.tone, alarm.rampSeconds);
    }, alarm.snoozeMinutes * 60 * 1000);
  }

  function setTone(tone: ToneId) {
    setState((p) => ({ ...p, alarm: { ...p.alarm, tone } }));
  }

  return (
    <div className="card">
      <h2>Smart alarm</h2>
      <p className="muted">
        Instead of a jarring blast, this eases you awake with a soft, rising tone — reducing the grogginess
        of being yanked out of deep sleep.
      </p>

      <label className="field checkbox">
        <input
          type="checkbox"
          checked={alarm.enabled}
          onChange={(e) => setState((p) => ({ ...p, alarm: { ...p.alarm, enabled: e.target.checked } }))}
        />
        <span>Alarm enabled</span>
      </label>

      <div className="schedule-highlight">
        <div>
          <div className="big-time">{formatClock(target.time)}</div>
          <div className="muted">{target.isEarlyCycleBoundary ? 'estimated cycle boundary' : 'planned wake time'}</div>
        </div>
      </div>
      <p className="muted small">
        This estimate comes from your planned bedtime and simple 90-minute cycle math — not from motion or
        microphone sensing, so treat it as a nudge, not a guarantee.
      </p>
      {drift.minutes > 0 && (
        <p className="muted small">
          Adjusted ~{drift.minutes} min later than planned, based on your last {drift.sampleCount} night
          {drift.sampleCount === 1 ? '' : 's'} of "did you fall asleep on time?" check-ins on the Reminders
          tab — the estimate learns from that instead of trusting the plan blindly.
        </p>
      )}

      <div className="field">
        <span>Wake window: ±{alarm.wakeWindowMinutes} min</span>
        <input
          type="range"
          min={0}
          max={40}
          step={5}
          value={alarm.wakeWindowMinutes}
          onChange={(e) => setState((p) => ({ ...p, alarm: { ...p.alarm, wakeWindowMinutes: Number(e.target.value) } }))}
        />
      </div>

      <div className="field">
        <span>Wake tone</span>
        <div className="tone-grid">
          {TONES.map((t) => (
            <div key={t.id} className={`tone-card ${alarm.tone === t.id ? 'tone-card-active' : ''}`}>
              <button type="button" className="tone-card-select" onClick={() => setTone(t.id)}>
                {t.label}
              </button>
              <button type="button" className="tone-card-preview" onClick={() => previewTone(t.id)} aria-label={`Preview ${t.label}`}>
                ▶
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <span>How quickly should it build in volume?</span>
        <div className="chip-row">
          {RAMP_OPTIONS.map((opt) => (
            <button
              key={opt.seconds}
              type="button"
              className={`chip ${alarm.rampSeconds === opt.seconds ? 'chip-active' : ''}`}
              onClick={() => setState((p) => ({ ...p, alarm: { ...p.alarm, rampSeconds: opt.seconds } }))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Which days should it ring?</span>
        <div className="chip-row">
          {(Object.keys(ACTIVE_DAYS_COPY) as AlarmActiveDays[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`chip ${alarm.activeDays === d ? 'chip-active' : ''}`}
              onClick={() => setState((p) => ({ ...p, alarm: { ...p.alarm, activeDays: d } }))}
            >
              {ACTIVE_DAYS_COPY[d]}
            </button>
          ))}
        </div>
        {!activeToday && (
          <p className="muted small">Not scheduled to ring today, based on the days you picked above.</p>
        )}
      </div>

      <div className="field">
        <span>Snooze length</span>
        <div className="chip-row">
          {SNOOZE_OPTIONS.map((min) => (
            <button
              key={min}
              type="button"
              className={`chip ${alarm.snoozeMinutes === min ? 'chip-active' : ''}`}
              onClick={() => setState((p) => ({ ...p, alarm: { ...p.alarm, snoozeMinutes: min } }))}
            >
              {min} min
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setRinging(true);
          stopRef.current = playAlarmTone(alarm.tone, alarm.rampSeconds);
        }}
      >
        Test full wake sequence
      </button>

      {ringing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Good morning</h3>
            <p className="muted">Ease into it — the tone will keep gently rising until you dismiss it.</p>
            <div className="modal-actions">
              <button type="button" onClick={snooze}>
                Snooze {alarm.snoozeMinutes} min
              </button>
              <button type="button" className="primary-btn" onClick={dismiss}>
                I'm up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
