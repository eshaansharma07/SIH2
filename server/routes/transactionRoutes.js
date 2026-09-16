import express from 'express';
import db from '../db/database.js';
import { getTransactionsCollection, getShopsCollection } from '../db/mongoClient.js';

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

    // 1. Try fetching from MongoDB Atlas if connected
    try {
      const col = await getTransactionsCollection();
      if (col) {
        const filter = { shop_id: shopId };
        if (type) filter.type = type;
        const mongoTxs = await col.find(filter)
          .sort({ date: -1, created_at: -1 })
          .limit(limit)
          .toArray();
        if (mongoTxs && mongoTxs.length > 0) {
          return res.json({ success: true, count: mongoTxs.length, transactions: mongoTxs });
        }
      }
    } catch (mongoErr) {
      console.warn('[MongoDB Atlas] Fallback to SQLite for GET /:', mongoErr.message);
    }

    // 2. Fallback to SQLite
    let query = 'SELECT * FROM transactions WHERE shop_id = ?';
    const params = [shopId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const transactions = db.prepare(query).all(...params);
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

    // Ensure shop exists in local SQLite to satisfy foreign key constraint across serverless containers
    const existingShop = db.prepare('SELECT id FROM shops WHERE id = ?').get(shopId);
    if (!existingShop) {
      let pulledShop = null;
      try {
        const shopsCol = await getShopsCollection();
        if (shopsCol) {
          pulledShop = await shopsCol.findOne({ id: shopId });
        }
      } catch (_) {}

      if (pulledShop) {
        try {
          db.prepare(`
            INSERT OR REPLACE INTO shops (
              id, name, owner_name, trade_type, trade_name, village, district, state,
              vintage_years, monthly_revenue, ownership, bank_account_type, phone, owner_category, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            pulledShop.id, pulledShop.name, pulledShop.owner_name, pulledShop.trade_type, pulledShop.trade_name || '',
            pulledShop.village || '', pulledShop.district || '', pulledShop.state || '',
            pulledShop.vintage_years || 0, pulledShop.monthly_revenue || 0,
            pulledShop.ownership || 'rented', pulledShop.bank_account_type || 'savings',
            pulledShop.phone || '', pulledShop.owner_category || 'general', pulledShop.is_demo || 0
          );
        } catch (_) {}
      } else {
        try {
          db.prepare(`
            INSERT OR IGNORE INTO shops (id, name, owner_name, trade_type, trade_name, village, district, state, vintage_years, monthly_revenue, is_demo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(shopId, 'Registered Shop', 'Enterprise Owner', 'kirana', 'Micro-Enterprise', 'Gram Panchayat', 'District', 'State', 1, 0, 0);
        } catch (_) {}
      }
    }

    // 1. Insert into SQLite
    const insert = db.prepare(`
      INSERT INTO transactions (id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      shopId,
      date,
      type,
      Number(amount),
      assignedCategory,
      assignedPaymentMode,
      customer_vendor_name,
      notes
    );

    const newTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

    // 2. Also persist in MongoDB Atlas for cross-container serverless persistence
    try {
      const col = await getTransactionsCollection();
      if (col) {
        await col.insertOne({
          id,
          shop_id: shopId,
          date,
          type,
          amount: Number(amount),
          category: assignedCategory,
          payment_mode: assignedPaymentMode,
          customer_vendor_name,
          notes,
          created_at: newTx?.created_at || new Date().toISOString()
        });
      }
    } catch (mongoErr) {
      console.warn('[MongoDB Atlas] Cloud insert notice:', mongoErr.message);
    }

    res.json({ success: true, transaction: newTx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a transaction (in case added mistakenly)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.query.shopId;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Transaction id is required' });
    }

    // 1. Delete from SQLite
    try {
      let query = 'DELETE FROM transactions WHERE id = ?';
      const params = [id];
      if (shopId) {
        query += ' AND shop_id = ?';
        params.push(shopId);
      }
      db.prepare(query).run(...params);
    } catch (sqlErr) {
      console.warn('[SQLite] Delete warning:', sqlErr.message);
    }

    // 2. Delete from MongoDB Atlas
    try {
      const col = await getTransactionsCollection();
      if (col) {
        const filter = { id };
        if (shopId) filter.shop_id = shopId;
        await col.deleteOne(filter);
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas] Delete warning:', mErr.message);
    }

    res.json({ success: true, message: 'Transaction deleted successfully', deletedId: id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Financial summary (Overall, 30 days, Cash vs UPI, Charts data)
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
          activeDays: 0,
          monthlyTrend: []
        }
      });
    }

    let txs = [];
    // 1. Try reading from MongoDB Atlas
    try {
      const col = await getTransactionsCollection();
      if (col) {
        txs = await col.find({ shop_id: shopId }).sort({ date: 1 }).toArray();
      }
    } catch (mongoErr) {
      console.warn('[MongoDB Atlas] Fallback to SQLite for /summary:', mongoErr.message);
    }

    // 2. Fallback to SQLite
    if (!txs || txs.length === 0) {
      txs = db.prepare(`
        SELECT * FROM transactions 
        WHERE shop_id = ? 
        ORDER BY date ASC
      `).all(shopId);
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let totalUdhaarGiven = 0;
    let totalUdhaarRepaid = 0;
    let totalCashIncome = 0;
    let totalUpiIncome = 0;
    const activeDaysSet = new Set();

    const monthlyMap = {}; // { 'Month Name': { income, expense, profit } }

    txs.forEach(t => {
      activeDaysSet.add(t.date);
      const monthKey = t.date.substring(0, 7);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, income: 0, expense: 0, profit: 0 };
      }

      if (t.type === 'income') {
        totalIncome += t.amount;
        monthlyMap[monthKey].income += t.amount;
        if (t.payment_mode === 'cash') totalCashIncome += t.amount;
        if (t.payment_mode === 'upi') totalUpiIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
        monthlyMap[monthKey].expense += t.amount;
      } else if (t.type === 'udhaar_given') {
        totalUdhaarGiven += t.amount;
      } else if (t.type === 'udhaar_repaid') {
        totalUdhaarRepaid += t.amount;
      }
    });

    const monthNames = {
      '2026-05': { label: 'May 2026', tag: 'Summer Baseline', desc: 'Steady rural grocery demand' },
      '2026-06': { label: 'Jun 2026', tag: 'Summer Baseline', desc: 'Consistent baseline sales' },
      '2026-07': { label: 'Jul 2026', tag: 'Monsoon Seasonal Dip', desc: 'Heavy rains & muddy village lanes' },
      '2026-08': { label: 'Aug 2026', tag: 'Post-Monsoon Recovery', desc: 'Weather clears & Rakhi/Janmashtami prep' },
      '2026-09': { label: 'Sep 2026', tag: 'Pre-Diwali Festival Surge', desc: 'Pre-Diwali advance oil & sugar rush' }
    };

    Object.values(monthlyMap).forEach(m => {
      m.profit = m.income - m.expense;
      const meta = monthNames[m.month] || { label: m.month, tag: 'Regular Month', desc: '' };
      m.label = meta.label;
      m.patternTag = meta.tag;
      m.narrative = meta.desc;
    });

    const netSurplus = totalIncome - totalExpense;
    const pendingUdhaar = Math.max(0, totalUdhaarGiven - totalUdhaarRepaid);

    res.json({
      success: true,
      summary: {
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        netSurplus: Math.round(netSurplus),
        pendingUdhaar: Math.round(pendingUdhaar),
        totalUdhaarGiven: Math.round(totalUdhaarGiven),
        totalUdhaarRepaid: Math.round(totalUdhaarRepaid),
        cashIncome: Math.round(totalCashIncome),
        upiIncome: Math.round(totalUpiIncome),
        digitalSharePct: totalIncome > 0 ? Math.round((totalUpiIncome / totalIncome) * 100) : 0,
        totalTransactions: txs.length,
        activeDays: activeDaysSet.size,
        monthlyTrend: Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))
      }
    });
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

    let txs = [];
    // 1. Try reading from MongoDB Atlas
    try {
      const col = await getTransactionsCollection();
      if (col) {
        txs = await col.find({
          shop_id: shopId,
          type: { $in: ['udhaar_given', 'udhaar_repaid'] }
        }).sort({ date: -1 }).toArray();
      }
    } catch (mongoErr) {
      console.warn('[MongoDB Atlas] Fallback to SQLite for /udhaar-ledger:', mongoErr.message);
    }

    // 2. Fallback to SQLite
    if (!txs || txs.length === 0) {
      txs = db.prepare(`
        SELECT * FROM transactions 
        WHERE shop_id = ? AND (type = 'udhaar_given' OR type = 'udhaar_repaid')
        ORDER BY date DESC
      `).all(shopId);
    }

    // 3. Load registered customers to enrich ledger with phone, village & credit limit
    let registeredCustomers = [];
    try {
      registeredCustomers = db.prepare(`
        SELECT * FROM customers WHERE shop_id = ?
      `).all(shopId);
    } catch (_) {
      registeredCustomers = [];
    }

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
          village: reg ? reg.village_address : '',
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

    // Also include registered customers who may have 0 pending balance yet
    registeredCustomers.forEach(rc => {
      const nameKey = (rc.name || '').trim().toLowerCase();
      if (!customerMap[rc.name]) {
        customerMap[rc.name] = {
          customerId: rc.id,
          customerName: rc.name,
          phone: rc.phone,
          village: rc.village_address,
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
