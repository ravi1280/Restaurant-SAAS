import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
  color?: 'accent' | 'success' | 'warning' | 'info' | 'loyalty';
}

export function StatCard({ label, value, change, icon, color = 'accent' }: StatCardProps) {
  const colors: Record<string, string> = {
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    loyalty: 'bg-loyalty/10 text-loyalty',
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/30 transition-all duration-200 hover:shadow-lg hover:shadow-accent/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary font-mono">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${change >= 0 ? 'text-success' : 'text-danger'}`}>
              {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(change)}% vs yesterday
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
