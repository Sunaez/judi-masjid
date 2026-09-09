const NOW = Date.UTC(2026, 8, 6, 12);
const FIVE_MINUTES = 300_000;
const weather = {
  temp: 18, condition: 'Clouds', iconCode: '04d',
  forecastTemp: 19, forecastCondition: 'Clear', timestamp: NOW,
};

describe('shared weather scheduler', () => {
  let subscribe: typeof import('../weatherClient').subscribeWeather;
  let cleanup: Array<() => void>;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    localStorage.clear();
    localStorage.setItem('judi.weather.interval', String(FIVE_MINUTES));
    cleanup = [];
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ ...weather, timestamp: Date.now() }) })) as jest.Mock;
    subscribe = require('../weatherClient').subscribeWeather;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup.forEach(stop => stop());
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function start(listener = jest.fn()) {
    cleanup.push(subscribe(listener));
    await jest.advanceTimersByTimeAsync(0);
    return listener;
  }

  it('fetches empty weather immediately and shares it across mounted components', async () => {
    const first = await start();
    const second = await start();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenLastCalledWith({ weather, loading: false });
    expect(second).toHaveBeenLastCalledWith({ weather, loading: false });
  });

  it('waits only the remaining time from the cached fetch timestamp', async () => {
    localStorage.setItem('judi.weather.current', JSON.stringify({ ...weather, timestamp: NOW - 120_000 }));
    await start();
    expect(fetch).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(179_999);
    expect(fetch).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(FIVE_MINUTES);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(['null', '{}', 'broken JSON', JSON.stringify({ ...weather, timestamp: NOW - 360_000 })])(
    'refreshes missing, malformed or stale weather on opening: %s', async cache => {
      localStorage.setItem('judi.weather.current', cache);
      await start();
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

  it('persists a randomized 4–6 minute interval for this browser', async () => {
    localStorage.removeItem('judi.weather.interval');
    jest.spyOn(Math, 'random').mockReturnValue(0.25);
    await start();
    expect(Number(localStorage.getItem('judi.weather.interval'))).toBe(270_000);
    expect(fetch).toHaveBeenCalledWith('/api/weather/current?interval=270000', expect.anything());
  });

  it('coalesces stacked events while a refresh is in progress', async () => {
    let resolve!: (response: unknown) => void;
    (fetch as jest.Mock).mockImplementation(() => new Promise(r => { resolve = r; }));
    await start();
    await start();
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    await jest.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    resolve({ ok: true, json: async () => weather });
    await jest.advanceTimersByTimeAsync(0);
  });

  it('shares a refresh between separate tabs using a lock and persistent cache', async () => {
    let queue = Promise.resolve();
    const request = jest.fn((_name: string, _options: unknown, work: () => Promise<void>) => {
      queue = queue.then(work);
      return queue;
    });
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });
    cleanup.push(subscribe(jest.fn()));
    jest.resetModules();
    const secondTab = require('../weatherClient').subscribeWeather;
    const listener = jest.fn();
    cleanup.push(secondTab(listener));
    await jest.advanceTimersByTimeAsync(0);
    expect(request).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({ weather, loading: false });
  });

  it('rechecks expired weather when a suspended page regains focus', async () => {
    await start();
    jest.setSystemTime(NOW + 360_000);
    window.dispatchEvent(new Event('focus'));
    await jest.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not loop when the server clock is slightly ahead of the device', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ...weather, timestamp: NOW + 30_000 }) });
    await start();
    await jest.advanceTimersByTimeAsync(FIVE_MINUTES);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('keeps stale data and backs off when the server returns a stale fallback', async () => {
    const stale = { ...weather, timestamp: NOW - 600_000 };
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => stale });
    const listener = await start();
    await jest.advanceTimersByTimeAsync(FIVE_MINUTES - 1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({ weather: stale, loading: false });
    await jest.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries failures after its interval and stops polling on unmount', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Offline'));
    await start();
    await jest.advanceTimersByTimeAsync(FIVE_MINUTES - 1);
    expect(fetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    cleanup.forEach(stop => stop());
    await jest.advanceTimersByTimeAsync(600_000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('reports provider configuration failures without triggering a console error overlay', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({
      code: 'WEATHER_API_KEY_REJECTED', error: 'OpenWeather rejected the API key.',
    }) });
    const listener = await start();
    expect(listener).toHaveBeenLastCalledWith({ weather: null, loading: false });
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('[weather] Failed to refresh:', 'OpenWeather rejected the API key.');
    await jest.advanceTimersByTimeAsync(FIVE_MINUTES - 1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
