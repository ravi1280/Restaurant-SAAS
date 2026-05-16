'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { generateId } from '@/lib/utils';
import { WaiterAlert } from '@/lib/types';
import { Bell } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface CallWaiterButtonProps {
  tableId: number;
  variant?: 'fab' | 'header';
}

const REASONS = [
  { id: 'assistance', label: 'Need assistance', icon: '🙋' },
  { id: 'order', label: 'Ready to order', icon: '📝' },
  { id: 'bill', label: 'Need the bill', icon: '💳' },
  { id: 'other', label: 'Other', icon: '💭' },
];

const COOLDOWN_SECS = 60;

export function CallWaiterButton({ tableId, variant = 'fab' }: CallWaiterButtonProps) {
  const { addWaiterAlert } = useRestaurant();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REASONS[0].label);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleCall = () => {
    const alert: WaiterAlert = {
      id: generateId(),
      tableId,
      reason: selectedReason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    addWaiterAlert(alert);
    showToast('Waiter has been called!', 'success');
    setCooldown(COOLDOWN_SECS);
    setShowModal(false);
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          onClick={() => cooldown <= 0 && setShowModal(true)}
          disabled={cooldown > 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-95 shadow-sm
            ${cooldown > 0
              ? 'bg-elevated border-border text-muted'
              : 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/50'
            }`}
          title={cooldown > 0 ? `Request sent ${COOLDOWN_SECS - cooldown}s ago` : 'Call Waiter'}
        >
          <Bell size={14} className={cooldown <= 0 ? "animate-pulse" : ""} />
          <span className="text-xs font-bold whitespace-nowrap">{cooldown > 0 ? `Sent (${cooldown}s)` : 'Call Waiter'}</span>
        </button>
      ) : (
        <>
          <button
            onClick={() => cooldown <= 0 && setShowModal(true)}
            disabled={cooldown > 0}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all active:scale-90
              ${cooldown > 0
                ? 'bg-elevated border-border text-muted'
                : 'bg-surface border-accent/40 text-accent hover:bg-accent/10'
              }`}
            style={cooldown > 0 ? {} : { animation: 'ripple 2s ease infinite' }}
            title={cooldown > 0 ? `Request sent ${COOLDOWN_SECS - cooldown}s ago` : 'Call Waiter'}
          >
            <Bell size={20} />
          </button>
          {cooldown > 0 && (
            <div className="absolute -top-8 left-0 w-12 text-center">
              <span className="text-[9px] text-muted whitespace-nowrap">{cooldown}s</span>
            </div>
          )}
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Call a Waiter" maxWidth="sm" position={variant === 'header' ? 'top' : 'center'}>
        <div className="p-6 space-y-5">
          <p className="text-sm text-muted text-center -mt-2">How can we help you at Table {tableId}?</p>
          <div className="grid grid-cols-2 gap-3">
            {REASONS.map(reason => {
              const isSelected = selectedReason === reason.label;
              return (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.label)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all
                    ${isSelected
                      ? 'bg-accent/10 border-accent text-accent shadow-sm scale-[1.02]'
                      : 'bg-elevated border-border text-muted hover:text-primary hover:border-accent/40 hover:bg-surface'
                    }`}
                >
                  <span className={`text-3xl mb-2 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                    {reason.icon}
                  </span>
                  <span className={`text-xs text-center font-bold tracking-wide ${isSelected ? 'text-accent' : ''}`}>
                    {reason.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 pt-3">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold">Cancel</Button>
            <Button variant="accent" onClick={handleCall} className="flex-1 py-3 rounded-xl font-bold shadow-lg shadow-accent/20">
              <Bell size={16} />
              Call Waiter
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
