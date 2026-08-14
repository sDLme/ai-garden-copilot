import { Garden, WeatherContext } from "../../shared/src";

const openMeteoForecastUrl = "https://api.open-meteo.com/v1/forecast";

const knownGardenCoordinates: Record<string, { latitude: number; longitude: number }> = {
  "Stockholm, Sweden": {
    latitude: 59.3293,
    longitude: 18.0686
  }
};

interface OpenMeteoForecastResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    wind_gusts_10m?: number;
  };
  daily?: {
    precipitation_probability_max?: number[];
  };
}

export class WeatherService {
  async getGardenWeather(garden: Garden): Promise<WeatherContext> {
    const coordinates = knownGardenCoordinates[garden.location];

    if (!coordinates) {
      return createFallbackWeather(garden.location, "No configured coordinates for this garden yet.");
    }

    const url = new URL(openMeteoForecastUrl);
    url.searchParams.set("latitude", String(coordinates.latitude));
    url.searchParams.set("longitude", String(coordinates.longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,wind_gusts_10m");
    url.searchParams.set("daily", "precipitation_probability_max");
    url.searchParams.set("forecast_days", "3");
    url.searchParams.set("timezone", "auto");

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return createFallbackWeather(garden.location, `Open-Meteo returned ${response.status}.`);
      }

      const payload = (await response.json()) as OpenMeteoForecastResponse;
      const current = payload.current;

      if (!current) {
        return createFallbackWeather(garden.location, "Open-Meteo did not return current conditions.");
      }

      const weather: WeatherContext = {
        location: garden.location,
        observedAt: current.time ?? new Date().toISOString(),
        temperatureC: current.temperature_2m ?? null,
        relativeHumidity: current.relative_humidity_2m ?? null,
        precipitationMm: current.precipitation ?? null,
        windGustKmh: current.wind_gusts_10m ?? null,
        precipitationProbabilityMax: payload.daily?.precipitation_probability_max?.[0] ?? null,
        source: "open-meteo",
        summary: summarizeWeather(current, payload.daily?.precipitation_probability_max?.[0] ?? null)
      };

      return weather;
    } catch (error) {
      return createFallbackWeather(
        garden.location,
        error instanceof Error ? error.message : "Weather request failed unexpectedly."
      );
    }
  }
}

function summarizeWeather(current: NonNullable<OpenMeteoForecastResponse["current"]>, precipitationProbability: number | null): string {
  const parts = [
    typeof current.temperature_2m === "number" ? `${current.temperature_2m}C` : undefined,
    typeof current.relative_humidity_2m === "number" ? `${current.relative_humidity_2m}% humidity` : undefined,
    typeof current.precipitation === "number" ? `${current.precipitation} mm current precipitation` : undefined,
    typeof current.wind_gusts_10m === "number" ? `${current.wind_gusts_10m} km/h wind gusts` : undefined,
    typeof precipitationProbability === "number" ? `${precipitationProbability}% max precipitation probability today` : undefined
  ].filter((part): part is string => Boolean(part));

  return parts.length ? parts.join(", ") : "Weather data is available, but no plant-relevant variables were returned.";
}

function createFallbackWeather(location: string, reason: string): WeatherContext {
  return {
    location,
    observedAt: new Date().toISOString(),
    temperatureC: null,
    relativeHumidity: null,
    precipitationMm: null,
    windGustKmh: null,
    precipitationProbabilityMax: null,
    source: "local-fallback",
    summary: `Weather unavailable: ${reason}`
  };
}
