'use client';

import React from 'react';

type Point = { date: string; count: number };

export default function MiniLineChart({
  data,
  height = 100,
}: {
  data: Point[];
  height?: number;
}) {
  const width = 300;
  const padding = 12;
  const points = data && data.length ? data : [{ date: 'N/A', count: 0 }];
  const maxY = Math.max(...points.map((p) => p.count), 1);
  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

  const d = points
    .map((p, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (p.count / maxY) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const area = `${d} L ${padding + stepX * (points.length - 1)} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={area} fill="currentColor" className="text-primary-500/10" />
      <path d={d} stroke="currentColor" className="text-primary-500" strokeWidth="2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}



