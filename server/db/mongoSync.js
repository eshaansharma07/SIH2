import { getMongoDb, closeMongoConnection } from './mongoClient.js';
import db from './database.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * MongoDB Atlas Cloud Sync Utility
 * Backs up and syncs Ramesh's Kirana Store, 4-month bahi-khata transactions,
 * credit scores, and government schemes to MongoDB Atlas using the managed
 * singleton connection pool.
 */

export async function syncToMongoDB() {
  const mongoDb = await getMongoDb();
  if (!mongoDb) {
    console.log('ℹ️ MongoDB not available. Skipping cloud sync.');
    return { success: false, message: 'MongoDB not configured or unavailable' };
  }

  try {
    console.log('🔄 Syncing local SQLite state to MongoDB Atlas...');

    // 1. Sync Shop Profile
    const shops = db.prepare('SELECT * FROM shops').all();
    if (shops.length > 0) {
      const shopCol = mongoDb.collection('shops');
      for (const s of shops) {
        await shopCol.updateOne({ id: s.id }, { $set: s }, { upsert: true });
      }
    }

    // 2. Sync 4 Months of Transactions
    const transactions = db.prepare('SELECT * FROM transactions').all();
    if (transactions.length > 0) {
      const txCol = mongoDb.collection('transactions');
      for (const tx of transactions) {
        await txCol.updateOne({ id: tx.id }, { $set: tx }, { upsert: true });
      }
    }

    // 3. Sync Peer Benchmarks
    const benchmarks = db.prepare('SELECT * FROM peer_benchmarks').all();
    if (benchmarks.length > 0) {
      const benchCol = mongoDb.collection('peer_benchmarks');
      for (const b of benchmarks) {
        await benchCol.updateOne({ id: b.id }, { $set: b }, { upsert: true });
      }
    }

    // 4. Sync Customers
    const customers = db.prepare('SELECT * FROM customers').all();
    if (customers.length > 0) {
      const custCol = mongoDb.collection('customers');
      for (const c of customers) {
        await custCol.updateOne({ id: c.id }, { $set: c }, { upsert: true });
      }
    }

    console.log(`✅ MongoDB Atlas Sync Complete: ${shops.length} shop(s), ${transactions.length} transactions, ${customers.length} customers synced.`);
    return {
      success: true,
      syncedShops: shops.length,
      syncedTransactions: transactions.length,
      syncedCustomers: customers.length
    };
  } catch (err) {
    console.error('❌ MongoDB Sync Error:', err.message);
    return { success: false, error: err.message };
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('mongoSync.js')) {
  syncToMongoDB().finally(async () => {
    await closeMongoConnection();
    process.exit(0);
  });
}

