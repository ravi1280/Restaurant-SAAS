'use client';

import { LoyaltyDashboard } from '@/components/loyalty/LoyaltyDashboard';

export default function LoyaltyPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-primary font-heading">Loyalty Points</h1>
        <p className="text-sm text-muted mt-1">Manage customer points, rewards, and leaderboard</p>
      </div>
      <LoyaltyDashboard />
    </div>
  );
}
