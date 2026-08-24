import type { AppState, DayLog } from '../types';
import { todayKey } from './time';

export interface DayPoint {
  date: string;
  label: string; // "Mon", "Tue", ...
  log: DayLog | undefined;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Oldest-to-newest view of the last 7 days, including days with no log. */
export function lastSevenDays(state: AppState): DayPoint[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = todayKey(d);
    return { date, label: WEEKDAY_LABELS[d.getDay()], log: state.logs[date] };
  });
}

export interface WeekSummary {
  days: DayPoint[];
  loggedDays: number;
  easyNights: number;
  hardNights: number;
  totalBypasses: number;
  streak: number; // consecutive most-recent days with any log
}

export function summarizeWeek(state: AppState): WeekSummary {
  const days = lastSevenDays(state);
  const logged = days.filter((d) => d.log);
  const easyNights = logged.filter((d) => d.log?.windDownFeltHard === false).length;
  const hardNights = logged.filter((d) => d.log?.windDownFeltHard === true).length;
  const totalBypasses = logged.reduce((sum, d) => sum + (d.log?.bypassCount ?? 0), 0);

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].log) streak++;
    else break;
  }

  return { days, loggedDays: logged.length, easyNights, hardNights, totalBypasses, streak };
}
