'use client';

import React, { useState } from 'react';
import { Reservation } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { generateId } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ReservationFormProps {
  onClose: () => void;
  prefillDate?: string;
}

const TIMES: string[] = [];
for (let h = 11; h <= 22; h++) {
  TIMES.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 22) TIMES.push(`${h.toString().padStart(2, '0')}:30`);
}

export function ReservationForm({ onClose, prefillDate }: ReservationFormProps) {
  const { addReservation, tables } = useRestaurant();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [date, setDate] = useState(prefillDate || today);
  const [time, setTime] = useState('19:00');
  const [tablePreference, setTablePreference] = useState<string>('auto');
  const [specialRequests, setSpecialRequests] = useState('');
  const [depositTaken, setDepositTaken] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!guestName.trim()) errs.guestName = 'Guest name required';
    if (!phone.trim()) errs.phone = 'Phone required';
    if (!date) errs.date = 'Date required';
    if (date < today) errs.date = 'Date cannot be in the past';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const res: Reservation = {
        id: generateId(),
        guestName: guestName.trim(),
        phone: phone.trim(),
        guestCount,
        date,
        time,
        tableId: tablePreference === 'auto' ? undefined : parseInt(tablePreference),
        specialRequests: specialRequests.trim(),
        depositTaken,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      addReservation(res);
      showToast(`Reservation for ${guestName} confirmed`, 'success');
      setSaving(false);
      onClose();
    }, 400);
  };

  return (
    <Modal isOpen onClose={onClose} title="New Reservation" maxWidth="md">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-muted mb-1">Guest Name *</label>
            <input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
              placeholder="John Smith"
            />
            {errors.guestName && <p className="text-xs text-danger mt-1">{errors.guestName}</p>}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Phone *</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
              placeholder="+94771234567"
            />
            {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Guests</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGuestCount(g => Math.max(1, g - 1))}
                className="w-9 h-9 bg-elevated border border-border rounded-xl text-primary hover:bg-accent/10 transition-all"
              >-</button>
              <span className="font-bold text-primary w-6 text-center">{guestCount}</span>
              <button
                onClick={() => setGuestCount(g => Math.min(12, g + 1))}
                className="w-9 h-9 bg-elevated border border-border rounded-xl text-primary hover:bg-accent/10 transition-all"
              >+</button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Date *</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
            />
            {errors.date && <p className="text-xs text-danger mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Time</label>
            <select
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
            >
              {TIMES.map(t => (
                <option key={t} value={t}>
                  {parseInt(t) > 12 ? `${parseInt(t) - 12}:${t.split(':')[1]} PM` : `${t} AM`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Table Preference</label>
            <select
              value={tablePreference}
              onChange={e => setTablePreference(e.target.value)}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm"
            >
              <option value="auto">Auto-assign</option>
              {tables.filter(t => t.status === 'available').map(t => (
                <option key={t.id} value={t.id.toString()}>
                  Table {t.id} ({t.seats} seats)
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-muted mb-1">Special Requests</label>
            <textarea
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-elevated border border-border rounded-xl text-primary focus:border-accent focus:outline-none text-sm resize-none"
              placeholder="Window seat, birthday celebration, dietary needs..."
            />
          </div>

          <div className="col-span-2 flex items-center justify-between py-2">
            <label className="text-sm text-muted">Deposit taken</label>
            <button
              onClick={() => setDepositTaken(!depositTaken)}
              className={`w-12 h-6 rounded-full transition-all relative ${depositTaken ? 'bg-success' : 'bg-elevated border border-border'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${depositTaken ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="accent" loading={saving} onClick={handleSubmit} className="flex-1">
            Confirm Reservation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
