import { co2Saved, expiresLabel, isExpired, isUrgent, timeAgo } from './date.utils';

describe('date utils', () => {
  const inHours = (h: number) => new Date(Date.now() + h * 3600_000);

  it('flags expired and urgent dates', () => {
    expect(isExpired(inHours(-1))).toBeTrue();
    expect(isExpired(inHours(1))).toBeFalse();
    expect(isUrgent(inHours(5))).toBeTrue();
    expect(isUrgent(inHours(30))).toBeFalse();
    expect(isUrgent(inHours(-2))).toBeFalse();
  });

  it('describes expiry in words', () => {
    expect(expiresLabel(inHours(-1))).toBe('expired');
    expect(expiresLabel(new Date(Date.now() + 20 * 60_000))).toBe('in under an hour');
    expect(expiresLabel(inHours(3))).toBe('in 3 hours');
    expect(expiresLabel('not a date')).toBe('unknown');
  });

  it('describes past times relative to now', () => {
    expect(timeAgo(new Date())).toBe('just now');
    expect(timeAgo(new Date(Date.now() - 5 * 60_000))).toBe('5m ago');
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000))).toBe('3h ago');
  });

  it('estimates CO2 saved', () => {
    expect(co2Saved(10)).toBe(25);
    expect(co2Saved(0)).toBe(0);
  });
});
