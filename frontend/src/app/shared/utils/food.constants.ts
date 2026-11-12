/** Food categories offered when listing food. Browse filters use the same list. */
export const FOOD_TYPES: readonly string[] = [
  'Cooked',
  'Raw',
  'Packaged',
  'Bakery',
  'Fruits & Vegetables',
  'Dairy',
  'Beverages',
  'Other'
];

/** Combine a date picker value and an "HH:mm" string into one Date. */
export function combineDateAndTime(date: Date | string, time: string | null | undefined): Date {
  const d = new Date(date);
  const [h, m] = (time || '23:59').split(':').map(n => parseInt(n, 10));
  d.setHours(isNaN(h) ? 23 : h, isNaN(m) ? 59 : m, 0, 0);
  return d;
}

export function toTimeString(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
