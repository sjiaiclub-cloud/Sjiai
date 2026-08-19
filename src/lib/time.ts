export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(totalMin: number): string {
  const m = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function nowMinutes(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Minutes forward from `from` to reach `to`, treating both as times-of-day (wraps past midnight). */
export function minutesUntil(from: number, to: number): number {
  return ((to - from) % 1440 + 1440) % 1440;
}
