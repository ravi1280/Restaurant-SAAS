'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, generateId, generateOrderNumber, calculateOrderTotals, calculatePointsEarned, calculatePointsDiscount } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import { parseLocalStorage, setLocalStorage } from '@/lib/utils';
import { Order, Table } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Star } from 'lucide-react';
import { OrderStatus } from './OrderStatus';

interface CheckoutModalProps {
  tableId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ tableId, onClose, onSuccess }: CheckoutModalProps) {
  const { items, subtotal, orderNote, clearCart } = useCart();
  const { settings, addOrder, getLoyaltyAccount, updateLoyaltyAccount, updateTable, tables } = useRestaurant();
  const { showToast } = useToast();

  const [phone, setPhone] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [payNow, setPayNow] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const loyaltyAcc = phone.length >= 10 ? getLoyaltyAccount(phone) : undefined;
  const availablePoints = loyaltyAcc?.points || 0;
  const discount = redeemPoints && availablePoints >= settings.minPointsToRedeem
    ? Math.min(
        calculatePointsDiscount(availablePoints, settings.rsPerPoints),
        Math.floor(subtotal * 0.5)
      )
    : 0;

  const { serviceCharge, gst, total: baseTotal } = calculateOrderTotals(subtotal, settings);
  const total = Math.max(0, baseTotal - discount);
  const pointsEarned = calculatePointsEarned(total, settings.pointsPer100);

  const handlePlaceOrder = () => {
    setPlacing(true);
    setTimeout(() => {
      const order: Order = {
        id: generateId(),
        orderNumber: generateOrderNumber(),
        tableId,
        items: [...items],
        status: 'pending',
        subtotal,
        serviceCharge,
        gst,
        total,
        loyaltyPhone: phone || undefined,
        pointsEarned,
        pointsRedeemed: redeemPoints ? Math.floor(discount / settings.rsPerPoints) * 100 : 0,
        discount,
        orderNote,
        modifications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addOrder(order);

      // Update table status
      const tableObj = tables.find(t => t.id === tableId);
      if (tableObj) {
        updateTable({
          ...tableObj,
          status: 'ordering',
          currentOrderId: order.id,
          occupiedSince: tableObj.occupiedSince || new Date().toISOString(),
        });
      }

      // Handle loyalty
      if (phone.length >= 10) {
        const existing = getLoyaltyAccount(phone);
        if (existing) {
          updateLoyaltyAccount({
            ...existing,
            points: existing.points - (redeemPoints ? Math.floor(discount / settings.rsPerPoints) * 100 : 0) + pointsEarned,
            totalSpent: existing.totalSpent + total,
            totalOrders: existing.totalOrders + 1,
            lastVisit: new Date().toISOString(),
          });
        } else {
          updateLoyaltyAccount({
            phone,
            name: '',
            points: pointsEarned,
            totalSpent: total,
            totalOrders: 1,
            enrolledAt: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
          });
        }
      }

      clearCart();
      setPlacedOrder(order);
      setPlacing(false);
    }, 800);
  };

  if (placedOrder) {
    return (
      <Modal isOpen onClose={onClose} maxWidth="sm">
        <OrderStatus order={placedOrder} onClose={onSuccess} />
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Checkout" maxWidth="sm">
      <div className="p-5 space-y-4">
        {/* Order summary */}
        <div className="bg-elevated rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Order Summary</p>
          {items.map((item, i) => {
            const modsTotal = item.selectedModifiers.reduce((s, m) => s + m.priceAdjustment, 0);
            return (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted">{item.quantity}× {item.name}</span>
                <span className="text-primary">{formatPrice((item.price + modsTotal) * item.quantity)}</span>
              </div>
            );
          })}
        </div>

        {/* Loyalty */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-loyalty" />
            <p className="text-sm font-semibold text-primary">Loyalty Points</p>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Phone number to earn/redeem points"
            className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-sm text-primary focus:border-loyalty focus:outline-none"
          />
          {loyaltyAcc && (
            <div className="mt-2 p-3 bg-loyalty/10 border border-loyalty/20 rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs text-loyalty">⭐ {loyaltyAcc.points.toLocaleString()} points available</p>
                {availablePoints >= settings.minPointsToRedeem && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={redeemPoints}
                      onChange={e => setRedeemPoints(e.target.checked)}
                      className="rounded accent-loyalty"
                    />
                    <span className="text-xs text-loyalty">Redeem ({formatPrice(calculatePointsDiscount(availablePoints, settings.rsPerPoints))} off)</span>
                  </label>
                )}
              </div>
            </div>
          )}
          {phone.length >= 10 && !loyaltyAcc && (
            <p className="text-xs text-muted mt-1">New account will be created · You&apos;ll earn {pointsEarned} points</p>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-1.5 border-t border-border pt-3">
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>Service ({settings.serviceChargePercent}%)</span><span>{formatPrice(serviceCharge)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>GST ({settings.gstPercent}%)</span><span>{formatPrice(gst)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-loyalty">
              <span>Loyalty Discount</span><span>-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-primary border-t border-border pt-1.5">
            <span>Total</span><span>{formatPrice(total)}</span>
          </div>
          {phone && (
            <p className="text-xs text-success text-right">+{pointsEarned} points to earn</p>
          )}
        </div>

        <Button
          variant="accent"
          size="lg"
          loading={placing}
          onClick={handlePlaceOrder}
          className="w-full"
        >
          Place Order · Table {tableId}
        </Button>
      </div>
    </Modal>
  );
}
