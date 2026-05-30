'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { KDSTicket } from './KDSTicket';
import { useRestaurant } from '@/context/RestaurantContext';
import { ChefHat } from 'lucide-react';

type KDSTab = 'all' | 'pending' | 'preparing' | 'ready' | 'completed';

const TABS: { id: KDSTab; label: string }[] = [
  { id: 'all', label: 'All Active' },
  { id: 'pending', label: 'New' },
  { id: 'preparing', label: 'Cooking' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Done Today' },
];

export function KDSBoard() {
  const { orders, refreshOrders, updateOrder } = useRestaurant();
  const [tab, setTab] = useState<KDSTab>('all');
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest');
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [prevIds, setPrevIds] = useState<Set<string>>(new Set());

  // Poll for updates every 3s
  useEffect(() => {
    refreshOrders(); // Initial fetch
    const interval = setInterval(() => {
      refreshOrders();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  // Filter orders for today
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));

  // Detect and flash new orders
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeTodayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
    const newIds = new Set(activeTodayOrders.map(o => o.id));
    
    // Check if the set of IDs is actually different from prevIds to avoid infinite loop
    const isDifferent = newIds.size !== prevIds.size || [...newIds].some(id => !prevIds.has(id));
    
    if (isDifferent) {
      const added = [...newIds].filter(id => !prevIds.has(id) && prevIds.size > 0);
      if (added.length > 0) {
        setFlashIds(new Set(added));
        setTimeout(() => setFlashIds(new Set()), 2000);
      }
      setPrevIds(newIds);
    }
  }, [orders]);

  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    updateOrder({
      ...order,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const filterOrders = (ordersList: Order[]) => {
    switch (tab) {
      case 'all': return ordersList.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
      case 'pending': return ordersList.filter(o => o.status === 'pending');
      case 'preparing': return ordersList.filter(o => o.status === 'preparing');
      case 'ready': return ordersList.filter(o => o.status === 'ready');
      case 'completed': return ordersList.filter(o => ['served', 'paid'].includes(o.status));
      default: return ordersList;
    }
  };

  const sortedFiltered = filterOrders(todayOrders).sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return sort === 'oldest' ? aTime - bTime : bTime - aTime;
  });

  const counts: Record<KDSTab, number> = {
    all: todayOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length,
    pending: todayOrders.filter(o => o.status === 'pending').length,
    preparing: todayOrders.filter(o => o.status === 'preparing').length,
    ready: todayOrders.filter(o => o.status === 'ready').length,
    completed: todayOrders.filter(o => ['served', 'paid'].includes(o.status)).length,
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
          <ChefHat className="w-16 h-16 text-muted/40 mb-4 mx-auto" />
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
