// ─── Menu ────────────────────────────────────────────────────────────────────

export type MenuCategory = {
  id: string;
  name: string;
  order: number;
};

export type ModifierOption = {
  id: string;
  name: string;
  priceAdjustment: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  options: ModifierOption[];
};

export type DietaryFlag = 'vegan' | 'spicy' | 'nuts' | 'glutenFree' | 'chefSpecial';
export type Station = 'hot' | 'cold' | 'bar';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  costPrice: number;           // COGS: cost to make this item
  emoji: string;
  available: boolean;
  dietaryFlags: DietaryFlag[];
  modifierGroups: ModifierGroup[];
  station: Station;
  soldCount: number;
  linkedInventoryIds: string[]; // inventory items consumed when sold
  upsellItemIds: string[];      // items to suggest when this is added to cart
  createdAt: string;
  modelUrl?: string;            // 3D model path (e.g. '/models/sammich.glb')
};

// ─── Cart & Orders ───────────────────────────────────────────────────────────

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedModifiers: { groupId: string; optionId: string; priceAdjustment: number }[];
  specialInstructions: string;
};

export type OrderModification = {
  id: string;
  timestamp: string;
  staffId: string;
  description: string;
  itemsAdded: CartItem[];
  itemsRemoved: CartItem[];
  previousTotal: number;
  newTotal: number;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'qr';

export type Order = {
  id: string;
  orderNumber: string;
  tableId: number;
  mergedTableIds?: number[];    // for merged tables
  items: CartItem[];
  status: OrderStatus;
  subtotal: number;
  serviceCharge: number;
  gst: number;
  total: number;
  loyaltyPhone?: string;
  pointsEarned: number;
  pointsRedeemed: number;
  discount: number;
  paymentMethod?: PaymentMethod;
  orderNote: string;
  modifications: OrderModification[];
  feedback?: OrderFeedback;
  createdAt: string;
  updatedAt: string;
};

// ─── Feedback ────────────────────────────────────────────────────────────────

export type OrderFeedback = {
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  submittedAt: string;
};

// ─── Tables ──────────────────────────────────────────────────────────────────

export type TableStatus = 'available' | 'occupied' | 'ordering' | 'bill-pending' | 'reserved';

export type WaiterAlert = {
  id: string;
  tableId: number;
  reason: string;
  status: 'pending' | 'acknowledged' | 'missed';
  createdAt: string;
};

export type Table = {
  id: number;
  seats: number;
  status: TableStatus;
  currentOrderId?: string;
  reservationId?: string;
  occupiedSince?: string;
  waiterAlerts: WaiterAlert[];
  mergedWith?: number[];        // IDs of tables merged into this one
  assignedStaffId?: string;
};

// ─── Reservations ────────────────────────────────────────────────────────────

export type ReservationStatus = 'confirmed' | 'arrived' | 'no-show' | 'cancelled';

export type Reservation = {
  id: string;
  guestName: string;
  phone: string;
  guestCount: number;
  date: string;
  time: string;
  tableId?: number;
  specialRequests: string;
  depositTaken: boolean;
  status: ReservationStatus;
  createdAt: string;
};

// ─── Loyalty ─────────────────────────────────────────────────────────────────

export type LoyaltyAccount = {
  phone: string;
  name: string;
  points: number;
  totalSpent: number;
  totalOrders: number;
  enrolledAt: string;
  lastVisit: string;
};

// ─── Staff & Shifts ──────────────────────────────────────────────────────────

export type StaffRole = 'manager' | 'waiter' | 'chef' | 'cashier' | 'host';

export type StaffMember = {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  pin: string;           // 4-digit PIN for clock-in
  active: boolean;
  hireDate: string;
  avatar: string;        // emoji
  createdAt: string;
};

export type Shift = {
  id: string;
  staffId: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  notes: string;
  tablesServed: number[];
  ordersHandled: string[];   // order IDs
};

// ─── Inventory ───────────────────────────────────────────────────────────────

export type InventoryUnit = 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'box' | 'bottle';

export type InventoryItem = {
  id: string;
  name: string;
  unit: InventoryUnit;
  currentStock: number;
  minStockLevel: number;   // alert threshold
  costPerUnit: number;
  category: string;        // 'Produce' | 'Meat' | 'Dairy' | 'Beverages' | 'Dry Goods'
  supplier: string;
  lastRestocked: string;
  createdAt: string;
};

export type StockMovement = {
  id: string;
  inventoryItemId: string;
  type: 'restock' | 'consumed' | 'waste' | 'adjustment';
  quantity: number;        // positive = in, negative = out
  reason: string;
  orderId?: string;        // if consumed by an order
  staffId?: string;
  timestamp: string;
};

// ─── Settings ────────────────────────────────────────────────────────────────

export type VenueSettings = {
  restaurantName: string;
  tagline: string;
  address: string;
  phone: string;
  gstNumber: string;
  currency: string;
  timezone: string;
  serviceChargePercent: number;
  gstPercent: number;
  pointsPer100: number;
  rsPerPoints: number;
  minPointsToRedeem: number;
  kdsWarningMinutes: number;
  kdsAlertMinutes: number;
  kdsAutoBumpMinutes: number;
  avgPrepTimeMinutes: number;   // for estimated wait time
  upsellEnabled: boolean;
  feedbackEnabled: boolean;
};
