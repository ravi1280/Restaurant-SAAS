'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { Bell, CheckCircle, Users } from 'lucide-react';

export default function WaiterDashboard() {
  const { tables, waiterAlerts, updateWaiterAlert } = useRestaurant();
  const { showToast } = useToast();
  const router = useRouter();
  const [prevAlertIds, setPrevAlertIds] = React.useState<Set<string>>(new Set());

  // Polling to keep the dashboard fresh
  useEffect(() => {
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('storage'));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeAlerts = waiterAlerts.filter(a => a.status === 'pending');

  // Watch for new alerts and trigger push notification
  useEffect(() => {
    const currentActiveIds = new Set(activeAlerts.map(a => a.id));
    
    // Find new alerts that weren't in the previous state
    const newAlerts = activeAlerts.filter(a => !prevAlertIds.has(a.id) && prevAlertIds.size > 0);
    
    newAlerts.forEach(alert => {
      showToast(`🔔 Table ${alert.tableId} needs you! (${alert.reason})`, 'warning');
      
      // Optional: Try to play a notification sound
      try {
        const audio = new Audio('/bell.mp3'); // Fails silently if no audio file
        audio.play().catch(() => {}); 
      } catch (e) {}
    });

    setPrevAlertIds(currentActiveIds);
  }, [activeAlerts]);

  const handleAcknowledgeAlert = (alert: any) => {
    updateWaiterAlert({ ...alert, status: 'acknowledged' });
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-elevated border-border text-primary';
      case 'occupied': return 'bg-warning/20 border-warning/40 text-warning';
      case 'ordering': return 'bg-info/20 border-info/40 text-info';
      case 'bill-pending': return 'bg-danger/20 border-danger/40 text-danger';
      case 'reserved': return 'bg-loyalty/20 border-loyalty/40 text-loyalty';
      default: return 'bg-elevated border-border text-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ maxWidth: '430px', margin: '0 auto' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
              W
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-primary leading-none">Waiter Hub</h1>
              <p className="text-xs text-muted mt-1">Select a table to manage</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} className="text-danger animate-pulse" />
              Active Requests
            </h2>
            <div className="space-y-2">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3.5 bg-danger/10 border border-danger/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center font-bold text-danger">
                      T{alert.tableId}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{alert.reason}</p>
                      <p className="text-[10px] text-danger/80">
                        {Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 60000)}m ago
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlert(alert)}
                    className="p-2 bg-danger text-white rounded-xl hover:bg-danger/90 active:scale-95 transition-transform"
                    title="Acknowledge"
                  >
                    <CheckCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
            <Users size={14} />
            Floor Plan
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => router.push(`/table/${table.id}?waiter=true`)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95
                  ${getTableColor(table.status)}
                `}
              >
                <span className="text-2xl font-black font-heading mb-1">{table.id}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  {table.status === 'bill-pending' ? 'Bill' : table.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
