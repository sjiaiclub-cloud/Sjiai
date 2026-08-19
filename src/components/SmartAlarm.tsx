import { useEffect, useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { usePreviewClock } from '../state/PreviewClock';
import { useSchedule } from '../lib/useSchedule';
import { estimateWakeWindow } from '../lib/wakeWindow';
import { formatClock, nowMinutes, toMinutes } from '../lib/time';
import { playSoftAlarm, previewChime } from '../lib/alarmTone';

export function SmartAlarm() {
  const { state, setState } = useAppState();
  const { alarm } = state;
  const schedule = useSchedule();
  const { tickNow } = usePreviewClock();
  const [ringing, setRinging] = useState(false);
  const stopRef = useRef<{ stop: () => void } | null>(null);
  const firedRef = useRef<string | null>(null);

  const target = estimateWakeWindow(schedule.bedtime, schedule.wakeTime, alarm.wakeWindowMinutes);

  useEffect(() => {
    if (!alarm.enabled) return;
    const nowKey = tickNow.toISOString().slice(0, 13); // dedupe within the same hour-tick
    const now = nowMinutes(tickNow);
    const targetMin = toMinutes(target.time);
    const withinFireWindow = Math.abs(now - targetMin) <= 1;
    if (withinFireWindow && firedRef.current !== nowKey && !ringing) {
      firedRef.current = nowKey;
      setRinging(true);
      stopRef.current = playSoftAlarm();
    }
  }, [tickNow, alarm.enabled, target.time, ringing]);

  function dismiss() {
    stopRef.current?.stop();
    stopRef.current = null;
    setRinging(false);
  }

  function snooze() {
    dismiss();
    window.setTimeout(() => {
      setRinging(true);
      stopRef.current = playSoftAlarm();
    }, 5 * 60 * 1000);
  }

  return (
    <div className="card">
      <h2>Smart alarm</h2>
      <p className="muted">
        Instead of a jarring blast, this eases you awake with a soft, rising melodic tone — reducing the
        grogginess of being yanked out of deep sleep.
      </p>

      <label className="field checkbox">
        <input
          type="checkbox"
          checked={alarm.enabled}
          onChange={(e) => setState((p) => ({ ...p, alarm: { ...p.alarm, enabled: e.target.checked } }))}
        />
        <span>Alarm enabled</span>
      </label>

      <label className="field">
        <span>Wake window: ±{alarm.wakeWindowMinutes} min</span>
        <input
          type="range"
          min={0}
          max={40}
          step={5}
          value={alarm.wakeWindowMinutes}
          onChange={(e) => setState((p) => ({ ...p, alarm: { ...p.alarm, wakeWindowMinutes: Number(e.target.value) } }))}
        />
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

      <div className="row-between">
        <button type="button" onClick={previewChime}>
          Preview tone
        </button>
        <button
          type="button"
          onClick={() => {
            setRinging(true);
            stopRef.current = playSoftAlarm();
          }}
        >
          Test full wake sequence
        </button>
      </div>

      {ringing && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Good morning</h3>
            <p className="muted">Ease into it — the tone will keep gently rising until you dismiss it.</p>
            <div className="modal-actions">
              <button type="button" onClick={snooze}>
                Snooze 5 min
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
