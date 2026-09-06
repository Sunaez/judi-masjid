/** @jest-environment node */

const NOW = Date.UTC(2026, 8, 6, 12);
const entry = { main: { temp: 18 }, weather: [{ main: 'Clouds', icon: '04d' }] };

describe('public weather endpoint', () => {
  let GET: typeof import('../route').GET;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    process.env.OPENWEATHER_API_KEY = 'test-key';
    process.env.OPENWEATHER_LAT = '51.5';
    process.env.OPENWEATHER_LON = '-0.1';
    global.fetch = jest.fn(async (url: URL) => ({
      ok: true,
      json: async () => url.pathname.endsWith('/forecast') ? { list: [entry] } : entry,
    })) as jest.Mock;
    // Public weather must work without either Firestore SDK or admin credentials.
    jest.doMock('@/lib/firebaseAdmin', () => { throw new Error('Unexpected Admin SDK access'); });
    jest.doMock('@/lib/firebase', () => { throw new Error('Unexpected Firestore access'); });
    GET = require('../route').GET;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    global.fetch = originalFetch;
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.OPENWEATHER_LAT;
    delete process.env.OPENWEATHER_LON;
  });

  const request = (interval = 300_000) => new Request(`http://localhost/api/weather/current?interval=${interval}`);

  it('coalesces concurrent cold starts into one current/forecast fetch pair', async () => {
    const responses = await Promise.all([GET(request()), GET(request()), GET(request())]);
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(await response.json()).toMatchObject({ temp: 18, timestamp: NOW });
    }
  });

  it('uses the device interval and the last successful weather timestamp', async () => {
    await GET(request(270_000));
    jest.setSystemTime(NOW + 269_999);
    await GET(request(270_000));
    expect(fetch).toHaveBeenCalledTimes(2);
    jest.setSystemTime(NOW + 270_000);
    const response = await GET(request(270_000));
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(await response.json()).toMatchObject({ timestamp: NOW + 270_000 });
  });

  it.each([0, -1, 1, 239_999, 360_001, NaN])('rejects an unsafe refresh interval: %s', async interval => {
    await GET(request());
    jest.setSystemTime(NOW + 240_000);
    await GET(request(interval));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns stale weather on upstream failure without changing its timestamp', async () => {
    await GET(request());
    jest.setSystemTime(NOW + 300_000);
    (fetch as jest.Mock).mockRejectedValue(new Error('Offline'));
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ timestamp: NOW });
    await GET(request());
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('backs off on an empty-cache failure and permits a later retry', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false });
    expect((await GET(request())).status).toBe(503);
    expect((await GET(request())).status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(2);
    jest.setSystemTime(NOW + 300_000);
    await GET(request());
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('identifies a rejected API key and preserves that diagnosis during cooldown', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });
    for (let i = 0; i < 2; i++) {
      const response = await GET(request());
      expect(response.status).toBe(503);
      const payload = await response.json();
      expect(payload.code).toBe('WEATHER_API_KEY_REJECTED');
      expect(payload.error).toContain('OPENWEATHER_API_KEY');
      expect(JSON.stringify(payload)).not.toContain('test-key');
    }
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('does not expose upstream request URLs or keys in errors', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Request failed: https://example.com?appid=test-key'));
    const response = await GET(request());
    expect(await response.json()).toEqual({
      code: 'WEATHER_UNAVAILABLE', error: 'Weather is temporarily unavailable.',
    });
    expect(JSON.stringify((console.warn as jest.Mock).mock.calls)).not.toContain('test-key');
  });
});
