import { useState, useEffect } from 'react';

export const useWeatherHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('weather_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  const addToHistory = (data) => {
    const updated = [{ ...data, timestamp: Date.now() }, ...history].slice(0, 100);
    setHistory(updated);
    localStorage.setItem('weather_history', JSON.stringify(updated));
  };

  const getHistory = (days = 7) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return history.filter((h) => h.timestamp > cutoff);
  };

  const getNumericValue = (entry, keys = []) => {
    for (const key of keys) {
      const value = key.split('.').reduce((acc, part) => acc?.[part], entry);
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }
    return null;
  };

  const getStats = (days = 7) => {
    const periodHistory = getHistory(days);
    if (!periodHistory.length) return null;

    const temps = periodHistory
      .map((item) => getNumericValue(item, ['temperature', 'current.temperature', 'main.temp']))
      .filter((value) => value !== null);

    const humidities = periodHistory
      .map((item) => getNumericValue(item, ['humidity', 'current.humidity', 'main.humidity']))
      .filter((value) => value !== null);

    if (!temps.length) return null;

    const avg = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

    return {
      avgTemp: Math.round(avg(temps)),
      maxTemp: Math.round(Math.max(...temps)),
      minTemp: Math.round(Math.min(...temps)),
      avgHumidity: humidities.length ? Math.round(avg(humidities)) : 0,
      entries: periodHistory.length,
    };
  };

  const getRecords = () => {
    if (!history.length) return null;

    const withValues = history.map((entry) => ({
      entry,
      temp: getNumericValue(entry, ['temperature', 'current.temperature', 'main.temp']),
      wind: getNumericValue(entry, ['windSpeed', 'current.windSpeed', 'wind.speed']),
      uv: getNumericValue(entry, ['uvIndex', 'current.uvIndex', 'uv.value']),
    }));

    const maxTempItem = withValues.filter((item) => item.temp !== null).sort((a, b) => b.temp - a.temp)[0];
    const minTempItem = withValues.filter((item) => item.temp !== null).sort((a, b) => a.temp - b.temp)[0];
    const maxWindItem = withValues.filter((item) => item.wind !== null).sort((a, b) => b.wind - a.wind)[0];
    const maxUvItem = withValues.filter((item) => item.uv !== null).sort((a, b) => b.uv - a.uv)[0];

    return {
      maxTemp: {
        value: maxTempItem?.temp ?? '—',
        date: maxTempItem?.entry?.timestamp ?? null,
      },
      minTemp: {
        value: minTempItem?.temp ?? '—',
        date: minTempItem?.entry?.timestamp ?? null,
      },
      maxWind: {
        value: maxWindItem?.wind ?? '—',
        date: maxWindItem?.entry?.timestamp ?? null,
      },
      maxUV: {
        value: maxUvItem?.uv ?? '—',
        date: maxUvItem?.entry?.timestamp ?? null,
      },
    };
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('weather_history');
  };

  return { history, addToHistory, getHistory, getStats, records: getRecords(), clearHistory };
};

export default useWeatherHistory;
