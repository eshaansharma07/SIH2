import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

test('Customer Credit & WhatsApp Reminders Suite', async (t) => {
  seedDatabase();

  await t.test('1. Seeded customers exist for ramesh-kirana with valid phone numbers', () => {
    const customers = db.prepare(`SELECT * FROM customers WHERE shop_id = 'ramesh-kirana'`).all();
    assert.ok(customers.length >= 7, 'Should have at least 7 seeded customers');

    const ramswaroop = customers.find(c => c.name.includes('Ramswaroop'));
    assert.ok(ramswaroop, 'Masterji Ramswaroop should be seeded');
    assert.strictEqual(ramswaroop.phone, '9876543210');
    assert.strictEqual(ramswaroop.village_address, 'Utraula Dehat');
    assert.strictEqual(ramswaroop.credit_limit, 8000);
  });

  await t.test('2. Registering a new customer with initial udhaar balance', () => {
    const custId = `test-cust-${Date.now()}`;
    const shopId = 'ramesh-kirana';
    const nowIso = new Date().toISOString();

    // Insert customer
    db.prepare(`
      INSERT INTO customers (id, shop_id, name, phone, village_address, credit_limit, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(custId, shopId, 'Pandit Dinanath', '9811223344', 'Mandir Marg', 7000, 'Temple priest', nowIso);

    // Insert initial transaction for transferred khata balance
    const txId = `tx-init-${Date.now()}`;
    db.prepare(`
      INSERT INTO transactions (id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(txId, shopId, nowIso.split('T')[0], 'udhaar_given', 850, 'Initial Khata Balance', 'khata', 'Pandit Dinanath', 'Initial paper transfer');

    // Verify customer
    const fetched = db.prepare('SELECT * FROM customers WHERE id = ?').get(custId);
    assert.ok(fetched);
    assert.strictEqual(fetched.name, 'Pandit Dinanath');
    assert.strictEqual(fetched.phone, '9811223344');

    // Verify udhaar transaction
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
    assert.ok(tx);
    assert.strictEqual(tx.amount, 850);
    assert.strictEqual(tx.type, 'udhaar_given');
    assert.strictEqual(tx.customer_vendor_name, 'Pandit Dinanath');

    // Clean up test customer and transaction
    db.prepare('DELETE FROM transactions WHERE id = ?').run(txId);
    db.prepare('DELETE FROM customers WHERE id = ?').run(custId);
  });

  await t.test('3. WhatsApp reminder URL and phone formatting', () => {
    const rawPhone = '+91 98765 43210';
    const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^91/, '');
    assert.strictEqual(cleanPhone, '9876543210');

    const customerName = 'Ram Prasad';
    const amount = 450;
    const shopName = "Ramesh's Kirana Store";
    const upiId = '9839124789@upi';

    const message = `नमस्ते ${customerName} जी! ${shopName} से आपका ₹${amount} का हिसाब बाकी है। कृपया सुविधानुसार भुगतान कर दें। धन्यवाद! UPI: ${upiId}`;
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/91${cleanPhone}?text=${encoded}`;

    assert.ok(waUrl.startsWith('https://wa.me/919876543210?text='));
    assert.ok(waUrl.includes('9839124789%40upi') || waUrl.includes('9839124789@upi'));
  });

  await t.test('4. Recording reminder timestamp updates customer record', () => {
    const custId = `test-remind-${Date.now()}`;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO customers (id, shop_id, name, phone, village_address, credit_limit, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(custId, 'ramesh-kirana', 'Test Remind Cust', '9999988888', 'Village 1', 5000, '', nowIso);

    const reminderTime = new Date().toISOString();
    db.prepare(`UPDATE customers SET last_reminder_sent = ? WHERE id = ?`).run(reminderTime, custId);

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(custId);
    assert.strictEqual(updated.last_reminder_sent, reminderTime);

    db.prepare('DELETE FROM customers WHERE id = ?').run(custId);
  });

  await t.test('5. Udhaar Given and Udhaar Repaid transaction cycle records properly', () => {
    const shopId = 'ramesh-kirana';
    const custName = 'Dharmendra Yadav';
    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split('T')[0];

    // Record udhaar_given of 1200
    const txGivenId = `tx-given-${Date.now()}`;
    db.prepare(`
      INSERT INTO transactions (id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, customer_phone, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(txGivenId, shopId, dateStr, 'udhaar_given', 1200, 'Monthly Grocery Khata', 'khata', custName, '9876543211', 'Lent on credit');

    // Record udhaar_repaid of 700 (Partial cash repayment)
    const txRepaidId = `tx-repaid-${Date.now()}`;
    db.prepare(`
      INSERT INTO transactions (id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, customer_phone, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(txRepaidId, shopId, dateStr, 'udhaar_repaid', 700, 'Partial Cash Clearing', 'khata', custName, '9876543211', 'Partial repayment');

    // Verify both records exist and have distinct types
    const given = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txGivenId);
    const repaid = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txRepaidId);

    assert.ok(given && repaid);
    assert.strictEqual(given.type, 'udhaar_given');
    assert.strictEqual(repaid.type, 'udhaar_repaid');
    assert.strictEqual(given.amount, 1200);
    assert.strictEqual(repaid.amount, 700);
    assert.strictEqual(given.category, 'Monthly Grocery Khata');
    assert.strictEqual(repaid.category, 'Partial Cash Clearing');

    // Clean up
    db.prepare('DELETE FROM transactions WHERE id IN (?, ?)').run(txGivenId, txRepaidId);
  });
});

