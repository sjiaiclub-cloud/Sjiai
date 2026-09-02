import type { AmbientId, ToneId } from './lib/sounds';

export type LockStrictness = 'off' | 'gentle' | 'firm';
export type AlarmActiveDays = 'everyday' | 'school' | 'weekend';

export interface Profile {
  wakeWeekday: string; // "HH:MM"
  wakeWeekend: string; // "HH:MM"
  schoolStartTime: string | null; // "HH:MM" or null if not applicable
  sleepGoalHours: number; // e.g. 9
  motivations: string[]; // tags the teen picked, e.g. "focus", "mood"
  onboarded: boolean;
}

export interface WindDownSettings {
  leadMinutes: number; // how many minutes before bedtime wind-down starts
  strictness: LockStrictness;
  lockedApps: string[]; // app ids the teen chose to make "sticky"
  ambientSound: AmbientId | 'none'; // optional sleep sound to play while winding down
}

export interface AlarmSettings {
  enabled: boolean;
  wakeTime: string; // "HH:MM", usually mirrors profile wake time
  wakeWindowMinutes: number; // e.g. 20 = may ring up to 20 min early at a cycle boundary
  tone: ToneId;
  rampSeconds: number; // how long the tone takes to reach full volume
  snoozeMinutes: number;
  activeDays: AlarmActiveDays;
}

export type SleepOnsetRating = 'ontime' | 'late' | 'very-late';

export interface DayLog {
  date: string; // YYYY-MM-DD
  caffeineTime: string | null; // "HH:MM" of last caffeine, if logged
  sunlightLogged: boolean;
  windDownFeltHard: boolean | null; // teen's own rating from the night before
  bypassCount: number; // times a locked app was opened anyway during wind-down
  bypassedApps: string[]; // which app ids were bypassed today, so patterns can be spotted
  sleepOnsetDrift: SleepOnsetRating | null; // self-reported: did you fall asleep around when planned?
  checkedIn: boolean; // whether today's one-tap morning check-in has been completed
}

export interface Preferences {
  lowPressureMode: boolean; // hides streaks/numbers in favor of plain, non-judgmental language
}

export interface AppState {
  profile: Profile;
  windDown: WindDownSettings;
  alarm: AlarmSettings;
  preferences: Preferences;
  logs: Record<string, DayLog>; // keyed by date
  isWeekend: boolean; // manual override for demo purposes (weekday vs weekend schedule)
}

export interface CandidateApp {
  id: string;
  label: string;
}

export const CANDIDATE_APPS: CandidateApp[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'discord', label: 'Discord' },
  { id: 'games', label: 'Mobile games' },
];

export const MOTIVATION_TAGS: CandidateApp[] = [
  { id: 'mood', label: 'Better mood' },
  { id: 'focus', label: 'Focus at school' },
  { id: 'sports', label: 'Sports performance' },
  { id: 'skin', label: 'Skin & appearance' },
  { id: 'energy', label: 'Daytime energy' },
];
