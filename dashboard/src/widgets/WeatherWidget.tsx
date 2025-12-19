import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './index';

type WeatherProps = { lat: number; lon: number; units?: 'metric' | 'imperial' };
type WeatherData = { temperature: number; windspeed: number; weathercode?: number };

const STORAGE_KEY = 'dashboard/widgets/weather';

export const WeatherWidget: React.FC<WidgetProps<WeatherProps>> = ({ props }) => {
  const [data, setData] = useState<WeatherData | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WeatherData) : null;
    } catch {
      return null;
    }
  });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const unitsParam = props.units === 'imperial' ? '&temperature_unit=fahrenheit&windspeed_unit=mph' : '';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${props.lat}&longitude=${props.lon}&current_weather=true${unitsParam}`;
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((j) => {
        const d: WeatherData = {
          temperature: j.current_weather?.temperature,
          windspeed: j.current_weather?.windspeed,
          weathercode: j.current_weather?.weathercode,
        };
        setData(d);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
      })
      .catch((e) => setErr(String(e)));
    return () => controller.abort();
  }, [props.lat, props.lon, props.units]);

  return (
    <div className="h-full flex flex-col">
      <div className="widget-title">Weather</div>
      <div className="flex-1 flex items-center">
        {data ? (
          <div>
            <div className="text-5xl font-semibold">{Math.round(data.temperature)}°</div>
            <div className="opacity-70 mt-1">Wind {Math.round(data.windspeed)} {props.units === 'imperial' ? 'mph' : 'km/h'}</div>
          </div>
        ) : (
          <div className="opacity-70">{err ? 'Offline / error' : 'Loading…'}</div>
        )}
      </div>
    </div>
  );
};

