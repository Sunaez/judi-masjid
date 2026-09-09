export const MOSQUE_TIME_ZONE = 'Europe/London';
const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: MOSQUE_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
export function mosqueParts(date = new Date()) {
  const parts = Object.fromEntries(clock.formatToParts(date).map(part => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second) };
}
export function mosqueMinutes(date = new Date()) {
  const parts = mosqueParts(date);
  return parts.hour * 60 + parts.minute;
}
export function mosqueDateKey(date = new Date(), dayOffset = 0) {
  const parts = mosqueParts(date);
  const calendar = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + dayOffset));
  return `${String(calendar.getUTCDate()).padStart(2, '0')}/${String(calendar.getUTCMonth() + 1).padStart(2, '0')}/${calendar.getUTCFullYear()}`;
}
/** Convert a London wall-clock time to an instant, including 23/25-hour days. */
export function mosqueTimeOnDate(hour: number, minute: number, date = new Date(), dayOffset = 0) {
  const parts = mosqueParts(date);
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute) + dayOffset * 86_400_000;
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const candidate = mosqueParts(new Date(instant));
    const represented = Date.UTC(candidate.year, candidate.month - 1, candidate.day, candidate.hour, candidate.minute, candidate.second);
    const adjusted = instant + wall - represented;
    if (adjusted === instant) break;
    instant = adjusted;
  }
  return new Date(instant);
}
