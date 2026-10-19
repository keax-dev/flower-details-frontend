export const BUSINESS_TIME_ZONE = 'America/Guayaquil';

export function todayInBusinessTimeZone(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const datePart = (type: 'year' | 'month' | 'day') => Number(parts.find((part) => part.type === type)?.value);

  return new Date(datePart('year'), datePart('month') - 1, datePart('day'));
}
