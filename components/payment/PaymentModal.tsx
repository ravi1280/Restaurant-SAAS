'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatPrice } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CheckCircle, CreditCard, Banknote, QrCode } from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStep = 'choose' | 'cash' | 'card' | 'qr' | 'success';

export function PaymentModal({ order, onClose, onSuccess }: PaymentModalProps) {
  const { updateOrder, updateLoyaltyAccount, getLoyaltyAccount } = useRestaurant();
  const [step, setStep] = useState<PaymentStep>('choose');
  const [tendered, setTendered] = useState('');
  const [processing, setProcessing] = useState(false);

  const processPayment = (method: Order['paymentMethod']) => {
    setProcessing(true);
    setTimeout(() => {
      const paidOrder: Order = {
        ...order,
        status: 'paid',
        paymentMethod: method,
        updatedAt: new Date().toISOString(),
      };
      updateOrder(paidOrder);

      // Award loyalty points
      if (order.loyaltyPhone) {
        const acc = getLoyaltyAccount(order.loyaltyPhone);
        if (acc) {
          updateLoyaltyAccount({
            ...acc,
            points: acc.points + order.pointsEarned - order.pointsRedeemed,
            totalSpent: acc.totalSpent + order.total,
            totalOrders: acc.totalOrders + 1,
            lastVisit: new Date().toISOString(),
          });
        }
      }

      setProcessing(false);
      setStep('success');
    }, 1500);
  };

  const change = tendered ? Math.max(0, parseFloat(tendered) - order.total) : 0;

  return (
    <Modal isOpen onClose={onClose} title="Payment" maxWidth="sm">
      <div className="p-5">
        {step === 'choose' && (
          <div className="space-y-3">
            <p className="text-center text-2xl font-bold text-primary">{formatPrice(order.total)}</p>
            <p className="text-center text-sm text-muted mb-4">Choose payment method</p>
            {[
              { id: 'cash', label: 'Cash', icon: <Banknote size={20} /> },
              { id: 'card', label: 'Card / POS', icon: <CreditCard size={20} /> },
              { id: 'qr', label: 'QR Pay', icon: <QrCode size={20} /> },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setStep(m.id as PaymentStep)}
                className="w-full flex items-center gap-3 p-4 bg-elevated border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all text-left"
              >
                <span className="text-accent">{m.icon}</span>
                <span className="font-medium text-primary">{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'cash' && (
          <div className="space-y-4">
            <p className="text-center text-2xl font-bold text-primary">{formatPrice(order.total)}</p>
            <div>
              <label className="block text-sm text-muted mb-2">Amount Tendered (Rs.)</label>
              <input
                type="number"
                value={tendered}
                onChange={e => setTendered(e.target.value)}
                placeholder={order.total.toString()}
                className="w-full px-4 py-3 bg-elevated border border-border rounded-xl text-primary text-xl font-bold focus:border-accent focus:outline-none text-center"
                autoFocus
              />
            </div>
            {tendered && parseFloat(tendered) >= order.total && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-center">
                <p className="text-success font-semibold">Change: {formatPrice(change)}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep('choose')} className="flex-1">Back</Button>
              <Button
                variant="accent"
                loading={processing}
                disabled={!tendered || parseFloat(tendered) < order.total}
                onClick={() => processPayment('cash')}
                className="flex-1"
              >
                Confirm Cash
              </Button>
            </div>
          </div>
        )}

        {step === 'card' && (
          <div className="space-y-4 text-center">
            <p className="text-2xl font-bold text-primary">{formatPrice(order.total)}</p>
            <div className="p-8 bg-elevated rounded-xl border border-border">
              <CreditCard size={48} className="text-accent mx-auto mb-3" />
              <p className="text-primary font-medium">Present card to POS terminal</p>
              <p className="text-muted text-sm mt-1">Awaiting card tap/swipe...</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep('choose')} className="flex-1">Back</Button>
              <Button variant="accent" loading={processing} onClick={() => processPayment('card')} className="flex-1">
                Confirm Approved ✓
              </Button>
            </div>
          </div>
        )}

        {step === 'qr' && (
          <div className="space-y-4 text-center">
            <p className="text-2xl font-bold text-primary">{formatPrice(order.total)}</p>
            <div className="p-6 bg-white rounded-xl mx-auto w-48 h-48 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-sm"
                    style={{
                      backgroundColor: [0, 2, 6, 8].includes(i) ? '#111' : i === 4 ? '#E8784A' : Math.random() > 0.5 ? '#111' : '#fff',
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-muted text-sm">Scan with any payment app</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep('choose')} className="flex-1">Back</Button>
              <Button variant="accent" loading={processing} onClick={() => processPayment('qr')} className="flex-1">
                Confirm Payment
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto" style={{ animation: 'scaleIn 0.3s ease' }}>
              <CheckCircle size={32} className="text-success" />
            </div>
            <div>
              <p className="text-xl font-bold text-primary">Payment Complete!</p>
              <p className="text-muted text-sm mt-1">{order.orderNumber}</p>
            </div>
            {order.pointsEarned > 0 && (
              <div className="p-2 bg-loyalty/10 border border-loyalty/20 rounded-xl">
                <p className="text-xs text-loyalty">⭐ {order.pointsEarned} loyalty points awarded</p>
              </div>
            )}
            <Button variant="accent" onClick={onSuccess} className="w-full">Done</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
