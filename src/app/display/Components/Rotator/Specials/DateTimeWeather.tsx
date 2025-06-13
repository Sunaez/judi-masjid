// DateTimeWeather.tsx
'use client';
import React, { useEffect, useState } from 'react';

interface DateTimeWeatherProps {
  temperature: number;
  condition: string;
}

export default function DateTimeWeather({ temperature, condition }: DateTimeWeatherProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="text-center">
      <p className="text-lg">{now.toLocaleString()}</p>
      <p className="mt-2 text-xl">Temperature: {temperature}°C</p>
      <p className="text-xl">Condition: {condition}</p>
    </div>
  );
}