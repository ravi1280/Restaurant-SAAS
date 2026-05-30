'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';
import { generateId, generateOrderNumber, calculateOrderTotals, calculatePointsEarned } from '@/lib/utils';
import { Order, LoyaltyAccount } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: number;
}

export function CartDrawer({ isOpen, onClose, tableId }: CartDrawerProps) {
  const { items, subtotal, itemCount, removeItem, updateQuantity, setOrderNote, orderNote, clearCart, addItem } = useCart();
  const { settings, menuItems } = useRestaurant();
  const [showCheckout, setShowCheckout] = useState(false);

  const { serviceCharge, gst, total } = calculateOrderTotals(subtotal, settings);

  // Calculate upsells
  const upsellIds = new Set<string>();
  items.forEach(cartItem => {
    const mi = menuItems.find(m => m.id === cartItem.menuItemId);
    if (mi && mi.upsellItemIds) {
      mi.upsellItemIds.forEach(id => upsellIds.add(id));
    }
  });
  // Exclude items already in cart
  items.forEach(cartItem => upsellIds.delete(cartItem.menuItemId));
  const upsellSuggestions = Array.from(upsellIds)
    .map(id => menuItems.find(m => m.id === id && m.available))
    .filter(Boolean)
    .slice(0, 2); // Show max 2

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl border-t border-border"
        style={{
          maxHeight: '85vh',
          animation: 'slideUp 0.3s ease',
          maxWidth: '430px',
          margin: '0 auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-accent" />
            <h3 className="font-semibold text-primary">Your Cart ({itemCount})</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-elevated text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 220px)' }}>
          {items.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted/40 mb-3" />
              <p className="text-muted text-sm">Your cart is empty</p>
            </div>
          ) : (
            <div className="px-5 space-y-3 pb-2">
              {items.map((item, idx) => {
                const modsTotal = item.selectedModifiers.reduce((s, m) => s + m.priceAdjustment, 0);
                const unitPrice = item.price + modsTotal;
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-elevated rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">{item.name}</p>
                      {item.selectedModifiers.length > 0 && (
                        <p className="text-xs text-muted mt-0.5">
                          {item.selectedModifiers.map(m => m.optionId).join(' · ')}
                        </p>
                      )}
                      <p className="text-xs text-accent font-semibold mt-1">
                        {formatPrice(unitPrice * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-background flex items-center justify-center text-muted hover:text-primary transition-all"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold text-primary w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-background flex items-center justify-center text-muted hover:text-primary transition-all"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.menuItemId)}
                        className="w-6 h-6 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Order note */}
              <div>
                <textarea
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="Order note (allergies, special requests...)"
                  rows={2}
                  className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-sm text-primary focus:border-accent focus:outline-none resize-none"
                />
              </div>

              {/* Upsell Prompts */}
              {settings.upsellEnabled && upsellSuggestions.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-accent mb-2">Pairs well with your order:</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {upsellSuggestions.map(upsell => upsell && (
                      <div key={upsell.id} className="min-w-[140px] p-2 bg-elevated border border-border rounded-xl shrink-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-medium text-primary">{upsell.name}</p>
                            <p className="text-[10px] text-muted">{formatPrice(upsell.price)}</p>
                          </div>
                          <button
                            onClick={() => addItem({
                              menuItemId: upsell.id,
                              name: upsell.name,
                              price: upsell.price,
                              quantity: 1,
                              selectedModifiers: [],
                              specialInstructions: ''
                            })}
                            className="p-1 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totals + Checkout */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Service ({settings.serviceChargePercent}%)</span><span>{formatPrice(serviceCharge)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>GST ({settings.gstPercent}%)</span><span>{formatPrice(gst)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-primary border-t border-border pt-2">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
            <Button
              variant="accent"
              size="lg"
              className="w-full mt-1"
              onClick={() => setShowCheckout(true)}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          tableId={tableId}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
