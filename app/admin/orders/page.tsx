'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { BillView } from '@/components/payment/BillView';
import { PaymentModal } from '@/components/payment/PaymentModal';
import { SplitBill } from '@/components/payment/SplitBill';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { Search, Filter, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OrderModificationModal } from '@/components/admin/OrderModificationModal';

const STATUS_TABS = ['all', 'pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'] as const;

export default function OrdersPage() {
  const { orders, updateOrder } = useRestaurant();
  const { showToast } = useToast();
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showModify, setShowModify] = useState(false);

  const sorted = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(o => (status === 'all' || o.status === status))
    .filter(o => !search ||
      o.orderNumber.includes(search) ||
      o.tableId.toString().includes(search) ||
      o.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-primary font-heading">Orders</h1>
        <p className="text-sm text-muted mt-1">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${status === s ? 'bg-accent text-white' : 'bg-elevated text-muted hover:text-primary'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order, table, item..."
            className="w-full pl-9 pr-3 py-1.5 bg-elevated border border-border rounded-xl text-sm text-primary focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Grid (Small Bill Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map(order => (
          <div key={order.id} className="bg-[#fcfaf5] dark:bg-elevated border border-border shadow-sm flex flex-col relative" style={{ borderRadius: '4px', borderTop: '4px solid var(--color-accent)' }}>
            
            <div className="p-4 flex-1">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-mono text-sm font-bold text-primary uppercase tracking-widest">{order.orderNumber}</p>
                  <p className="text-xs text-muted mt-0.5 font-medium">Table {order.tableId}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="border-t border-dashed border-border/60 my-3" />

              {/* Items */}
              <div className="space-y-2 mb-4 min-h-[60px]">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-xs items-start gap-2">
                    <span className="text-primary leading-tight"><span className="font-bold">{i.quantity}×</span> {i.name}</span>
                    <span className="text-primary whitespace-nowrap">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-border/60 my-3" />

              {/* Totals */}
              <div className="flex justify-between items-center text-sm font-black text-primary">
                <span>TOTAL</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <p className="text-[10px] text-muted text-right mt-1">{formatDateTime(order.createdAt)}</p>
            </div>

            {/* Actions */}
            <div className="bg-surface border-t border-border p-3 flex gap-2">
              <Button variant="ghost" className="flex-1 text-xs py-1.5 h-auto" onClick={() => setSelected(order)}>View</Button>
              {order.status !== 'paid' && order.status !== 'cancelled' && (
                <Button variant="secondary" className="flex-1 text-xs py-1.5 h-auto border-accent/20 text-accent hover:bg-accent/10" onClick={() => { setSelected(order); setShowPayment(true); }}>
                  Pay
                </Button>
              )}
            </div>
            
            {/* Receipt Zig Zag Bottom (Visual Effect) */}
            <div className="absolute -bottom-1 left-0 right-0 h-1 overflow-hidden" style={{ backgroundImage: 'linear-gradient(135deg, transparent 50%, var(--color-border) 50%), linear-gradient(45deg, transparent 50%, var(--color-border) 50%)', backgroundSize: '8px 4px', backgroundRepeat: 'repeat-x' }}></div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted text-sm bg-surface border border-dashed border-border rounded-xl">
            No orders found matching your filters.
          </div>
        )}
      </div>

      {/* Bill view modal */}
      {selected && !showPayment && !showSplit && !showModify && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm flex flex-col gap-3">
            <BillView order={selected} onClose={() => setSelected(null)} />
            
            {/* Actions Container */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 bg-elevated" onClick={() => setShowSplit(true)}>
                  Split Bill
                </Button>
                {['pending', 'preparing', 'ready'].includes(selected.status) && (
                  <Button variant="secondary" className="flex-1 bg-elevated" onClick={() => setShowModify(true)}>
                    <Edit3 size={14} className="mr-1 inline" /> Edit
                  </Button>
                )}
              </div>
              {selected.status !== 'paid' && (
                <Button variant="accent" className="w-full" onClick={() => setShowPayment(true)}>
                  Process Payment
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modify Order */}
      {selected && showModify && (
        <OrderModificationModal order={selected} onClose={() => { setShowModify(false); setSelected(null); }} />
      )}

      {/* Split bill */}
      {selected && showSplit && (
        <Modal isOpen onClose={() => setShowSplit(false)} title="Split Bill" maxWidth="md">
          <SplitBill order={selected} />
        </Modal>
      )}

      {/* Payment */}
      {selected && showPayment && (
        <PaymentModal
          order={selected}
          onClose={() => { setShowPayment(false); setSelected(null); }}
          onSuccess={() => {
            setShowPayment(false);
            setSelected(null);
            showToast('Payment processed!', 'success');
          }}
        />
      )}
    </div>
  );
}
