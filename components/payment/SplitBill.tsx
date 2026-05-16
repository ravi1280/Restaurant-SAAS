'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SplitBillProps {
  order: Order;
}

export function SplitBill({ order }: SplitBillProps) {
  const [mode, setMode] = useState<'equal' | 'items'>('equal');
  const [people, setPeople] = useState(2);
  const [assignments, setAssignments] = useState<Record<number, boolean[]>>({});

  const perPerson = Math.ceil(order.total / people);

  const toggleItem = (personIdx: number, itemIdx: number) => {
    const current = assignments[personIdx] || order.items.map(() => false);
    const updated = [...current];
    updated[itemIdx] = !updated[itemIdx];
    setAssignments(prev => ({ ...prev, [personIdx]: updated }));
  };

  const getPersonTotal = (personIdx: number) => {
    const selected = assignments[personIdx] || order.items.map(() => false);
    return order.items.reduce((sum, item, idx) => {
      if (!selected[idx]) return sum;
      const proportion = (item.price * item.quantity) / order.subtotal;
      return sum + Math.round(order.total * proportion);
    }, 0);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('equal')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
            ${mode === 'equal' ? 'bg-accent text-white' : 'bg-elevated text-muted'}`}
        >
          Split Equally
        </button>
        <button
          onClick={() => setMode('items')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
            ${mode === 'items' ? 'bg-accent text-white' : 'bg-elevated text-muted'}`}
        >
          Split by Items
        </button>
      </div>

      {mode === 'equal' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Number of people</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPeople(p => Math.max(2, p - 1))}
                className="w-8 h-8 rounded-lg bg-elevated text-primary font-bold hover:bg-accent/10 transition-all"
              >-</button>
              <span className="w-6 text-center font-bold text-primary">{people}</span>
              <button
                onClick={() => setPeople(p => Math.min(12, p + 1))}
                className="w-8 h-8 rounded-lg bg-elevated text-primary font-bold hover:bg-accent/10 transition-all"
              >+</button>
            </div>
          </div>
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl text-center">
            <p className="text-xs text-muted mb-1">Per person</p>
            <p className="text-2xl font-bold text-accent">{formatPrice(perPerson)}</p>
            <p className="text-xs text-muted mt-1">Total: {formatPrice(order.total)} ÷ {people}</p>
          </div>
        </div>
      )}

      {mode === 'items' && (
        <div className="space-y-3">
          <p className="text-xs text-muted">Assign items to each person</p>
          {Array.from({ length: people }, (_, pi) => (
            <div key={pi} className="p-3 bg-elevated rounded-xl">
              <p className="text-sm font-semibold text-primary mb-2">Person {pi + 1}</p>
              <div className="space-y-1">
                {order.items.map((item, ii) => (
                  <label key={ii} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(assignments[pi] || [])[ii] || false}
                      onChange={() => toggleItem(pi, ii)}
                      className="rounded accent-accent"
                    />
                    <span className="text-sm text-primary flex-1">{item.quantity}× {item.name}</span>
                    <span className="text-xs text-muted">{formatPrice(item.price * item.quantity)}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm font-semibold">
                <span className="text-muted">Subtotal</span>
                <span className="text-primary">{formatPrice(getPersonTotal(pi))}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-2">
            <button
              onClick={() => setPeople(p => Math.min(12, p + 1))}
              className="text-xs text-accent hover:underline"
            >+ Add person</button>
            {people > 2 && (
              <button
                onClick={() => setPeople(p => Math.max(2, p - 1))}
                className="text-xs text-danger hover:underline"
              >- Remove person</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
