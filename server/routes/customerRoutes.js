import express from 'express';
import db from '../db/database.js';
import { getCustomersCollection, getTransactionsCollection } from '../db/mongoClient.js';

const router = express.Router();

/**
 * Normalizes phone numbers by stripping country code (+91) and non-digits.
 */
function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * GET /api/customers?shopId=...
 * Returns registered customers along with their live computed udhaar balances,
 * credit limit utilization, and last reminder timestamp.
 */
router.get('/', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId query parameter is required' });
    }

    // 1. Fetch registered customers for this shop
    let customers = [];
    try {
      customers = db.prepare(`
        SELECT * FROM customers 
        WHERE shop_id = ? 
        ORDER BY created_at DESC
      `).all(shopId);
    } catch (e) {
      console.warn('[Database] SQLite customers fetch notice:', e.message);
    }

    // Fallback or hydrate from MongoDB Atlas if SQLite was blank
    if (customers.length === 0) {
      try {
        const col = await getCustomersCollection();
        if (col) {
          const mongoList = await col.find({ shop_id: shopId }).toArray();
          if (mongoList && mongoList.length > 0) {
            customers = mongoList.map(({ _id, ...rest }) => rest);
            // Cache back into local SQLite
            const insert = db.prepare(`
              INSERT OR REPLACE INTO customers (id, shop_id, name, phone, village_address, credit_limit, notes, last_reminder_sent, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const c of customers) {
              try {
                insert.run(
                  c.id, c.shop_id, c.name, c.phone, c.village_address || '',
                  c.credit_limit || 5000, c.notes || '', c.last_reminder_sent || null,
                  c.created_at || new Date().toISOString()
                );
              } catch (_) {}
            }
          }
        }
      } catch (mErr) {
        console.warn('[MongoDB Atlas] Fallback customer notice:', mErr.message);
      }
    }

    // 2. Fetch all udhaar transactions for this shop to compute live balances
    let txs = [];
    try {
      txs = db.prepare(`
        SELECT * FROM transactions 
        WHERE shop_id = ? AND (type = 'udhaar_given' OR type = 'udhaar_repaid')
        ORDER BY date ASC
      `).all(shopId);
    } catch (_) {
      txs = [];
    }

    // Map transactions by customer name (normalized lowercase)
    const txByCustomer = new Map();
    txs.forEach(t => {
      const nameKey = (t.customer_vendor_name || '').trim().toLowerCase();
      if (!nameKey) return;
      if (!txByCustomer.has(nameKey)) {
        txByCustomer.set(nameKey, { totalGiven: 0, totalRepaid: 0, lastDate: t.date, txCount: 0 });
      }
      const agg = txByCustomer.get(nameKey);
      if (t.type === 'udhaar_given') {
        agg.totalGiven += t.amount;
      } else if (t.type === 'udhaar_repaid') {
        agg.totalRepaid += t.amount;
      }
      agg.lastDate = t.date;
      agg.txCount += 1;
    });

    // 3. Attach live metrics to each customer
    const registeredNames = new Set();
    const result = customers.map(c => {
      const nameKey = c.name.trim().toLowerCase();
      registeredNames.add(nameKey);
      const agg = txByCustomer.get(nameKey) || { totalGiven: 0, totalRepaid: 0, lastDate: null, txCount: 0 };
      const balanceOwed = Math.max(0, agg.totalGiven - agg.totalRepaid);
      const limit = Number(c.credit_limit) || 5000;
      const usagePercent = Math.min(100, Math.round((balanceOwed / limit) * 100));

      let status = 'safe';
      if (balanceOwed > limit) status = 'overlimit';
      else if (usagePercent >= 80) status = 'attention';

      return {
        ...c,
        phone: c.phone || '',
        cleanPhone: normalizePhone(c.phone),
        credit_limit: limit,
        totalGiven: agg.totalGiven,
        totalRepaid: agg.totalRepaid,
        balanceOwed,
        usagePercent,
        status,
        lastTransactionDate: agg.lastDate,
        txCount: agg.txCount,
        isRegistered: true
      };
    });

    // 4. Also discover any transaction customer names that aren't yet registered
    // so the shopkeeper can 1-click register them
    for (const [nameKey, agg] of txByCustomer.entries()) {
      if (!registeredNames.has(nameKey)) {
        const balanceOwed = Math.max(0, agg.totalGiven - agg.totalRepaid);
        const originalTx = txs.find(t => (t.customer_vendor_name || '').trim().toLowerCase() === nameKey);
        const displayName = originalTx ? originalTx.customer_vendor_name.trim() : nameKey;
        const limit = 5000;
        const usagePercent = Math.min(100, Math.round((balanceOwed / limit) * 100));

        result.push({
          id: `unregistered-${Buffer.from(nameKey).toString('hex').slice(0, 8)}`,
          shop_id: shopId,
          name: displayName,
          phone: '',
          cleanPhone: '',
          village_address: '',
          credit_limit: limit,
          notes: 'Auto-detected from existing bahi-khata entries',
          last_reminder_sent: null,
          created_at: null,
          totalGiven: agg.totalGiven,
          totalRepaid: agg.totalRepaid,
          balanceOwed,
          usagePercent,
          status: balanceOwed > limit ? 'overlimit' : usagePercent >= 80 ? 'attention' : 'safe',
          lastTransactionDate: agg.lastDate,
          txCount: agg.txCount,
          isRegistered: false
        });
      }
    }

    // Sort by highest balance owed first
    result.sort((a, b) => b.balanceOwed - a.balanceOwed);

    res.json({
      success: true,
      count: result.length,
      customers: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/customers
 * Register a new customer with mobile, village, and credit limit
 */
router.post('/', async (req, res) => {
  try {
    const {
      shopId,
      name,
      phone,
      village_address,
      village,
      credit_limit,
      creditLimit,
      notes,
      initialBalance
    } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Customer mobile number is required' });
    }

    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
    }

    const finalVillage = (village_address || village || '').trim();
    const finalLimit = Math.max(500, Number(credit_limit || creditLimit) || 5000);
    const finalNotes = (notes || '').trim();
    const id = `cust-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nowIso = new Date().toISOString();

    // Insert into SQLite
    const insert = db.prepare(`
      INSERT INTO customers (id, shop_id, name, phone, village_address, credit_limit, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      shopId,
      name.trim(),
      phone.trim(),
      finalVillage,
      finalLimit,
      finalNotes,
      nowIso
    );

    const newCustomer = {
      id,
      shop_id: shopId,
      name: name.trim(),
      phone: phone.trim(),
      cleanPhone,
      village_address: finalVillage,
      credit_limit: finalLimit,
      notes: finalNotes,
      last_reminder_sent: null,
      created_at: nowIso,
      totalGiven: 0,
      totalRepaid: 0,
      balanceOwed: 0,
      usagePercent: 0,
      status: 'safe',
      isRegistered: true
    };

    // If initial khata balance was provided, create an initial transaction
    const initialAmt = Number(initialBalance) || 0;
    if (initialAmt > 0) {
      const txId = `tx-init-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      try {
        const txInsert = db.prepare(`
          INSERT INTO transactions (id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        txInsert.run(
          txId,
          shopId,
          nowIso.split('T')[0],
          'udhaar_given',
          initialAmt,
          'Initial Khata Balance',
          'khata',
          name.trim(),
          'Carried forward from paper bahi-khata ledger'
        );

        newCustomer.totalGiven = initialAmt;
        newCustomer.balanceOwed = initialAmt;
        newCustomer.usagePercent = Math.min(100, Math.round((initialAmt / finalLimit) * 100));

        // Sync tx to Mongo
        try {
          const txCol = await getTransactionsCollection();
          if (txCol) {
            await txCol.updateOne({ id: txId }, { $set: {
              id: txId,
              shop_id: shopId,
              date: nowIso.split('T')[0],
              type: 'udhaar_given',
              amount: initialAmt,
              category: 'Initial Khata Balance',
              payment_mode: 'khata',
              customer_vendor_name: name.trim(),
              notes: 'Carried forward from paper bahi-khata ledger',
              created_at: nowIso
            }}, { upsert: true });
          }
        } catch (_) {}
      } catch (txErr) {
        console.warn('[Database] Initial khata balance creation error:', txErr.message);
      }
    }

    // Sync customer to MongoDB Atlas in background
    try {
      const col = await getCustomersCollection();
      if (col) {
        await col.updateOne({ id }, { $set: newCustomer }, { upsert: true });
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas] Customer sync notice:', mErr.message);
    }

    res.status(201).json({ success: true, customer: newCustomer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/customers/:id
 * Update customer details
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, village_address, credit_limit, notes } = req.body;

    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const updatedName = (name && name.trim()) || existing.name;
    const updatedPhone = (phone && phone.trim()) || existing.phone;
    const updatedVillage = village_address !== undefined ? village_address.trim() : existing.village_address;
    const updatedLimit = credit_limit !== undefined ? Number(credit_limit) : existing.credit_limit;
    const updatedNotes = notes !== undefined ? notes.trim() : existing.notes;

    db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, village_address = ?, credit_limit = ?, notes = ?
      WHERE id = ?
    `).run(updatedName, updatedPhone, updatedVillage, updatedLimit, updatedNotes, id);

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    // Sync to MongoDB Atlas
    try {
      const col = await getCustomersCollection();
      if (col) {
        await col.updateOne({ id }, { $set: updated }, { upsert: true });
      }
    } catch (_) {}

    res.json({ success: true, customer: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/customers/:id
 * Remove customer record
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const del = db.prepare('DELETE FROM customers WHERE id = ?').run(id);

    try {
      const col = await getCustomersCollection();
      if (col) {
        await col.deleteOne({ id });
      }
    } catch (_) {}

    res.json({ success: true, deleted: del.changes > 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/customers/:id/reminder-sent
 * Updates last_reminder_sent timestamp when shopkeeper sends a WhatsApp reminder
 */
router.post('/:id/reminder-sent', async (req, res) => {
  try {
    const { id } = req.params;
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE customers 
      SET last_reminder_sent = ? 
      WHERE id = ?
    `).run(nowIso, id);

    try {
      const col = await getCustomersCollection();
      if (col) {
        await col.updateOne({ id }, { $set: { last_reminder_sent: nowIso } });
      }
    } catch (_) {}

    res.json({ success: true, lastReminderSent: nowIso });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
