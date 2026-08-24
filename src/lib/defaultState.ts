import type { AppState } from '../types';

export const STORAGE_KEY = 'driftly-sleep-state-v2';

export function defaultState(): AppState {
  return {
    profile: {
      wakeWeekday: '07:00',
      wakeWeekend: '09:00',
      schoolStartTime: '08:00',
      sleepGoalHours: 9,
      motivations: [],
      onboarded: false,
    },
    windDown: {
      leadMinutes: 40,
      strictness: 'gentle',
      lockedApps: [],
      ambientSound: 'none',
    },
    alarm: {
      enabled: true,
      wakeTime: '07:00',
      wakeWindowMinutes: 20,
      tone: 'chime',
      rampSeconds: 90,
      snoozeMinutes: 5,
      activeDays: 'everyday',
    },
    logs: {},
    isWeekend: false,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, quota) — fail silently, state stays in-memory
  }
}
