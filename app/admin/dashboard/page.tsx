'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { StatCard } from '@/components/admin/StatCard';
import { SalesChart } from '@/components/admin/SalesChart';
import { RecentOrdersTable } from '@/components/admin/RecentOrdersTable';
import { TopItemsList } from '@/components/admin/TopItemsList';
import { PeakHeatmap } from '@/components/admin/PeakHeatmap';
import { Modal } from '@/components/ui/Modal';
import { BillView } from '@/components/payment/BillView';
import { Order } from '@/lib/types';
import { formatPrice, getElapsedMinutes } from '@/lib/utils';
import { DollarSign, ShoppingBag, Grid3X3, Clock, Bell, CheckCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function DashboardPage() {
  const { orders, tables, menuItems, waiterAlerts, updateWaiterAlert } = useRestaurant();
  const { showToast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const yesterdayOrders = orders.filter(o => o.createdAt.startsWith(yesterday));

  const todayRevenue = todayOrders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total : 0), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0);
  const revenueChange = yesterdayRevenue
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : 0;

  const activeOrderCount = todayOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;
  const activeTables = tables.filter(t => t.status !== 'available').length;

  const avgTicketTime = (() => {
    const servedToday = orders.filter(o =>
      o.createdAt.startsWith(today) && ['served', 'paid'].includes(o.status)
    );
    if (servedToday.length === 0) return 0;
    const totalMins = servedToday.reduce((s, o) => s + getElapsedMinutes(o.createdAt), 0);
    return Math.round(totalMins / servedToday.length);
  })();

  const pendingAlerts = (waiterAlerts || []).filter(a => a.status === 'pending');

  const handleAcknowledgeAlert = (alertId: string) => {
    const alert = waiterAlerts.find(a => a.id === alertId);
    if (alert) {
      updateWaiterAlert({ ...alert, status: 'acknowledged' });
      showToast(`Alert acknowledged`, 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary font-heading">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatPrice(todayRevenue)}
          change={revenueChange}
          icon={<DollarSign size={20} />}
          color="accent"
        />
        <StatCard
          label="Total Orders Today"
          value={activeOrderCount.toString()}
          change={5}
          icon={<ShoppingBag size={20} />}
          color="info"
        />
        <StatCard
          label="Active Tables"
          value={`${activeTables} / ${tables.length}`}
          icon={<Grid3X3 size={20} />}
          color="success"
        />
        <StatCard
          label="Avg Ticket Time"
          value={`${avgTicketTime}m`}
          change={-3}
          icon={<Clock size={20} />}
          color="warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SalesChart orders={orders} />
        </div>
        <TopItemsList items={menuItems} orders={orders} />
      </div>

      {/* Recent orders + waiter alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentOrdersTable
            orders={todayOrders}
            onRowClick={setSelectedOrder}
          />
        </div>

        {/* Waiter Alerts Widget */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Bell size={16} className="text-accent" />
            <h3 className="font-semibold text-primary">Waiter Alerts</h3>
            {pendingAlerts.length > 0 && (
              <span className="ml-auto bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingAlerts.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {pendingAlerts.length === 0 ? (
              <div className="px-5 py-6 text-center text-muted text-sm">
                <CheckCircle size={24} className="mx-auto mb-2 text-success" />
                All clear!
              </div>
            ) : (
              pendingAlerts.map(alert => (
                <div key={alert.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary">Table {alert.tableId}</p>
                    <p className="text-xs text-muted">{alert.reason}</p>
                    <p className="text-[10px] text-hint mt-0.5 font-mono">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all"
                  >
                    <CheckCircle size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <PeakHeatmap orders={orders} />

      {/* Order detail modal */}
      {selectedOrder && (
        <Modal isOpen onClose={() => setSelectedOrder(null)} maxWidth="sm">
          <BillView order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </Modal>
      )}
    </div>
  );
}
