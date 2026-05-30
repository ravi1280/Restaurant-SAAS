'use client';

import React, { useState } from 'react';
import { LoyaltyAccount } from '@/lib/types';
import { useRestaurant } from '@/context/RestaurantContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, maskPhone, formatDate } from '@/lib/utils';
import { Search, Trophy, Star, Plus, Minus, Users, Gift } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function LoyaltyDashboard() {
  const { loyalty, updateLoyaltyAccount, orders } = useRestaurant();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LoyaltyAccount | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const totalPointsIssued = todayOrders.reduce((s, o) => s + o.pointsEarned, 0);
  const totalPointsRedeemed = todayOrders.reduce((s, o) => s + o.pointsRedeemed, 0);

  const filtered = loyalty.filter(acc =>
    !search ||
    acc.phone.includes(search) ||
    acc.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.points - a.points);

  const top10 = [...loyalty].sort((a, b) => b.points - a.points).slice(0, 10);

  const handleAdjust = (type: 'add' | 'deduct') => {
    if (!selected || !adjustAmount || isNaN(parseInt(adjustAmount))) {
      showToast('Enter a valid amount', 'warning');
      return;
    }
    const amount = parseInt(adjustAmount);
    const newPoints = type === 'add'
      ? selected.points + amount
      : Math.max(0, selected.points - amount);
    updateLoyaltyAccount({ ...selected, points: newPoints });
    setSelected({ ...selected, points: newPoints });
    showToast(
      `${type === 'add' ? 'Added' : 'Deducted'} ${amount} points ${type === 'add' ? 'to' : 'from'} ${selected.phone}`,
      type === 'add' ? 'success' : 'warning'
    );
    setAdjustAmount('');
    setAdjustReason('');
  };

  const exportCSV = () => {
    const rows = [
      ['Phone', 'Name', 'Points', 'Total Spent', 'Orders', 'Last Visit'],
      ...loyalty.map(acc => [
        acc.phone, acc.name, acc.points, acc.totalSpent, acc.totalOrders, acc.lastVisit,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'loyalty-customers.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enrolled Customers', value: loyalty.length.toString(), icon: <Users className="w-4 h-4 text-accent" /> },
          { label: 'Points Issued Today', value: totalPointsIssued.toLocaleString(), icon: <Star className="w-4 h-4 text-loyalty fill-loyalty" /> },
          { label: 'Points Redeemed Today', value: totalPointsRedeemed.toLocaleString(), icon: <Gift className="w-4 h-4 text-success" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-between">
            <div className="p-2 bg-elevated border border-border rounded-xl w-fit mb-2 flex items-center justify-center">{stat.icon}</div>
            <div>
              <p className="text-xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Customer list */}
        <div className="xl:col-span-2 bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-primary">All Customers</h3>
            <Button variant="secondary" size="sm" onClick={exportCSV}>Export CSV</Button>
          </div>
          <div className="px-5 py-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-9 pr-3 py-2 bg-elevated border border-border rounded-xl text-sm text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(acc => (
              <div
                key={acc.phone}
                onClick={() => setSelected(acc === selected ? null : acc)}
                className={`px-5 py-3 cursor-pointer transition-all hover:bg-elevated
                  ${selected?.phone === acc.phone ? 'bg-accent/5 border-l-2 border-accent' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">{acc.name || 'Anonymous'}</p>
                    <p className="text-xs text-muted font-mono">{maskPhone(acc.phone)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-loyalty flex items-center justify-end gap-1">
                      <Star size={12} className="fill-loyalty text-loyalty shrink-0" />
                      <span>{acc.points.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-muted">{formatPrice(acc.totalSpent)} spent</p>
                  </div>
                </div>

                {selected?.phone === acc.phone && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Points', value: acc.points.toLocaleString() },
                        { label: 'Orders', value: acc.totalOrders.toString() },
                        { label: 'Last Visit', value: formatDate(acc.lastVisit) },
                      ].map(s => (
                        <div key={s.label} className="bg-elevated rounded-xl p-2">
                          <p className="text-sm font-bold text-primary">{s.value}</p>
                          <p className="text-[10px] text-muted">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={adjustAmount}
                        onChange={e => setAdjustAmount(e.target.value)}
                        placeholder="Points amount"
                        className="flex-1 px-3 py-2 bg-elevated border border-border rounded-xl text-sm text-primary focus:border-accent focus:outline-none"
                      />
                      <Button variant="success" size="sm" onClick={() => handleAdjust('add')}>
                        <Plus size={14} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleAdjust('deduct')}>
                        <Minus size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-5 py-8 text-center text-muted text-sm">No customers found</div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Trophy size={16} className="text-warning" />
            <h3 className="font-semibold text-primary">Top Customers</h3>
          </div>
          <div className="divide-y divide-border">
            {top10.map((acc, idx) => (
              <div key={acc.phone} className="px-5 py-3 flex items-center gap-3">
                <span className={`text-sm font-bold w-5 text-center
                  ${idx === 0 ? 'text-warning' : idx === 1 ? 'text-muted' : idx === 2 ? 'text-accent' : 'text-hint'}`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{acc.name || maskPhone(acc.phone)}</p>
                  <p className="text-xs text-muted">{acc.totalOrders} orders</p>
                </div>
                <span className="text-sm font-bold text-loyalty flex items-center gap-1">
                  <Star size={12} className="fill-loyalty text-loyalty shrink-0" />
                  <span>{acc.points.toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
