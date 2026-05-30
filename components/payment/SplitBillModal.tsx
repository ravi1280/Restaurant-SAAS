'use client';

import React, { useState } from 'react';
import { Order, CartItem } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Users, Receipt, Check, ChevronRight } from 'lucide-react';
import { PaymentModal } from '@/components/payment/PaymentModal';

interface SplitBillModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSplitComplete: () => void;
}

type SplitMode = 'equal' | 'items';

export function SplitBillModal({ order, isOpen, onClose, onSplitComplete }: SplitBillModalProps) {
  const { settings, addOrder, updateOrder } = useRestaurant();
  const { showToast } = useToast();
  
  const [mode, setMode] = useState<SplitMode>('equal');
  
  // Equal Split States
  const [numSplits, setNumSplits] = useState(2);
  const [selectedSplitToPay, setSelectedSplitToPay] = useState<number | null>(null);
  
  // Itemized Split States
  const [selectedItems, setSelectedItems] = useState<{ [itemIdx: number]: number }>({}); // maps item index to quantity to move

  // Active Payment Modal state
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);

  const calculateSplitAmount = () => {
    return Number((order.total / numSplits).toFixed(2));
  };

  const handleEqualSplitPay = (splitIndex: number) => {
    const amount = calculateSplitAmount();
    setPaymentAmount(amount);
    setSelectedSplitToPay(splitIndex);
  };

  const handlePaymentSuccess = () => {
    if (paymentAmount === null) return;
    
    const isLastSplit = order.total - paymentAmount <= 1.00; // Float precision margin
    
    if (isLastSplit) {
      const fullyPaidOrder: Order = {
        ...order,
        status: 'paid',
        paymentMethod: 'cash', // Default to cash for simplicity
        total: 0,
        subtotal: 0,
        serviceCharge: 0,
        gst: 0,
        updatedAt: new Date().toISOString(),
      };
      updateOrder(fullyPaidOrder);
      showToast('Final split paid! Order fully settled.', 'success');
      setPaymentAmount(null);
      onSplitComplete();
    } else {
      const remainingTotal = Number((order.total - paymentAmount).toFixed(2));
      const ratio = remainingTotal / order.total;
      
      const partiallyPaidOrder: Order = {
        ...order,
        total: remainingTotal,
        subtotal: Number((order.subtotal * ratio).toFixed(2)),
        serviceCharge: Number((order.serviceCharge * ratio).toFixed(2)),
        gst: Number((order.gst * ratio).toFixed(2)),
        orderNote: `${order.orderNote || ''}\n[Split Paid: ${formatPrice(paymentAmount)}]`.trim(),
        updatedAt: new Date().toISOString(),
      };
      updateOrder(partiallyPaidOrder);
      showToast(`Paid portion of ${formatPrice(paymentAmount)}. Remaining balance: ${formatPrice(remainingTotal)}`, 'success');
      setPaymentAmount(null);
      
      // Update splits view
      if (numSplits > 2) {
        setNumSplits(prev => prev - 1);
      }
    }
  };

  const handleToggleItemSelection = (idx: number, maxQty: number) => {
    const current = selectedItems[idx] || 0;
    if (current === 0) {
      setSelectedItems(prev => ({ ...prev, [idx]: 1 }));
    } else if (current < maxQty) {
      setSelectedItems(prev => ({ ...prev, [idx]: current + 1 }));
    } else {
      const next = { ...selectedItems };
      delete next[idx];
      setSelectedItems(next);
    }
  };

  const handleItemizedSplitSubmit = () => {
    const movedItems: CartItem[] = [];
    const keptItems: CartItem[] = [];

    order.items.forEach((item, idx) => {
      const moveQty = selectedItems[idx] || 0;
      const keepQty = item.quantity - moveQty;

      if (moveQty > 0) {
        movedItems.push({
          ...item,
          quantity: moveQty,
        });
      }
      if (keepQty > 0) {
        keptItems.push({
          ...item,
          quantity: keepQty,
        });
      }
    });

    if (movedItems.length === 0) {
      showToast('Select at least one item to split', 'warning');
      return;
    }

    const calculateTotals = (items: CartItem[]) => {
      const subtotal = items.reduce((sum, item) => {
        const modsPrice = item.selectedModifiers.reduce((s, m) => s + m.priceAdjustment, 0);
        return sum + (item.price + modsPrice) * item.quantity;
      }, 0);
      const serviceCharge = Number((subtotal * (settings.serviceChargePercent / 100)).toFixed(2));
      const gst = Number((subtotal * (settings.gstPercent / 100)).toFixed(2));
      const total = Number((subtotal + serviceCharge + gst).toFixed(2));
      return { subtotal, serviceCharge, gst, total };
    };

    const movedTotals = calculateTotals(movedItems);
    const keptTotals = calculateTotals(keptItems);

    // Create New Order for Split Items
    const splitOrder: Order = {
      id: Math.random().toString(36).substring(2),
      orderNumber: `${order.orderNumber}-B`,
      tableId: order.tableId,
      items: movedItems,
      status: 'pending',
      subtotal: movedTotals.subtotal,
      serviceCharge: movedTotals.serviceCharge,
      gst: movedTotals.gst,
      total: movedTotals.total,
      pointsEarned: 0,
      pointsRedeemed: 0,
      discount: 0,
      orderNote: `Split from Order ${order.orderNumber}`,
      modifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update Original Order
    const updatedOriginal: Order = {
      ...order,
      orderNumber: `${order.orderNumber.split('-')[0]}-A`,
      items: keptItems,
      subtotal: keptTotals.subtotal,
      serviceCharge: keptTotals.serviceCharge,
      gst: keptTotals.gst,
      total: keptTotals.total,
      updatedAt: new Date().toISOString(),
    };

    addOrder(splitOrder);
    updateOrder(updatedOriginal);

    showToast('Bill split by items successfully!', 'success');
    setSelectedItems({});
    onSplitComplete();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split Bill / Receipt" maxWidth="sm">
      <div className="p-5 space-y-4">
        {/* Toggle Mode */}
        <div className="flex bg-elevated p-1 rounded-xl border border-border">
          <button
            onClick={() => setMode('equal')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all
              ${mode === 'equal' ? 'bg-accent text-white shadow-md' : 'text-muted hover:text-primary'}`}
          >
            <Users size={14} /> Split Equally
          </button>
          <button
            onClick={() => setMode('items')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all
              ${mode === 'items' ? 'bg-accent text-white shadow-md' : 'text-muted hover:text-primary'}`}
          >
            <Receipt size={14} /> Split by Items
          </button>
        </div>

        {/* Total Amount Indicator */}
        <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 text-center">
          <p className="text-xs text-muted font-medium">Total Bill to Split</p>
          <p className="text-2xl font-black text-primary font-heading mt-1">{formatPrice(order.total)}</p>
        </div>

        {/* Modes Content */}
        {mode === 'equal' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-2 font-medium">Number of Splits</label>
              <div className="flex items-center justify-between gap-3 bg-elevated border border-border p-2 rounded-xl">
                <button
                  disabled={numSplits <= 2}
                  onClick={() => setNumSplits(prev => prev - 1)}
                  className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary font-bold hover:bg-elevated transition-colors disabled:opacity-50"
                >
                  -
                </button>
                <span className="font-heading text-lg font-bold">{numSplits} portions</span>
                <button
                  disabled={numSplits >= 10}
                  onClick={() => setNumSplits(prev => prev + 1)}
                  className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary font-bold hover:bg-elevated transition-colors disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Array.from({ length: numSplits }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-elevated border border-border rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-primary">Portion {idx + 1}</p>
                    <p className="text-sm font-bold text-accent">{formatPrice(calculateSplitAmount())}</p>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    className="text-xs py-1.5 px-3 h-auto"
                    onClick={() => handleEqualSplitPay(idx)}
                  >
                    Pay Portion
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'items' && (
          <div className="space-y-4">
            <p className="text-xs text-muted">Select items to move to a new separate bill:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-border/60">
              {order.items.map((item, idx) => {
                const selectedQty = selectedItems[idx] || 0;
                const isSelected = selectedQty > 0;
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleItemSelection(idx, item.quantity)}
                    className={`flex items-center justify-between py-2.5 px-1 cursor-pointer transition-all hover:bg-accent/5 rounded-lg
                      ${isSelected ? 'bg-accent/5 border-l-2 border-accent pl-2' : ''}`}
                  >
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-primary">{item.name}</p>
                      <p className="text-[10px] text-muted">{formatPrice(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">
                        {selectedQty > 0 ? `${selectedQty} of ${item.quantity}` : `${item.quantity} available`}
                      </span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-accent border-accent text-white' : 'border-border bg-surface'}`}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="accent"
              className="w-full flex items-center justify-center gap-2 mt-2"
              onClick={handleItemizedSplitSubmit}
              disabled={Object.keys(selectedItems).length === 0}
            >
              Split Selected Items <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>

      {paymentAmount !== null && (
        <PaymentModal
          order={{
            ...order,
            total: paymentAmount, // Override total for payment presentation
          }}
          onClose={() => setPaymentAmount(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Modal>
  );
}
