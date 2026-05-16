'use client';

import React, { useState } from 'react';
import { MenuItem, ModifierGroup } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Minus } from 'lucide-react';

const DIETARY_MAP = {
  vegan: { icon: '🌱', label: 'Vegan', variant: 'success' as const },
  spicy: { icon: '🌶', label: 'Spicy', variant: 'danger' as const },
  nuts: { icon: '🥜', label: 'Contains Nuts', variant: 'warning' as const },
  glutenFree: { icon: '🌾', label: 'Gluten Free', variant: 'info' as const },
  chefSpecial: { icon: '⭐', label: "Chef's Special", variant: 'loyalty' as const },
};

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});
  const [instructions, setInstructions] = useState('');

  const modifierTotal = Object.entries(selectedModifiers).reduce((sum, [groupId, optionId]) => {
    const group = item.modifierGroups.find(g => g.id === groupId);
    const option = group?.options.find(o => o.id === optionId);
    return sum + (option?.priceAdjustment || 0);
  }, 0);

  const totalPrice = (item.price + modifierTotal) * quantity;

  const handleAddToCart = () => {
    // Check required modifiers
    const missing = item.modifierGroups
      .filter(g => g.required && !selectedModifiers[g.id]);
    if (missing.length > 0) {
      showToast(`Please select: ${missing.map(g => g.name).join(', ')}`, 'warning');
      return;
    }

    const cartItem = {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      selectedModifiers: Object.entries(selectedModifiers).map(([groupId, optionId]) => {
        const group = item.modifierGroups.find(g => g.id === groupId);
        const option = group?.options.find(o => o.id === optionId);
        return { groupId, optionId, priceAdjustment: option?.priceAdjustment || 0 };
      }),
      specialInstructions: instructions,
    };

    addItem(cartItem);
    showToast(`${item.name} added to cart`, 'success');
    setShowModal(false);
    setQuantity(1);
    setSelectedModifiers({});
    setInstructions('');
  };

  return (
    <>
      <button
        onClick={() => item.available && setShowModal(true)}
        disabled={!item.available}
        className={`relative text-left rounded-2xl border transition-all duration-200 overflow-hidden w-full
          ${item.available
            ? 'bg-surface border-border hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 active:scale-95'
            : 'bg-elevated border-border opacity-60 cursor-not-allowed'
          }`}
      >
        {/* Sold out overlay */}
        {!item.available && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 rounded-2xl">
            <span className="px-3 py-1 bg-danger/20 text-danger text-xs font-bold rounded-full border border-danger/30">
              Sold Out
            </span>
          </div>
        )}

        <div className="p-3">
          <div className="text-4xl mb-2 text-center">{item.emoji}</div>
          <p className="font-semibold text-sm text-primary leading-tight">{item.name}</p>
          <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>

          {/* Dietary badges */}
          {item.dietaryFlags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.dietaryFlags.map(flag => {
                const d = DIETARY_MAP[flag];
                return (
                  <span key={flag} className="text-[10px]" title={d.label}>
                    {d.icon}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-bold text-accent">{formatPrice(item.price)}</p>
            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
          </div>
        </div>
      </button>

      {/* Item Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={item.name} maxWidth="sm">
        <div className="p-5 space-y-4">
          {/* Emoji + description */}
          <div className="flex gap-4">
            <div className="text-6xl">{item.emoji}</div>
            <div>
              <p className="text-sm text-muted leading-relaxed">{item.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {item.dietaryFlags.map(flag => {
                  const d = DIETARY_MAP[flag];
                  return (
                    <Badge key={flag} variant={d.variant}>
                      {d.icon} {d.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modifiers */}
          {item.modifierGroups.map(group => (
            <div key={group.id}>
              <p className="text-sm font-semibold text-primary mb-2">
                {group.name}
                {group.required && <span className="text-danger ml-1 text-xs">*Required</span>}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedModifiers(prev => ({ ...prev, [group.id]: opt.id }))}
                    className={`px-3 py-2 rounded-xl text-sm border transition-all
                      ${selectedModifiers[group.id] === opt.id
                        ? 'bg-accent/20 border-accent text-accent font-medium'
                        : 'bg-elevated border-border text-muted hover:border-accent/40'
                      }`}
                  >
                    {opt.name}
                    {opt.priceAdjustment > 0 && (
                      <span className="block text-xs mt-0.5 opacity-70">+{formatPrice(opt.priceAdjustment)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Special instructions */}
          <div>
            <p className="text-sm font-semibold text-primary mb-2">Special Instructions</p>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Allergies, preferences, etc..."
              rows={2}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-sm text-primary focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Quantity + Add */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-3 bg-elevated rounded-xl px-2 py-1">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg hover:bg-accent/10 text-primary flex items-center justify-center transition-all"
              >
                <Minus size={14} />
              </button>
              <span className="font-bold text-primary w-4 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-7 h-7 rounded-lg hover:bg-accent/10 text-primary flex items-center justify-center transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
            <Button variant="accent" onClick={handleAddToCart} className="flex-1">
              Add to Cart · {formatPrice(totalPrice)}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
