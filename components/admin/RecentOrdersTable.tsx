'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatPrice, formatTime } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: Order[];
  onRowClick?: (order: Order) => void;
}

const PAGE_SIZE = 10;

export function RecentOrdersTable({ orders, onRowClick }: RecentOrdersTableProps) {
  const [page, setPage] = useState(0);

  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const total = Math.ceil(sorted.length / PAGE_SIZE);
  const slice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-primary">Recent Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Order #', 'Table', 'Items', 'Total', 'Status', 'Time'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {slice.map(order => (
              <tr
                key={order.id}
                onClick={() => onRowClick?.(order)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-elevated' : ''}`}
              >
                <td className="px-4 py-3 font-mono text-sm text-primary">{order.orderNumber}</td>
                <td className="px-4 py-3 text-sm text-muted">Table {order.tableId}</td>
                <td className="px-4 py-3 text-sm text-muted">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} items
                </td>
                <td className="px-4 py-3 text-sm font-medium text-primary">{formatPrice(order.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-xs text-muted font-mono">{formatTime(order.createdAt)}</td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted text-sm">No orders yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {total > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted">
            Page {page + 1} of {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-elevated disabled:opacity-40 transition-all text-muted"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(total - 1, p + 1))}
              disabled={page === total - 1}
              className="p-1.5 rounded-lg hover:bg-elevated disabled:opacity-40 transition-all text-muted"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
