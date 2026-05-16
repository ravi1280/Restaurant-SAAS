'use client';

import React, { useState } from 'react';
import { formatPrice } from '@/lib/utils';

interface SalesChartProps {
  orders: Array<{ createdAt: string; total: number }>;
}

export function SalesChart({ orders }: SalesChartProps) {
  const [mode, setMode] = useState<'today' | 'week'>('today');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Hourly data for today
  const hours = Array.from({ length: 17 }, (_, i) => i + 7); // 7am to 11pm
  const hourlyData = hours.map(hour => {
    const total = orders
      .filter(o => {
        const d = new Date(o.createdAt);
        return d.toISOString().split('T')[0] === todayStr && d.getHours() === hour;
      })
      .reduce((sum, o) => sum + o.total, 0);
    return { label: hour <= 12 ? `${hour}am` : `${hour - 12}pm`, value: total };
  });

  // Daily data for this week
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const total = orders
      .filter(o => o.createdAt.startsWith(dateStr))
      .reduce((sum, o) => sum + o.total, 0);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      value: total,
    };
  });

  const data = mode === 'today' ? hourlyData : weekData;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-primary">Sales Overview</h3>
        <div className="flex gap-1 bg-elevated rounded-xl p-1">
          {(['today', 'week'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
                ${mode === m ? 'bg-accent text-white' : 'text-muted hover:text-primary'}`}
            >
              {m === 'today' ? 'Today' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-1.5 h-44 overflow-x-auto pb-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group">
            <div className="relative w-full flex flex-col justify-end" style={{ height: '140px' }}>
              {d.value > 0 && (
                <div
                  className="absolute bottom-0 w-full bg-accent/30 hover:bg-accent/60 rounded-t-md transition-all duration-300 cursor-pointer border-t-2 border-accent/60"
                  style={{ height: `${Math.max((d.value / maxVal) * 140, 4)}px` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-elevated border border-border rounded-lg text-xs text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {formatPrice(d.value)}
                  </div>
                </div>
              )}
              {d.value === 0 && (
                <div className="absolute bottom-0 w-full h-1 bg-elevated rounded-t-sm" />
              )}
            </div>
            <span className="text-[10px] text-muted whitespace-nowrap">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
