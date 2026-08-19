import { toMinutes, fromMinutes, minutesUntil } from './time';

const FALL_ASLEEP_BUFFER_MIN = 15;
const SCHOOL_PREP_BUFFER_MIN = 45;
const CYCLE_MIN = 90;

export interface ScheduleOption {
  cycles: number;
  hours: number;
  bedtime: string;
}

export interface Schedule {
  wakeTime: string;
  bedtime: string;
  windDownStart: string;
  cycles: number;
  hours: number;
  options: ScheduleOption[];
  warnings: string[];
}

/**
 * Recommends bedtime using 90-minute sleep cycles rather than a flat goal,
 * and flags (without blocking) when school start time makes the plan unrealistic.
 * Teen sleep need/chronotype varies, so this is a starting point to adjust, not a mandate.
 */
export function computeSchedule(
  wakeTime: string,
  sleepGoalHours: number,
  schoolStartTime: string | null,
  windDownLeadMinutes: number,
): Schedule {
  const wakeMin = toMinutes(wakeTime);
  const allOptions: ScheduleOption[] = [4, 5, 6].map((cycles) => {
    const hours = (cycles * CYCLE_MIN) / 60;
    const bedtime = fromMinutes(wakeMin - hours * 60 - FALL_ASLEEP_BUFFER_MIN);
    return { cycles, hours, bedtime };
  });

  // Pick the option closest to the stated goal.
  const best = allOptions.reduce((closest, opt) =>
    Math.abs(opt.hours - sleepGoalHours) < Math.abs(closest.hours - sleepGoalHours) ? opt : closest,
  );

  const windDownStart = fromMinutes(toMinutes(best.bedtime) - windDownLeadMinutes);

  const warnings: string[] = [];
  if (schoolStartTime) {
    const latestWake = toMinutes(schoolStartTime) - SCHOOL_PREP_BUFFER_MIN;
    if (wakeMin > latestWake && minutesUntil(latestWake, wakeMin) < 720) {
      warnings.push(
        `To make it to school by ${schoolStartTime}, you'd realistically need to wake by ${fromMinutes(
          latestWake,
        )}. That's earlier than the wake time you set — teens' body clocks naturally run later, so consider an earlier wind-down instead of just a harsher alarm, and use weekends to catch up gradually rather than swinging wildly.`,
      );
    }
  }
  if (best.hours < 8) {
    warnings.push(
      'This plan gives you under 8 hours. That can work occasionally, but most teens feel and perform better closer to 8-10 hours a night.',
    );
  }

  return {
    wakeTime,
    bedtime: best.bedtime,
    windDownStart,
    cycles: best.cycles,
    hours: best.hours,
    options: allOptions,
    warnings,
  };
}
