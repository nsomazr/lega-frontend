'use client';

import React from 'react';

type Point = { label: string; value: number };

export default function BarChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="grid grid-cols-12 items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center justify-end">
          <div
            className="w-full bg-primary-500/80 rounded"
            style={{ height: `${(d.value / max) * 100}%` }}
            title={`${d.label}: ${d.value}`}
          />
          <div className="text-[10px] mt-1 text-secondary-600 dark:text-secondary-400 truncate w-full text-center">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}








