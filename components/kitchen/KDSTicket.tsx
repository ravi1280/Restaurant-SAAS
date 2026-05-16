'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { getElapsedMinutes } from '@/lib/utils';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { Clock, CheckCircle, Flame, X } from 'lucide-react';

interface KDSTicketProps {
  order: Order;
  onStatusChange: (order: Order, newStatus: Order['status']) => void;
}

export function KDSTicket({ order, onStatusChange }: KDSTicketProps) {
  const [elapsed, setElapsed] = useState(getElapsedMinutes(order.createdAt));
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedMinutes(order.createdAt));
    }, 10000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const getStatusColor = () => {
    switch (order.status) {
      case 'pending': return 'bg-elevated border-border text-muted';
      case 'preparing': return 'bg-warning border-warning/50 text-warning';
      case 'ready': return 'bg-success border-success/50 text-success';
      case 'served':
      case 'paid': return 'bg-loyalty border-loyalty/50 text-loyalty';
      default: return 'bg-elevated border-border text-muted';
    }
  };

  const getTimeColor = () => {
    if (elapsed < 10) return 'text-success bg-success/10 border-success/30';
    if (elapsed < 20) return 'text-warning bg-warning/10 border-warning/30';
    return 'text-danger bg-danger/10 border-danger/30 animate-pulse-slow shadow-[0_0_15px_rgba(239,68,68,0.3)]';
  };

  const stations = [...new Set(order.items.map(i => {
    // We don't have station on cart items, just show all
    return 'hot';
  }))];

  const nextAction: { label: string; status: Order['status'] } | null =
    order.status === 'pending' ? { label: 'Start Cooking', status: 'preparing' }
      : order.status === 'preparing' ? { label: 'Mark Ready', status: 'ready' }
        : order.status === 'ready' ? { label: 'Bump / Served', status: 'served' }
          : null;

  const toggleItem = (idx: number) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Simple border based on status
  const getBorder = () => {
    if (order.status === 'preparing') return 'border-warning/50';
    if (order.status === 'ready') return 'border-success/50';
    if (elapsed >= 20) return 'border-danger/60';
    return 'border-border';
  };

  return (
    <div
      className={`relative bg-[#fcfaf5] dark:bg-elevated rounded flex flex-col h-full font-sans border border-border shadow-sm transition-shadow ${getBorder()}`}
      style={{ borderTopWidth: '4px', borderTopColor: 'var(--color-' + getStatusColor().split('-')[1].split(' ')[0] + ')' }}
    >
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-primary leading-none">
                {order.tableId === 0 ? 'Takeaway' : `Table ${order.tableId}`}
              </p>
              {order.status === 'ready' && <span className="flex h-1.5 w-1.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span></span>}
            </div>
            <p className="text-[10px] font-mono text-muted tracking-wide uppercase mt-0.5">ID: {order.orderNumber}</p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded border border-dashed ${getTimeColor()}`}>
            <Clock size={12} />
            <span className="text-xs font-mono font-bold tracking-tight">
              {elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-border/60 mx-4" />

      {/* Items List */}
      <div className="p-4 flex-1 space-y-2">
        {order.items.map((item, idx) => {
          const isDone = completedItems.has(idx);
          return (
            <button 
              key={idx} 
              onClick={() => toggleItem(idx)}
              className={`w-full text-left flex gap-3 group transition-opacity ${isDone ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="text-sm font-bold font-mono text-primary shrink-0 w-6">
                {item.quantity}x
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-start">
                <p className={`text-sm font-bold leading-tight ${isDone ? 'line-through text-muted' : 'text-primary'}`}>
                  {item.name}
                </p>
                {item.selectedModifiers.length > 0 && (
                  <p className={`text-[10px] mt-0.5 font-medium ${isDone ? 'line-through text-muted' : 'text-muted'}`}>
                    + {item.selectedModifiers.map(m => m.optionId).join(', ')}
                  </p>
                )}
                {item.specialInstructions && (
                  <div className={`mt-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md text-warning bg-warning/10 border border-warning/20 inline-block`}>
                    ⚠ {item.specialInstructions}
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {order.orderNote && (
          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-warning">
              📝 {order.orderNote}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 pb-5 mt-auto relative bg-transparent border-t border-dashed border-border/60">
        {nextAction ? (
          <button
            onClick={() => onStatusChange(order, nextAction.status)}
            className={`w-full py-2 rounded text-sm font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-1.5 border
              ${order.status === 'pending' ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning hover:text-white' : 
                order.status === 'preparing' ? 'bg-success/10 text-success border-success/30 hover:bg-success hover:text-white' :
                'bg-accent text-white hover:bg-accent/90 border-accent'
              }
            `}
          >
            {nextAction.status === 'ready' && <CheckCircle size={14} />}
            {nextAction.label}
          </button>
        ) : order.status === 'served' || order.status === 'paid' ? (
          <div className="flex items-center justify-center gap-1.5 py-2 text-success text-sm font-bold uppercase tracking-widest border border-dashed border-success/30 rounded">
            <CheckCircle size={14} />
            Completed
          </div>
        ) : null}
        
        {/* Receipt Zig Zag Bottom */}
        <div className="absolute -bottom-1 left-0 right-0 h-2 overflow-hidden" style={{ backgroundImage: 'linear-gradient(135deg, transparent 50%, var(--color-background) 50%), linear-gradient(45deg, transparent 50%, var(--color-background) 50%)', backgroundSize: '12px 8px', backgroundRepeat: 'repeat-x' }}></div>
      </div>
    </div>
  );
}
