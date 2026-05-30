'use client';

import React, { useState } from 'react';
import { MenuItem } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, generateId, getDirectImageUrl } from '@/lib/utils';
import { Edit2, Trash2, Copy, Power, Leaf, Flame, AlertTriangle, Wheat, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
}

const DIETARY_MAP = {
  vegan: { icon: Leaf, color: 'text-success bg-success/10 border-success/20', title: 'Vegan' },
  spicy: { icon: Flame, color: 'text-danger bg-danger/10 border-danger/20', title: 'Spicy' },
  nuts: { icon: AlertTriangle, color: 'text-warning bg-warning/10 border-warning/20', title: 'Contains Nuts' },
  glutenFree: { icon: Wheat, color: 'text-info bg-info/10 border-info/20', title: 'Gluten Free' },
  chefSpecial: { icon: Star, color: 'text-loyalty bg-loyalty/10 border-loyalty/20 fill-loyalty', title: "Chef's Special" },
};

export function MenuItemCard({ item, onEdit }: MenuItemCardProps) {
  const { updateMenuItem, deleteMenuItem, addMenuItem, menuCategories } = useRestaurant();
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const category = menuCategories.find(c => c.id === item.categoryId);

  const toggleAvailability = () => {
    updateMenuItem({ ...item, available: !item.available });
    showToast(
      `${item.name} marked as ${!item.available ? 'available' : 'unavailable'}`,
      !item.available ? 'success' : 'warning'
    );
  };

  const handleDuplicate = () => {
    const dup: MenuItem = {
      ...item,
      id: generateId(),
      name: `${item.name} (Copy)`,
      soldCount: 0,
      createdAt: new Date().toISOString(),
    };
    addMenuItem(dup);
    showToast(`${item.name} duplicated`, 'success');
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteMenuItem(item.id);
    showToast(`${item.name} deleted`, 'info');
  };

  return (
    <div className={`group relative bg-surface border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/30 flex flex-col justify-between h-[390px]
      ${item.available ? 'border-border' : 'border-border opacity-70 bg-elevated/40'}`}>
      
      <div>
        {/* Image / Emoji Banner */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-elevated border-b border-border select-none">
          {item.imageUrl ? (
            <img
              src={getDirectImageUrl(item.imageUrl)}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-149514740007a-18a1833f4a7c?q=80&w=300&auto=format&fit=crop';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-accent/5 to-accent/15">
              <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{item.emoji}</span>
            </div>
          )}

          {/* Floating Availability Badge */}
          <button
            onClick={toggleAvailability}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all duration-300 shadow-md border z-10
              ${item.available
                ? 'bg-success/80 border-success/30 text-white hover:bg-success'
                : 'bg-black/40 border-white/10 text-white/70 hover:bg-black/60'
              }`}
            title={item.available ? 'Mark Unavailable' : 'Mark Available'}
          >
            <Power size={14} />
          </button>

          {/* Station Badge */}
          {item.station && (
            <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-lg text-[9px] font-bold tracking-wider uppercase backdrop-blur-md bg-black/60 border border-white/10 text-white/90">
              {item.station === 'hot' ? '🔥 Hot' : item.station === 'cold' ? '❄️ Cold' : '🍹 Bar'}
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-primary text-base line-clamp-1 group-hover:text-accent transition-colors">
              {item.name}
            </p>
          </div>

          <p className="text-xs text-muted line-clamp-2 h-8 leading-normal">
            {item.description || 'No description provided.'}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 min-h-[22px]">
            {category && (
              <Badge variant="muted">{category.name}</Badge>
            )}
            <div className="flex gap-1">
              {item.dietaryFlags?.map(f => {
                const config = DIETARY_MAP[f as keyof typeof DIETARY_MAP];
                if (!config) return null;
                const IconComponent = config.icon;
                return (
                  <span
                    key={f}
                    title={config.title}
                    className={`inline-flex items-center justify-center p-1 rounded-lg border text-xs ${config.color}`}
                  >
                    <IconComponent size={12} />
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer details + Action controls */}
      <div className="mt-auto">
        {/* Price & Stats */}
        <div className="flex items-baseline justify-between border-t border-border/50 px-4 py-2.5 bg-elevated/10">
          <p className="text-lg font-black text-accent">{formatPrice(item.price)}</p>
          <p className="text-[11px] font-medium text-muted">{item.soldCount || 0} sold</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 px-3 pb-3 pt-2 bg-elevated/20 border-t border-border/50">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary hover:bg-elevated border border-transparent hover:border-border transition-all"
          >
            <Edit2 size={12} />
            Edit
          </button>
          <button
            onClick={handleDuplicate}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary hover:bg-elevated border border-transparent hover:border-border transition-all"
          >
            <Copy size={12} />
            Dup
          </button>
          <button
            onClick={handleDelete}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all border
              ${confirmDelete
                ? 'bg-danger/20 border-danger/30 text-danger animate-pulse'
                : 'text-muted border-transparent hover:text-danger hover:bg-danger/10 hover:border-danger/10'
              }`}
          >
            <Trash2 size={12} />
            {confirmDelete ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>

    </div>
  );
}
