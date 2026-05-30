'use client';

import React, { useState, useEffect } from 'react';
import { useRestaurant } from '@/context/RestaurantContext';
import { TableCell } from '@/components/floor/TableCell';
import { TableDetailPanel } from '@/components/floor/TableDetailPanel';
import { Table } from '@/lib/types';
import { RefreshCw, UserPlus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function FloorPage() {
  const { tables, refreshTables, updateTable } = useRestaurant();
  const { showToast } = useToast();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Poll for updates every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTables();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshTables]);

  // Sync selected table when tables update
  useEffect(() => {
    if (selectedTable) {
      const updated = tables.find(t => t.id === selectedTable.id);
      if (updated) setSelectedTable(updated);
    }
  }, [tables]);

  const counts = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => ['occupied', 'ordering'].includes(t.status)).length,
    billPending: tables.filter(t => t.status === 'bill-pending').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  const handleWalkIn = () => {
    const free = tables.find(t => t.status === 'available');
    if (!free) {
      showToast('No available tables!', 'warning');
      return;
    }
    updateTable({
      ...free,
      status: 'occupied',
      occupiedSince: new Date().toISOString(),
    });
    setSelectedTable({ ...free, status: 'occupied' });
    showToast(`Walk-in seated at Table ${free.id}`, 'success');
  };

  return (
    <div className="flex h-full gap-0">
      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary font-heading">Floor Plan</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-success rounded-full" />{counts.available} Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-warning rounded-full" />{counts.occupied} Occupied
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-loyalty rounded-full" />{counts.billPending} Bill Pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-info rounded-full" />{counts.reserved} Reserved
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => refreshTables()}
                className="p-2 rounded-xl bg-elevated border border-border text-muted hover:text-primary hover:border-accent/30 transition-all"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={handleWalkIn}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-all active:scale-95"
              >
                <UserPlus size={15} />
                Walk-in
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { color: 'bg-success/20 border-success/40', label: 'Available' },
              { color: 'bg-warning/10 border-warning/40', label: 'Occupied' },
              { color: 'bg-info/10 border-info/40', label: 'Active Order' },
              { color: 'bg-loyalty/10 border-loyalty/40', label: 'Bill Pending' },
              { color: 'bg-info/10 border-info/30', label: 'Reserved' },
            ].map(l => (
              <div key={l.label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${l.color}`}>
                <span className="text-muted">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {tables.map(table => (
              <TableCell
                key={table.id}
                table={table}
                isSelected={selectedTable?.id === table.id}
                onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedTable && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-background/55 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSelectedTable(null)}
          />
          {/* Panel Wrapper (Slide-over on mobile, inline sidebar on desktop) */}
          <div className="fixed md:static inset-y-0 right-0 z-40 w-full sm:w-80 h-full border-l border-border bg-surface shadow-2xl md:shadow-none flex flex-col">
            <TableDetailPanel
              table={selectedTable}
              onClose={() => setSelectedTable(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}
