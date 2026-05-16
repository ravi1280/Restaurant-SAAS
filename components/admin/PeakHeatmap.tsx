import React from 'react';
import { getDayName } from '@/lib/utils';

interface PeakHeatmapProps {
  orders: Array<{ createdAt: string }>;
}

export function PeakHeatmap({ orders }: PeakHeatmapProps) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const days = Array.from({ length: 7 }, (_, i) => i);

  // Count orders per day-hour
  const heatmap: number[][] = days.map(() => hours.map(() => 0));
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0
    const hour = d.getHours();
    if (hour >= 7 && hour <= 22) {
      heatmap[dayOfWeek][hour - 7]++;
    }
  });

  const maxCount = Math.max(...heatmap.flat(), 1);

  const getOpacity = (count: number) => {
    if (count === 0) return 0.05;
    return 0.15 + (count / maxCount) * 0.85;
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-primary mb-4">Peak Hours Heatmap</h3>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Hour labels */}
          <div className="flex pl-10 mb-1">
            {hours.map(h => (
              <div key={h} className="flex-1 text-[9px] text-muted text-center">
                {h <= 12 ? `${h}am` : `${h - 12}pm`}
              </div>
            ))}
          </div>

          {/* Grid */}
          {days.map(day => (
            <div key={day} className="flex items-center gap-0.5 mb-0.5">
              <div className="w-9 text-[10px] text-muted text-right pr-2 shrink-0">
                {getDayName(day)}
              </div>
              {hours.map((h, hi) => {
                const count = heatmap[day][hi];
                return (
                  <div
                    key={h}
                    className="flex-1 h-6 rounded-sm cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: `rgba(232, 120, 74, ${getOpacity(count)})`,
                    }}
                    title={`${getDayName(day)} ${h <= 12 ? h + 'am' : (h - 12) + 'pm'}: ${count} orders`}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-muted">Less</span>
            {[0.05, 0.25, 0.5, 0.75, 1].map((op, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: `rgba(232, 120, 74, ${op})` }}
              />
            ))}
            <span className="text-[10px] text-muted">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
