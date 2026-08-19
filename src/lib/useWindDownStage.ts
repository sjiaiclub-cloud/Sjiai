import { useSchedule } from './useSchedule';
import { usePreviewClock } from '../state/PreviewClock';
import { toMinutes, nowMinutes, minutesUntil } from './time';

export type WindDownStage = 'normal' | 'nudge' | 'winddown' | 'locked';

export interface WindDownState {
  stage: WindDownStage;
  tintOpacity: number; // 0 - 0.4
  progress: number; // 0-1 through the current stage
}

const NUDGE_LEAD_MIN = 30;
const MAX_TINT = 0.38;

function isBetween(now: number, start: number, end: number): boolean {
  const duration = minutesUntil(start, end);
  const offset = minutesUntil(start, now);
  return offset < duration;
}

export function useWindDownStage(): WindDownState {
  const schedule = useSchedule();
  const { tickNow } = usePreviewClock();
  const now = nowMinutes(tickNow);

  const windDownStart = toMinutes(schedule.windDownStart);
  const bedtime = toMinutes(schedule.bedtime);
  const wake = toMinutes(schedule.wakeTime);
  const nudgeStart = ((windDownStart - NUDGE_LEAD_MIN) % 1440 + 1440) % 1440;

  if (isBetween(now, windDownStart, bedtime)) {
    const total = minutesUntil(windDownStart, bedtime);
    const elapsed = minutesUntil(windDownStart, now);
    const progress = total === 0 ? 1 : elapsed / total;
    return { stage: 'winddown', tintOpacity: progress * MAX_TINT, progress };
  }
  if (isBetween(now, bedtime, wake)) {
    return { stage: 'locked', tintOpacity: MAX_TINT, progress: 1 };
  }
  if (isBetween(now, nudgeStart, windDownStart)) {
    const total = minutesUntil(nudgeStart, windDownStart);
    const elapsed = minutesUntil(nudgeStart, now);
    return { stage: 'nudge', tintOpacity: 0, progress: total === 0 ? 1 : elapsed / total };
  }
  return { stage: 'normal', tintOpacity: 0, progress: 0 };
}
