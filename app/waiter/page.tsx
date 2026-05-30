'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { Bell, CheckCircle, Users, Utensils, Receipt } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BillView } from '@/components/payment/BillView';
import { SplitBillModal } from '@/components/payment/SplitBillModal';
import { Table } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function WaiterDashboard() {
  const { tables, waiterAlerts, updateWaiterAlert, orders, updateTable } = useRestaurant();
  const { showToast } = useToast();
  const router = useRouter();
  const [prevAlertIds, setPrevAlertIds] = useState<Set<string>>(new Set());
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showBill, setShowBill] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);

  // Polling to keep the dashboard fresh
  useEffect(() => {
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('storage'));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeAlerts = waiterAlerts.filter(a => a.status === 'pending');

  // Watch for new alerts and trigger push notification
  useEffect(() => {
    const activeIds = activeAlerts.map(a => a.id);
    const hasChanged = activeIds.length !== prevAlertIds.size || activeIds.some(id => !prevAlertIds.has(id));
    
    if (hasChanged) {
      const currentActiveIds = new Set(activeIds);
      
      // Find new alerts that weren't in the previous state
      const newAlerts = activeAlerts.filter(a => !prevAlertIds.has(a.id) && prevAlertIds.size > 0);
      
      newAlerts.forEach(alert => {
        showToast(`Table ${alert.tableId} needs you! (${alert.reason})`, 'warning');
        
        // Optional: Try to play a notification sound
        try {
          const audio = new Audio('/bell.mp3'); // Fails silently if no audio file
          audio.play().catch(() => {}); 
        } catch (e) {}
      });

      setPrevAlertIds(currentActiveIds);
    }
  }, [activeAlerts, prevAlertIds, showToast]);

  const handleAcknowledgeAlert = (alert: any) => {
    updateWaiterAlert({ ...alert, status: 'acknowledged' });
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-elevated border-border text-primary';
      case 'occupied': return 'bg-warning/20 border-warning/40 text-warning';
      case 'ordering': return 'bg-info/20 border-info/40 text-info';
      case 'bill-pending': return 'bg-danger/20 border-danger/40 text-danger';
      case 'reserved': return 'bg-loyalty/20 border-loyalty/40 text-loyalty';
      default: return 'bg-elevated border-border text-primary';
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setShowBill(false);
    setShowSplit(false);
    setSelectedOrderIndex(0);
  };

  // Find active orders for selected table
  const activeOrders = selectedTable
    ? orders.filter(o => o.tableId === selectedTable.id && o.status !== 'paid' && o.status !== 'cancelled')
    : [];

  const activeOrder = activeOrders[selectedOrderIndex] || activeOrders[0];

  return (
    <div className="min-h-screen bg-background" style={{ maxWidth: '430px', margin: '0 auto' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
              W
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-primary leading-none">Waiter Hub</h1>
              <p className="text-xs text-muted mt-1">Select a table to manage</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} className="text-danger animate-pulse" />
              Active Requests
            </h2>
            <div className="space-y-2">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3.5 bg-danger/10 border border-danger/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center font-bold text-danger">
                      T{alert.tableId}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{alert.reason}</p>
                      <p className="text-[10px] text-danger/80">
                        {Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 60000)}m ago
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlert(alert)}
                    className="p-2 bg-danger text-white rounded-xl hover:bg-danger/90 active:scale-95 transition-transform"
                    title="Acknowledge"
                  >
                    <CheckCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
            <Users size={14} />
            Floor Plan
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                  ${getTableColor(table.status)}
                `}
              >
                <span className="text-2xl font-black font-heading mb-1">{table.id}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  {table.status === 'bill-pending' ? 'Bill' : table.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Detail/Management Modal */}
      {selectedTable && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedTable(null);
            setShowBill(false);
            setShowSplit(false);
          }}
          title={showBill ? `Bill - Table ${selectedTable.id}` : `Table ${selectedTable.id}`}
          maxWidth="sm"
        >
          {showBill ? (
            <div className="p-1">
              {activeOrder ? (
                <BillView
                  order={activeOrder}
                  onClose={() => setShowBill(false)}
                />
              ) : (
                <p className="p-4 text-center text-sm text-muted">No active bill found.</p>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Table Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider font-semibold">Table Status</p>
                  <p className="text-sm font-bold text-primary capitalize mt-0.5">{selectedTable.status}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                  ${selectedTable.status === 'available' ? 'bg-success/15 text-success' :
                    selectedTable.status === 'bill-pending' ? 'bg-danger/15 text-danger' :
                    'bg-warning/15 text-warning'}`}
                >
                  {selectedTable.status}
                </span>
              </div>

              {/* Multiple Bills Dropdown (if exists) */}
              {activeOrders.length > 1 && (
                <div className="flex items-center justify-between p-2 bg-elevated border border-border rounded-xl">
                  <span className="text-xs text-muted font-medium">Select Bill:</span>
                  <select
                    value={selectedOrderIndex}
                    onChange={e => setSelectedOrderIndex(parseInt(e.target.value))}
                    className="bg-surface border border-border px-2 py-1 rounded-lg text-xs font-bold text-accent focus:outline-none"
                  >
                    {activeOrders.map((o, idx) => (
                      <option key={o.id} value={idx}>
                        {o.orderNumber} ({formatPrice(o.total)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Active Order Details */}
              {activeOrder ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-elevated border border-border rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-muted font-mono font-medium">Ref: {activeOrder.orderNumber}</p>
                      <span className="text-xs font-bold text-accent">{formatPrice(activeOrder.total)}</span>
                    </div>
                    <div className="divide-y divide-border/60 max-h-48 overflow-y-auto">
                      {activeOrder.items.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between text-xs text-primary">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 h-auto"
                      onClick={() => setShowBill(true)}
                    >
                      <Receipt size={13} /> View Bill
                    </Button>

                    <Button
                      variant="secondary"
                      className="flex-1 text-xs py-2 h-auto animate-fade-in"
                      onClick={() => setShowSplit(true)}
                    >
                      Split Bill
                    </Button>
                  </div>

                  {selectedTable.status !== 'bill-pending' && (
                    <Button
                      variant="danger"
                      className="w-full text-xs py-2 h-auto"
                      onClick={() => {
                        const updatedTable = { ...selectedTable, status: 'bill-pending' as const };
                        updateTable(updatedTable);
                        setSelectedTable(updatedTable);
                        showToast('Bill requested. Table status updated.', 'info');
                      }}
                    >
                      Request Checkout / Bill
                    </Button>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-border rounded-xl bg-elevated/20">
                  <Utensils className="w-10 h-10 text-muted/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary">No Active Orders</p>
                  <p className="text-xs text-muted mt-0.5">Start a new session to add items</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-border pt-4 flex gap-2">
                <Button
                  variant="accent"
                  className="flex-1"
                  onClick={() => {
                    if (selectedTable.status === 'available') {
                      updateTable({ ...selectedTable, status: 'ordering' });
                    }
                    router.push(`/table/${selectedTable.id}?waiter=true`);
                    setSelectedTable(null);
                  }}
                >
                  {selectedTable.status === 'available' ? 'Start Ordering' : '➕ Add Items'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedTable(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {showSplit && activeOrder && (
        <SplitBillModal
          order={activeOrder}
          isOpen={true}
          onClose={() => setShowSplit(false)}
          onSplitComplete={() => {
            setShowSplit(false);
            setSelectedOrderIndex(0);
          }}
        />
      )}
    </div>
  );
}
