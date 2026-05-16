import { VenueSettings } from './types';

export function formatPrice(amount: number, currency = 'Rs.'): string {
  return `${currency} ${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function generateOrderNumber(): string {
  const today = new Date();
  const storedOrders = (() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('tableflow_orders');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const todayStr = today.toISOString().split('T')[0];
  const todaysOrders = storedOrders.filter((o: { createdAt: string }) => 
    o.createdAt.startsWith(todayStr)
  );
  const num = (todaysOrders.length + 1).toString().padStart(3, '0');
  return `#A-${num}`;
}

export function getElapsedMinutes(dateString: string): number {
  const now = new Date();
  const created = new Date(dateString);
  return Math.floor((now.getTime() - created.getTime()) / 60000);
}

export function getElapsedDisplay(dateString: string): string {
  const mins = getElapsedMinutes(dateString);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m ago` : `${hours}h ago`;
}

export function calculateOrderTotals(
  subtotal: number,
  settings: Pick<VenueSettings, 'serviceChargePercent' | 'gstPercent'>
) {
  const serviceCharge = Math.round((subtotal * settings.serviceChargePercent) / 100);
  const gst = Math.round((subtotal * settings.gstPercent) / 100);
  const total = subtotal + serviceCharge + gst;
  return { serviceCharge, gst, total };
}

export function calculatePointsEarned(total: number, pointsPer100 = 10): number {
  return Math.floor(total / 100) * pointsPer100;
}

export function calculatePointsDiscount(points: number, rsPerPoints = 10): number {
  return Math.floor(points / 100) * rsPerPoints;
}

export function getDayName(dayIndex: number): string {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.substring(0, 3) + '***' + phone.substring(phone.length - 3);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-warning border-warning',
    preparing: 'text-info border-info',
    ready: 'text-success border-success',
    served: 'text-muted border-border',
    paid: 'text-success border-success',
    cancelled: 'text-danger border-danger',
    available: 'text-success',
    occupied: 'text-warning',
    ordering: 'text-info',
    'bill-pending': 'text-loyalty',
    reserved: 'text-info',
    confirmed: 'text-info',
    arrived: 'text-success',
    'no-show': 'text-danger',
  };
  return colors[status] || 'text-muted';
}

export function parseLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

// ─── Wait Time Estimation ────────────────────────────────────────────────────

export function estimateWaitMinutes(
  activeOrderCount: number,
  avgPrepTimeMinutes = 12
): number {
  // Base time + congestion factor: each extra order adds 30% of avg prep time
  const base = avgPrepTimeMinutes;
  const extra = Math.floor(activeOrderCount * (avgPrepTimeMinutes * 0.3));
  return Math.min(base + extra, 60);
}

export function formatWaitTime(minutes: number): string {
  if (minutes <= 5) return '~5 min';
  const rounded = Math.ceil(minutes / 5) * 5;
  return `~${rounded} min`;
}

// ─── COGS & Profitability ─────────────────────────────────────────────────────

export function calculateMargin(price: number, cost: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100);
}

export function calculateCogsForOrder(
  items: Array<{ menuItemId: string; quantity: number }>,
  menuItems: Array<{ id: string; costPrice: number }>
): number {
  return items.reduce((sum, item) => {
    const mi = menuItems.find(m => m.id === item.menuItemId);
    return sum + (mi?.costPrice || 0) * item.quantity;
  }, 0);
}

// ─── Shift Utilities ──────────────────────────────────────────────────────────

export function calculateShiftDuration(clockIn: string, clockOut?: string): number {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return Math.floor((end - start) / 60000); // minutes
}

export function formatShiftDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Inventory Helpers ────────────────────────────────────────────────────────

export function isLowStock(current: number, min: number): boolean {
  return current <= min;
}

export function stockStatusColor(current: number, min: number): string {
  if (current <= 0) return 'text-danger';
  if (current <= min) return 'text-warning';
  return 'text-success';
}

