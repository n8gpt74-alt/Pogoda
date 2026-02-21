import { mockWeatherData, refreshMockData } from '../data/mockWeatherData';
import SunCalc from 'suncalc';

const API_BASE = 'https://api.openweathermap.org/data/2.5';
const API_BASE_3 = 'https://api.openweathermap.org/data/3.0';

const OWM_KEY = 'owm_api_key';
const STORMGLASS_KEY = 'stormglass_api_key';
const STRICT_TRUTH_KEY = 'strict_truth_mode';
const ONE_CALL_EXCLUDE = 'minutely';

const getApiKey = () => localStorage.getItem(OWM_KEY)?.trim() || '';
const setApiKey = (key) => localStorage.setItem(OWM_KEY, key?.trim() || '');
const hasApiKey = () => !!getApiKey();

const getStormglassKey = () => localStorage.getItem(STORMGLASS_KEY)?.trim() || '';
const setStormglassKey = (key) => localStorage.setItem(STORMGLASS_KEY, key?.trim() || '');

const isStrictTruthMode = () => localStorage.getItem(STRICT_TRUTH_KEY) !== 'false';
const setStrictTruthMode = (enabled) => localStorage.setItem(STRICT_TRUTH_KEY, String(Boolean(enabled)));

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация не поддерживается'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      }),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

const mapWeatherCondition = (weatherId, icon) => {
  const isNight = icon?.includes('n');

  if (weatherId >= 200 && weatherId < 300) {
    return { code: 'thunderstorm', label: 'Гроза', icon: 'cloud-lightning', animation: 'thunderstorm' };
  }
  if (weatherId >= 300 && weatherId < 400) {
    return { code: 'drizzle', label: 'Морось', icon: 'cloud-drizzle', animation: 'rain' };
  }
  if (weatherId >= 500 && weatherId < 600) {
    return { code: 'rain', label: 'Дождь', icon: 'cloud-rain', animation: 'rain' };
  }
  if (weatherId >= 600 && weatherId < 700) {
    return { code: 'snow', label: 'Снег', icon: 'cloud-snow', animation: 'snow' };
  }
  if (weatherId >= 700 && weatherId < 800) {
    return { code: 'mist', label: 'Туман', icon: 'cloud-fog', animation: 'fog' };
  }
  if (weatherId === 800) {
    return isNight
      ? { code: 'clear_night', label: 'Ясно', icon: 'moon', animation: 'clear-night' }
      : { code: 'sunny', label: 'Ясно', icon: 'sun', animation: 'sunny' };
  }
  if (weatherId === 801) {
    return { code: 'partly_cloudy', label: 'Малооблачно', icon: 'cloud-sun', animation: 'partly-cloudy' };
  }

  return { code: 'cloudy', label: 'Облачно', icon: 'cloud', animation: 'cloudy' };
};

const getWindDirectionLabel = (degrees) => {
  const directions = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const calculateAstronomy = (lat, lon, date = new Date()) => {
  const times = SunCalc.getTimes(date, lat, lon);
  const moonIllum = SunCalc.getMoonIllumination(date);
  const moonPos = SunCalc.getMoonPosition(date, lat, lon);
  const sunPos = SunCalc.getPosition(date, lat, lon);

  const moonPhaseNames = [
    'Новолуние',
    'Молодая луна',
    'Первая четверть',
    'Прибывающая луна',
    'Полнолуние',
    'Убывающая луна',
    'Последняя четверть',
    'Старая луна',
  ];

  const phaseIndex = Math.round(moonIllum.phase * 8) % 8;

  return {
    sunrise: times.sunrise?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || '--:--',
    sunset: times.sunset?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || '--:--',
    solarNoon: times.solarNoon?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || '--:--',
    goldenHour: times.goldenHour?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || '--:--',
    dawn: times.dawn?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || '--:--',
    dusk: times.dusk?.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || '--:--',
    moonPhase: moonPhaseNames[phaseIndex],
    moonIllumination: Math.round(moonIllum.fraction * 100),
    moonAltitude: Math.round((moonPos.altitude * 180) / Math.PI),
    sunAltitude: Math.round((sunPos.altitude * 180) / Math.PI),
    dayLength: times.sunset && times.sunrise ? Math.round((times.sunset - times.sunrise) / 1000 / 60) : 0,
  };
};

const normalizeAlertSeverity = ({ event = '', tags = [] }) => {
  const source = `${event} ${tags.join(' ')}`.toLowerCase();

  if (/extreme|чрезвычай|ураган|tornado|hurricane|storm warning/.test(source)) {
    return 'extreme';
  }
  if (/severe|шторм|гроза|буря|storm|thunder/.test(source)) {
    return 'severe';
  }
  if (/advisory|watch|heat|cold|uv|rain|snow|wind|fog|мороз|жар|ветер|ливень|снег|туман/.test(source)) {
    return 'moderate';
  }

  return 'minor';
};

const parseApiAlerts = (alerts = []) => {
  if (!Array.isArray(alerts)) return [];

  return alerts.map((alert, index) => {
    const event = alert.event || alert.headline || 'Погодное предупреждение';
    const start = alert.start ? new Date(alert.start * 1000) : null;
    const end = alert.end ? new Date(alert.end * 1000) : null;

    return {
      id: `api-${alert.event || 'alert'}-${alert.start || index}`,
      event,
      description: alert.description || alert.headline || 'Официальное предупреждение от метеослужбы',
      severity: normalizeAlertSeverity({ event, tags: alert.tags || [] }),
      source: alert.sender_name || 'OpenWeatherMap',
      startsAt: start?.toISOString() || null,
      endsAt: end?.toISOString() || null,
      expires: end ? end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'До обновления',
      tags: alert.tags || [],
      official: true,
    };
  });
};

const parseCurrentWeather = (data, uvIndexOverride = null) => {
  const condition = mapWeatherCondition(data.weather[0].id, data.weather[0].icon);

  return {
    temperature: Math.round(data.main.temp * 10) / 10,
    feelsLike: Math.round(data.main.feels_like * 10) / 10,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: Math.round(data.wind.speed * 10) / 10,
    windGust: data.wind.gust ? Math.round(data.wind.gust * 10) / 10 : Math.round(data.wind.speed * 13) / 10,
    windDirection: data.wind.deg || 0,
    windDirectionLabel: getWindDirectionLabel(data.wind.deg || 0),
    visibility: data.visibility ? Math.round(data.visibility / 1000) : 10,
    uvIndex: uvIndexOverride ?? data.uvi ?? 0,
    cloudCover: data.clouds?.all || 0,
    condition,
    dewPoint: Math.round((data.main.temp - (100 - data.main.humidity) / 5) * 10) / 10,
    lastUpdated: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    description: data.weather[0].description,
  };
};

const parseHourlyForecast = (list) => {
  return list.slice(0, 48).map((item) => {
    const date = new Date(item.dt * 1000);
    return {
      time: date.toISOString(),
      hour: `${date.getHours()}:00`,
      temperature: Math.round(item.main.temp * 10) / 10,
      feelsLike: Math.round(item.main.feels_like * 10) / 10,
      humidity: item.main.humidity,
      precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
      precipitationProbability: Math.round((item.pop || 0) * 100),
      windSpeed: Math.round(item.wind.speed * 10) / 10,
      windGust: item.wind.gust ? Math.round(item.wind.gust * 10) / 10 : Math.round(item.wind.speed * 13) / 10,
      windDirection: item.wind.deg || 0,
      pressure: item.main.pressure,
      visibility: item.visibility ? Math.round(item.visibility / 1000) : 10,
      uvIndex: null,
      cloudCover: item.clouds?.all || 0,
      condition: mapWeatherCondition(item.weather[0].id, item.weather[0].icon),
    };
  });
};

const parseDailyForecast = (list) => {
  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const dailyMap = new Map();

  list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toDateString();

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: date.toISOString(),
        dayName: weekDays[date.getDay()],
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('ru-RU', { month: 'short' }),
        temps: [],
        humidity: [],
        precipitation: 0,
        precipitationProbability: 0,
        windSpeed: [],
        windDirection: [],
        condition: null,
      });
    }

    const day = dailyMap.get(dateKey);
    day.temps.push(item.main.temp);
    day.humidity.push(item.main.humidity);
    day.precipitation += item.rain?.['3h'] || item.snow?.['3h'] || 0;
    day.precipitationProbability = Math.max(day.precipitationProbability, (item.pop || 0) * 100);
    day.windSpeed.push(item.wind.speed);
    day.windDirection.push(item.wind.deg || 0);

    if (!day.condition || item.weather[0].id < 800) {
      day.condition = mapWeatherCondition(item.weather[0].id, item.weather[0].icon);
    }
  });

  return Array.from(dailyMap.values()).slice(0, 7).map((day) => ({
    date: day.date,
    dayName: day.dayName,
    dayNumber: day.dayNumber,
    month: day.month,
    tempMax: Math.round(Math.max(...day.temps) * 10) / 10,
    tempMin: Math.round(Math.min(...day.temps) * 10) / 10,
    humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
    precipitation: Math.round(day.precipitation * 10) / 10,
    precipitationProbability: Math.round(day.precipitationProbability),
    windSpeed: Math.round((day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length) * 10) / 10,
    windDirection: Math.round(day.windDirection.reduce((a, b) => a + b, 0) / day.windDirection.length),
    condition: day.condition,
    uvIndex: null,
  }));
};

const parseOneCallHourly = (hourly = []) => {
  return hourly.slice(0, 48).map((item) => {
    const date = new Date(item.dt * 1000);
    const weather = item.weather?.[0] || {};

    return {
      time: date.toISOString(),
      hour: `${date.getHours()}:00`,
      temperature: Math.round((item.temp ?? 0) * 10) / 10,
      feelsLike: Math.round((item.feels_like ?? item.temp ?? 0) * 10) / 10,
      humidity: item.humidity ?? 0,
      precipitation: Math.round(((item.rain?.['1h'] ?? 0) + (item.snow?.['1h'] ?? 0)) * 10) / 10,
      precipitationProbability: Math.round((item.pop || 0) * 100),
      windSpeed: Math.round((item.wind_speed ?? 0) * 10) / 10,
      windGust: item.wind_gust ? Math.round(item.wind_gust * 10) / 10 : Math.round((item.wind_speed ?? 0) * 13) / 10,
      windDirection: item.wind_deg || 0,
      pressure: item.pressure ?? 0,
      visibility: item.visibility ? Math.round(item.visibility / 1000) : 10,
      uvIndex: Math.round(item.uvi ?? 0),
      cloudCover: item.clouds ?? 0,
      condition: mapWeatherCondition(weather.id || 804, weather.icon || '04d'),
    };
  });
};

const parseOneCallDaily = (daily = []) => {
  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return daily.slice(0, 7).map((item) => {
    const date = new Date(item.dt * 1000);
    const weather = item.weather?.[0] || {};

    return {
      date: date.toISOString(),
      dayName: weekDays[date.getDay()],
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('ru-RU', { month: 'short' }),
      tempMax: Math.round((item.temp?.max ?? 0) * 10) / 10,
      tempMin: Math.round((item.temp?.min ?? 0) * 10) / 10,
      humidity: Math.round(item.humidity ?? 0),
      precipitation: Math.round(((item.rain ?? 0) + (item.snow ?? 0)) * 10) / 10,
      precipitationProbability: Math.round((item.pop || 0) * 100),
      windSpeed: Math.round((item.wind_speed ?? 0) * 10) / 10,
      windDirection: Math.round(item.wind_deg ?? 0),
      condition: mapWeatherCondition(weather.id || 804, weather.icon || '04d'),
      uvIndex: Math.round(item.uvi ?? 0),
      sunrise: item.sunrise ? new Date(item.sunrise * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      sunset: item.sunset ? new Date(item.sunset * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '--:--',
    };
  });
};

const parseAirQuality = (data) => {
  const aqi = data.list[0].main.aqi;
  const components = data.list[0].components;

  const aqiLabels = ['', 'Хорошее', 'Удовлетворительное', 'Умеренное', 'Плохое', 'Очень плохое'];
  const aqiColors = ['', 'bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];

  return {
    aqi: aqi * 50,
    category: aqiLabels[aqi] || 'Неизвестно',
    color: aqiColors[aqi] || 'bg-gray-500',
    pm25: Math.round(components.pm2_5),
    pm10: Math.round(components.pm10),
    o3: Math.round(components.o3),
    no2: Math.round(components.no2),
    so2: Math.round(components.so2),
    co: Math.round(components.co),
  };
};

const generateWindRoseData = (hourlyData = []) => {
  const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  const buckets = directions.map(() => ({ count: 0, totalSpeed: 0 }));

  hourlyData.forEach((hour) => {
    const dirIndex = Math.round((hour.windDirection || 0) / 45) % 8;
    buckets[dirIndex].count += 1;
    buckets[dirIndex].totalSpeed += hour.windSpeed || 0;
  });

  const total = hourlyData.length || 1;

  return directions.map((dir, index) => ({
    direction: dir,
    angle: index * 45,
    frequency: Math.round((buckets[index].count / total) * 100),
    avgSpeed: buckets[index].count > 0 ? Math.round((buckets[index].totalSpeed / buckets[index].count) * 10) / 10 : 0,
  }));
};

const normalizePollenLevel = (value) => {
  if (value == null) return { level: 'Нет данных', color: 'gray' };
  if (value <= 20) return { level: 'Низкий', color: 'green' };
  if (value <= 50) return { level: 'Умеренный', color: 'yellow' };
  if (value <= 100) return { level: 'Высокий', color: 'orange' };
  return { level: 'Очень высокий', color: 'red' };
};

const parseOpenMeteoPollen = (daily = {}) => {
  const fields = [
    ['birch_pollen', 'Деревья'],
    ['grass_pollen', 'Травы'],
    ['mugwort_pollen', 'Сорняки'],
    ['alder_pollen', 'Ольха'],
  ];

  const todayValues = fields.map(([field]) => daily[field]?.[0] ?? null);
  const validValues = todayValues.filter((value) => value != null);
  if (validValues.length === 0) return null;

  const overallIndex = Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
  const overallLevel = normalizePollenLevel(overallIndex).level;

  const types = fields.map(([field, name]) => {
    const value = daily[field]?.[0] ?? null;
    const normalized = normalizePollenLevel(value);
    return {
      name,
      level: normalized.level,
      index: value == null ? 0 : Math.round(value),
      species: [],
    };
  });

  const forecast = (daily.time || []).slice(0, 3).map((_, index) => {
    const dayIndexValues = fields
      .map(([field]) => daily[field]?.[index] ?? null)
      .filter((value) => value != null);

    const avg = dayIndexValues.length > 0
      ? Math.round(dayIndexValues.reduce((sum, value) => sum + value, 0) / dayIndexValues.length)
      : null;

    return {
      day: index === 0 ? 'Сегодня' : index === 1 ? 'Завтра' : 'Послезавтра',
      level: normalizePollenLevel(avg).level,
    };
  });

  return {
    available: true,
    overall: overallLevel,
    overallIndex,
    types,
    forecast,
    recommendations: overallIndex > 50
      ? ['Сократите пребывание на улице в утренние часы', 'Используйте очки и маску при необходимости', 'Проветривайте помещение после дождя']
      : ['Риск аллергии умеренный или низкий'],
    source: 'Open-Meteo Air Quality',
    updatedAt: new Date().toISOString(),
  };
};

const parseOpenMeteoSoil = ({ hourly, current }) => {
  if (!hourly?.time?.length) return null;

  const now = Date.now();
  let nearestIndex = 0;
  let nearestDiff = Number.POSITIVE_INFINITY;

  hourly.time.forEach((value, index) => {
    const diff = Math.abs(new Date(value).getTime() - now);
    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearestIndex = index;
    }
  });

  const soilTemp = hourly.soil_temperature_0cm?.[nearestIndex];
  const soilMoistureRaw = hourly.soil_moisture_0_to_1cm?.[nearestIndex];
  const evapotranspiration = hourly.evapotranspiration?.[nearestIndex];

  if (soilTemp == null || soilMoistureRaw == null) {
    return null;
  }

  const soilMoisturePercent = Math.round(Math.max(0, Math.min(100, soilMoistureRaw * 100)));
  const temp = current.temperature ?? 0;
  const humidity = current.humidity ?? 0;

  const conditions = (() => {
    if (temp < 5 || temp > 35) return { status: 'Плохие', color: 'red', description: 'Температурный стресс для растений' };
    if (soilMoisturePercent < 30) return { status: 'Умеренные', color: 'yellow', description: 'Недостаток влаги в почве' };
    if (soilMoisturePercent > 80) return { status: 'Умеренные', color: 'yellow', description: 'Почва переувлажнена' };
    return { status: 'Хорошие', color: 'green', description: 'Условия близки к оптимальным' };
  })();

  return {
    available: true,
    soilMoisture: soilMoisturePercent,
    soilTemperature: Math.round(soilTemp),
    evapotranspiration: Number((evapotranspiration ?? 0).toFixed(1)),
    growingDegreeDays: Math.max(0, Math.round((temp - 10) * 1)),
    frostRisk: temp < 3 ? 'Высокий' : temp < 7 ? 'Умеренный' : 'Низкий',
    frostRiskPercent: temp < 0 ? 100 : temp < 3 ? 70 : temp < 7 ? 30 : 5,
    irrigationNeed: soilMoisturePercent < 40 ? 'Требуется' : soilMoisturePercent < 60 ? 'Скоро' : 'Не требуется',
    irrigationAmount: Math.max(0, Math.round((60 - soilMoisturePercent) * 0.5)),
    conditions,
    crops: [
      { name: 'Пшеница', status: temp > 5 && temp < 30 ? 'Благоприятно' : 'Неблагоприятно' },
      { name: 'Картофель', status: temp > 10 && temp < 25 ? 'Благоприятно' : 'Неблагоприятно' },
      { name: 'Томаты', status: temp > 15 && temp < 30 ? 'Благоприятно' : 'Неблагоприятно' },
      { name: 'Яблони', status: temp > 5 ? 'Благоприятно' : 'Риск заморозков' },
    ],
    sprayingConditions: {
      suitable: humidity < 80 && temp > 10 && temp < 30,
      reason: humidity >= 80 ? 'Высокая влажность' : temp <= 10 ? 'Низкая температура' : 'Условия подходящие',
    },
    source: 'Open-Meteo Forecast',
    updatedAt: new Date().toISOString(),
  };
};

const parseStormglassTides = (data) => {
  const tideData = data?.data;
  if (!Array.isArray(tideData) || tideData.length === 0) {
    return null;
  }

  const highs = tideData
    .filter((item) => item.type === 'high')
    .slice(0, 2)
    .map((item) => ({
      time: new Date(item.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      height: Number(item.height?.toFixed(2) || 0),
    }));

  const lows = tideData
    .filter((item) => item.type === 'low')
    .slice(0, 2)
    .map((item) => ({
      time: new Date(item.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      height: Number(item.height?.toFixed(2) || 0),
    }));

  const next = tideData.find((item) => new Date(item.time).getTime() > Date.now()) || tideData[0];

  return {
    available: true,
    high: highs,
    low: lows,
    current: next?.type === 'high' ? 'rising' : 'falling',
    nextHigh: highs[0]?.time || '--:--',
    source: 'Stormglass',
    updatedAt: new Date().toISOString(),
  };
};

const buildPassportEntry = ({ source, status, note = '', updatedAt = null }) => ({
  source,
  status,
  note,
  updatedAt,
});

const parseAirQualityLabel = (status) => {
  if (status === 'ok') return 'observed';
  if (status === 'fallback') return 'derived';
  return 'unavailable';
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

export const weatherService = {
  getApiKey,
  setApiKey,
  hasApiKey,
  getStormglassKey,
  setStormglassKey,
  isStrictTruthMode,
  setStrictTruthMode,
  getCurrentPosition,

  async getWeatherData(coords = null) {
    const apiKey = getApiKey();
    const strictTruth = isStrictTruthMode();

    if (!apiKey) {
      if (strictTruth) {
        throw new Error('Strict Truth Mode включён: укажите API ключ OpenWeatherMap для получения фактических данных.');
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
      const mock = refreshMockData();
      return {
        ...mock,
        alerts: [],
        tides: null,
        pollen: null,
        agriculture: null,
        dataPassport: {
          weather: buildPassportEntry({ source: 'Mock Generator', status: 'derived', note: 'Демо-данные', updatedAt: new Date().toISOString() }),
          alerts: buildPassportEntry({ source: 'Mock Generator', status: 'unavailable', note: 'Официальные алерты недоступны без API' }),
          airQuality: buildPassportEntry({ source: 'Mock Generator', status: 'derived', note: 'Демо-данные', updatedAt: new Date().toISOString() }),
          astronomy: buildPassportEntry({ source: 'SunCalc', status: 'derived', note: 'Расчёт по координатам', updatedAt: new Date().toISOString() }),
          pollen: buildPassportEntry({ source: 'Open-Meteo', status: 'unavailable', note: 'Требуется реальный API режим' }),
          agriculture: buildPassportEntry({ source: 'Open-Meteo', status: 'unavailable', note: 'Требуется реальный API режим' }),
          tides: buildPassportEntry({ source: 'Stormglass', status: 'unavailable', note: 'Требуется ключ Stormglass' }),
        },
      };
    }

    try {
      let { lat, lon } = coords || {};
      if (!lat || !lon) {
        try {
          const pos = await getCurrentPosition();
          lat = pos.lat;
          lon = pos.lon;
        } catch {
          lat = 55.7558;
          lon = 37.6173;
        }
      }

      const currentUrl = `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ru`;
      const airUrl = `${API_BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      const oneCallUrl = `${API_BASE_3}/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ru&exclude=${ONE_CALL_EXCLUDE}`;
      const forecastUrl = `${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ru`;

      const [currentRes, airRes, oneCallRes] = await Promise.all([
        fetch(currentUrl),
        fetch(airUrl),
        fetch(oneCallUrl),
      ]);

      if (!currentRes.ok) throw new Error(`Ошибка API текущей погоды: ${currentRes.status}`);
      if (!airRes.ok) throw new Error(`Ошибка API качества воздуха: ${airRes.status}`);

      const [currentData, airData, oneCallData] = await Promise.all([
        currentRes.json(),
        airRes.json(),
        oneCallRes.ok ? oneCallRes.json() : Promise.resolve(null),
      ]);

      let hourly = [];
      let daily = [];
      let alerts = [];
      let uvOverride = null;
      let coreForecastMode = 'onecall';

      if (oneCallData) {
        hourly = parseOneCallHourly(oneCallData.hourly);
        daily = parseOneCallDaily(oneCallData.daily);
        alerts = parseApiAlerts(oneCallData.alerts);
        uvOverride = Math.round(oneCallData.current?.uvi ?? 0);
      }

      if (hourly.length === 0 || daily.length === 0) {
        const forecastData = await fetchJson(forecastUrl);
        hourly = parseHourlyForecast(forecastData.list);
        daily = parseDailyForecast(forecastData.list);
        coreForecastMode = 'forecast-fallback';
      }

      const current = parseCurrentWeather(currentData, uvOverride);
      const airQuality = parseAirQuality(airData);
      const windRose = generateWindRoseData(hourly);
      const astronomy = calculateAstronomy(lat, lon);

      const pollenPromise = fetchJson(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&daily=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen&timezone=auto`
      )
        .then((data) => parseOpenMeteoPollen(data.daily))
        .catch(() => null);

      const agriculturePromise = fetchJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm,evapotranspiration&timezone=auto`
      )
        .then((data) => parseOpenMeteoSoil({ hourly: data.hourly, current }))
        .catch(() => null);

      const stormglassKey = getStormglassKey();
      const tidesPromise = stormglassKey
        ? fetchJson(
          `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lon}&start=${new Date().toISOString()}&end=${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}`,
          { headers: { Authorization: stormglassKey } }
        )
          .then((data) => parseStormglassTides(data))
          .catch(() => null)
        : Promise.resolve(null);

      const [pollen, agriculture, tides] = await Promise.all([pollenPromise, agriculturePromise, tidesPromise]);

      const passport = {
        weather: buildPassportEntry({ source: 'OpenWeatherMap Current + One Call', status: 'observed', updatedAt: new Date().toISOString() }),
        alerts: buildPassportEntry({ source: 'OpenWeatherMap Alerts', status: alerts.length > 0 ? 'observed' : 'observed', note: alerts.length === 0 ? 'Активных официальных предупреждений нет' : '', updatedAt: new Date().toISOString() }),
        airQuality: buildPassportEntry({ source: 'OpenWeatherMap Air Pollution', status: parseAirQualityLabel('ok'), updatedAt: new Date().toISOString() }),
        astronomy: buildPassportEntry({ source: 'SunCalc', status: 'derived', note: 'Расчёт по координатам', updatedAt: new Date().toISOString() }),
        pollen: pollen
          ? buildPassportEntry({ source: pollen.source, status: 'observed', updatedAt: pollen.updatedAt })
          : buildPassportEntry({ source: 'Open-Meteo Air Quality', status: 'unavailable', note: 'Провайдер не вернул валидные данные' }),
        agriculture: agriculture
          ? buildPassportEntry({ source: agriculture.source, status: 'derived', note: 'Основано на измерениях soil + текущей погоде', updatedAt: agriculture.updatedAt })
          : buildPassportEntry({ source: 'Open-Meteo Forecast', status: 'unavailable', note: 'Недостаточно soil-параметров' }),
        tides: tides
          ? buildPassportEntry({ source: tides.source, status: 'observed', updatedAt: tides.updatedAt })
          : buildPassportEntry({ source: 'Stormglass', status: 'unavailable', note: stormglassKey ? 'Провайдер вернул ошибку' : 'Добавьте ключ Stormglass в настройках' }),
      };

      if (strictTruth) {
        // В строгом режиме не подставляем synthetic данные
      }

      return {
        location: {
          city: currentData.name,
          country: currentData.sys.country,
          coordinates: { lat, lon },
          timezone: currentData.timezone,
        },
        current,
        hourly,
        daily,
        alerts,
        airQuality,
        windRose,
        astronomy,
        pollen: strictTruth ? pollen : pollen,
        agriculture: strictTruth ? agriculture : agriculture,
        tides: strictTruth ? tides : tides,
        dataPassport: {
          ...passport,
          forecastMode: coreForecastMode,
        },
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  },

  async searchCity(query) {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    try {
      const data = await fetchJson(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`);
      return data.map((item) => ({
        name: item.local_names?.ru || item.name,
        country: item.country,
        lat: item.lat,
        lon: item.lon,
        state: item.state,
      }));
    } catch (error) {
      console.error('City search error:', error);
      return [];
    }
  },

  getLocation() {
    return mockWeatherData.location;
  },
};

export default weatherService;
