'use client';

import React, { useState } from 'react';
import { MenuItem, MenuCategory } from '@/lib/types';
import { MenuItemCard } from './MenuItem';

interface MenuBrowserProps {
  items: MenuItem[];
  categories: MenuCategory[];
}

export function MenuBrowser({ items, categories }: MenuBrowserProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const filtered = activeCategory === 'all'
    ? items.filter(i => i.available)
    : items.filter(i => i.categoryId === activeCategory && i.available);

  // Include sold out items at the end
  const allItems = activeCategory === 'all'
    ? [...items.filter(i => i.available), ...items.filter(i => !i.available)]
    : [...items.filter(i => i.categoryId === activeCategory && i.available), ...items.filter(i => i.categoryId === activeCategory && !i.available)];

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0
            ${activeCategory === 'all'
              ? 'bg-accent text-white shadow-md shadow-accent/30'
              : 'bg-elevated text-muted hover:text-primary border border-border'
            }`}
        >
          All
        </button>
        {sortedCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0
              ${activeCategory === cat.id
                ? 'bg-accent text-white shadow-md shadow-accent/30'
                : 'bg-elevated text-muted hover:text-primary border border-border'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {allItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🍽</p>
          <p className="text-muted">No items in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {allItems.map(item => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
