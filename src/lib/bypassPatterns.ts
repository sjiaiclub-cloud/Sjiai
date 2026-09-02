import type { AppState, DayLog } from '../types';
import { lastSevenDays } from './weekStats';

/**
 * How many consecutive days (most recent first, including today) had this app bypassed
 * during wind-down. Used to turn a repeated bypass into an in-the-moment prompt to
 * renegotiate the lock, instead of a number that only surfaces a week later in Trends.
 */
export function consecutiveBypassNights(state: AppState, appId: string): number {
  const days = lastSevenDays(state); // oldest -> newest
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].log?.bypassedApps.includes(appId)) streak++;
    else break;
  }
  return streak;
}

/** Every locked app currently on a bypass streak of at least `threshold` nights. */
export function strugglingApps(state: AppState, threshold = 3): string[] {
  return state.windDown.lockedApps.filter((appId) => consecutiveBypassNights(state, appId) >= threshold);
}

/** What the streak would become if `appId` gets bypassed right now, without committing it yet. */
export function previewStreakAfterBypass(state: AppState, today: DayLog, appId: string): number {
  const bypassedApps = today.bypassedApps.includes(appId) ? today.bypassedApps : [...today.bypassedApps, appId];
  const hypothetical: AppState = { ...state, logs: { ...state.logs, [today.date]: { ...today, bypassedApps } } };
  return consecutiveBypassNights(hypothetical, appId);
}
