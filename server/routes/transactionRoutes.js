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
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const assignedCategory = (category && String(category).trim().slice(0, 100)) || (type === 'income' ? 'Daily Counter Sales' : type === 'expense' ? 'Shop Supplies' : 'Customer Khata');
    const assignedPaymentMode = type.startsWith('udhaar') ? 'khata' : (payment_mode || 'cash');
    const safeCustomerName = customer_vendor_name ? String(customer_vendor_name).trim().slice(0, 100) : '';
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
      notes: safeNotes,
      created_at: new Date().toISOString()
    };

    await dataStore.createTransaction(newTx);

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
          phone: reg ? reg.phone : '',
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

export default router;
