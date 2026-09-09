import { mosqueDateKey, mosqueMinutes, mosqueTimeOnDate } from '../mosqueClock';
import { cacheTimetable, readTimetable } from '../timetableCache';
import { recoveringSubscription } from '../recoveringSubscription';

const times = { fajrStart: '05:00', fajrJamaat: '05:30', sunrise: '06:30', dhuhrStart: '12:00',
  dhuhrJamaat: '13:00', asrStart: '15:00', asrJamaat: '16:00', maghrib: '18:30', ishaStart: '20:00', ishaJamaat: '21:00' };
afterEach(() => jest.useRealTimers());

it('uses London dates and times for explicit UTC instants', () => {
  const instant = new Date('2026-09-09T23:30:00Z');
  expect(mosqueDateKey(instant)).toBe('10/09/2026');
  expect(mosqueMinutes(instant)).toBe(30);
  expect(mosqueTimeOnDate(5, 30, instant).toISOString()).toBe('2026-09-10T04:30:00.000Z');
});
it.each([
  ['2026-03-29T00:00:00Z', 23], ['2026-10-24T23:00:00Z', 25],
])('schedules midnight across a DST change at %s', (start, hours) => {
  const date = new Date(start);
  expect(mosqueTimeOnDate(0, 0, date, 1).getTime() - date.getTime()).toBe(hours * 3_600_000);
});
it('never uses a cached timetable for another date and rejects malformed data', () => {
  cacheTimetable('09/09/2026', times);
  expect(readTimetable('09/09/2026')).toEqual(times);
  expect(readTimetable('10/09/2026')).toBeNull();
  cacheTimetable('10/09/2026', { ...times, fajrStart: '25:00' });
  expect(readTimetable('10/09/2026')).toBeNull();
});
it('bounds persistent timetable storage and expires old snapshots', () => {
  jest.useFakeTimers();
  for (let day = 1; day <= 20; day++) cacheTimetable(`${day}/09/2026`, times);
  expect(Object.keys(JSON.parse(localStorage.getItem('judi.display.timetables.v1')!))).toHaveLength(4);
  jest.advanceTimersByTime(8 * 86_400_000);
  expect(readTimetable('20/09/2026')).toBeNull();
});
it('contains corrupt storage and denied writes', () => {
  localStorage.setItem('judi.display.timetables.v1', '{bad');
  expect(readTimetable('09/09/2026')).toBeNull();
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('Denied'); });
  expect(() => cacheTimetable('09/09/2026', times)).not.toThrow();
  spy.mockRestore();
});
it('retries one listener after a startup timeout and ignores obsolete callbacks', () => {
  jest.useFakeTimers();
  const callbacks: Array<(value: number) => void> = [];
  const stops: jest.Mock[] = [];
  const next = jest.fn();
  const fail = jest.fn();
  const stop = recoveringSubscription<number>(callback => {
    callbacks.push(callback); const unsubscribe = jest.fn(); stops.push(unsubscribe); return unsubscribe;
  }, next, fail);
  jest.advanceTimersByTime(25_000);
  expect(callbacks).toHaveLength(2);
  expect(stops[0]).toHaveBeenCalledTimes(1);
  callbacks[0](1); callbacks[1](2);
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(2);
  stop(); callbacks[1](3);
  expect(next).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
