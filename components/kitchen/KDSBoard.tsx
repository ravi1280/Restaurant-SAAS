'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { KDSTicket } from './KDSTicket';
import { parseLocalStorage, setLocalStorage } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';

type KDSTab = 'all' | 'pending' | 'preparing' | 'ready' | 'completed';

const TABS: { id: KDSTab; label: string }[] = [
  { id: 'all', label: 'All Active' },
  { id: 'pending', label: 'New' },
  { id: 'preparing', label: 'Cooking' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Done Today' },
];

export function KDSBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<KDSTab>('all');
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest');
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [prevIds, setPrevIds] = useState<Set<string>>(new Set());

  const loadOrders = () => {
    const all = parseLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = all.filter(o => o.createdAt.startsWith(today));
    
    // Detect new orders
    const newIds = new Set(todayOrders.map(o => o.id));
    const added = [...newIds].filter(id => !prevIds.has(id) && prevIds.size > 0);
    if (added.length > 0) {
      setFlashIds(new Set(added));
      setTimeout(() => setFlashIds(new Set()), 2000);
    }
    setPrevIds(newIds);
    setOrders(todayOrders);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    const all = parseLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const updated = all.map(o =>
      o.id === order.id ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
    );
    setLocalStorage(STORAGE_KEYS.ORDERS, updated);
    loadOrders();
  };

  const filterOrders = (orders: Order[]) => {
    switch (tab) {
      case 'all': return orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
      case 'pending': return orders.filter(o => o.status === 'pending');
      case 'preparing': return orders.filter(o => o.status === 'preparing');
      case 'ready': return orders.filter(o => o.status === 'ready');
      case 'completed': return orders.filter(o => ['served', 'paid'].includes(o.status));
      default: return orders;
    }
  };

  const sortedFiltered = filterOrders(orders).sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sort === 'oldest' ? aTime - bTime : bTime - aTime;
  });

  const counts: Record<KDSTab, number> = {
    all: orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => ['served', 'paid'].includes(o.status)).length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${tab === t.id ? 'bg-accent text-white' : 'bg-elevated text-muted hover:text-primary'}`}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${tab === t.id ? 'bg-white/20' : 'bg-accent/20 text-accent'}`}>
                  {counts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as 'oldest' | 'newest')}
            className="px-3 py-1.5 bg-elevated border border-border rounded-xl text-sm text-primary"
          >
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Board */}
      {sortedFiltered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-5xl mb-4">👨‍🍳</span>
          <p className="text-lg font-semibold text-primary mb-1">Kitchen is clear!</p>
          <p className="text-muted text-sm">No active orders right now</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 overflow-y-auto">
          {sortedFiltered.map(order => (
            <div
              key={order.id}
              className={`transition-all duration-500 ${flashIds.has(order.id) ? 'ring-2 ring-accent/60 ring-offset-2 ring-offset-background' : ''}`}
            >
              <KDSTicket order={order} onStatusChange={handleStatusChange} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
