import {
  MenuItem, MenuCategory, Order, Table, Reservation, LoyaltyAccount,
  StaffMember, Shift, InventoryItem
} from './types';
import { generateId } from './utils';
import { TABLE_SEAT_COUNTS } from './constants';

// ─── Categories ─────────────────────────────────────────────────────────────
export const seedCategories: MenuCategory[] = [
  { id: 'cat-starters', name: 'Starters', order: 0 },
  { id: 'cat-mains', name: 'Mains', order: 1 },
  { id: 'cat-drinks', name: 'Drinks', order: 2 },
  { id: 'cat-desserts', name: 'Desserts', order: 3 },
  { id: 'cat-specials', name: 'Specials', order: 4 },
];

// ─── Menu Items ──────────────────────────────────────────────────────────────
export const seedMenuItems: MenuItem[] = [
  {
    id: 'item-1',
    name: 'Devilled Prawns',
    description: 'Succulent tiger prawns tossed in our signature fiery devilled sauce. Served with garlic bread.',
    categoryId: 'cat-starters',
    price: 1200,
    costPrice: 450,
    emoji: '🦐',
    available: true,
    dietaryFlags: ['spicy'],
    modifierGroups: [
      {
        id: 'mg-1', name: 'Spice Level', required: true, options: [
          { id: 'mo-1', name: 'Mild', priceAdjustment: 0 },
          { id: 'mo-2', name: 'Medium', priceAdjustment: 0 },
          { id: 'mo-3', name: 'Hot', priceAdjustment: 0 },
        ]
      }
    ],
    station: 'hot',
    soldCount: 142,
    linkedInventoryIds: ['inv-prawns', 'inv-garlic'],
    upsellItemIds: ['item-10'], // Passion Mojito
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'item-2',
    name: 'Mushroom Bruschetta',
    description: 'Grilled sourdough topped with sautéed wild mushrooms, garlic, and truffle oil.',
    categoryId: 'cat-starters',
    price: 750,
    costPrice: 200,
    emoji: '🍞',
    available: true,
    dietaryFlags: ['vegan'],
    modifierGroups: [],
    station: 'cold',
    soldCount: 89,
    linkedInventoryIds: ['inv-mushrooms', 'inv-bread'],
    upsellItemIds: ['item-13'], 
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'item-5',
    name: 'Grilled Sea Bass',
    description: 'Whole sea bass grilled over charcoal. Served with seasonal vegetables.',
    categoryId: 'cat-mains',
    price: 2800,
    costPrice: 1200,
    emoji: '🐠',
    available: true,
    dietaryFlags: ['chefSpecial'],
    modifierGroups: [
      {
        id: 'mg-4', name: 'Side', required: false, options: [
          { id: 'mo-11', name: 'Seasonal Vegetables', priceAdjustment: 0 },
          { id: 'mo-13', name: 'Steamed Rice', priceAdjustment: 150 },
        ]
      }
    ],
    station: 'hot',
    soldCount: 67,
    linkedInventoryIds: ['inv-seabass'],
    upsellItemIds: ['item-12', 'item-9'], // Espresso or Lava cake
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'item-9',
    name: 'Espresso',
    description: 'Rich and bold single-origin Ceylon espresso.',
    categoryId: 'cat-drinks',
    price: 350,
    costPrice: 80,
    emoji: '☕',
    available: true,
    dietaryFlags: ['vegan'],
    modifierGroups: [],
    station: 'bar',
    soldCount: 312,
    linkedInventoryIds: ['inv-coffee'],
    upsellItemIds: ['item-12'], // Chocolate Lava
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'item-10',
    name: 'Passion Mojito',
    description: 'Freshly muddled mint with tangy passion fruit and lime juice.',
    categoryId: 'cat-drinks',
    price: 650,
    costPrice: 150,
    emoji: '🍹',
    available: true,
    dietaryFlags: ['vegan'],
    modifierGroups: [],
    station: 'bar',
    soldCount: 203,
    linkedInventoryIds: ['inv-passion', 'inv-mint'],
    upsellItemIds: ['item-3'], // Calamari
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'item-12',
    name: 'Dark Chocolate Lava',
    description: 'Warm Valrhona chocolate cake with a molten center.',
    categoryId: 'cat-desserts',
    price: 950,
    costPrice: 300,
    emoji: '🍫',
    available: true,
    dietaryFlags: ['nuts'],
    modifierGroups: [],
    station: 'hot',
    soldCount: 134,
    linkedInventoryIds: ['inv-chocolate'],
    upsellItemIds: ['item-9'], // Espresso
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'item-13',
    name: 'Coconut Panna Cotta',
    description: 'Silky smooth coconut milk panna cotta.',
    categoryId: 'cat-desserts',
    price: 850,
    costPrice: 250,
    emoji: '🥥',
    available: true,
    dietaryFlags: ['vegan', 'glutenFree'],
    modifierGroups: [],
    station: 'cold',
    soldCount: 97,
    linkedInventoryIds: ['inv-coconut'],
    upsellItemIds: [],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  }
];

// ─── Tables ──────────────────────────────────────────────────────────────────
export function generateSeedTables(): Table[] {
  return TABLE_SEAT_COUNTS.map((seats, idx) => ({
    id: idx + 1,
    seats,
    status: 'available' as const,
    waiterAlerts: [],
  }));
}

// ─── Past Orders ─────────────────────────────────────────────────
function randomItem() {
  const items = seedMenuItems;
  const item = items[Math.floor(Math.random() * items.length)];
  const qty = Math.floor(Math.random() * 3) + 1;
  return {
    menuItemId: item.id,
    name: item.name,
    price: item.price,
    quantity: qty,
    selectedModifiers: [],
    specialInstructions: '',
  };
}

function generatePastOrder(daysAgo: number, tableId: number, isCurrent: boolean = false): Order {
  const date = new Date();
  if (!isCurrent) {
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 12) + 10, Math.floor(Math.random() * 60));
  }

  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = Array.from({ length: numItems }, randomItem);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const serviceCharge = Math.round(subtotal * 0.1);
  const gst = Math.round(subtotal * 0.08);
  const total = subtotal + serviceCharge + gst;

  const orderDate = date.toISOString();
  const dayNum = Math.floor(Math.random() * 30) + 1;

  const feedback = (!isCurrent && Math.random() > 0.5) ? {
    rating: (Math.floor(Math.random() * 2) + 4) as 4 | 5,
    comment: 'Great food!',
    submittedAt: orderDate
  } : undefined;

  let status: Order['status'] = 'paid';
  if (isCurrent) {
    const statuses: Order['status'][] = ['pending', 'preparing', 'ready', 'served'];
    status = statuses[Math.floor(Math.random() * statuses.length)];
  }

  return {
    id: generateId(),
    orderNumber: `#A-${dayNum.toString().padStart(3, '0')}`,
    tableId,
    items,
    status,
    subtotal,
    serviceCharge,
    gst,
    total,
    pointsEarned: Math.floor(total / 100) * 10,
    pointsRedeemed: 0,
    discount: 0,
    paymentMethod: ['cash', 'card', 'qr'][Math.floor(Math.random() * 3)] as 'cash' | 'card' | 'qr',
    orderNote: '',
    modifications: [],
    feedback,
    createdAt: orderDate,
    updatedAt: orderDate,
  };
}

export function generateSeedOrders(): Order[] {
  const orders: Order[] = [];
  
  // Past orders (paid/completed)
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 7) + 1;
    const tableId = Math.floor(Math.random() * 20) + 1;
    orders.push(generatePastOrder(daysAgo, tableId, false));
  }

  // Current active orders (pending, preparing, ready, served)
  for (let i = 0; i < 15; i++) {
    const tableId = Math.floor(Math.random() * 20) + 1;
    orders.push(generatePastOrder(0, tableId, true));
  }
  
  return orders;
}

// ─── Loyalty Accounts ────────────────────────────────────────────────────────
export const seedLoyaltyAccounts: LoyaltyAccount[] = [
  {
    phone: '+94771234567',
    name: 'Anika Silva',
    points: 3450,
    totalSpent: 48200,
    totalOrders: 18,
    enrolledAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    lastVisit: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

// ─── Reservations ────────────────────────────────────────────────────────────
export function generateSeedReservations(): Reservation[] {
  const guestNames = ['James Wilson', 'Sarah Mitchell'];
  const times = ['19:00', '20:30'];
  return guestNames.map((name, idx) => {
    const date = new Date();
    date.setDate(date.getDate() + idx);
    return {
      id: generateId(),
      guestName: name,
      phone: `+9477000000${idx}`,
      guestCount: 2,
      date: date.toISOString().split('T')[0],
      time: times[idx],
      tableId: idx + 1,
      specialRequests: '',
      depositTaken: false,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
  });
}

// ─── Staff & Shifts ──────────────────────────────────────────────────────────
export const seedStaff: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Nimal Fernando',
    role: 'manager',
    phone: '+94771112222',
    email: 'nimal@tableflow.com',
    pin: '1234',
    active: true,
    hireDate: new Date(Date.now() - 365 * 86400000).toISOString(),
    avatar: '👨‍💼',
    createdAt: new Date().toISOString()
  },
  {
    id: 'staff-2',
    name: 'Saman Kumara',
    role: 'waiter',
    phone: '+94773334444',
    email: 'saman@tableflow.com',
    pin: '5678',
    active: true,
    hireDate: new Date(Date.now() - 180 * 86400000).toISOString(),
    avatar: '🤵',
    createdAt: new Date().toISOString()
  }
];

export const seedShifts: Shift[] = [];

// ─── Inventory ────────────────────────────────────────────────────────────
export const seedInventory: InventoryItem[] = [
  {
    id: 'inv-prawns',
    name: 'Tiger Prawns',
    unit: 'kg',
    currentStock: 15,
    minStockLevel: 5,
    costPerUnit: 2500,
    category: 'Meat',
    supplier: 'Ocean Fresh',
    lastRestocked: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-seabass',
    name: 'Sea Bass (Whole)',
    unit: 'pcs',
    currentStock: 8,
    minStockLevel: 10,
    costPerUnit: 1200,
    category: 'Meat',
    supplier: 'Ocean Fresh',
    lastRestocked: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-coffee',
    name: 'Espresso Beans',
    unit: 'kg',
    currentStock: 3.5,
    minStockLevel: 2,
    costPerUnit: 4500,
    category: 'Beverages',
    supplier: 'Ceylon Roasters',
    lastRestocked: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
];
