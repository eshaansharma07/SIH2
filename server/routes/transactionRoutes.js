import express from 'express';
import dataStore from '../db/dataStore.js';

const router = express.Router();

// Get transactions for a shop
router.get('/', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.json({ success: true, count: 0, transactions: [] });
    }
    const limit = Number(req.query.limit) || 100;
    const type = req.query.type; // optional filter: income, expense, udhaar_given, udhaar_repaid

    const transactions = await dataStore.getTransactions(shopId, { type, limit });
    res.json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a new transaction (from Bahi-Khata tactile logger)
router.post('/', async (req, res) => {
  try {
    const {
      shopId,
      date = new Date().toISOString().split('T')[0],
      type, // 'income', 'expense', 'udhaar_given', 'udhaar_repaid'
      amount,
      category,
      payment_mode = 'cash', // 'cash', 'upi', 'khata'
      customer_vendor_name = '',
      notes = ''
    } = req.body;

    if (!shopId) {
      return res.status(400).json({ success: false, error: 'shopId is required' });
    }

    const validTypes = ['income', 'expense', 'udhaar_given', 'udhaar_repaid'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid transaction type is required (income, expense, udhaar_given, udhaar_repaid)' 
      });
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0 || numAmount > 10000000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid transaction amount between ₹1 and ₹1,00,00,000 is required' 
      });
    }

    const validModes = ['cash', 'upi', 'khata'];
    if (payment_mode && !validModes.includes(payment_mode)) {
      return res.status(400).json({
        success: false,
        error: 'Valid payment mode is required (cash, upi, khata)'
      });
    }

    const validDate = (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) ? date : new Date().toISOString().split('T')[0];
    const clientTxId = (req.body.id || req.body.client_tx_id || '').trim();
    const id = clientTxId || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Idempotency check: if this transaction already exists (e.g. offline queue retry), return it cleanly
    if (clientTxId) {
      const existing = await dataStore.getTransactionById(clientTxId);
      if (existing) {
        return res.status(200).json({ success: true, transaction: existing, duplicate: true, idempotent: true });
      }
    }

    const assignedCategory = (category && String(category).trim().slice(0, 100)) || (type === 'income' ? 'Daily Counter Sales' : type === 'expense' ? 'Shop Supplies' : 'Customer Khata');
    const assignedPaymentMode = type.startsWith('udhaar') ? 'khata' : (payment_mode || 'cash');
    const safeCustomerName = customer_vendor_name ? String(customer_vendor_name).trim().slice(0, 100) : '';
    const safeCustomerPhone = (req.body.customer_phone || req.body.customerPhone || '').trim().replace(/\D/g, '').slice(-10);
    const safeNotes = notes ? String(notes).trim().slice(0, 250) : '';

    const newTx = {
      id,
      shop_id: shopId,
      shopId,
      date: validDate,
      type,
      amount: numAmount,
      category: assignedCategory,
      payment_mode: assignedPaymentMode,
      customer_vendor_name: safeCustomerName,
      customer_phone: safeCustomerPhone,
      notes: safeNotes,
      created_at: new Date().toISOString()
    };

    const saved = await dataStore.createTransaction(newTx);
    if (saved && saved.isExisting) {
      return res.status(200).json({ success: true, transaction: saved, duplicate: true, idempotent: true });
    }

    res.status(201).json({ success: true, transaction: newTx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a transaction (Accidental entry undo)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.query.shopId || '';

    await dataStore.deleteTransaction(id, shopId);

    res.json({ success: true, message: 'Transaction deleted successfully', deletedId: id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get financial summary & seasonal cash flow metrics
router.get('/summary', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.json({
        success: true,
        summary: {
          totalIncome: 0,
          totalExpense: 0,
          netSurplus: 0,
          pendingUdhaar: 0,
          totalUdhaarGiven: 0,
          totalUdhaarRepaid: 0,
          cashIncome: 0,
          upiIncome: 0,
          digitalSharePct: 0,
          totalTransactions: 0,
          monthlyTrend: []
        }
      });
    }

    const summary = await dataStore.getTransactionSummary(shopId);
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Udhaar Ledger (Customer balances & repayment tracking)
router.get('/udhaar-ledger', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      return res.json({ success: true, count: 0, ledger: [] });
    }

    const [allTxs, registeredCustomers] = await Promise.all([
      dataStore.getTransactions(shopId, { limit: 1000 }),
      dataStore.getCustomers(shopId)
    ]);

    const txs = allTxs.filter(t => t.type === 'udhaar_given' || t.type === 'udhaar_repaid');

    const regCustomerMap = new Map();
    registeredCustomers.forEach(rc => {
      regCustomerMap.set((rc.name || '').trim().toLowerCase(), rc);
    });

    const customerMap = {};

    txs.forEach(t => {
      const name = (t.customer_vendor_name || 'Village Customer').trim();
      const nameKey = name.toLowerCase();
      const reg = regCustomerMap.get(nameKey);

      if (!customerMap[name]) {
        customerMap[name] = {
          customerId: reg ? reg.id : null,
          customerName: name,
          phone: reg ? reg.phone : (t.customer_phone || ''),
          village: reg ? (reg.village_address || reg.village) : '',
          creditLimit: reg ? reg.credit_limit : 5000,
          lastReminderSent: reg ? reg.last_reminder_sent : null,
          isRegistered: Boolean(reg),
          totalGiven: 0,
          totalRepaid: 0,
          balanceOwed: 0,
          lastDate: t.date,
          history: []
        };
      }

      if (!customerMap[name].phone && t.customer_phone) {
        customerMap[name].phone = t.customer_phone;
      }

      if (t.type === 'udhaar_given') {
        customerMap[name].totalGiven += t.amount;
      } else {
        customerMap[name].totalRepaid += t.amount;
      }

      customerMap[name].history.push({
        id: t.id,
        date: t.date,
        type: t.type,
        amount: t.amount,
        notes: t.notes
      });
    });

    // Include registered customers who have 0 transactions yet
    registeredCustomers.forEach(rc => {
      if (!customerMap[rc.name]) {
        customerMap[rc.name] = {
          customerId: rc.id,
          customerName: rc.name,
          phone: rc.phone,
          village: rc.village_address || rc.village,
          creditLimit: rc.credit_limit || 5000,
          lastReminderSent: rc.last_reminder_sent,
          isRegistered: true,
          totalGiven: 0,
          totalRepaid: 0,
          balanceOwed: 0,
          lastDate: null,
          history: []
        };
      }
    });

    const ledger = Object.values(customerMap).map(c => {
      c.balanceOwed = Math.max(0, c.totalGiven - c.totalRepaid);
      c.usagePercent = Math.min(100, Math.round((c.balanceOwed / (c.creditLimit || 5000)) * 100));
      return c;
    }).sort((a, b) => b.balanceOwed - a.balanceOwed);

    res.json({ success: true, count: ledger.length, ledger });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch Sync endpoint for offline queue replay
router.post('/sync', async (req, res) => {
  try {
    const rawList = Array.isArray(req.body) ? req.body : (req.body.transactions || req.body.txs || []);
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return res.status(400).json({ success: false, error: 'transactions array is required' });
    }

    const results = [];
    for (const item of rawList) {
      const shopId = item.shop_id || item.shopId;
      if (!shopId) continue;

      const clientTxId = (item.id || item.client_tx_id || '').trim();
      const id = clientTxId || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      // Check idempotency first
      if (clientTxId) {
        const existing = await dataStore.getTransactionById(clientTxId);
        if (existing) {
          results.push({ ...existing, duplicate: true, idempotent: true });
          continue;
        }
      }

      const numAmount = Number(item.amount);
      if (!item.amount || isNaN(numAmount) || numAmount <= 0) continue;

      const validDate = (item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) ? item.date : new Date().toISOString().split('T')[0];
      const assignedCategory = (item.category && String(item.category).trim().slice(0, 100)) || 
        (item.type === 'income' ? 'Daily Counter Sales' : item.type === 'expense' ? 'Shop Supplies' : 'Customer Khata');
      const assignedPaymentMode = item.type?.startsWith('udhaar') ? 'khata' : (item.payment_mode || 'cash');
      const safeCustomerName = item.customer_vendor_name ? String(item.customer_vendor_name).trim().slice(0, 100) : '';
      const safeCustomerPhone = (item.customer_phone || item.customerPhone || '').trim().replace(/\D/g, '').slice(-10);
      const safeNotes = item.notes ? String(item.notes).trim().slice(0, 250) : '';

      const newTx = {
        id,
        shop_id: shopId,
        shopId,
        date: validDate,
        type: item.type,
        amount: numAmount,
        category: assignedCategory,
        payment_mode: assignedPaymentMode,
        customer_vendor_name: safeCustomerName,
        customer_phone: safeCustomerPhone,
        notes: safeNotes,
        created_at: item.created_at || new Date().toISOString()
      };

      const saved = await dataStore.createTransaction(newTx);
      results.push(saved?.isExisting ? saved : newTx);
    }

    res.status(200).json({ success: true, processed: results.length, transactions: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
