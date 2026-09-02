import type { AppState } from '../types';
import { summarizeWeek } from './weekStats';
import { MOTIVATION_TAGS } from '../types';

/**
 * A plain-text weekly summary the teen can copy and send themselves — to a parent,
 * a coach, whoever. Deliberately not a live dashboard anyone else can pull data from:
 * the only way this leaves the app is if the person using it chooses to share it.
 */
export function buildShareSummary(state: AppState): string {
  const week = summarizeWeek(state);
  const motivation = MOTIVATION_TAGS.find((m) => m.id === state.profile.motivations[0]);

  const lines = [
    `My sleep this week (Driftly)`,
    `Days checked in: ${week.loggedDays}/7`,
    `Current streak: ${week.streak} day${week.streak === 1 ? '' : 's'}`,
    `Easy wind-down nights: ${week.easyNights}`,
    `Hard wind-down nights: ${week.hardNights}`,
  ];
  if (motivation) lines.push(`What I'm working toward: ${motivation.label}`);
  return lines.join('\n');
}
