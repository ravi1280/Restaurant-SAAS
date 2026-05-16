'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { MenuItemForm } from '@/components/menu/MenuItemForm';
import { MenuItem } from '@/lib/types';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

export default function MenuPage() {
  const { menuItems, menuCategories, updateMenuItem } = useRestaurant();
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = [...menuCategories].sort((a, b) => a.order - b.order);
  const filtered = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(i => i.categoryId === activeCategory);

  const handleBulkToggle = () => {
    const targetAvailability = filtered.some(i => !selected.has(i.id) || !i.available);
    selected.forEach(id => {
      const item = menuItems.find(m => m.id === id);
      if (item) updateMenuItem({ ...item, available: targetAvailability });
    });
    showToast(`${selected.size} items updated`, 'success');
    setSelected(new Set());
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(menuItems, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'menu-items.json';
    a.click();
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-heading">Menu Manager</h1>
          <p className="text-sm text-muted mt-1">{menuItems.length} items across {menuCategories.length} categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportJSON}>
            <Download size={14} />
            Export JSON
          </Button>
          <Button variant="accent" onClick={() => setEditingItem(null)}>
            <Plus size={16} />
            Add Item
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0
            ${activeCategory === 'all' ? 'bg-accent text-white' : 'bg-elevated text-muted hover:text-primary border border-border'}`}
        >
          All ({menuItems.length})
        </button>
        {sorted.map(cat => {
          const count = menuItems.filter(i => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0
                ${activeCategory === cat.id ? 'bg-accent text-white' : 'bg-elevated text-muted hover:text-primary border border-border'}`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/30 rounded-xl">
          <span className="text-sm text-accent font-medium">{selected.size} selected</span>
          <Button variant="secondary" size="sm" onClick={handleBulkToggle}>
            Toggle Availability
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Item grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🍽</p>
          <p className="text-muted">No items in this category</p>
          <Button variant="accent" className="mt-4" onClick={() => setEditingItem(null)}>
            <Plus size={16} />
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="relative"
              onClick={(e) => {
                // Allow checkbox selection
                if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                  // Don't interfere with card actions
                }
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(item.id);
                  else next.delete(item.id);
                  setSelected(next);
                }}
                className="absolute top-3 left-3 z-10 w-4 h-4 accent-accent rounded"
              />
              <MenuItemCard item={item} onEdit={setEditingItem} />
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {editingItem !== undefined && (
        <MenuItemForm item={editingItem} onClose={() => setEditingItem(undefined)} />
      )}
    </div>
  );
}
