import React from 'react';
import { Star } from 'lucide-react';

interface LoyaltyBadgeProps {
  points: number;
}

export function LoyaltyBadge({ points }: LoyaltyBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-loyalty/10 border border-loyalty/20 rounded-full">
      <Star size={12} className="text-loyalty fill-loyalty" />
      <span className="text-xs font-semibold text-loyalty">
        {points.toLocaleString()} pts
      </span>
    </div>
  );
}
