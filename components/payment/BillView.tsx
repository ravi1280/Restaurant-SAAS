'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { X, Printer } from 'lucide-react';

interface BillViewProps {
  order: Order;
  onClose: () => void;
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.109-1.343a9.96 9.96 0 004.9 1.287h.005c5.507 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.18-2.92-7.062A9.92 9.92 0 0012.012 2zm5.726 14.22c-.247.697-1.442 1.3-1.99 1.393-.5.086-1.155.15-3.344-.755-2.796-1.158-4.59-4-4.73-4.186-.14-.185-1.138-1.512-1.138-2.885 0-1.373.72-2.047.976-2.316.257-.269.566-.336.755-.336.19 0 .378.002.54.01.17.008.397-.064.622.485.228.556.78 1.9.847 2.037.067.137.112.298.022.478-.09.18-.135.292-.27.448-.135.157-.28.35-.4.5-.135.166-.277.348-.12.617.158.27.7 1.15 1.502 1.864.802.714 1.478.935 1.748 1.05.27.113.427.093.585-.09.158-.18.675-.787.855-1.056.18-.27.36-.225.607-.135.247.09 1.573.742 1.843.877.27.135.45.202.518.318.067.116.067.674-.18 1.371z" />
  </svg>
);

export function BillView({ order, onClose }: BillViewProps) {
  const { settings, menuItems } = useRestaurant();
  const [phone, setPhone] = useState(order.loyaltyPhone || '');

  const handlePrint = () => window.print();

  const handleWhatsAppShare = () => {
    if (!phone) return;

    // Format the items list
    const itemsText = order.items.map(item => {
      const unitPrice = item.price + item.selectedModifiers.reduce((s, m) => s + m.priceAdjustment, 0);
      let text = `${item.quantity}x ${item.name} - ${formatPrice(unitPrice * item.quantity)}`;
      if (item.selectedModifiers.length > 0) {
        text += `\n   (Modifiers: ${item.selectedModifiers.map(m => m.optionId).join(', ')})`;
      }
      return text;
    }).join('\n');

    // Create the full message template
    const message = `*${settings.restaurantName}*
${settings.tagline ? `_${settings.tagline}_\n` : ''}
*Receipt for Table ${order.tableId === 0 ? 'Takeaway' : `Table ${order.tableId}`}*
Order Ref: ${order.orderNumber}
Date: ${formatDateTime(order.createdAt)}

-------------------------
${itemsText}
-------------------------
Subtotal: ${formatPrice(order.subtotal)}
Service Charge (${settings.serviceChargePercent}%): ${formatPrice(order.serviceCharge)}
GST (${settings.gstPercent}%): ${formatPrice(order.gst)}
${order.discount > 0 ? `Discount: -${formatPrice(order.discount)}\n` : ''}
*Total Amount: ${formatPrice(order.total)}*

${order.pointsEarned > 0 ? `⭐ Points Earned: ${order.pointsEarned} points\n` : ''}
Thank you for dining with us!`;

    const formattedPhone = phone.replace(/[^0-9]/g, '');
    let finalPhone = formattedPhone;
    if (finalPhone.startsWith('0')) {
      finalPhone = '94' + finalPhone.substring(1);
    } else if (!finalPhone.startsWith('94') && finalPhone.length === 9) {
      finalPhone = '94' + finalPhone;
    }

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

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
          <span>{order.tableId === 0 ? 'Takeaway' : `Table ${order.tableId}`} · {order.orderNumber}</span>
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

        {/* WhatsApp sharing (print:hidden) */}
        <div className="mt-5 p-4 bg-success/5 border border-success/15 rounded-xl print:hidden">
          <div className="flex items-center gap-2 mb-2 text-success font-semibold text-xs">
            <WhatsAppIcon className="w-4 h-4 text-success" />
            <span>Share Receipt via WhatsApp</span>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 0771234567"
              className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-primary focus:border-success focus:outline-none"
            />
            <button
              onClick={handleWhatsAppShare}
              disabled={!phone}
              className="px-3.5 py-1.5 bg-success text-white font-bold text-xs rounded-lg hover:bg-success/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              Send
            </button>
          </div>
        </div>

        <div className="border-t border-dashed border-border mt-4 pt-3 text-center">
          <p className="text-xs text-muted">Thank you for dining with us!</p>
          <p className="text-xs text-muted font-mono tracking-wider">Powered by TableFlow</p>
        </div>
      </div>
    </div>
  );
}
