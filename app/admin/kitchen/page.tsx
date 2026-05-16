'use client';

import { KDSBoard } from '@/components/kitchen/KDSBoard';

export default function KitchenPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary font-heading">Kitchen Display</h1>
        <p className="text-sm text-muted mt-1">Live order tickets · Auto-refreshes every 3 seconds</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <KDSBoard />
      </div>
    </div>
  );
}
