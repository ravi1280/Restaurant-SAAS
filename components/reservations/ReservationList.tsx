'use client';

import React, { useState } from 'react';
import { Reservation } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Phone, Users, Calendar, Clock, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';

interface ReservationListProps {
  reservations: Reservation[];
}

type RTab = 'upcoming' | 'today' | 'past' | 'cancelled';

export function ReservationList({ reservations }: ReservationListProps) {
  const { updateReservation, updateTable, tables } = useRestaurant();
  const { showToast } = useToast();
  const [tab, setTab] = useState<RTab>('today');
  const [search, setSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  const filterRes = (r: Reservation) => {
    const dateStr = r.date;
    switch (tab) {
      case 'today': return dateStr === today && r.status !== 'cancelled';
      case 'upcoming': return dateStr > today && r.status !== 'cancelled';
      case 'past': return (dateStr < today || r.status === 'arrived' || r.status === 'no-show') && r.status !== 'cancelled';
      case 'cancelled': return r.status === 'cancelled';
      default: return true;
    }
  };

  const filtered = reservations
    .filter(filterRes)
    .filter(r =>
      !search ||
      r.guestName.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const counts: Record<RTab, number> = {
    today: reservations.filter(r => r.date === today && r.status !== 'cancelled').length,
    upcoming: reservations.filter(r => r.date > today && r.status !== 'cancelled').length,
    past: reservations.filter(r => r.date < today || r.status === 'arrived').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  };

  const handleCheckin = (res: Reservation) => {
    updateReservation({ ...res, status: 'arrived' });
    // Mark table as occupied
    if (res.tableId) {
      const table = tables.find(t => t.id === res.tableId);
      if (table) {
        updateTable({ ...table, status: 'occupied', occupiedSince: new Date().toISOString() });
      }
    }
    showToast(`${res.guestName} checked in`, 'success');
  };

  const handleNoShow = (res: Reservation) => {
    updateReservation({ ...res, status: 'no-show' });
    showToast(`${res.guestName} marked as no-show`, 'warning');
  };

  const handleCancel = (res: Reservation) => {
    updateReservation({ ...res, status: 'cancelled' });
    showToast(`Reservation cancelled`, 'info');
  };

  return (
    <div className="space-y-4">
      {/* Tabs + search */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['today', 'upcoming', 'past', 'cancelled'] as RTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${tab === t ? 'bg-accent text-white' : 'bg-elevated text-muted hover:text-primary'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {counts[t] > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${tab === t ? 'bg-white/20' : 'bg-accent/20 text-accent'}`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or phone..."
          className="flex-1 min-w-40 px-3 py-1.5 bg-elevated border border-border rounded-xl text-sm text-primary focus:border-accent focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <Calendar className="w-12 h-12 text-muted/40 mb-3" />
          <p className="text-muted text-sm">No reservations for this period</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(res => (
            <div key={res.id} className="bg-surface border border-border rounded-2xl p-4 hover:border-accent/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-primary">{res.guestName}</p>
                    <StatusBadge status={res.status} />
                    {res.depositTaken && (
                      <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 flex items-center gap-1 font-semibold uppercase tracking-wider">
                        <CreditCard size={10} /> Deposit
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />{res.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />{res.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} />{res.guestCount} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={11} />{res.phone}
                    </span>
                    {res.tableId && (
                      <span>Table {res.tableId}</span>
                    )}
                  </div>
                  {res.specialRequests && (
                    <p className="text-xs text-muted mt-1 italic">"{res.specialRequests}"</p>
                  )}
                </div>

                {res.status === 'confirmed' && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="success" size="sm" onClick={() => handleCheckin(res)}>
                      Check-in
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleNoShow(res)}>
                      No Show
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleCancel(res)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
