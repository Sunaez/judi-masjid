import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import KioskLifecycle from '../Components/KioskLifecycle';
import DisplayBoundary from '../Components/DisplayBoundary';

beforeEach(() => jest.useFakeTimers());
afterEach(() => { cleanup(); jest.useRealTimers(); jest.restoreAllMocks(); });

it('releases a wake lock arriving after unmount and stops the heartbeat', async () => {
  let resolve!: (value: unknown) => void;
  const release = jest.fn(async () => {});
  const request = jest.fn(() => new Promise(done => { resolve = done; }));
  const original = Object.getOwnPropertyDescriptor(navigator, 'wakeLock');
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  try {
    const { unmount } = render(<KioskLifecycle />);
    expect(document.documentElement.dataset.displayHeartbeat).toBeDefined();
    unmount();
    await act(async () => { resolve({ release, released: false }); });
    expect(release).toHaveBeenCalledTimes(1);
    expect(document.documentElement.dataset.displayHeartbeat).toBeUndefined();
    await act(async () => { await jest.advanceTimersByTimeAsync(0); });
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    if (original) Object.defineProperty(navigator, 'wakeLock', original);
    else Reflect.deleteProperty(navigator, 'wakeLock');
  }
});

it('contains a panel error and recovers without unmounting adjacent content', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  let broken = true;
  function Panel() { if (broken) throw Error('bad content'); return <span>Recovered</span>; }
  const { getByText } = render(<><span>Prayer timetable</span><DisplayBoundary><Panel /></DisplayBoundary></>);
  expect(getByText('Prayer timetable')).toBeInTheDocument();
  expect(getByText(/temporarily unavailable/)).toBeInTheDocument();
  broken = false;
  act(() => jest.advanceTimersByTime(30_000));
  expect(getByText('Recovered')).toBeInTheDocument();
});
