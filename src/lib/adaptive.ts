import type { AppState, SleepOnsetRating } from '../types';
import { lastSevenDays } from './weekStats';

const DRIFT_MINUTES: Record<SleepOnsetRating, number> = {
  ontime: 0,
  late: 20,
  'very-late': 50,
};

const MAX_SAMPLES = 5;

export interface DriftEstimate {
  minutes: number; // rolling average minutes later than planned the teen actually fell asleep
  sampleCount: number;
}

/**
 * Learns from the last few mornings' "did you fall asleep around when planned?" check-ins
 * instead of trusting the plan blindly forever — a fixed wake-window estimate that never
 * adjusts to how sleep onset actually goes is really just a static guess wearing a label.
 */
export function estimateSleepOnsetDrift(state: AppState): DriftEstimate {
  const recentRatings = lastSevenDays(state)
    .map((d) => d.log?.sleepOnsetDrift)
    .filter((r): r is SleepOnsetRating => r != null)
    .slice(-MAX_SAMPLES);

  if (recentRatings.length === 0) return { minutes: 0, sampleCount: 0 };

  const total = recentRatings.reduce((sum, r) => sum + DRIFT_MINUTES[r], 0);
  return { minutes: Math.round(total / recentRatings.length), sampleCount: recentRatings.length };
}
