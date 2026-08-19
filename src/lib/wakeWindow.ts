import { toMinutes, fromMinutes, minutesUntil } from './time';

const CYCLE_MIN = 90;

export interface WakeWindowResult {
  time: string; // "HH:MM"
  isEarlyCycleBoundary: boolean;
}

/**
 * Picks the latest 90-minute cycle boundary (from bedtime) that falls within
 * `windowMinutes` before the target wake time. This is a math estimate from
 * the planned schedule, not a sensor-based sleep-stage detector — no motion
 * or microphone data is used, so it's disclosed as an estimate in the UI.
 */
export function estimateWakeWindow(bedtime: string, wakeTime: string, windowMinutes: number): WakeWindowResult {
  const bedtimeMin = toMinutes(bedtime);
  const wakeMin = toMinutes(wakeTime);
  const sleepDuration = minutesUntil(bedtimeMin, wakeMin);

  const cyclesElapsedAtWake = Math.floor(sleepDuration / CYCLE_MIN);
  const boundaryBeforeWake = cyclesElapsedAtWake * CYCLE_MIN;
  const distanceFromWake = sleepDuration - boundaryBeforeWake;

  if (distanceFromWake > 0 && distanceFromWake <= windowMinutes) {
    return { time: fromMinutes(bedtimeMin + boundaryBeforeWake), isEarlyCycleBoundary: true };
  }
  return { time: wakeTime, isEarlyCycleBoundary: false };
}
