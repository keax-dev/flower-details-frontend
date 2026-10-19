import { describe, expect, it } from 'vitest';
import { todayInBusinessTimeZone } from '@features/dashboard/config/business-time-zone';

describe('todayInBusinessTimeZone', () => {
  it('uses the Ecuador calendar day across the UTC midnight boundary', () => {
    const date = todayInBusinessTimeZone(new Date('2026-10-20T02:00:00Z'));

    expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([2026, 10, 19]);
  });
});
