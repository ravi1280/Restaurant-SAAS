import { pgTable, text, integer, doublePrecision, boolean, jsonb } from 'drizzle-orm/pg-core';
import { 
  DietaryFlag, ModifierGroup, CartItem, OrderModification, 
  OrderFeedback, WaiterAlert, Station 
} from '../types';

// 1. Menu Categories
export const menuCategories = pgTable('menu_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  order: integer('order').notNull(),
});

// 2. Menu Items
export const menuItems = pgTable('menu_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  categoryId: text('category_id').notNull().references(() => menuCategories.id, { onDelete: 'cascade' }),
  price: doublePrecision('price').notNull(),
  costPrice: doublePrecision('cost_price').notNull(),
  emoji: text('emoji').notNull(),
  available: boolean('available').notNull().default(true),
  dietaryFlags: jsonb('dietary_flags').$type<DietaryFlag[]>().notNull().default([]),
  modifierGroups: jsonb('modifier_groups').$type<ModifierGroup[]>().notNull().default([]),
  station: text('station').$type<Station>().notNull(),
  soldCount: integer('sold_count').notNull().default(0),
  linkedInventoryIds: jsonb('linked_inventory_ids').$type<string[]>().notNull().default([]),
  upsellItemIds: jsonb('upsell_item_ids').$type<string[]>().notNull().default([]),
  modelUrl: text('model_url'),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
});

// 3. Orders
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  tableId: integer('table_id').notNull(),
  mergedTableIds: jsonb('merged_table_ids').$type<number[]>().default([]),
  items: jsonb('items').$type<CartItem[]>().notNull().default([]),
  status: text('status').notNull(), // 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'
  subtotal: doublePrecision('subtotal').notNull(),
  serviceCharge: doublePrecision('service_charge').notNull(),
  gst: doublePrecision('gst').notNull(),
  total: doublePrecision('total').notNull(),
  loyaltyPhone: text('loyalty_phone'),
  pointsEarned: integer('points_earned').notNull().default(0),
  pointsRedeemed: integer('points_redeemed').notNull().default(0),
  discount: doublePrecision('discount').notNull().default(0),
  paymentMethod: text('payment_method'), // 'cash' | 'card' | 'qr'
  orderNote: text('order_note').notNull().default(''),
  modifications: jsonb('modifications').$type<OrderModification[]>().notNull().default([]),
  feedback: jsonb('feedback').$type<OrderFeedback>(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// 4. Tables
export const tables = pgTable('tables', {
  id: integer('id').primaryKey(),
  seats: integer('seats').notNull(),
  status: text('status').notNull(), // 'available' | 'occupied' | 'ordering' | 'bill-pending' | 'reserved'
  currentOrderId: text('current_order_id'),
  reservationId: text('reservation_id'),
  occupiedSince: text('occupied_since'),
  waiterAlerts: jsonb('waiter_alerts').$type<WaiterAlert[]>().notNull().default([]),
  mergedWith: jsonb('merged_with').$type<number[]>().default([]),
  assignedStaffId: text('assigned_staff_id'),
});

// 5. Reservations
export const reservations = pgTable('reservations', {
  id: text('id').primaryKey(),
  guestName: text('guest_name').notNull(),
  phone: text('phone').notNull(),
  guestCount: integer('guest_count').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  tableId: integer('table_id'),
  specialRequests: text('special_requests').notNull().default(''),
  depositTaken: boolean('deposit_taken').notNull().default(false),
  status: text('status').notNull(), // 'confirmed' | 'arrived' | 'no-show' | 'cancelled'
  createdAt: text('created_at').notNull(),
});

// 6. Loyalty Accounts
export const loyaltyAccounts = pgTable('loyalty_accounts', {
  phone: text('phone').primaryKey(),
  name: text('name').notNull(),
  email: text('email'), // Added for Email Marketing
  dob: text('dob'), // Date of Birth for birthday offers (YYYY-MM-DD)
  anniversary: text('anniversary'), // For anniversary offers (YYYY-MM-DD)
  points: integer('points').notNull().default(0),
  totalSpent: doublePrecision('total_spent').notNull().default(0),
  totalOrders: integer('total_orders').notNull().default(0),
  enrolledAt: text('enrolled_at').notNull(),
  lastVisit: text('last_visit').notNull(),
});

// 7. Staff Members
export const staffMembers = pgTable('staff_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'manager' | 'waiter' | 'chef' | 'cashier' | 'host'
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  pin: text('pin').notNull(),
  active: boolean('active').notNull().default(true),
  hireDate: text('hire_date').notNull(),
  avatar: text('avatar').notNull(),
  createdAt: text('created_at').notNull(),
});

// 8. Shifts
export const shifts = pgTable('shifts', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staffMembers.id, { onDelete: 'cascade' }),
  clockIn: text('clock_in').notNull(),
  clockOut: text('clock_out'),
  breakMinutes: integer('break_minutes').notNull().default(0),
  notes: text('notes').notNull().default(''),
  tablesServed: jsonb('tables_served').$type<number[]>().notNull().default([]),
  ordersHandled: jsonb('orders_handled').$type<string[]>().notNull().default([]),
});

// 9. Inventory Items
export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit').notNull(), // 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'box' | 'bottle'
  currentStock: doublePrecision('current_stock').notNull(),
  minStockLevel: doublePrecision('min_stock_level').notNull(),
  costPerUnit: doublePrecision('cost_per_unit').notNull(),
  category: text('category').notNull(),
  supplier: text('supplier').notNull(),
  lastRestocked: text('last_restocked').notNull(),
  createdAt: text('created_at').notNull(),
});

// 10. Stock Movements
export const stockMovements = pgTable('stock_movements', {
  id: text('id').primaryKey(),
  inventoryItemId: text('inventory_item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'restock' | 'consumed' | 'waste' | 'adjustment'
  quantity: doublePrecision('quantity').notNull(),
  reason: text('reason').notNull(),
  orderId: text('order_id'),
  staffId: text('staff_id'),
  timestamp: text('timestamp').notNull(),
});

// 11. Venue Settings
export const venueSettings = pgTable('venue_settings', {
  id: integer('id').primaryKey().default(1),
  restaurantName: text('restaurant_name').notNull(),
  tagline: text('tagline').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  gstNumber: text('gst_number').notNull(),
  currency: text('currency').notNull(),
  timezone: text('timezone').notNull(),
  serviceChargePercent: doublePrecision('service_charge_percent').notNull(),
  gstPercent: doublePrecision('gst_percent').notNull(),
  pointsPer100: integer('points_per100').notNull(),
  rsPerPoints: doublePrecision('rs_per_points').notNull(),
  minPointsToRedeem: integer('min_points_to_redeem').notNull(),
  kdsWarningMinutes: integer('kds_warning_minutes').notNull(),
  kdsAlertMinutes: integer('kds_alert_minutes').notNull(),
  kdsAutoBumpMinutes: integer('kds_auto_bump_minutes').notNull(),
  avgPrepTimeMinutes: integer('avg_prep_time_minutes').notNull(),
  upsellEnabled: boolean('upsell_enabled').notNull().default(true),
  feedbackEnabled: boolean('feedback_enabled').notNull().default(true),
});
