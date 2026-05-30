import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './index';
import * as schema from './schema';
import { 
  seedCategories, 
  seedMenuItems, 
  generateSeedTables, 
  generateSeedOrders, 
  seedLoyaltyAccounts, 
  generateSeedReservations, 
  seedStaff, 
  seedInventory 
} from '../seedData';
import { DEFAULT_SETTINGS } from '../constants';

async function main() {
  console.log('⏳ Seeding database...');

  try {
    // 1. Clear existing data in reverse order of foreign keys
    console.log('🧹 Clearing existing data...');
    await db.delete(schema.venueSettings);
    await db.delete(schema.stockMovements);
    await db.delete(schema.inventoryItems);
    await db.delete(schema.shifts);
    await db.delete(schema.staffMembers);
    await db.delete(schema.reservations);
    await db.delete(schema.loyaltyAccounts);
    await db.delete(schema.orders);
    await db.delete(schema.tables);
    await db.delete(schema.menuItems);
    await db.delete(schema.menuCategories);

    // 2. Insert Menu Categories
    console.log('📁 Inserting menu categories...');
    await db.insert(schema.menuCategories).values(seedCategories);

    // 3. Insert Menu Items
    console.log('🍔 Inserting menu items...');
    await db.insert(schema.menuItems).values(seedMenuItems);

    // 4. Insert Tables
    console.log('🪑 Inserting tables...');
    await db.insert(schema.tables).values(generateSeedTables());

    // 5. Insert Orders
    console.log('📝 Inserting orders...');
    await db.insert(schema.orders).values(generateSeedOrders());

    // 6. Insert Loyalty Accounts
    console.log('💎 Inserting loyalty accounts...');
    await db.insert(schema.loyaltyAccounts).values(seedLoyaltyAccounts);

    // 7. Insert Reservations
    console.log('📅 Inserting reservations...');
    await db.insert(schema.reservations).values(generateSeedReservations());

    // 8. Insert Staff Members
    console.log('👥 Inserting staff members...');
    await db.insert(schema.staffMembers).values(seedStaff);

    // 9. Insert Inventory Items
    console.log('📦 Inserting inventory items...');
    await db.insert(schema.inventoryItems).values(seedInventory);

    // 10. Insert Venue Settings
    console.log('⚙️ Inserting venue settings...');
    await db.insert(schema.venueSettings).values({
      id: 1,
      ...DEFAULT_SETTINGS,
    });

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
