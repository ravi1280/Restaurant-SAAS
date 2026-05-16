'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { Order, CartItem, OrderModification } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { calculateOrderTotals, generateId } from '@/lib/utils';
import { Plus, Minus, Trash2 } from 'lucide-react';

export function OrderModificationModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { menuItems, updateOrder, settings, staff } = useRestaurant();
  const [items, setItems] = useState<CartItem[]>(order.items);
  const [staffId, setStaffId] = useState(staff[0]?.id || '');
  const [reason, setReason] = useState('');

  const handleUpdateQty = (index: number, delta: number) => {
    const newItems = [...items];
    const qty = newItems[index].quantity + delta;
    if (qty <= 0) {
      newItems.splice(index, 1);
    } else {
      newItems[index] = { ...newItems[index], quantity: qty };
    }
    setItems(newItems);
  };

  const handleAddItem = (menuItemId: string) => {
    const item = menuItems.find(m => m.id === menuItemId);
    if (!item) return;

    const existingIndex = items.findIndex(i => i.menuItemId === menuItemId && i.selectedModifiers.length === 0);
    if (existingIndex >= 0) {
      handleUpdateQty(existingIndex, 1);
    } else {
      setItems([...items, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        selectedModifiers: [],
        specialInstructions: ''
      }]);
    }
  };

  const handleSave = () => {
    if (!staffId || !reason) return alert('Staff member and reason are required');

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const { serviceCharge, gst, total } = calculateOrderTotals(subtotal, settings);

    // Simplified diffing logic for demo
    const modification: OrderModification = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      staffId,
      description: reason,
      itemsAdded: [], // In full version, compute exact diff
      itemsRemoved: [],
      previousTotal: order.total,
      newTotal: total,
    };

    updateOrder({
      ...order,
      items,
      subtotal,
      serviceCharge,
      gst,
      total,
      modifications: [...(order.modifications || []), modification]
    });

    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Modify Order ${order.orderNumber}`} maxWidth="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted mb-1 block">Staff Member</label>
            <select
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              className="w-full bg-elevated border border-border p-2 rounded-lg text-sm"
            >
              <option value="">Select Staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted mb-1 block">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Guest requested extra item, mistake"
              className="w-full bg-elevated border border-border p-2 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="border border-border rounded-xl p-4 max-h-[40vh] overflow-y-auto">
          <h3 className="font-semibold mb-3">Current Items</h3>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center mb-3 pb-3 border-b border-border last:border-0 last:pb-0 last:mb-0">
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted">Rs. {item.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleUpdateQty(idx, -1)} className="p-1.5 bg-surface rounded-md hover:bg-border">
                  {item.quantity === 1 ? <Trash2 size={14} className="text-danger" /> : <Minus size={14} />}
                </button>
                <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => handleUpdateQty(idx, 1)} className="p-1.5 bg-surface rounded-md hover:bg-border">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-3">Add Items</h3>
          <div className="flex gap-2 flex-wrap">
            {menuItems.filter(m => m.available).map(item => (
              <button
                key={item.id}
                onClick={() => handleAddItem(item.id)}
                className="px-3 py-1.5 bg-elevated border border-border rounded-full text-xs hover:bg-accent hover:text-white transition-colors"
              >
                {item.name} (+ Rs. {item.price})
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={handleSave}>Save Modifications</Button>
        </div>
      </div>
    </Modal>
  );
}
