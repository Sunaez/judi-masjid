import { normalizeWeatherData } from '../weather';

describe('normalizeWeatherData', () => {
  it('accepts a valid OpenWeather-shaped cache document', () => {
    expect(
      normalizeWeatherData({
        temp: 12.4,
        condition: 'Clouds',
        iconCode: '04d',
        forecastTemp: 13.2,
        forecastCondition: 'Rain',
        timestamp: 123456,
      })
    ).toEqual({
      temp: 12,
      condition: 'Clouds',
      iconCode: '04d',
      forecastTemp: 13,
      forecastCondition: 'Rain',
      timestamp: 123456,
    });
  });

  it('rejects malformed or unreasonable cache documents', () => {
    expect(
      normalizeWeatherData({
        temp: 999,
        condition: 'Clouds',
        iconCode: '04d',
        forecastTemp: 13,
        forecastCondition: 'Rain',
        timestamp: 123456,
      })
    ).toBeNull();

    expect(
      normalizeWeatherData({
        temp: 12,
        condition: 'Clouds',
        iconCode: '../bad',
        forecastTemp: 13,
        forecastCondition: 'Rain',
        timestamp: 123456,
      })
    ).toBeNull();
  });
});
