import express from 'express';
import dataStore from '../db/dataStore.js';

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

    const [customers, txs] = await Promise.all([
      dataStore.getCustomers(shopId),
      dataStore.getTransactions(shopId, { limit: 1000 })
    ]);

    // Filter udhaar transactions
    const udhaarTxs = txs.filter(t => t.type === 'udhaar_given' || t.type === 'udhaar_repaid');

    // Count all transactions for each customer (sales, udhaar, expenses)
    const allTxCountByCustomer = new Map();
    txs.forEach(t => {
      const nameKey = (t.customer_vendor_name || '').trim().toLowerCase();
      const cId = (t.customer_id || '').trim();
      if (nameKey) {
        allTxCountByCustomer.set(nameKey, (allTxCountByCustomer.get(nameKey) || 0) + 1);
      }
      if (cId) {
        allTxCountByCustomer.set(cId, (allTxCountByCustomer.get(cId) || 0) + 1);
      }
    });

    // Map transactions by customer name (normalized lowercase)
    const txByCustomer = new Map();
    udhaarTxs.forEach(t => {
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

      const totalTxCount = Math.max(
        agg.txCount, 
        allTxCountByCustomer.get(c.id) || 0, 
        allTxCountByCustomer.get(nameKey) || 0
      );

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
        txCount: totalTxCount,
        isRegistered: true
      };
    });

    // Also surface any un-registered ledger names
    for (const [nameKey, agg] of txByCustomer.entries()) {
      if (!registeredNames.has(nameKey)) {
        const balanceOwed = Math.max(0, agg.totalGiven - agg.totalRepaid);
        const originalTx = udhaarTxs.find(t => (t.customer_vendor_name || '').trim().toLowerCase() === nameKey);
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
          txCount: Math.max(agg.txCount, allTxCountByCustomer.get(nameKey) || 0),
          isRegistered: false
        });
      }
    }

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

    await dataStore.createCustomer(newCustomer);

    const initialAmt = Number(initialBalance) || 0;
    if (initialAmt > 0) {
      const txId = `tx-init-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const initTx = {
        id: txId,
        shop_id: shopId,
        shopId,
        date: nowIso.split('T')[0],
        type: 'udhaar_given',
        amount: initialAmt,
        category: 'Initial Khata Balance',
        payment_mode: 'khata',
        customer_vendor_name: name.trim(),
        notes: 'Carried forward from paper bahi-khata ledger',
        created_at: nowIso
      };

      await dataStore.createTransaction(initTx);

      newCustomer.totalGiven = initialAmt;
      newCustomer.balanceOwed = initialAmt;
      newCustomer.usagePercent = Math.min(100, Math.round((initialAmt / finalLimit) * 100));
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

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (village_address !== undefined) updateData.village_address = village_address.trim();
    if (credit_limit !== undefined) updateData.credit_limit = Number(credit_limit);
    if (notes !== undefined) updateData.notes = notes.trim();

    const updated = await dataStore.updateCustomer(id, updateData);

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
    await dataStore.deleteCustomer(id);
    res.json({ success: true, deleted: true });
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
    const lastReminderSent = await dataStore.recordCustomerReminder(id);
    res.json({ success: true, lastReminderSent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
