import { useMemo } from 'react';
import { useAppState } from '../state/AppStateContext';
import { computeSchedule } from './sleepMath';

export function useSchedule() {
  const { state } = useAppState();
  const { profile, windDown, isWeekend } = state;
  const wakeTime = isWeekend ? profile.wakeWeekend : profile.wakeWeekday;
  return useMemo(
    () => computeSchedule(wakeTime, profile.sleepGoalHours, isWeekend ? null : profile.schoolStartTime, windDown.leadMinutes),
    [wakeTime, profile.sleepGoalHours, isWeekend, profile.schoolStartTime, windDown.leadMinutes],
  );
}
