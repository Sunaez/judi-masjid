export interface WeatherData {
  temp: number;
  condition: string;
  iconCode: string;
  forecastTemp: number;
  forecastCondition: string;
  timestamp: number;
}

const MAX_WEATHER_TEXT_LENGTH = 40;
const MIN_REASONABLE_TEMPERATURE = -50;
const MAX_REASONABLE_TEMPERATURE = 60;
const OPENWEATHER_ICON_CODE_PATTERN = /^\d{2}[dn]$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isReasonableWeatherText(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= MAX_WEATHER_TEXT_LENGTH
  );
}

function isReasonableTemperature(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_REASONABLE_TEMPERATURE &&
    value <= MAX_REASONABLE_TEMPERATURE
  );
}

export function normalizeWeatherData(value: unknown): WeatherData | null {
  if (!isPlainObject(value)) return null;

  if (
    !isReasonableTemperature(value.temp) ||
    !isReasonableTemperature(value.forecastTemp) ||
    !isReasonableWeatherText(value.condition) ||
    !isReasonableWeatherText(value.forecastCondition) ||
    typeof value.iconCode !== 'string' ||
    !OPENWEATHER_ICON_CODE_PATTERN.test(value.iconCode) ||
    typeof value.timestamp !== 'number' ||
    !Number.isFinite(value.timestamp) ||
    value.timestamp <= 0
  ) {
    return null;
  }

  return {
    temp: Math.round(value.temp),
    condition: value.condition.trim(),
    iconCode: value.iconCode,
    forecastTemp: Math.round(value.forecastTemp),
    forecastCondition: value.forecastCondition.trim(),
    timestamp: value.timestamp,
  };
}
