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

interface TableDetailPanelProps {
  table: Table;
  onClose: () => void;
}

export function TableDetailPanel({ table, onClose }: TableDetailPanelProps) {
  const { orders, updateTable, updateOrder, waiterAlerts, updateWaiterAlert } = useRestaurant();
  const { showToast } = useToast();
  const [showBill, setShowBill] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<number | ''>('');

  const currentOrder = table.currentOrderId
    ? orders.find(o => o.id === table.currentOrderId)
    : undefined;

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

  const handleMarkBillPending = () => {
    updateTable({ ...table, status: 'bill-pending' });
    showToast(`Table ${table.id} marked as bill pending`, 'info');
  };

  return (
    <div className="w-80 h-full bg-surface border-l border-border flex flex-col">
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

        {/* Current order */}
        {currentOrder ? (
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Current Order</p>
              <span className="font-mono text-xs text-primary">{currentOrder.orderNumber}</span>
            </div>
            <div className="space-y-2 mb-3">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    <span className="text-primary font-medium">{item.quantity}×</span> {item.name}
                  </span>
                  <span className="text-primary">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between text-sm font-semibold text-primary">
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
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setShowBill(true)}
            >
              <DollarSign size={14} />
              View Full Bill
            </Button>
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
            {table.mergedWith ? (
              <Button variant="ghost" size="sm" className="w-full text-muted" onClick={() => updateTable({ ...table, mergedWith: undefined })}>
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
              className="flex-1 bg-surface border border-border p-1.5 rounded-lg text-sm"
            >
              <option value="">Select table...</option>
              {Array.from({ length: 20 }, (_, i) => i + 1)
                .filter(id => id !== table.id)
                .map(id => <option key={id} value={id}>Table {id}</option>)}
            </select>
            <Button size="sm" variant="accent" onClick={() => {
              if (mergeTarget) {
                updateTable({ ...table, mergedWith: [...(table.mergedWith || []), mergeTarget as number] });
                setShowMerge(false);
                setMergeTarget('');
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
            updateTable({ ...table, status: 'available', currentOrderId: undefined, occupiedSince: undefined });
            showToast('Payment complete! Table cleared.', 'success');
          }}
        />
      )}
    </div>
  );
}
