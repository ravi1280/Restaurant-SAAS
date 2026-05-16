'use client';

import React, { useState } from 'react';
import { MenuItem } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';
import { Edit2, Trash2, Copy, Power } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { generateId } from '@/lib/utils';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
}

const DIETARY_ICONS: Record<string, string> = {
  vegan: '🌱',
  spicy: '🌶',
  nuts: '🥜',
  glutenFree: '🌾',
  chefSpecial: '⭐',
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
    <div className={`bg-surface border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-accent/5
      ${item.available ? 'border-border' : 'border-border opacity-60'}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="text-4xl">{item.emoji}</div>
          <button
            onClick={toggleAvailability}
            className={`p-1.5 rounded-lg transition-all ${item.available
              ? 'text-success bg-success/10 hover:bg-success/20'
              : 'text-muted bg-elevated hover:bg-elevated'
            }`}
            title={item.available ? 'Mark unavailable' : 'Mark available'}
          >
            <Power size={14} />
          </button>
        </div>

        <p className="font-semibold text-primary text-sm mt-2">{item.name}</p>

        <div className="flex flex-wrap gap-1 mt-1">
          {category && (
            <Badge variant="muted">{category.name}</Badge>
          )}
          {item.dietaryFlags.map(f => (
            <span key={f} title={f} className="text-sm">{DIETARY_ICONS[f]}</span>
          ))}
        </div>

        <p className="text-lg font-bold text-accent mt-2">{formatPrice(item.price)}</p>
        <p className="text-xs text-muted mt-0.5">{item.soldCount} sold</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 pb-3 border-t border-border pt-2 mt-1">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-primary hover:bg-elevated transition-all"
        >
          <Edit2 size={12} />
          Edit
        </button>
        <button
          onClick={handleDuplicate}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium text-muted hover:text-primary hover:bg-elevated transition-all"
        >
          <Copy size={12} />
          Duplicate
        </button>
        <button
          onClick={handleDelete}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all
            ${confirmDelete ? 'bg-danger/10 text-danger' : 'text-muted hover:text-danger hover:bg-danger/10'}`}
        >
          <Trash2 size={12} />
          {confirmDelete ? 'Confirm?' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
