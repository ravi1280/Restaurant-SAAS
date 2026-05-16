import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'loyalty' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-accent/10 text-accent border-accent/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-info/10 text-info border-info/20',
    loyalty: 'bg-loyalty/10 text-loyalty border-loyalty/20',
    muted: 'bg-elevated text-muted border-border',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    served: 'muted',
    paid: 'success',
    cancelled: 'danger',
    available: 'success',
    occupied: 'warning',
    ordering: 'info',
    'bill-pending': 'loyalty',
    reserved: 'info',
    confirmed: 'info',
    arrived: 'success',
    'no-show': 'danger',
    acknowledged: 'success',
    missed: 'danger',
  };

  const labels: Record<string, string> = {
    'bill-pending': 'Bill Pending',
    'no-show': 'No Show',
  };

  const variant = map[status] || 'muted';
  const label = labels[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return <Badge variant={variant}>{label}</Badge>;
}
