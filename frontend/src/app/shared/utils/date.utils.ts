/** Date helpers shared by the listing and claim pages. */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function hoursUntil(date: Date | string): number {
  return (new Date(date).getTime() - Date.now()) / HOUR;
}

export function isExpired(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}

/** True when the food expires within the next 24 hours. */
export function isUrgent(date: Date | string): boolean {
  const h = hoursUntil(date);
  return h >= 0 && h < 24;
}

/** "in 3 hours", "today", "tomorrow", "in 4 days", or a date. */
export function expiresLabel(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'unknown';
  const diff = d.getTime() - Date.now();
  if (diff < 0) return 'expired';
  if (diff < HOUR) return 'in under an hour';
  if (diff < 12 * HOUR) {
    const h = Math.round(diff / HOUR);
    return `in ${h} hour${h === 1 ? '' : 's'}`;
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((d.getTime() - startOfToday.getTime()) / DAY);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `in ${days} days`;
  return `on ${d.toLocaleDateString()}`;
}

/** "just now", "5m ago", "3h ago", "2d ago", or a date. */
export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

/** Rough impact estimate used across dashboards: 1 serving saved ≈ 2.5 kg CO₂e. */
export const CO2_KG_PER_MEAL = 2.5;

export function co2Saved(meals: number): number {
  return Math.round(meals * CO2_KG_PER_MEAL);
}
