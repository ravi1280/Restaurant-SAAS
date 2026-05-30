'use server';

import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { 
  MenuItem, MenuCategory, Order, Table, Reservation, 
  LoyaltyAccount, VenueSettings, WaiterAlert, 
  StaffMember, Shift, InventoryItem, StockMovement 
} from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Fetch the entire restaurant state from the database
export async function getDbState() {
  try {
    const categories = await db.select().from(schema.menuCategories).orderBy(schema.menuCategories.order);
    const items = await db.select().from(schema.menuItems).orderBy(schema.menuItems.name);
    const ords = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    const tbls = await db.select().from(schema.tables).orderBy(schema.tables.id);
    const resvs = await db.select().from(schema.reservations).orderBy(schema.reservations.date);
    const loyaltyAccs = await db.select().from(schema.loyaltyAccounts);
    const staffMembers = await db.select().from(schema.staffMembers);
    const shiftsList = await db.select().from(schema.shifts);
    const inventoryItems = await db.select().from(schema.inventoryItems);
    const stockMoves = await db.select().from(schema.stockMovements).orderBy(desc(schema.stockMovements.timestamp));
    const settingsRow = await db.select().from(schema.venueSettings).where(eq(schema.venueSettings.id, 1)).limit(1);

    return {
      menuCategories: categories,
      menuItems: items,
      orders: ords,
      tables: tbls,
      reservations: resvs,
      loyalty: loyaltyAccs,
      staff: staffMembers,
      shifts: shiftsList,
      inventory: inventoryItems,
      stockMovements: stockMoves,
      settings: settingsRow[0] || null,
    };
  } catch (error) {
    console.error('Failed to get database state:', error);
    throw new Error('Database read failed');
  }
}

// ─── Menu Items ───
export async function addMenuItemAction(item: MenuItem) {
  await db.insert(schema.menuItems).values(item);
  revalidatePath('/');
}

export async function updateMenuItemAction(item: MenuItem) {
  await db.update(schema.menuItems)
    .set(item)
    .where(eq(schema.menuItems.id, item.id));
  revalidatePath('/');
}

export async function deleteMenuItemAction(id: string) {
  await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));
  revalidatePath('/');
}

export async function updateCategoriesAction(categories: MenuCategory[]) {
  // Clear and batch-reinsert categories sequentially (neon-http compatible)
  await db.delete(schema.menuCategories);
  if (categories.length > 0) {
    await db.insert(schema.menuCategories).values(categories);
  }
  revalidatePath('/');
}

// ─── Orders ───
export async function addOrderAction(order: Order) {
  await db.insert(schema.orders).values(order);
  revalidatePath('/');
}

export async function updateOrderAction(order: Order) {
  await db.update(schema.orders)
    .set(order)
    .where(eq(schema.orders.id, order.id));
  revalidatePath('/');
}

// ─── Tables ───
export async function updateTableAction(table: Table) {
  await db.update(schema.tables)
    .set(table)
    .where(eq(schema.tables.id, table.id));
  revalidatePath('/');
}

export async function mergeTablesAction(primaryId: number, secondaryIds: number[], newSeats: number) {
  // Update primary table seats and mergedWith associations
  await db.update(schema.tables)
    .set({ mergedWith: secondaryIds, seats: newSeats })
    .where(eq(schema.tables.id, primaryId));

  // Update secondary tables status to occupied and link back to primary table
  for (const secId of secondaryIds) {
    await db.update(schema.tables)
      .set({ status: 'occupied', mergedWith: [primaryId] })
      .where(eq(schema.tables.id, secId));
  }
  revalidatePath('/');
}

export async function unmergeTablesAction(primaryId: number, secondaryIds: number[]) {
  // Reset primary table mergedWith association
  await db.update(schema.tables)
    .set({ mergedWith: null })
    .where(eq(schema.tables.id, primaryId));

  // Reset secondary tables status to available and clear mergedWith
  for (const secId of secondaryIds) {
    await db.update(schema.tables)
      .set({ status: 'available', mergedWith: null })
      .where(eq(schema.tables.id, secId));
  }
  revalidatePath('/');
}

// ─── Reservations ───
export async function addReservationAction(res: Reservation) {
  await db.insert(schema.reservations).values(res);
  revalidatePath('/');
}

export async function updateReservationAction(res: Reservation) {
  await db.update(schema.reservations)
    .set(res)
    .where(eq(schema.reservations.id, res.id));
  revalidatePath('/');
}

export async function deleteReservationAction(id: string) {
  await db.delete(schema.reservations).where(eq(schema.reservations.id, id));
  revalidatePath('/');
}

// ─── Loyalty ───
export async function updateLoyaltyAccountAction(acc: LoyaltyAccount) {
  await db.insert(schema.loyaltyAccounts)
    .values(acc)
    .onConflictDoUpdate({
      target: schema.loyaltyAccounts.phone,
      set: acc
    });
  revalidatePath('/');
}

// ─── Waiter Alerts ───
export async function addWaiterAlertAction(alert: WaiterAlert) {
  // Add waiter alert to active table sequentially
  const [table] = await db.select().from(schema.tables).where(eq(schema.tables.id, alert.tableId)).limit(1);
  if (table) {
    const currentAlerts = table.waiterAlerts || [];
    await db.update(schema.tables)
      .set({ waiterAlerts: [...currentAlerts, alert] })
      .where(eq(schema.tables.id, alert.tableId));
  }
  revalidatePath('/');
}

export async function updateWaiterAlertAction(alert: WaiterAlert) {
  // Update waiter alert state inside table metadata sequentially
  const [table] = await db.select().from(schema.tables).where(eq(schema.tables.id, alert.tableId)).limit(1);
  if (table) {
    const currentAlerts = table.waiterAlerts || [];
    const updatedAlerts = currentAlerts.map(a => a.id === alert.id ? alert : a);
    await db.update(schema.tables)
      .set({ waiterAlerts: updatedAlerts })
      .where(eq(schema.tables.id, alert.tableId));
  }
  revalidatePath('/');
}

// ─── Settings ───
export async function updateSettingsAction(settings: VenueSettings) {
  const payload = { ...settings, id: 1 };
  await db.insert(schema.venueSettings)
    .values(payload)
    .onConflictDoUpdate({
      target: schema.venueSettings.id,
      set: payload
    });
  revalidatePath('/');
}

// ─── Staff ───
export async function addStaffAction(member: StaffMember) {
  await db.insert(schema.staffMembers).values(member);
  revalidatePath('/');
}

export async function updateStaffAction(member: StaffMember) {
  await db.update(schema.staffMembers)
    .set(member)
    .where(eq(schema.staffMembers.id, member.id));
  revalidatePath('/');
}

// ─── Staff Delete ───
export async function deleteStaffAction(id: string) {
  await db.delete(schema.staffMembers).where(eq(schema.staffMembers.id, id));
  revalidatePath('/');
}

// ─── Shifts ───
export async function clockInAction(staffId: string) {
  const shift: Shift = {
    id: Math.random().toString(36).substring(2) + Date.now().toString(36),
    staffId,
    clockIn: new Date().toISOString(),
    breakMinutes: 0,
    notes: '',
    tablesServed: [],
    ordersHandled: [],
  };
  const [newShift] = await db.insert(schema.shifts).values(shift).returning();
  revalidatePath('/');
  return newShift;
}

export async function clockOutAction(shiftId: string) {
  await db.update(schema.shifts)
    .set({ clockOut: new Date().toISOString() })
    .where(eq(schema.shifts.id, shiftId));
  revalidatePath('/');
}

// ─── Inventory ───
export async function addInventoryItemAction(item: InventoryItem) {
  await db.insert(schema.inventoryItems).values(item);
  revalidatePath('/');
}

export async function updateInventoryItemAction(item: InventoryItem) {
  await db.update(schema.inventoryItems)
    .set(item)
    .where(eq(schema.inventoryItems.id, item.id));
  revalidatePath('/');
}

export async function deleteInventoryItemAction(id: string) {
  await db.delete(schema.inventoryItems).where(eq(schema.inventoryItems.id, id));
  revalidatePath('/');
}

export async function addStockMovementAction(movement: StockMovement) {
  // Insert stock movement sequentially
  await db.insert(schema.stockMovements).values(movement);

  // Fetch and update matching inventory item current stock levels
  const [invItem] = await db.select()
    .from(schema.inventoryItems)
    .where(eq(schema.inventoryItems.id, movement.inventoryItemId))
    .limit(1);

  if (invItem) {
    const newStock = Math.max(0, invItem.currentStock + movement.quantity);
    await db.update(schema.inventoryItems)
      .set({ currentStock: newStock, lastRestocked: new Date().toISOString() })
      .where(eq(schema.inventoryItems.id, movement.inventoryItemId));
  }
  revalidatePath('/');
}
