'use client';

import React, { useState } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { ReservationList } from '@/components/reservations/ReservationList';
import { ReservationForm } from '@/components/reservations/ReservationForm';
import { Reservation } from '@/lib/types';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ReservationsPage() {
  const { reservations } = useRestaurant();
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayCount = reservations.filter(r => r.date === today && r.status !== 'cancelled').length;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary font-heading">Reservations</h1>
          <p className="text-sm text-muted mt-1">
            {todayCount > 0 ? `${todayCount} reservations today` : 'No reservations today'}
            {' · '}
            {reservations.length} total
          </p>
        </div>
        <Button variant="accent" onClick={() => setShowForm(true)}>
          <Plus size={16} />
          New Reservation
        </Button>
      </div>

      {/* Calendar mini-view */}
      <ReservationCalendarMini reservations={reservations} />

      <ReservationList reservations={reservations} />

      {showForm && (
        <ReservationForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function ReservationCalendarMini({ reservations }: { reservations: Reservation[] }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getDayReservations = (day: number) => {
    const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return reservations.filter(r => r.date === dateStr && r.status !== 'cancelled');
  };

  const isToday = (day: number) => {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Calendar size={20} className="text-accent" />
          {monthNames[viewMonth]} {viewYear}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
              else setViewMonth(m => m - 1);
            }}
            className="p-2 rounded-lg bg-elevated border border-border hover:bg-accent/10 hover:text-accent transition-all text-muted"
          >←</button>
          <button
            onClick={() => {
              setViewMonth(today.getMonth());
              setViewYear(today.getFullYear());
            }}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-elevated border border-border hover:bg-accent/10 hover:text-accent transition-all text-muted"
          >Today</button>
          <button
            onClick={() => {
              if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
              else setViewMonth(m => m + 1);
            }}
            className="p-2 rounded-lg bg-elevated border border-border hover:bg-accent/10 hover:text-accent transition-all text-muted"
          >→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted uppercase tracking-wider">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="bg-background/50 rounded-xl" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayRes = getDayReservations(day);
          const todayFlag = isToday(day);
          const hasRes = dayRes.length > 0;
          
          return (
            <div
              key={day}
              className={`min-h-[80px] p-2 flex flex-col justify-between rounded-xl border transition-all cursor-pointer
                ${todayFlag 
                  ? 'bg-accent/10 border-accent/30' 
                  : hasRes 
                    ? 'bg-elevated border-border hover:border-accent/40' 
                    : 'bg-surface border-border hover:bg-elevated'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                  ${todayFlag ? 'bg-accent text-white' : 'text-primary'}
                `}>
                  {day}
                </span>
                {hasRes && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent/20 text-accent">
                    {dayRes.length}
                  </span>
                )}
              </div>
              
              <div className="mt-auto pt-1">
                {hasRes ? (
                  <div className="flex -space-x-1 overflow-hidden">
                    {dayRes.slice(0, 3).map((r, i) => (
                      <div key={i} className="w-4 h-4 rounded-full bg-loyalty border border-surface flex items-center justify-center text-[8px] text-white font-bold" title={r.guestName}>
                        {r.guestName.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {dayRes.length > 3 && (
                      <div className="w-4 h-4 rounded-full bg-elevated border border-surface flex items-center justify-center text-[8px] text-muted font-bold">
                        +
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
