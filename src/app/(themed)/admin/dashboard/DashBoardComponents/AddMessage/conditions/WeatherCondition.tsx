// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/conditions/WeatherCondition.tsx
import React from 'react';

export default function WeatherCondition({
  idx,
  entries,
  newWeather,
  onWeatherChange,
  addWeather,
  removeWeather
}: {
  idx: number;
  entries: string[];
  newWeather: string;
  onWeatherChange: (v:string)=>void;
  addWeather: ()=>void;
  removeWeather: (i:number)=>void;
}) {
  const exhausted = entries.length >= ['Clear','Cloudy','Rain','Snow','Sleet','Drizzle','Fog','Thunder','Ice'].length;
  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        {entries.map((w,i)=>(
          <span key={i} className="px-2 py-1 rounded flex items-center bg-[var(--background-end)]">
            {w}
            <button onClick={()=>removeWeather(i)}
              className="text-red-500 text-2xl ml-2 p-2">×</button>
          </span>
        ))}
      </div>
      {exhausted ? (
        <p className="italic text-[var(--text-color)]">No more weather conditions available</p>
      ) : (
        <div className="flex gap-2">
          <select value={newWeather} onChange={e=>onWeatherChange(e.target.value)}
            className="flex-1 p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]">
            {['Clear','Cloudy','Rain','Snow','Sleet','Drizzle','Fog','Thunder','Ice']
              .filter(w=>!entries.includes(w))
              .map(w=> <option key={w} value={w}>{w}</option>)}
          </select>
          <button onClick={addWeather}
            className="px-4 py-2 rounded bg-[var(--accent-color)] text-[var(--x-text-color)]">
            Add
          </button>
        </div>
      )}
    </div>
  );
}
