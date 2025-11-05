'use client';

import React from 'react';

type Slice = { label: string; value: number; color: string };

export default function DonutChart({
  data,
  size = 160,
  stroke = 18,
}: {
  data: Slice[];
  size?: number;
  stroke?: number;
}) {
  const total = Math.max(data.reduce((s, d) => s + d.value, 0), 1);
  const r = (size - stroke) / 2;
  const c = Math.PI * 2 * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        {data.map((s, i) => {
          const len = (s.value / total) * c;
          const dasharray = `${len} ${c - len}`;
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={dasharray}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return circle;
        })}
      </svg>
      <div className="space-y-1 text-sm">
        {data.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded" style={{ background: s.color }} />
            <span className="text-secondary-800 dark:text-secondary-200">{s.label}</span>
            <span className="text-secondary-600 dark:text-secondary-400 ml-auto">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}








