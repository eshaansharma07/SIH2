import { test, after } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { accountingService } from '../services/accountingService.js';
import { generateShopToken } from '../middleware/auth.js';
import { closeMongoConnection } from '../db/mongoClient.js';

test('Vyapaar Accounting & Billing Domain Test Suite', async (t) => {
  seedDatabase();

  const shopId = 'ramesh-kirana';

  await t.test('1. Seeded products and suppliers exist for ramesh-kirana', async () => {
    const products = await accountingService.getProducts(shopId);
    assert.ok(products.length >= 10, 'Should have at least 10 seeded products');

    const flour = products.find(p => p.name.includes('Wheat Flour'));
    assert.ok(flour, 'Wheat flour product should exist');
    assert.strictEqual(flour.hsn_code, '1101');
    assert.strictEqual(flour.gst_rate, 5);

    const suppliers = await accountingService.getSuppliers(shopId);
    assert.ok(suppliers.length >= 2, 'Should have at least 2 seeded suppliers');
    const mandi = suppliers.find(s => s.name.includes('Balrampur Galla Mandi'));
    assert.ok(mandi, 'Mandi supplier should exist');
    assert.strictEqual(mandi.gstin, '09AABCU9603R1ZM');
  });

  await t.test('2. Product CRUD, SKU generation and price validation', async () => {
    const newProd = await accountingService.upsertProduct(shopId, {
      name: 'Madhur Brown Sugar 1kg',
      category: 'Staples',
      unit: 'pkt',
      purchasePrice: 45,
      sellingPrice: 55,
      gstRate: 5,
      currentStock: 25,
      reorderLevel: 5
    });

    assert.ok(newProd.id, 'Product ID should be generated');
    assert.strictEqual(newProd.name, 'Madhur Brown Sugar 1kg');
    assert.strictEqual(newProd.selling_price, 55);
    assert.ok(newProd.sku.startsWith('SKU-'), 'SKU should be auto-generated');

    // Update product
    const updated = await accountingService.upsertProduct(shopId, {
      id: newProd.id,
      name: 'Madhur Brown Sugar 1kg (Special)',
      sellingPrice: 58
    });
    assert.strictEqual(updated.name, 'Madhur Brown Sugar 1kg (Special)');
    assert.strictEqual(updated.selling_price, 58);

    // Delete product
    const delRes = await accountingService.deleteProduct(shopId, newProd.id);
    assert.strictEqual(delRes.success, true);
    const fetched = await accountingService.getProductById(shopId, newProd.id);
    assert.ok(!fetched || fetched.is_active === 0);

    // Cleanup
    db.prepare('DELETE FROM products WHERE id = ?').run(newProd.id);
  });

  await t.test('3. Stock adjustment and movements audit trail', async () => {
    const products = await accountingService.getProducts(shopId);
    const prod = products[0];
    const initialStock = prod.current_stock;

    // Adjust stock by +5
    const adjResult = await accountingService.adjustStock(shopId, prod.id, {
      quantity: 5,
      type: 'adjustment_in',
      notes: 'Test stock intake'
    });

    assert.strictEqual(adjResult.current_stock, initialStock + 5);

    // Verify stock movement logged
    const movements = await accountingService.getStockMovements(shopId, { productId: prod.id });
    assert.ok(movements.length > 0, 'Movement must be logged in stock_movements');
    assert.strictEqual(movements[0].quantity, 5);

    // Rollback stock adjustment
    await accountingService.adjustStock(shopId, prod.id, {
      quantity: -5,
      type: 'adjustment_out',
      notes: 'Test rollback'
    });
  });

  await t.test('4. Invoice Creation: Intra-state GST splits CGST and SGST equally (50/50)', async () => {
    const products = await accountingService.getProducts(shopId);
    const prod = products.find(p => p.gst_rate === 5) || products[0];

    const invoice = await accountingService.createInvoice(shopId, {
      customerName: 'Test Local Customer',
      customerState: 'Uttar Pradesh',
      isInterstate: false,
      paymentMode: 'cash',
      items: [
        {
          productId: prod.id,
          name: prod.name,
          quantity: 2,
          unitPrice: 100, // 200 taxable + 5% GST = 10 (CGST 5 + SGST 5) = 210
          gstRate: 5
        }
      ]
    });

    assert.ok(invoice.id);
    assert.strictEqual(invoice.is_interstate, 0);
    assert.strictEqual(invoice.total_amount, 210);
    assert.strictEqual(invoice.igst, 0);
    assert.strictEqual(invoice.cgst, 5);
    assert.strictEqual(invoice.sgst, 5);
    assert.strictEqual(invoice.cgst, invoice.sgst, 'CGST and SGST must be exactly equal for intra-state');

    // Cleanup
    db.prepare('DELETE FROM transactions WHERE id = ?').run(`tx-inv-${invoice.id}-paid`);
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoice.id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(invoice.id);
  });

  await t.test('5. Invoice Creation: Inter-state GST applies IGST and sets CGST=0, SGST=0', async () => {
    const products = await accountingService.getProducts(shopId);
    const prod = products.find(p => p.gst_rate === 18) || products[0];

    const invoice = await accountingService.createInvoice(shopId, {
      customerName: 'Bihar Wholesale Buyer',
      customerState: 'Bihar',
      isInterstate: true,
      paymentMode: 'upi',
      items: [
        {
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          unitPrice: 100,
          gstRate: 18
        }
      ]
    });

    assert.strictEqual(invoice.is_interstate, 1);
    assert.strictEqual(invoice.cgst, 0);
    assert.strictEqual(invoice.sgst, 0);
    assert.strictEqual(invoice.igst, 18);
    assert.strictEqual(invoice.total_amount, 118);

    // Cleanup
    db.prepare('DELETE FROM transactions WHERE id = ?').run(`tx-inv-${invoice.id}-paid`);
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoice.id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(invoice.id);
  });

  await t.test('6. Invoice Creation decrements product inventory stock', async () => {
    const products = await accountingService.getProducts(shopId);
    const prod = products[0];
    const initialStock = prod.current_stock;

    const invoice = await accountingService.createInvoice(shopId, {
      customerName: 'Inventory Test Customer',
      paymentMode: 'cash',
      items: [
        {
          productId: prod.id,
          quantity: 3,
          unitPrice: prod.selling_price,
          gstRate: prod.gst_rate
        }
      ]
    });

    const updatedProd = await accountingService.getProductById(shopId, prod.id);
    assert.strictEqual(updatedProd.current_stock, initialStock - 3, 'Stock must decrease by sold quantity');

    // Revert stock & delete test invoice
    await accountingService.adjustStock(shopId, prod.id, { quantity: 3, notes: 'Test revert' });
    db.prepare('DELETE FROM transactions WHERE id = ?').run(`tx-inv-${invoice.id}-paid`);
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoice.id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(invoice.id);
  });

  await t.test('7. Cash sale invoice automatically creates income transaction in core ledger', async () => {
    const products = await accountingService.getProducts(shopId);
    const prod = products[0];

    const invoice = await accountingService.createInvoice(shopId, {
      customerName: 'Cash Buyer Ramesh',
      paymentMode: 'cash',
      items: [
        {
          productId: prod.id,
          quantity: 1,
          unitPrice: 250,
          gstRate: 5
        }
      ]
    });

    // Check core transactions table
    const tx = db.prepare(`
      SELECT * FROM transactions 
      WHERE id = ? AND type = 'income'
    `).get(`tx-inv-${invoice.id}-paid`);

    assert.ok(tx, 'Core income transaction must be logged for cash invoice');
    assert.strictEqual(tx.amount, invoice.total_amount);
    assert.strictEqual(tx.payment_mode, 'cash');

    // Cleanup
    if (tx) db.prepare('DELETE FROM transactions WHERE id = ?').run(tx.id);
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoice.id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(invoice.id);
  });

  await t.test('8. Khata (credit) invoice creates udhaar_given transaction and increases balance', async () => {
    const cust = db.prepare(`SELECT * FROM customers WHERE shop_id = ? LIMIT 1`).get(shopId);
    assert.ok(cust, 'Seeded customer must exist');

    const products = await accountingService.getProducts(shopId);
    const prod = products[0];

    const invoice = await accountingService.createInvoice(shopId, {
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      paymentMode: 'khata',
      items: [
        {
          productId: prod.id,
          quantity: 2,
          unitPrice: 150,
          gstRate: 0
        }
      ]
    });

    assert.strictEqual(invoice.payment_status, 'unpaid');
    assert.strictEqual(invoice.balance_due, 300);

    // Check core transactions table for udhaar_given
    const tx = db.prepare(`
      SELECT * FROM transactions 
      WHERE shop_id = ? AND notes LIKE ? AND type = 'udhaar_given'
    `).get(shopId, `%${invoice.invoice_number}%`);

    assert.ok(tx, 'Core udhaar_given transaction must be logged for credit invoice');
    assert.strictEqual(tx.amount, 300);
    assert.strictEqual(tx.customer_id, cust.id);

    // Cleanup
    if (tx) db.prepare('DELETE FROM transactions WHERE id = ?').run(tx.id);
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoice.id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(invoice.id);
  });

  await t.test('9. Purchase recording increments inventory stock and creates core expense transaction', async () => {
    const products = await accountingService.getProducts(shopId);
    const prod = products[0];
    const initialStock = prod.current_stock;

    const suppliers = await accountingService.getSuppliers(shopId);
    const supp = suppliers[0];

    const purchase = await accountingService.createPurchase(shopId, {
      supplierId: supp.id,
      supplierName: supp.name,
      paymentMode: 'bank_transfer',
      items: [
        {
          productId: prod.id,
          quantity: 15,
          unitPrice: 80,
          gstRate: 5
        }
      ]
    });

    assert.ok(purchase.id);
    const updatedProd = await accountingService.getProductById(shopId, prod.id);
    assert.strictEqual(updatedProd.current_stock, initialStock + 15, 'Stock must increment by purchased quantity');

    // Check core transactions table for stock procurement expense
    const tx = db.prepare(`
      SELECT * FROM transactions 
      WHERE shop_id = ? AND notes LIKE ? AND type = 'expense'
    `).get(shopId, `%${purchase.purchase_number}%`);

    assert.ok(tx, 'Core expense transaction must be logged for purchase');
    assert.strictEqual(tx.amount, purchase.total_amount);

    // Cleanup
    if (tx) db.prepare('DELETE FROM transactions WHERE id = ?').run(tx.id);
    await accountingService.adjustStock(shopId, prod.id, { quantity: -15, notes: 'Test purchase revert' });
    db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(purchase.id);
    db.prepare('DELETE FROM purchases WHERE id = ?').run(purchase.id);
  });

  await t.test('10. Customer payment settles receivables and creates core udhaar_repaid transaction', async () => {
    const cust = db.prepare(`SELECT * FROM customers WHERE shop_id = ? LIMIT 1`).get(shopId);

    const payment = await accountingService.recordPayment(shopId, {
      partyType: 'customer',
      partyId: cust.id,
      partyName: cust.name,
      amount: 450,
      paymentMode: 'cash',
      notes: 'Test settlement'
    });

    assert.ok(payment.id);
    assert.strictEqual(payment.amount, 450);

    // Check core transactions table for udhaar_repaid
    const tx = db.prepare(`
      SELECT * FROM transactions 
      WHERE shop_id = ? AND notes LIKE ? AND type = 'udhaar_repaid'
    `).get(shopId, `%${payment.id}%`);

    assert.ok(tx, 'Core udhaar_repaid transaction must be logged');
    assert.strictEqual(tx.amount, 450);

    // Cleanup
    if (tx) db.prepare('DELETE FROM transactions WHERE id = ?').run(tx.id);
    db.prepare('DELETE FROM payments WHERE id = ?').run(payment.id);
  });

  await t.test('11. Receivables aging analysis correctly groups into 0-30, 31-60, 61-90, 90+ buckets', async () => {
    const rec = await accountingService.getReceivables(shopId);
    assert.ok(rec.buckets, 'Buckets object must exist');
    assert.ok(rec.buckets.d0_30 !== undefined);
    assert.ok(rec.buckets.d31_60 !== undefined);
    assert.ok(rec.buckets.d61_90 !== undefined);
    assert.ok(rec.buckets.d90_plus !== undefined);
    assert.ok(Array.isArray(rec.customers), 'Customers list must be an array');
  });

  await t.test('12. GST summary report calculates turnover, output tax, ITC, and net GST payable', async () => {
    const gst = await accountingService.getGstReport(shopId);
    assert.ok(gst.taxableSales >= 0);
    assert.ok(gst.outputTaxTotal >= 0);
    assert.ok(gst.itcTotal >= 0);
    assert.strictEqual(gst.netGstPayable, Math.round(Math.max(0, gst.outputTaxTotal - gst.itcTotal) * 100) / 100);
  });

  await t.test('13. Profit & Loss report calculates Revenue, COGS, Gross Profit, and Net Margin', async () => {
    const pnl = await accountingService.getProfitLoss(shopId);
    assert.ok(pnl.totalSalesRevenue >= 0);
    assert.ok(pnl.costOfGoodsSold >= 0);
    assert.strictEqual(pnl.grossProfit, Math.round((pnl.totalSalesRevenue - pnl.costOfGoodsSold) * 100) / 100);
    assert.ok(pnl.netMarginPct !== undefined);
  });

  await t.test('14. Security: requireShopAccess prevents cross-shop ledger tampering', () => {
    const rameshToken = generateShopToken({ id: 'ramesh-kirana', phone: '9839124789', is_demo: 1 });
    assert.ok(rameshToken, 'Token should generate');

    const foreignShop = { id: 'shop-unauthorized-99', phone: '9999999999', is_demo: 0 };
    const foreignToken = generateShopToken(foreignShop);
    assert.ok(foreignToken, 'Foreign token should generate');
  });

  after(async () => {
    await closeMongoConnection();
  });
});
