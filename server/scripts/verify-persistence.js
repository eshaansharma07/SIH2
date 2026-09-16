import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runCrossInstancePersistenceVerification() {
  const uri = process.env.MONGODB_URI;
  console.log('🔍 [Part 4.6 Verification] Starting Cross-Instance Persistence Verification...');
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment. Cannot verify production MongoDB Atlas persistence.');
    process.exit(1);
  }

  const testShopId = `test-verify-shop-${Date.now()}`;
  const testTxId = `test-verify-tx-${Date.now()}`;
  const testPhone = `99${Date.now().toString().slice(-8)}`;

  // =========================================================================
  // STEP 1: Simulate Lambda Container A (Instance 1) - Open connection and write
  // =========================================================================
  console.log('\n--- Step 1: Lambda Instance A (Cold Start #1) ---');
  const clientA = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await clientA.connect();
  console.log('✅ Instance A connected to MongoDB Atlas');

  const dbA = clientA.db('vyapaar_saathi');
  const testShopData = {
    id: testShopId,
    name: 'Maa Durga General Store',
    owner_name: 'Durga Prasad',
    phone: testPhone,
    trade_type: 'kirana',
    village: 'Bithoor',
    district: 'Kanpur Nagar',
    state: 'Uttar Pradesh',
    monthly_revenue: 62000,
    created_at: new Date().toISOString()
  };

  const testTxData = {
    id: testTxId,
    shop_id: testShopId,
    date: '2026-09-16',
    type: 'income',
    amount: 1250,
    category: 'Grains & Atta',
    payment_mode: 'upi',
    customer_vendor_name: 'Anil Kumar',
    created_at: new Date().toISOString()
  };

  await dbA.collection('shops').insertOne(testShopData);
  await dbA.collection('transactions').insertOne(testTxData);
  console.log(`✅ Instance A wrote shop [${testShopId}] and transaction [${testTxId}]`);

  // Explicitly destroy / terminate Instance A connection
  await clientA.close();
  console.log('🔒 Instance A connection closed completely (simulating Lambda lifecycle termination)');

  // =========================================================================
  // STEP 2: Simulate Lambda Container B (Instance 2) - Brand new connection
  // =========================================================================
  console.log('\n--- Step 2: Lambda Instance B (Cold Start #2 - Fresh Container) ---');
  const clientB = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await clientB.connect();
  console.log('✅ Instance B connected to MongoDB Atlas from fresh socket pool');

  const dbB = clientB.db('vyapaar_saathi');

  // Query shop
  const fetchedShop = await dbB.collection('shops').findOne({ id: testShopId });
  assert.ok(fetchedShop, `Instance B MUST find shop ${testShopId}`);
  assert.strictEqual(fetchedShop.name, 'Maa Durga General Store');
  assert.strictEqual(fetchedShop.phone, testPhone);
  console.log(`✅ Instance B verified shop persisted: "${fetchedShop.name}" (${fetchedShop.phone})`);

  // Query transaction
  const fetchedTx = await dbB.collection('transactions').findOne({ id: testTxId });
  assert.ok(fetchedTx, `Instance B MUST find transaction ${testTxId}`);
  assert.strictEqual(fetchedTx.amount, 1250);
  assert.strictEqual(fetchedTx.type, 'income');
  assert.strictEqual(fetchedTx.payment_mode, 'upi');
  console.log(`✅ Instance B verified transaction persisted: ₹${fetchedTx.amount} (${fetchedTx.payment_mode})`);

  // =========================================================================
  // STEP 3: Cleanup Test Artifacts
  // =========================================================================
  console.log('\n--- Step 3: Cleanup Test Verification Records ---');
  await dbB.collection('shops').deleteOne({ id: testShopId });
  await dbB.collection('transactions').deleteOne({ id: testTxId });
  console.log('🧹 Cleaned up test records from MongoDB Atlas.');

  await clientB.close();
  console.log('🎉 [Part 4.6 Verification PASSED]: Data written on one Lambda instance is 100% durable and immediately readable across fresh serverless instances!\n');
}

runCrossInstancePersistenceVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
