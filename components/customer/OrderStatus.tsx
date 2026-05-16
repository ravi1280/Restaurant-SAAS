'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { parseLocalStorage, estimateWaitMinutes, formatWaitTime } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Star } from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';

interface OrderStatusProps {
  order: Order;
  onClose: () => void;
}

const STEPS = ['Order Received', 'Preparing', 'Ready to Serve'];

export function OrderStatus({ order, onClose }: OrderStatusProps) {
  const { updateOrder } = useRestaurant();
  const [step, setStep] = useState(0);
  const [liveOrder, setLiveOrder] = useState(order);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(!!order.feedback);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 3000);
    const t2 = setTimeout(() => setStep(2), 11000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Poll for real status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const orders = parseLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
      const updated = orders.find(o => o.id === order.id);
      if (updated) {
        setLiveOrder(updated);
        if (updated.status === 'preparing' && step < 1) setStep(1);
        if (updated.status === 'ready' && step < 2) setStep(2);
        if (['served', 'paid'].includes(updated.status) && step < 3) setStep(3);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [order.id, step]);

  return (
    <div className="p-6 text-center space-y-6">
      {/* Success animation */}
      <div
        className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center"
        style={{ animation: step === 2 ? 'pulse 1s infinite' : 'scaleIn 0.5s ease' }}
      >
        <CheckCircle
          size={40}
          className={`transition-colors duration-500 ${step === 2 ? 'text-success' : 'text-success/50'}`}
        />
      </div>

      <div>
        <p className="text-xl font-bold text-primary">
          {step === 2 ? '🎉 Ready to Serve!' : 'Order Placed!'}
        </p>
        <p className="text-muted text-sm mt-1">
          {liveOrder.orderNumber} · Table {liveOrder.tableId}
        </p>
        {step < 2 && (
          <p className="text-xs text-muted mt-1">
            Estimated wait: {formatWaitTime(estimateWaitMinutes(
              parseLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []).filter(o => o.status === 'preparing').length,
              12
            ))}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-3">
        {STEPS.map((label, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500
              ${idx < step ? 'bg-success text-white' :
                idx === step ? 'bg-accent text-white scale-110' :
                  'bg-elevated text-muted border border-border'}`}>
              {idx < step ? '✓' : idx + 1}
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-medium transition-colors duration-500
                ${idx === step ? 'text-primary' : idx < step ? 'text-success' : 'text-muted'}`}>
                {label}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-full h-0.5 rounded-full transition-all duration-500
                ${idx < step ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 2 && (
        <div
          className="p-3 bg-success/10 border border-success/20 rounded-xl"
          style={{ animation: 'fadeIn 0.5s ease' }}
        >
          <p className="text-success font-semibold">Your order is ready! 🎊</p>
          <p className="text-muted text-xs mt-1">Your waiter is bringing your order</p>
        </div>
      )}

      {step === 3 && (
        <div className="p-4 bg-elevated rounded-xl border border-border" style={{ animation: 'fadeIn 0.5s ease' }}>
          {feedbackSubmitted || liveOrder.feedback ? (
            <div className="text-center py-4">
              <Star size={32} className="text-warning mx-auto mb-2" fill="currentColor" />
              <p className="font-semibold text-primary">Thank you for your feedback!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-primary">How was your food?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)}>
                    <Star
                      size={28}
                      className={star <= rating ? 'text-warning fill-current' : 'text-muted'}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell us what you liked (optional)"
                className="w-full bg-surface border border-border p-2 rounded-lg text-sm h-16"
              />
              <Button
                variant="accent"
                className="w-full"
                disabled={rating === 0}
                onClick={() => {
                  updateOrder({
                    ...liveOrder,
                    feedback: { rating: rating as 1|2|3|4|5, comment, submittedAt: new Date().toISOString() }
                  });
                  setFeedbackSubmitted(true);
                }}
              >
                Submit Feedback
              </Button>
            </div>
          )}
        </div>
      )}

      <Button variant="secondary" onClick={onClose} className="w-full">
        Back to Menu
      </Button>
    </div>
  );
}
