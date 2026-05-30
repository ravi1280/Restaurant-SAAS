import React from 'react';
import { MenuItem } from '@/lib/types';
import { formatPrice, getDirectImageUrl } from '@/lib/utils';

interface TopItemsListProps {
  items: MenuItem[];
  orders: Array<{ items: Array<{ menuItemId: string; quantity: number; price: number }> }>;
}

export function TopItemsList({ items, orders }: TopItemsListProps) {
  const salesMap: Record<string, { units: number; revenue: number }> = {};

  orders.forEach(order => {
    order.items.forEach(ci => {
      if (!salesMap[ci.menuItemId]) salesMap[ci.menuItemId] = { units: 0, revenue: 0 };
      salesMap[ci.menuItemId].units += ci.quantity;
      salesMap[ci.menuItemId].revenue += ci.price * ci.quantity;
    });
  });

  const ranked = items
    .map(item => ({
      item,
      units: salesMap[item.id]?.units || item.soldCount || 0,
      revenue: salesMap[item.id]?.revenue || 0,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const maxUnits = Math.max(...ranked.map(r => r.units), 1);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-primary mb-4">Top Selling Items</h3>
      <div className="space-y-3">
        {ranked.map((entry, idx) => (
          <div key={entry.item.id} className="flex items-center gap-3">
            <span className="text-xs font-bold text-hint w-4 text-center">{idx + 1}</span>
            {entry.item.imageUrl ? (
              <img
                src={getDirectImageUrl(entry.item.imageUrl)}
                alt={entry.item.name}
                className="w-6 h-6 object-cover rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-149514740007a-18a1833f4a7c?q=80&w=120&auto=format&fit=crop';
                }}
              />
            ) : (
              <span className="text-xl">{entry.item.emoji}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-primary truncate">{entry.item.name}</p>
                <p className="text-xs text-muted ml-2 shrink-0">{entry.units} sold</p>
              </div>
              <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent/60 rounded-full transition-all duration-500"
                  style={{ width: `${(entry.units / maxUnits) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
