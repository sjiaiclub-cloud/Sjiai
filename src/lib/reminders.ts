import type { Schedule } from './sleepMath';
import type { DayLog } from '../types';
import { toMinutes, nowMinutes, fromMinutes } from './time';

export interface Reminder {
  id: string;
  tone: 'info' | 'warning' | 'insight';
  text: string;
}

/**
 * Generates contextual nudges from the teen's own logged habits and schedule,
 * rather than generic static rules ("drink water", "no screens") with low adherence.
 */
export function getReminders(
  schedule: Schedule,
  today: DayLog,
  yesterday: DayLog | undefined,
  now: Date = new Date(),
): Reminder[] {
  const reminders: Reminder[] = [];
  const currentMin = nowMinutes(now);
  const caffeineCutoff = toMinutes(schedule.bedtime) - 8 * 60; // ~8h half-life rule of thumb

  if (today.caffeineTime) {
    const caffeineMin = toMinutes(today.caffeineTime);
    if (caffeineMin > caffeineCutoff) {
      reminders.push({
        id: 'caffeine-late',
        tone: 'warning',
        text: `You logged caffeine at ${today.caffeineTime}, after your ${fromMinutes(
          caffeineCutoff,
        )} cutoff. It can still be active in your system at bedtime — tonight's wind-down may feel harder than usual.`,
      });
    }
  } else if (currentMin >= caffeineCutoff && currentMin < toMinutes(schedule.bedtime)) {
    reminders.push({
      id: 'caffeine-cutoff-passed',
      tone: 'info',
      text: `It's past your caffeine cutoff (${fromMinutes(caffeineCutoff)}) for tonight's bedtime. Skipping caffeine from here keeps wind-down easier.`,
    });
  }

  if (!today.sunlightLogged && currentMin < 11 * 60) {
    reminders.push({
      id: 'sunlight',
      tone: 'info',
      text: 'No sunlight logged yet today. Even 10 minutes of natural light this morning helps set your body clock to feel sleepy earlier tonight.',
    });
  }

  if (yesterday?.caffeineTime && yesterday.windDownFeltHard) {
    reminders.push({
      id: 'correlation-caffeine',
      tone: 'insight',
      text: `Last night you logged caffeine at ${yesterday.caffeineTime} and rated wind-down as hard. That's a pattern worth watching, not a coincidence.`,
    });
  }

  if (yesterday && yesterday.bypassCount >= 3) {
    reminders.push({
      id: 'correlation-bypass',
      tone: 'insight',
      text: `You opened a locked app ${yesterday.bypassCount} times during wind-down last night. If the lock list feels wrong, adjust it — it should fit you, not fight you.`,
    });
  }

  return reminders;
}
