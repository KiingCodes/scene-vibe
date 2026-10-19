import { describe, expect, it } from 'vitest';
import { normalizeDoorWait, doorWaitLabel, BROADCAST_CHANNELS } from '@/lib/venueCommand';

describe('venue command rules', () => {
  it('defaults missing or invalid wait values to 15–20 minutes', () => {
    for (const value of [undefined, null, NaN, '15', -1, Infinity]) {
      expect(normalizeDoorWait(value)).toBe(15);
      expect(doorWaitLabel(value)).toBe('15-20 min');
    }
  });
  it('preserves zero as no wait', () => {
    expect(normalizeDoorWait(0)).toBe(0);
    expect(doorWaitLabel(0)).toBe('No wait');
  });
  it('keeps the requested target channel identifiers', () => {
    expect(BROADCAST_CHANNELS.map(({ id }) => id)).toEqual(expect.arrayContaining(['johannesburg', 'capetown', 'live-clubs']));
  });
});
