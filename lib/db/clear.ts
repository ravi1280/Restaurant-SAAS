import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './index';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

async function main() {
  console.log('🧹 Clearing transactional data (Orders, Loyalty, Reservations, Stock)...');
  try {
    await db.delete(schema.stockMovements);
    await db.delete(schema.shifts);
    await db.delete(schema.reservations);
    await db.delete(schema.loyaltyAccounts);
    await db.delete(schema.orders);
    
    // Optionally reset table statuses to available
    const tables = await db.select().from(schema.tables);
    for (const table of tables) {
      await db.update(schema.tables).set({ status: 'available', currentOrderId: null, occupiedSince: null }).where(eq(schema.tables.id, table.id));
    }
    
    console.log('✅ Database cleared! Ready for fresh orders.');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
  process.exit(0);
}

main();
