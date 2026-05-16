'use client';

import React from 'react';
import { Order } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { X, Printer } from 'lucide-react';

interface BillViewProps {
  order: Order;
  onClose: () => void;
}

export function BillView({ order, onClose }: BillViewProps) {
  const { settings, menuItems } = useRestaurant();

  const handlePrint = () => window.print();

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Close */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border print:hidden">
        <h3 className="font-semibold text-primary">Bill / Receipt</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-primary transition-all"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-primary transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-5 print:p-4">
        {/* Restaurant header */}
        <div className="text-center mb-5">
          <p className="text-xl font-bold text-primary font-heading">{settings.restaurantName}</p>
          <p className="text-xs text-muted">{settings.tagline}</p>
          <p className="text-xs text-muted mt-1">{settings.address}</p>
          <p className="text-xs text-muted">{settings.phone}</p>
          <p className="text-xs text-muted">GST: {settings.gstNumber}</p>
        </div>

        <div className="border-t border-dashed border-border my-4" />

        {/* Order info */}
        <div className="flex justify-between text-xs text-muted mb-3">
          <span>Table {order.tableId} · {order.orderNumber}</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          {order.items.map((item, idx) => {
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            const modsTotal = item.selectedModifiers.reduce((s, m) => s + m.priceAdjustment, 0);
            const unitPrice = item.price + modsTotal;
            return (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary">{item.quantity}× {item.name}</span>
                  <span className="text-primary font-medium">{formatPrice(unitPrice * item.quantity)}</span>
                </div>
                {item.selectedModifiers.length > 0 && (
                  <div className="pl-4 mt-0.5">
                    {item.selectedModifiers.map((mod, mi) => (
                      <p key={mi} className="text-xs text-muted">
                        └ {mod.optionId}
                        {mod.priceAdjustment > 0 && ` (+${formatPrice(mod.priceAdjustment)})`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-dashed border-border my-3" />

        {/* Totals */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="text-primary">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Service Charge ({settings.serviceChargePercent}%)</span>
            <span className="text-primary">{formatPrice(order.serviceCharge)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">GST ({settings.gstPercent}%)</span>
            <span className="text-primary">{formatPrice(order.gst)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-loyalty">Loyalty Discount</span>
              <span className="text-loyalty">-{formatPrice(order.discount)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-border my-3" />

        <div className="flex justify-between text-lg font-bold text-primary">
          <span>TOTAL</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        {order.pointsEarned > 0 && (
          <div className="mt-3 p-2 bg-loyalty/10 border border-loyalty/20 rounded-xl text-center">
            <p className="text-xs text-loyalty">⭐ You earned <strong>{order.pointsEarned} points</strong> on this order!</p>
          </div>
        )}

        <div className="border-t border-dashed border-border mt-4 pt-3 text-center">
          <p className="text-xs text-muted">Thank you for dining with us!</p>
          <p className="text-xs text-muted">Powered by TableFlow</p>
        </div>
      </div>
    </div>
  );
}
