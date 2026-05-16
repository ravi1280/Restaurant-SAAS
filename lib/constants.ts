import { VenueSettings } from './types';

export const STORAGE_KEYS = {
  MENU_ITEMS: 'tableflow_menu_items',
  MENU_CATEGORIES: 'tableflow_menu_categories',
  ORDERS: 'tableflow_orders',
  TABLES: 'tableflow_tables',
  RESERVATIONS: 'tableflow_reservations',
  LOYALTY: 'tableflow_loyalty',
  WAITER_ALERTS: 'tableflow_waiter_alerts',
  SETTINGS: 'tableflow_settings',
  SEEDED: 'tableflow_seeded_v2',
  STAFF: 'tableflow_staff',
  SHIFTS: 'tableflow_shifts',
  INVENTORY: 'tableflow_inventory',
  STOCK_MOVEMENTS: 'tableflow_stock_movements',
} as const;

export const DEFAULT_SETTINGS: VenueSettings = {
  restaurantName: 'The Golden Spoon',
  tagline: 'Fine Dining & Café',
  address: '42 Galle Road, Colombo 03, Sri Lanka',
  phone: '+94 11 234 5678',
  gstNumber: 'GST-2024-TGS-001',
  currency: 'Rs.',
  timezone: 'Asia/Colombo',
  serviceChargePercent: 10,
  gstPercent: 8,
  pointsPer100: 10,
  rsPerPoints: 10,
  minPointsToRedeem: 100,
  kdsWarningMinutes: 10,
  kdsAlertMinutes: 20,
  kdsAutoBumpMinutes: 5,
  avgPrepTimeMinutes: 12,
  upsellEnabled: true,
  feedbackEnabled: true,
};

export const FOOD_EMOJIS = [
  '🍕', '🍔', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🥘', '🍛',
  '🍣', '🍱', '🥩', '🍗', '🐠', '🦐', '🦑', '🦞', '🦀', '🥦',
  '🥕', '🍞', '🧇', '🥞', '🧆', '🥙', '🌭', '🍟', '🧀', '🥚',
  '🍳', '🥓', '🥣', '🍲', '🫕', '🫔', '🧆', '🍚', '🍙', '🍘',
  '🍥', '🥮', '🍡', '🧁', '🍰', '🎂', '🍮', '🍫', '🍬', '🍭',
  '🍦', '🍧', '🍨', '🥧', '🍩', '🍪', '🫖', '☕', '🍵', '🧃',
  '🥤', '🧋', '🍹', '🍸', '🍷', '🍺', '🥂', '🍾', '🥭', '🍓',
  '🍇', '🍉', '🍊', '🍋', '🍎', '🍐', '🍑', '🍒', '🥝', '🥥',
];

export const TABLE_SEAT_COUNTS = [2, 4, 4, 6, 4, 2, 8, 4, 4, 4, 2, 6, 4, 4, 8, 2, 4, 4, 6, 4];
