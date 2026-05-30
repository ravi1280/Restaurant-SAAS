'use client';

import React, { useState } from 'react';
import { Table, Order, WaiterAlert } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, formatDateTime, getElapsedDisplay } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { X, Bell, CheckCircle, Clock, DollarSign, UserX, Link2, Unlink } from 'lucide-react';
import { BillView } from '@/components/payment/BillView';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { SplitBillModal } from '@/components/payment/SplitBillModal';

interface TableDetailPanelProps {
  table: Table;
  onClose: () => void;
}

export function TableDetailPanel({ table, onClose }: TableDetailPanelProps) {
  const { orders, updateTable, mergeTables, unmergeTables, waiterAlerts, updateWaiterAlert } = useRestaurant();
  const { showToast } = useToast();
  const [showBill, setShowBill] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<number | ''>('');
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);

  // Find all active orders for this table
  const activeOrders = orders.filter(
    o => o.tableId === table.id && o.status !== 'paid' && o.status !== 'cancelled'
  );

  const currentOrder = activeOrders[selectedOrderIndex] || activeOrders[0];

  const tableAlerts = (waiterAlerts || []).filter(
    a => a.tableId === table.id && a.status === 'pending'
  );

  const handleAcknowledgeAlert = (alert: WaiterAlert) => {
    updateWaiterAlert({ ...alert, status: 'acknowledged' });
    showToast(`Alert acknowledged for Table ${table.id}`, 'success');
  };

  const handleClearTable = () => {
    updateTable({
      ...table,
      status: 'available',
      currentOrderId: undefined,
      occupiedSince: undefined,
      waiterAlerts: [],
    });
    showToast(`Table ${table.id} cleared`, 'success');
  };

  return (
    <div className="w-full h-full bg-surface flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-primary">Table {table.id}</h3>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={table.status} />
            <span className="text-xs text-muted">{table.seats} seats</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-primary transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Select active order if multiple bills exist */}
      {activeOrders.length > 1 && (
        <div className="px-5 py-2.5 bg-elevated border-b border-border flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-muted">Select Bill:</span>
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

      <div className="flex-1 overflow-y-auto">
        {/* Occupied since */}
        {table.occupiedSince && (
          <div className="px-5 py-3 border-b border-border flex items-center gap-2 text-sm">
            <Clock size={14} className="text-muted" />
            <span className="text-muted">Seated: </span>
            <span className="text-primary font-medium">{getElapsedDisplay(table.occupiedSince)}</span>
          </div>
        )}

        {/* Waiter alerts */}
        {tableAlerts.length > 0 && (
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
              🔔 Waiter Alerts
            </p>
            <div className="space-y-2">
              {tableAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between gap-2 p-2 bg-accent/10 rounded-xl border border-accent/20">
                  <div>
                    <p className="text-xs font-medium text-primary">{alert.reason}</p>
                    <p className="text-[10px] text-muted">{formatDateTime(alert.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlert(alert)}
                    className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all shrink-0"
                  >
                    <CheckCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current order details */}
        {currentOrder ? (
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Order Items</p>
              <span className="font-mono text-xs text-primary font-bold">{currentOrder.orderNumber}</span>
            </div>
            <div className="space-y-2 mb-3">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    <span className="text-primary font-semibold">{item.quantity}×</span> {item.name}
                  </span>
                  <span className="text-primary font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between text-sm font-bold text-primary">
                <span>Total</span>
                <span>{formatPrice(currentOrder.total)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <p className="text-muted text-sm">No active order</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-border space-y-2">
        {currentOrder && (
          <>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs py-2 h-auto"
                onClick={() => setShowBill(true)}
              >
                <DollarSign size={14} />
                View Bill
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs py-2 h-auto"
                onClick={() => setShowSplit(true)}
              >
                Split Bill
              </Button>
            </div>
            <Button
              variant="accent"
              size="sm"
              className="w-full"
              onClick={() => setShowPayment(true)}
            >
              Mark Paid
            </Button>
          </>
        )}
        {table.status !== 'available' && (
          <>
            <Button variant="ghost" size="sm" className="w-full text-muted" onClick={handleClearTable}>
              <UserX size={14} /> Clear Table
            </Button>
            {table.mergedWith && table.mergedWith.length > 0 ? (
              <Button variant="ghost" size="sm" className="w-full text-muted" onClick={() => unmergeTables(table.id)}>
                <Unlink size={14} /> Unmerge
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full text-muted" onClick={() => setShowMerge(true)}>
                <Link2 size={14} /> Merge Table
              </Button>
            )}
          </>
        )}
      </div>

      {showMerge && (
        <div className="px-5 py-4 border-t border-border bg-elevated">
          <p className="text-xs font-semibold mb-2">Merge with Table:</p>
          <div className="flex gap-2">
            <select
              value={mergeTarget}
              onChange={e => setMergeTarget(parseInt(e.target.value))}
              className="flex-1 bg-surface border border-border p-1.5 rounded-lg text-sm focus:outline-none"
            >
              <option value="">Select table...</option>
              {Array.from({ length: 20 }, (_, i) => i + 1)
                .filter(id => id !== table.id)
                .map(id => <option key={id} value={id}>Table {id}</option>)}
            </select>
            <Button size="sm" variant="accent" onClick={() => {
              if (mergeTarget) {
                mergeTables(table.id, [mergeTarget as number]);
                setShowMerge(false);
                setMergeTarget('');
                showToast(`Table ${table.id} merged with Table ${mergeTarget}`, 'success');
              }
            }}>Merge</Button>
          </div>
        </div>
      )}

      {showBill && currentOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowBill(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm">
            <BillView order={currentOrder} onClose={() => setShowBill(false)} />
          </div>
        </div>
      )}

      {showPayment && currentOrder && (
        <PaymentModal
          order={currentOrder}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            
            // If this was the last active order, free up the table
            if (activeOrders.length <= 1) {
              updateTable({ ...table, status: 'available', currentOrderId: undefined, occupiedSince: undefined });
            }
            setSelectedOrderIndex(0);
            showToast('Payment complete! Order settled.', 'success');
          }}
        />
      )}

      {showSplit && currentOrder && (
        <SplitBillModal
          order={currentOrder}
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
