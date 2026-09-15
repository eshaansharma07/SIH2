import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

test('Shop Auth & Transaction Operations Suite', async (t) => {
  seedDatabase();

  await t.test('1. Shopkeeper phone & PIN verification in database', () => {
    // Ramesh's phone is '+91 98391 24789' and password is '1234'
    const phoneInput = '9839124789';
    const digitsOnly = phoneInput.replace(/\D/g, '');

    const shop = db.prepare(`
      SELECT * FROM shops 
      WHERE (
        phone = ? 
        OR (phone != '' AND REPLACE(REPLACE(phone, ' ', ''), '+91', '') = ?)
        OR id = ?
        OR LOWER(name) = LOWER(?)
      )
      ORDER BY is_demo ASC, created_at DESC
      LIMIT 1
    `).get(phoneInput, digitsOnly, phoneInput, phoneInput);

    assert.ok(shop, 'Ramesh shop should be found by normalized phone');
    assert.strictEqual(shop.id, 'ramesh-kirana');
    assert.strictEqual(shop.password, '1234');
  });

  await t.test('2. Transaction creation and deletion', () => {
    const txId = `test-tx-${Date.now()}`;
    const insert = db.prepare(`
      INSERT INTO transactions (id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(txId, 'ramesh-kirana', '2026-09-15', 'income', 450, 'Groceries', 'cash', 'Test Customer', 'Test item');

    const created = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
    assert.ok(created, 'Transaction must be created');
    assert.strictEqual(created.amount, 450);

    // Delete transaction
    const del = db.prepare('DELETE FROM transactions WHERE id = ?');
    const delResult = del.run(txId);
    assert.strictEqual(delResult.changes, 1, 'Exactly one row should be deleted');

    const check = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
    assert.strictEqual(check, undefined, 'Transaction should no longer exist');
  });

  await t.test('3. New shop registration with phone and PIN', () => {
    const newShopId = `test-shop-${Date.now()}`;
    const insertShop = db.prepare(`
      INSERT INTO shops (
        id, name, owner_name, trade_type, trade_name, village, district, state,
        vintage_years, monthly_revenue, ownership, bank_account_type, phone, password, owner_category, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    insertShop.run(
      newShopId,
      'Shree Ganesh Stores',
      'Mahesh Kumar',
      'kirana',
      'Kirana & Provisions',
      'Bithoor',
      'Kanpur Nagar',
      'Uttar Pradesh',
      4,
      45000,
      'owned',
      'savings',
      '9988776655',
      '5678',
      'obc'
    );

    const lookup = db.prepare('SELECT * FROM shops WHERE phone = ?').get('9988776655');
    assert.ok(lookup, 'New shop should be retrieved by phone');
    assert.strictEqual(lookup.owner_name, 'Mahesh Kumar');
    assert.strictEqual(lookup.password, '5678');

    // Clean up test shop
    db.prepare('DELETE FROM shops WHERE id = ?').run(newShopId);
  });
});
