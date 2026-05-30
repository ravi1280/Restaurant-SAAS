'use client';

import React, { createContext, useContext, useEffect, useCallback, useReducer } from 'react';
import {
  MenuItem, MenuCategory, Order, Table, Reservation,
  LoyaltyAccount, VenueSettings, WaiterAlert,
  StaffMember, Shift, InventoryItem, StockMovement,
} from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import {
  getDbState,
  addMenuItemAction,
  updateMenuItemAction,
  deleteMenuItemAction,
  updateCategoriesAction,
  addOrderAction,
  updateOrderAction,
  updateTableAction,
  mergeTablesAction,
  unmergeTablesAction,
  addReservationAction,
  updateReservationAction,
  deleteReservationAction,
  updateLoyaltyAccountAction,
  addWaiterAlertAction,
  updateWaiterAlertAction,
  updateSettingsAction,
  addStaffAction,
  updateStaffAction,
  deleteStaffAction,
  clockInAction,
  clockOutAction,
  addInventoryItemAction,
  updateInventoryItemAction,
  deleteInventoryItemAction,
  addStockMovementAction,
} from '@/lib/actions/dbActions';

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Recursively converts database null values to undefined for frontend optional type compatibility
function cleanDbObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return undefined as any;
  if (Array.isArray(obj)) {
    return obj.map(cleanDbObject) as any;
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        newObj[key] = val === null ? undefined : cleanDbObject(val);
      }
    }
    return newObj;
  }
  return obj;
}

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

  // Load and hydrate state from Neon DB on mount
  useEffect(() => {
    async function initDbState() {
      try {
        const dbState = await getDbState();
        const cleanedItems = cleanDbObject(dbState.menuItems || []);
        const cleanedCategories = cleanDbObject(dbState.menuCategories || []);
        const cleanedOrders = cleanDbObject(dbState.orders || []);
        const cleanedTables = cleanDbObject(dbState.tables || []);
        const cleanedReservations = cleanDbObject(dbState.reservations || []);
        const cleanedLoyalty = cleanDbObject(dbState.loyalty || []);
        const cleanedSettings = cleanDbObject(dbState.settings || DEFAULT_SETTINGS);
        const cleanedStaff = cleanDbObject(dbState.staff || []);
        const cleanedShifts = cleanDbObject(dbState.shifts || []);
        const cleanedInventory = cleanDbObject(dbState.inventory || []);
        const cleanedStockMovements = cleanDbObject(dbState.stockMovements || []);

        dispatch({
          type: 'HYDRATE',
          payload: {
            menuItems: cleanedItems as MenuItem[],
            menuCategories: cleanedCategories as MenuCategory[],
            orders: cleanedOrders as Order[],
            tables: cleanedTables as Table[],
            reservations: cleanedReservations as Reservation[],
            loyalty: cleanedLoyalty as LoyaltyAccount[],
            waiterAlerts: cleanedTables ? (cleanedTables.flatMap(t => t.waiterAlerts || []) as WaiterAlert[]) : [],
            settings: cleanedSettings as VenueSettings,
            staff: cleanedStaff as StaffMember[],
            shifts: cleanedShifts as Shift[],
            inventory: cleanedInventory as InventoryItem[],
            stockMovements: cleanedStockMovements as StockMovement[],
            isSeeded: true,
          },
        });
      } catch (error) {
        console.error('Error hydrating restaurant state from database:', error);
      }
    }
    initDbState();
  }, []);

  // ─── Menu ─────────────────────────────────────────────────────────────────
  const addMenuItem = useCallback((item: MenuItem) => {
    const updated = [...state.menuItems, item];
    dispatch({ type: 'SET_MENU_ITEMS', payload: updated as MenuItem[] });
    addMenuItemAction(item).catch(err => console.error('DB Error:', err));
  }, [state.menuItems]);

  const updateMenuItem = useCallback((item: MenuItem) => {
    const updated = state.menuItems.map(i => i.id === item.id ? item : i);
    dispatch({ type: 'SET_MENU_ITEMS', payload: updated as MenuItem[] });
    updateMenuItemAction(item).catch(err => console.error('DB Error:', err));
  }, [state.menuItems]);

  const deleteMenuItem = useCallback((id: string) => {
    const updated = state.menuItems.filter(i => i.id !== id);
    dispatch({ type: 'SET_MENU_ITEMS', payload: updated as MenuItem[] });
    deleteMenuItemAction(id).catch(err => console.error('DB Error:', err));
  }, [state.menuItems]);

  const updateCategories = useCallback((categories: MenuCategory[]) => {
    dispatch({ type: 'SET_MENU_CATEGORIES', payload: categories as MenuCategory[] });
    updateCategoriesAction(categories).catch(err => console.error('DB Error:', err));
  }, []);

  // ─── Orders ───────────────────────────────────────────────────────────────
  const addOrder = useCallback((order: Order) => {
    const updated = [...state.orders, order];
    dispatch({ type: 'SET_ORDERS', payload: updated as Order[] });
    addOrderAction(order).catch(err => console.error('DB Error:', err));
  }, [state.orders]);

  const updateOrder = useCallback((order: Order) => {
    const updated = state.orders.map(o => o.id === order.id ? order : o);
    dispatch({ type: 'SET_ORDERS', payload: updated as Order[] });
    updateOrderAction(order).catch(err => console.error('DB Error:', err));
  }, [state.orders]);

  const refreshOrders = useCallback(async () => {
    try {
      const dbState = await getDbState();
      const cleanedOrders = cleanDbObject(dbState.orders || []);
      dispatch({ type: 'SET_ORDERS', payload: cleanedOrders as Order[] });
    } catch (err) {
      console.error('DB Error:', err);
    }
  }, []);

  // ─── Tables ───────────────────────────────────────────────────────────────
  const updateTable = useCallback((table: Table) => {
    const updated = state.tables.map(t => t.id === table.id ? table : t);
    dispatch({ type: 'SET_TABLES', payload: updated as Table[] });
    updateTableAction(table).catch(err => console.error('DB Error:', err));
  }, [state.tables]);

  const refreshTables = useCallback(async () => {
    try {
      const dbState = await getDbState();
      const cleanedTables = cleanDbObject(dbState.tables || []);
      dispatch({ type: 'SET_TABLES', payload: cleanedTables as Table[] });
    } catch (err) {
      console.error('DB Error:', err);
    }
  }, []);

  const mergeTables = useCallback((primaryId: number, secondaryIds: number[]) => {
    let newSeats = 0;
    const updated = state.tables.map(t => {
      if (t.id === primaryId) {
        const addedSeats = secondaryIds.reduce((s, id) => {
          const found = state.tables.find(x => x.id === id);
          return s + (found?.seats || 0);
        }, 0);
        newSeats = t.seats + addedSeats;
        return { ...t, mergedWith: secondaryIds, seats: newSeats };
      }
      if (secondaryIds.includes(t.id)) {
        return { ...t, status: 'occupied' as const, mergedWith: [primaryId] };
      }
      return t;
    });
    dispatch({ type: 'SET_TABLES', payload: updated as Table[] });
    mergeTablesAction(primaryId, secondaryIds, newSeats).catch(err => console.error('DB Error:', err));
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
    dispatch({ type: 'SET_TABLES', payload: updated as Table[] });
    unmergeTablesAction(primaryId, mergedIds).catch(err => console.error('DB Error:', err));
  }, [state.tables]);

  // ─── Reservations ─────────────────────────────────────────────────────────
  const addReservation = useCallback((res: Reservation) => {
    const updated = [...state.reservations, res];
    dispatch({ type: 'SET_RESERVATIONS', payload: updated as Reservation[] });
    addReservationAction(res).catch(err => console.error('DB Error:', err));
  }, [state.reservations]);

  const updateReservation = useCallback((res: Reservation) => {
    const updated = state.reservations.map(r => r.id === res.id ? res : r);
    dispatch({ type: 'SET_RESERVATIONS', payload: updated as Reservation[] });
    updateReservationAction(res).catch(err => console.error('DB Error:', err));
  }, [state.reservations]);

  const deleteReservation = useCallback((id: string) => {
    const updated = state.reservations.filter(r => r.id !== id);
    dispatch({ type: 'SET_RESERVATIONS', payload: updated as Reservation[] });
    deleteReservationAction(id).catch(err => console.error('DB Error:', err));
  }, [state.reservations]);

  // ─── Loyalty ──────────────────────────────────────────────────────────────
  const updateLoyaltyAccount = useCallback((acc: LoyaltyAccount) => {
    const existing = state.loyalty.find(l => l.phone === acc.phone);
    const updated = existing
      ? state.loyalty.map(l => l.phone === acc.phone ? acc : l)
      : [...state.loyalty, acc];
    dispatch({ type: 'SET_LOYALTY', payload: updated as LoyaltyAccount[] });
    updateLoyaltyAccountAction(acc).catch(err => console.error('DB Error:', err));
  }, [state.loyalty]);

  const getLoyaltyAccount = useCallback((phone: string) => {
    return state.loyalty.find(l => l.phone === phone);
  }, [state.loyalty]);

  // ─── Waiter Alerts ────────────────────────────────────────────────────────
  const addWaiterAlert = useCallback((alert: WaiterAlert) => {
    const updatedAlerts = [...state.waiterAlerts, alert];
    dispatch({ type: 'SET_WAITER_ALERTS', payload: updatedAlerts as WaiterAlert[] });

    const updatedTables = state.tables.map(t =>
      t.id === alert.tableId ? { ...t, waiterAlerts: [...(t.waiterAlerts || []), alert] } : t
    );
    dispatch({ type: 'SET_TABLES', payload: updatedTables as Table[] });

    addWaiterAlertAction(alert).catch(err => console.error('DB Error:', err));
  }, [state.waiterAlerts, state.tables]);

  const updateWaiterAlert = useCallback((alert: WaiterAlert) => {
    const updatedAlerts = state.waiterAlerts.map(a => a.id === alert.id ? alert : a);
    dispatch({ type: 'SET_WAITER_ALERTS', payload: updatedAlerts as WaiterAlert[] });
    updateWaiterAlertAction(alert).catch(err => console.error('DB Error:', err));
  }, [state.waiterAlerts]);

  const refreshWaiterAlerts = useCallback(async () => {
    try {
      const dbState = await getDbState();
      const cleanedTables = cleanDbObject(dbState.tables || []);
      dispatch({ type: 'SET_WAITER_ALERTS', payload: cleanedTables ? (cleanedTables.flatMap(t => t.waiterAlerts || []) as WaiterAlert[]) : [] });
    } catch (err) {
      console.error('DB Error:', err);
    }
  }, []);

  // ─── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback((settings: VenueSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings as VenueSettings });
    updateSettingsAction(settings).catch(err => console.error('DB Error:', err));
  }, []);

  // ─── Staff ────────────────────────────────────────────────────────────────
  const addStaff = useCallback((member: StaffMember) => {
    const updated = [...state.staff, member];
    dispatch({ type: 'SET_STAFF', payload: updated as StaffMember[] });
    addStaffAction(member).catch(err => console.error('DB Error:', err));
  }, [state.staff]);

  const updateStaff = useCallback((member: StaffMember) => {
    const updated = state.staff.map(s => s.id === member.id ? member : s);
    dispatch({ type: 'SET_STAFF', payload: updated as StaffMember[] });
    updateStaffAction(member).catch(err => console.error('DB Error:', err));
  }, [state.staff]);

  const deleteStaff = useCallback((id: string) => {
    const updated = state.staff.filter(s => s.id !== id);
    dispatch({ type: 'SET_STAFF', payload: updated as StaffMember[] });
    deleteStaffAction(id).catch(err => console.error('DB Error:', err));
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
    dispatch({ type: 'SET_SHIFTS', payload: updated as Shift[] });
    clockInAction(staffId).catch(err => console.error('DB Error:', err));
    return shift;
  }, [state.shifts]);

  const clockOut = useCallback((shiftId: string) => {
    const updated = state.shifts.map(s =>
      s.id === shiftId ? { ...s, clockOut: new Date().toISOString() } : s
    );
    dispatch({ type: 'SET_SHIFTS', payload: updated as Shift[] });
    clockOutAction(shiftId).catch(err => console.error('DB Error:', err));
  }, [state.shifts]);

  const getActiveShift = useCallback((staffId: string): Shift | undefined => {
    return state.shifts.find(s => s.staffId === staffId && !s.clockOut);
  }, [state.shifts]);

  // ─── Inventory ────────────────────────────────────────────────────────────
  const addInventoryItem = useCallback((item: InventoryItem) => {
    const updated = [...state.inventory, item];
    dispatch({ type: 'SET_INVENTORY', payload: updated as InventoryItem[] });
    addInventoryItemAction(item).catch(err => console.error('DB Error:', err));
  }, [state.inventory]);

  const updateInventoryItem = useCallback((item: InventoryItem) => {
    const updated = state.inventory.map(i => i.id === item.id ? item : i);
    dispatch({ type: 'SET_INVENTORY', payload: updated as InventoryItem[] });
    updateInventoryItemAction(item).catch(err => console.error('DB Error:', err));
  }, [state.inventory]);

  const deleteInventoryItem = useCallback((id: string) => {
    const updated = state.inventory.filter(i => i.id !== id);
    dispatch({ type: 'SET_INVENTORY', payload: updated as InventoryItem[] });
    deleteInventoryItemAction(id).catch(err => console.error('DB Error:', err));
  }, [state.inventory]);

  const addStockMovement = useCallback((movement: StockMovement) => {
    const updatedInventory = state.inventory.map(item =>
      item.id === movement.inventoryItemId
        ? { ...item, currentStock: Math.max(0, item.currentStock + movement.quantity) }
        : item
    );
    dispatch({ type: 'SET_INVENTORY', payload: updatedInventory as InventoryItem[] });

    const updatedMovements = [...state.stockMovements, movement];
    dispatch({ type: 'SET_STOCK_MOVEMENTS', payload: updatedMovements as StockMovement[] });
    addStockMovementAction(movement).catch(err => console.error('DB Error:', err));
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
