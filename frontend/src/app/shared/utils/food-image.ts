/** Maps a food type (see FOOD_TYPES) to its bundled category illustration. */
const MAP: Record<string, string> = {
  cooked: 'cooked',
  raw: 'raw',
  packaged: 'packaged',
  bakery: 'bakery',
  'fruits & vegetables': 'fruits',
  fruits: 'fruits',
  vegetables: 'fruits',
  dairy: 'dairy',
  beverages: 'beverages'
};

export function foodImage(type?: string | null): string {
  const key = (type ?? '').trim().toLowerCase();
  return `assets/illustrations/food/${MAP[key] ?? 'other'}.svg`;
}
