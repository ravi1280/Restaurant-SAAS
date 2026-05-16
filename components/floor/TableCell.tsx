'use client';

import React from 'react';
import { Table } from '@/lib/types';
import { getElapsedDisplay } from '@/lib/utils';
import { Bell, Link2, Users } from 'lucide-react';

interface TableCellProps {
  table: Table;
  isSelected: boolean;
  onClick: () => void;
}

const STATUS_STYLES: Record<Table['status'], { bg: string; border: string; text: string; dot: string }> = {
  available: {
    bg: 'bg-elevated hover:bg-success/10',
    border: 'border-border hover:border-success/40',
    text: 'text-muted',
    dot: 'bg-success',
  },
  occupied: {
    bg: 'bg-warning/10 hover:bg-warning/15',
    border: 'border-warning/40',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  ordering: {
    bg: 'bg-info/10 hover:bg-info/15',
    border: 'border-info/40',
    text: 'text-info',
    dot: 'bg-info',
  },
  'bill-pending': {
    bg: 'bg-loyalty/10 hover:bg-loyalty/15',
    border: 'border-loyalty/40',
    text: 'text-loyalty',
    dot: 'bg-loyalty',
  },
  reserved: {
    bg: 'bg-info/10 hover:bg-info/15',
    border: 'border-info/30',
    text: 'text-info',
    dot: 'bg-info',
  },
};

const STATUS_LABELS: Record<Table['status'], string> = {
  available: 'Free',
  occupied: 'Occupied',
  ordering: 'Active Order',
  'bill-pending': 'Bill Pending',
  reserved: 'Reserved',
};

export function TableCell({ table, isSelected, onClick }: TableCellProps) {
  const style = STATUS_STYLES[table.status];
  const pendingAlerts = (table.waiterAlerts || []).filter(a => a.status === 'pending');
  const isCircle = table.seats <= 2;

  return (
    <button
      onClick={onClick}
      className={`relative p-3 flex flex-col items-center justify-center transition-all duration-300 text-center
        ${isCircle ? 'rounded-full aspect-square' : 'rounded-2xl aspect-[4/3]'}
        border-2 shadow-sm
        ${style.bg} ${style.border}
        ${isSelected ? 'ring-4 ring-accent/30 ring-offset-2 ring-offset-background scale-[1.03] shadow-md' : 'hover:scale-[1.03] hover:shadow-md'}
      `}
    >
      {/* Waiter alert badge */}
      {pendingAlerts.length > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg animate-bounce z-10">
          <Bell size={12} className="text-white" />
        </div>
      )}

      {/* Merged badge */}
      {table.mergedWith && table.mergedWith.length > 0 && (
        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-info rounded-full flex items-center justify-center shadow-lg z-10" title={`Merged with ${table.mergedWith.join(', ')}`}>
          <Link2 size={12} className="text-white" />
        </div>
      )}

      {/* Status dot */}
      <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${style.dot} shadow-sm`} />

      {/* Table number */}
      <div className={`flex flex-col items-center justify-center ${isCircle ? 'mt-1' : 'mt-0'}`}>
        <p className="text-3xl font-black text-primary font-heading tracking-tight drop-shadow-sm leading-none">{table.id}</p>
        
        {/* Seats indicator */}
        <div className="flex items-center gap-1 mt-1 text-muted">
          <Users size={10} />
          <span className="text-[10px] font-bold">{table.seats}</span>
        </div>
      </div>

      {/* Status Label */}
      <div className={`mt-2 px-2 py-0.5 rounded-md bg-background/50 backdrop-blur-sm border ${style.border} ${style.text}`}>
        <p className="text-[9px] font-bold tracking-wider uppercase">
          {STATUS_LABELS[table.status]}
        </p>
      </div>

      {/* Timer */}
      {table.occupiedSince && table.status !== 'available' && (
        <p className="text-[10px] font-mono font-medium text-muted mt-1 bg-background/40 px-1.5 rounded-sm">
          {getElapsedDisplay(table.occupiedSince)}
        </p>
      )}
    </button>
  );
}
