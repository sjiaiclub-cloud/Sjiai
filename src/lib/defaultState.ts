import type { AppState } from '../types';

export const STORAGE_KEY = 'driftly-sleep-state-v3';

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
    preferences: {
      lowPressureMode: false,
    },
    logs: {},
    isWeekend: false,
  };
}

export function emptyDayLog(date: string): AppState['logs'][string] {
  return {
    date,
    caffeineTime: null,
    sunlightLogged: false,
    windDownFeltHard: null,
    bypassCount: 0,
    bypassedApps: [],
    sleepOnsetDrift: null,
    checkedIn: false,
  };
}

/** Loose structural check so a corrupted or hand-edited import file can't crash the app. */
export function isPlausibleAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.profile === 'object' &&
    v.profile !== null &&
    typeof v.windDown === 'object' &&
    v.windDown !== null &&
    typeof v.alarm === 'object' &&
    v.alarm !== null &&
    typeof v.logs === 'object' &&
    v.logs !== null
  );
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!isPlausibleAppState(parsed)) return defaultState();
    return mergeWithDefaults(parsed);
  } catch {
    return defaultState();
  }
}

/** Shallow-merges a loaded/imported state onto fresh defaults, one level deep per section,
 * so a schema upgrade that added fields (like this one did) never leaves a section half-filled. */
export function mergeWithDefaults(parsed: Partial<AppState>): AppState {
  const base = defaultState();
  return {
    profile: { ...base.profile, ...parsed.profile },
    windDown: { ...base.windDown, ...parsed.windDown },
    alarm: { ...base.alarm, ...parsed.alarm },
    preferences: { ...base.preferences, ...parsed.preferences },
    logs: parsed.logs ?? {},
    isWeekend: parsed.isWeekend ?? base.isWeekend,
  };
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode, quota) — fail silently, state stays in-memory
  }
}
