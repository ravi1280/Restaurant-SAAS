'use client';

import React, { createContext, useContext, useEffect, useCallback, useReducer } from 'react';
import {
  MenuItem, MenuCategory, Order, Table, Reservation,
  LoyaltyAccount, VenueSettings, WaiterAlert,
  StaffMember, Shift, InventoryItem, StockMovement,
} from '@/lib/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/lib/constants';
import { parseLocalStorage, setLocalStorage } from '@/lib/utils';
import {
  seedMenuItems, seedCategories, generateSeedTables,
  generateSeedOrders, seedLoyaltyAccounts,
  generateSeedReservations, seedStaff, seedShifts,
  seedInventory,
} from '@/lib/seedData';

// ─── State ───────────────────────────────────────────────────────────────────
interface RestaurantState {
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  orders: Order[];
  tables: Table[];
  reservations: Reservation[];
  loyalty: LoyaltyAccount[];
  waiterAlerts: WaiterAlert[];
  settings: VenueSettings;
  staff: StaffMember[];
  shifts: Shift[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  isSeeded: boolean;
}

type RestaurantAction =
  | { type: 'HYDRATE'; payload: RestaurantState }
  | { type: 'SET_MENU_ITEMS'; payload: MenuItem[] }
  | { type: 'SET_MENU_CATEGORIES'; payload: MenuCategory[] }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'SET_RESERVATIONS'; payload: Reservation[] }
  | { type: 'SET_LOYALTY'; payload: LoyaltyAccount[] }
  | { type: 'SET_WAITER_ALERTS'; payload: WaiterAlert[] }
  | { type: 'SET_SETTINGS'; payload: VenueSettings }
  | { type: 'SET_STAFF'; payload: StaffMember[] }
  | { type: 'SET_SHIFTS'; payload: Shift[] }
  | { type: 'SET_INVENTORY'; payload: InventoryItem[] }
  | { type: 'SET_STOCK_MOVEMENTS'; payload: StockMovement[] };

function reducer(state: RestaurantState, action: RestaurantAction): RestaurantState {
  switch (action.type) {
    case 'HYDRATE': return action.payload;
    case 'SET_MENU_ITEMS': return { ...state, menuItems: action.payload };
    case 'SET_MENU_CATEGORIES': return { ...state, menuCategories: action.payload };
    case 'SET_ORDERS': return { ...state, orders: action.payload };
    case 'SET_TABLES': return { ...state, tables: action.payload };
    case 'SET_RESERVATIONS': return { ...state, reservations: action.payload };
    case 'SET_LOYALTY': return { ...state, loyalty: action.payload };
    case 'SET_WAITER_ALERTS': return { ...state, waiterAlerts: action.payload };
    case 'SET_SETTINGS': return { ...state, settings: action.payload };
    case 'SET_STAFF': return { ...state, staff: action.payload };
    case 'SET_SHIFTS': return { ...state, shifts: action.payload };
    case 'SET_INVENTORY': return { ...state, inventory: action.payload };
    case 'SET_STOCK_MOVEMENTS': return { ...state, stockMovements: action.payload };
    default: return state;
  }
}

const initialState: RestaurantState = {
  menuItems: [], menuCategories: [], orders: [], tables: [],
  reservations: [], loyalty: [], waiterAlerts: [],
  settings: DEFAULT_SETTINGS, staff: [], shifts: [],
  inventory: [], stockMovements: [], isSeeded: false,
};

// ─── Context ─────────────────────────────────────────────────────────────────
interface RestaurantContextValue extends RestaurantState {
  // Menu
  updateMenuItem: (item: MenuItem) => void;
  addMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  updateCategories: (categories: MenuCategory[]) => void;
  // Orders
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  refreshOrders: () => void;
  // Tables
  updateTable: (table: Table) => void;
  refreshTables: () => void;
  mergeTables: (primaryId: number, secondaryIds: number[]) => void;
  unmergeTables: (primaryId: number) => void;
  // Reservations
  addReservation: (res: Reservation) => void;
  updateReservation: (res: Reservation) => void;
  deleteReservation: (id: string) => void;
  // Loyalty
  updateLoyaltyAccount: (acc: LoyaltyAccount) => void;
  getLoyaltyAccount: (phone: string) => LoyaltyAccount | undefined;
  // Waiter Alerts
  addWaiterAlert: (alert: WaiterAlert) => void;
  updateWaiterAlert: (alert: WaiterAlert) => void;
  refreshWaiterAlerts: () => void;
  // Settings
  updateSettings: (settings: VenueSettings) => void;
  // Staff
  addStaff: (member: StaffMember) => void;
  updateStaff: (member: StaffMember) => void;
  deleteStaff: (id: string) => void;
  // Shifts
  clockIn: (staffId: string) => Shift;
  clockOut: (shiftId: string) => void;
  getActiveShift: (staffId: string) => Shift | undefined;
  // Inventory
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  addStockMovement: (movement: StockMovement) => void;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Seed + hydrate on mount
  useEffect(() => {
    const seeded = parseLocalStorage<boolean>(STORAGE_KEYS.SEEDED, false);

    if (!seeded) {
      const orders = generateSeedOrders();
      const tables = generateSeedTables();
      const reservations = generateSeedReservations();

      setLocalStorage(STORAGE_KEYS.MENU_ITEMS, seedMenuItems);
      setLocalStorage(STORAGE_KEYS.MENU_CATEGORIES, seedCategories);
      setLocalStorage(STORAGE_KEYS.ORDERS, orders);
      setLocalStorage(STORAGE_KEYS.TABLES, tables);
      setLocalStorage(STORAGE_KEYS.RESERVATIONS, reservations);
      setLocalStorage(STORAGE_KEYS.LOYALTY, seedLoyaltyAccounts);
      setLocalStorage(STORAGE_KEYS.WAITER_ALERTS, []);
      setLocalStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      setLocalStorage(STORAGE_KEYS.STAFF, seedStaff);
      setLocalStorage(STORAGE_KEYS.SHIFTS, seedShifts);
      setLocalStorage(STORAGE_KEYS.INVENTORY, seedInventory);
      setLocalStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []);
      setLocalStorage(STORAGE_KEYS.SEEDED, true);
    }

    dispatch({
      type: 'HYDRATE',
      payload: {
        menuItems: parseLocalStorage(STORAGE_KEYS.MENU_ITEMS, seedMenuItems),
        menuCategories: parseLocalStorage(STORAGE_KEYS.MENU_CATEGORIES, seedCategories),
        orders: parseLocalStorage(STORAGE_KEYS.ORDERS, []),
        tables: parseLocalStorage(STORAGE_KEYS.TABLES, []),
        reservations: parseLocalStorage(STORAGE_KEYS.RESERVATIONS, []),
        loyalty: parseLocalStorage(STORAGE_KEYS.LOYALTY, []),
        waiterAlerts: parseLocalStorage(STORAGE_KEYS.WAITER_ALERTS, []),
        settings: { ...DEFAULT_SETTINGS, ...parseLocalStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS) },
        staff: parseLocalStorage(STORAGE_KEYS.STAFF, seedStaff),
        shifts: parseLocalStorage(STORAGE_KEYS.SHIFTS, seedShifts),
        inventory: parseLocalStorage(STORAGE_KEYS.INVENTORY, seedInventory),
        stockMovements: parseLocalStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []),
        isSeeded: true,
      },
    });

    const handleStorage = (e: StorageEvent | Event) => {
      // Just re-hydrate entirely on storage event (for same-tab polling or cross-tab sync)
      dispatch({
        type: 'HYDRATE',
        payload: {
          menuItems: parseLocalStorage(STORAGE_KEYS.MENU_ITEMS, seedMenuItems),
          menuCategories: parseLocalStorage(STORAGE_KEYS.MENU_CATEGORIES, seedCategories),
          orders: parseLocalStorage(STORAGE_KEYS.ORDERS, []),
          tables: parseLocalStorage(STORAGE_KEYS.TABLES, []),
          reservations: parseLocalStorage(STORAGE_KEYS.RESERVATIONS, []),
          loyalty: parseLocalStorage(STORAGE_KEYS.LOYALTY, []),
          waiterAlerts: parseLocalStorage(STORAGE_KEYS.WAITER_ALERTS, []),
          settings: { ...DEFAULT_SETTINGS, ...parseLocalStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS) },
          staff: parseLocalStorage(STORAGE_KEYS.STAFF, seedStaff),
          shifts: parseLocalStorage(STORAGE_KEYS.SHIFTS, seedShifts),
          inventory: parseLocalStorage(STORAGE_KEYS.INVENTORY, seedInventory),
          stockMovements: parseLocalStorage(STORAGE_KEYS.STOCK_MOVEMENTS, []),
          isSeeded: true,
        },
      });
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ─── Menu ─────────────────────────────────────────────────────────────────
  const addMenuItem = useCallback((item: MenuItem) => {
    const updated = [...state.menuItems, item];
    setLocalStorage(STORAGE_KEYS.MENU_ITEMS, updated);
    dispatch({ type: 'SET_MENU_ITEMS', payload: updated });
  }, [state.menuItems]);

  const updateMenuItem = useCallback((item: MenuItem) => {
    const updated = state.menuItems.map(i => i.id === item.id ? item : i);
    setLocalStorage(STORAGE_KEYS.MENU_ITEMS, updated);
    dispatch({ type: 'SET_MENU_ITEMS', payload: updated });
  }, [state.menuItems]);

  const deleteMenuItem = useCallback((id: string) => {
    const updated = state.menuItems.filter(i => i.id !== id);
    setLocalStorage(STORAGE_KEYS.MENU_ITEMS, updated);
    dispatch({ type: 'SET_MENU_ITEMS', payload: updated });
  }, [state.menuItems]);

  const updateCategories = useCallback((categories: MenuCategory[]) => {
    setLocalStorage(STORAGE_KEYS.MENU_CATEGORIES, categories);
    dispatch({ type: 'SET_MENU_CATEGORIES', payload: categories });
  }, []);

  // ─── Orders ───────────────────────────────────────────────────────────────
  const addOrder = useCallback((order: Order) => {
    const updated = [...state.orders, order];
    setLocalStorage(STORAGE_KEYS.ORDERS, updated);
    dispatch({ type: 'SET_ORDERS', payload: updated });
  }, [state.orders]);

  const updateOrder = useCallback((order: Order) => {
    const updated = state.orders.map(o => o.id === order.id ? order : o);
    setLocalStorage(STORAGE_KEYS.ORDERS, updated);
    dispatch({ type: 'SET_ORDERS', payload: updated });
  }, [state.orders]);

  const refreshOrders = useCallback(() => {
    const orders = parseLocalStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    dispatch({ type: 'SET_ORDERS', payload: orders });
  }, []);

  // ─── Tables ───────────────────────────────────────────────────────────────
  const updateTable = useCallback((table: Table) => {
    const updated = state.tables.map(t => t.id === table.id ? table : t);
    setLocalStorage(STORAGE_KEYS.TABLES, updated);
    dispatch({ type: 'SET_TABLES', payload: updated });
  }, [state.tables]);

  const refreshTables = useCallback(() => {
    const tables = parseLocalStorage<Table[]>(STORAGE_KEYS.TABLES, []);
    dispatch({ type: 'SET_TABLES', payload: tables });
  }, []);

  const mergeTables = useCallback((primaryId: number, secondaryIds: number[]) => {
    const updated = state.tables.map(t => {
      if (t.id === primaryId) {
        return { ...t, mergedWith: secondaryIds, seats: t.seats + secondaryIds.reduce((s, id) => {
          const found = state.tables.find(x => x.id === id);
          return s + (found?.seats || 0);
        }, 0) };
      }
      if (secondaryIds.includes(t.id)) {
        return { ...t, status: 'occupied' as const, mergedWith: [primaryId] };
      }
      return t;
    });
    setLocalStorage(STORAGE_KEYS.TABLES, updated);
    dispatch({ type: 'SET_TABLES', payload: updated });
  }, [state.tables]);

  const unmergeTables = useCallback((primaryId: number) => {
    const primary = state.tables.find(t => t.id === primaryId);
    const mergedIds = primary?.mergedWith || [];
    const updated = state.tables.map(t => {
      if (t.id === primaryId) {
        const { mergedWith, ...rest } = t;
        return { ...rest, mergedWith: undefined };
      }
      if (mergedIds.includes(t.id)) {
        return { ...t, status: 'available' as const, mergedWith: undefined };
      }
      return t;
    });
    setLocalStorage(STORAGE_KEYS.TABLES, updated);
    dispatch({ type: 'SET_TABLES', payload: updated });
  }, [state.tables]);

  // ─── Reservations ─────────────────────────────────────────────────────────
  const addReservation = useCallback((res: Reservation) => {
    const updated = [...state.reservations, res];
    setLocalStorage(STORAGE_KEYS.RESERVATIONS, updated);
    dispatch({ type: 'SET_RESERVATIONS', payload: updated });
  }, [state.reservations]);

  const updateReservation = useCallback((res: Reservation) => {
    const updated = state.reservations.map(r => r.id === res.id ? res : r);
    setLocalStorage(STORAGE_KEYS.RESERVATIONS, updated);
    dispatch({ type: 'SET_RESERVATIONS', payload: updated });
  }, [state.reservations]);

  const deleteReservation = useCallback((id: string) => {
    const updated = state.reservations.filter(r => r.id !== id);
    setLocalStorage(STORAGE_KEYS.RESERVATIONS, updated);
    dispatch({ type: 'SET_RESERVATIONS', payload: updated });
  }, [state.reservations]);

  // ─── Loyalty ──────────────────────────────────────────────────────────────
  const updateLoyaltyAccount = useCallback((acc: LoyaltyAccount) => {
    const existing = state.loyalty.find(l => l.phone === acc.phone);
    const updated = existing
      ? state.loyalty.map(l => l.phone === acc.phone ? acc : l)
      : [...state.loyalty, acc];
    setLocalStorage(STORAGE_KEYS.LOYALTY, updated);
    dispatch({ type: 'SET_LOYALTY', payload: updated });
  }, [state.loyalty]);

  const getLoyaltyAccount = useCallback((phone: string) => {
    return state.loyalty.find(l => l.phone === phone);
  }, [state.loyalty]);

  // ─── Waiter Alerts ────────────────────────────────────────────────────────
  const addWaiterAlert = useCallback((alert: WaiterAlert) => {
    const existing = parseLocalStorage<WaiterAlert[]>(STORAGE_KEYS.WAITER_ALERTS, []);
    const updated = [...existing, alert];
    setLocalStorage(STORAGE_KEYS.WAITER_ALERTS, updated);
    dispatch({ type: 'SET_WAITER_ALERTS', payload: updated });
    const tables = parseLocalStorage<Table[]>(STORAGE_KEYS.TABLES, []);
    const updatedTables = tables.map(t =>
      t.id === alert.tableId ? { ...t, waiterAlerts: [...(t.waiterAlerts || []), alert] } : t
    );
    setLocalStorage(STORAGE_KEYS.TABLES, updatedTables);
    dispatch({ type: 'SET_TABLES', payload: updatedTables });
  }, []);

  const updateWaiterAlert = useCallback((alert: WaiterAlert) => {
    const existing = parseLocalStorage<WaiterAlert[]>(STORAGE_KEYS.WAITER_ALERTS, []);
    const updated = existing.map(a => a.id === alert.id ? alert : a);
    setLocalStorage(STORAGE_KEYS.WAITER_ALERTS, updated);
    dispatch({ type: 'SET_WAITER_ALERTS', payload: updated });
  }, []);

  const refreshWaiterAlerts = useCallback(() => {
    const alerts = parseLocalStorage<WaiterAlert[]>(STORAGE_KEYS.WAITER_ALERTS, []);
    dispatch({ type: 'SET_WAITER_ALERTS', payload: alerts });
  }, []);

  // ─── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback((settings: VenueSettings) => {
    setLocalStorage(STORAGE_KEYS.SETTINGS, settings);
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  }, []);

  // ─── Staff ────────────────────────────────────────────────────────────────
  const addStaff = useCallback((member: StaffMember) => {
    const updated = [...state.staff, member];
    setLocalStorage(STORAGE_KEYS.STAFF, updated);
    dispatch({ type: 'SET_STAFF', payload: updated });
  }, [state.staff]);

  const updateStaff = useCallback((member: StaffMember) => {
    const updated = state.staff.map(s => s.id === member.id ? member : s);
    setLocalStorage(STORAGE_KEYS.STAFF, updated);
    dispatch({ type: 'SET_STAFF', payload: updated });
  }, [state.staff]);

  const deleteStaff = useCallback((id: string) => {
    const updated = state.staff.filter(s => s.id !== id);
    setLocalStorage(STORAGE_KEYS.STAFF, updated);
    dispatch({ type: 'SET_STAFF', payload: updated });
  }, [state.staff]);

  // ─── Shifts ───────────────────────────────────────────────────────────────
  const clockIn = useCallback((staffId: string): Shift => {
    const shift: Shift = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      staffId,
      clockIn: new Date().toISOString(),
      breakMinutes: 0,
      notes: '',
      tablesServed: [],
      ordersHandled: [],
    };
    const updated = [...state.shifts, shift];
    setLocalStorage(STORAGE_KEYS.SHIFTS, updated);
    dispatch({ type: 'SET_SHIFTS', payload: updated });
    return shift;
  }, [state.shifts]);

  const clockOut = useCallback((shiftId: string) => {
    const updated = state.shifts.map(s =>
      s.id === shiftId ? { ...s, clockOut: new Date().toISOString() } : s
    );
    setLocalStorage(STORAGE_KEYS.SHIFTS, updated);
    dispatch({ type: 'SET_SHIFTS', payload: updated });
  }, [state.shifts]);

  const getActiveShift = useCallback((staffId: string): Shift | undefined => {
    return state.shifts.find(s => s.staffId === staffId && !s.clockOut);
  }, [state.shifts]);

  // ─── Inventory ────────────────────────────────────────────────────────────
  const addInventoryItem = useCallback((item: InventoryItem) => {
    const updated = [...state.inventory, item];
    setLocalStorage(STORAGE_KEYS.INVENTORY, updated);
    dispatch({ type: 'SET_INVENTORY', payload: updated });
  }, [state.inventory]);

  const updateInventoryItem = useCallback((item: InventoryItem) => {
    const updated = state.inventory.map(i => i.id === item.id ? item : i);
    setLocalStorage(STORAGE_KEYS.INVENTORY, updated);
    dispatch({ type: 'SET_INVENTORY', payload: updated });
  }, [state.inventory]);

  const deleteInventoryItem = useCallback((id: string) => {
    const updated = state.inventory.filter(i => i.id !== id);
    setLocalStorage(STORAGE_KEYS.INVENTORY, updated);
    dispatch({ type: 'SET_INVENTORY', payload: updated });
  }, [state.inventory]);

  const addStockMovement = useCallback((movement: StockMovement) => {
    // Update inventory level
    const updatedInventory = state.inventory.map(item =>
      item.id === movement.inventoryItemId
        ? { ...item, currentStock: Math.max(0, item.currentStock + movement.quantity) }
        : item
    );
    setLocalStorage(STORAGE_KEYS.INVENTORY, updatedInventory);
    dispatch({ type: 'SET_INVENTORY', payload: updatedInventory });

    const updatedMovements = [...state.stockMovements, movement];
    setLocalStorage(STORAGE_KEYS.STOCK_MOVEMENTS, updatedMovements);
    dispatch({ type: 'SET_STOCK_MOVEMENTS', payload: updatedMovements });
  }, [state.inventory, state.stockMovements]);

  const value: RestaurantContextValue = {
    ...state,
    addMenuItem, updateMenuItem, deleteMenuItem, updateCategories,
    addOrder, updateOrder, refreshOrders,
    updateTable, refreshTables, mergeTables, unmergeTables,
    addReservation, updateReservation, deleteReservation,
    updateLoyaltyAccount, getLoyaltyAccount,
    addWaiterAlert, updateWaiterAlert, refreshWaiterAlerts,
    updateSettings,
    addStaff, updateStaff, deleteStaff,
    clockIn, clockOut, getActiveShift,
    addInventoryItem, updateInventoryItem, deleteInventoryItem, addStockMovement,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used within RestaurantProvider');
  return ctx;
}
