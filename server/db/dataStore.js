import db from './database.js';
import {
  getShopsCollection,
  getTransactionsCollection,
  getCustomersCollection,
  getBenchmarksCollection,
  isMongoConfigured
} from './mongoClient.js';

/**
 * Normalizes MongoDB documents by removing _id and returning a clean object
 */
function cleanDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

export const dataStore = {
  /**
   * Determine if MongoDB Atlas is the active primary datastore
   */
  async isPrimaryMongo() {
    if (!isMongoConfigured()) return false;
    const col = await getShopsCollection();
    return Boolean(col);
  },

  // ==========================================
  // 1. SHOPS
  // ==========================================

  async getShopById(id) {
    if (!id) return null;
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getShopsCollection();
        const doc = await col.findOne({ id });
        if (doc) return cleanDoc(doc);
      } catch (err) {
        console.warn('[DataStore] Mongo getShopById fallback:', err.message);
      }
    }
    return db.prepare('SELECT * FROM shops WHERE id = ?').get(id) || null;
  },

  async findShopById(id) {
    return this.getShopById(id);
  },

  async getDemoShop() {
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getShopsCollection();
        const doc = await col.findOne({ is_demo: 1 });
        if (doc) return cleanDoc(doc);
      } catch (err) {
        console.warn('[DataStore] Mongo getDemoShop fallback:', err.message);
      }
    }
    return db.prepare('SELECT * FROM shops WHERE is_demo = 1 LIMIT 1').get() || null;
  },

  async findShopByPhoneOrId(input, digitsOnly) {
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getShopsCollection();
        const query = {
          $or: [
            { phone: input },
            { id: input },
            { name: { $regex: new RegExp(`^${input}$`, 'i') } },
            ...(digitsOnly ? [{ phone: { $regex: digitsOnly } }] : [])
          ]
        };
        const doc = await col.findOne(query, { sort: { is_demo: 1, created_at: -1 } });
        if (doc) return cleanDoc(doc);
      } catch (err) {
        console.warn('[DataStore] Mongo findShopByPhoneOrId fallback:', err.message);
      }
    }

    return db.prepare(`
      SELECT * FROM shops 
      WHERE (
        phone = ? 
        OR (phone != '' AND REPLACE(REPLACE(phone, ' ', ''), '+91', '') = ?)
        OR id = ?
        OR LOWER(name) = LOWER(?)
      )
      ORDER BY is_demo ASC, created_at DESC
      LIMIT 1
    `).get(input, digitsOnly || input, input, input) || null;
  },

  async upsertShop(shopData) {
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getShopsCollection();
        await col.updateOne({ id: shopData.id }, { $set: shopData }, { upsert: true });
      } catch (err) {
        console.warn('[DataStore] Mongo upsertShop error:', err.message);
      }
    }

    // Mirror to local SQLite
    try {
      db.prepare(`
        INSERT OR REPLACE INTO shops (
          id, name, owner_name, trade_type, trade_name, village, district, state,
          vintage_years, monthly_revenue, ownership, bank_account_type, phone, password, owner_category, is_demo, is_udyam_verified, udyam_number, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        shopData.id, shopData.name, shopData.owner_name, shopData.trade_type, shopData.trade_name || '',
        shopData.village || '', shopData.district || '', shopData.state || '',
        shopData.vintage_years || 0, shopData.monthly_revenue || 0,
        shopData.ownership || 'rented', shopData.bank_account_type || 'savings',
        shopData.phone || '', shopData.password || '1234', shopData.owner_category || 'general',
        shopData.is_demo ? 1 : 0, shopData.is_udyam_verified ? 1 : 0, shopData.udyam_number || '',
        shopData.created_at || new Date().toISOString()
      );
    } catch (_) {}

    return shopData;
  },

  async updateShop(id, updateData) {
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getShopsCollection();
        await col.updateOne({ id }, { $set: updateData });
      } catch (err) {
        console.warn('[DataStore] Mongo updateShop error:', err.message);
      }
    }

    const current = await this.getShopById(id);
    const merged = { ...current, ...updateData };

    try {
      db.prepare(`
        UPDATE shops 
        SET name = ?, owner_name = ?, phone = ?, village = ?, district = ?, state = ?, vintage_years = ?, bank_account_type = ?, is_udyam_verified = ?, udyam_number = ?
        WHERE id = ?
      `).run(
        merged.name, merged.owner_name, merged.phone, merged.village, merged.district, merged.state,
        merged.vintage_years, merged.bank_account_type, merged.is_udyam_verified ? 1 : 0, merged.udyam_number || '', id
      );
    } catch (_) {}

    return merged;
  },

  // ==========================================
  // 2. TRANSACTIONS
  // ==========================================

  async getTransactions(shopId, { type = '', limit = 100 } = {}) {
    if (!shopId) return [];
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getTransactionsCollection();
        const query = { shop_id: shopId };
        if (type) query.type = type;
        const docs = await col.find(query).sort({ date: -1, created_at: -1 }).limit(Number(limit) || 100).toArray();
        if (docs && docs.length > 0) return docs.map(cleanDoc);
      } catch (err) {
        console.warn('[DataStore] Mongo getTransactions fallback:', err.message);
      }
    }

    let query = 'SELECT * FROM transactions WHERE shop_id = ?';
    const params = [shopId];
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(Number(limit) || 100);

    return db.prepare(query).all(...params);
  },

  async findTransactions(query = {}) {
    const shopId = query.shop_id || query.shopId;
    return this.getTransactions(shopId, { type: query.type, limit: query.limit || 200 });
  },

  async getTransactionById(id) {
    if (!id) return null;
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getTransactionsCollection();
        const doc = await col.findOne({ id });
        if (doc) return cleanDoc(doc);
      } catch (err) {
        console.warn('[DataStore] Mongo getTransactionById fallback:', err.message);
      }
    }
    return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) || null;
  },

  async createTransaction(txData) {
    // Idempotency: if transaction with this ID already exists, return it cleanly
    if (txData.id) {
      const existing = await this.getTransactionById(txData.id);
      if (existing) {
        return { ...existing, isExisting: true };
      }
    }

    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getTransactionsCollection();
        await col.updateOne({ id: txData.id }, { $set: txData }, { upsert: true });
      } catch (err) {
        console.warn('[DataStore] Mongo createTransaction error:', err.message);
      }
    }

    // Mirror to SQLite
    try {
      db.prepare(`
        INSERT OR REPLACE INTO transactions (
          id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, customer_phone, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txData.id, txData.shop_id || txData.shopId, txData.date, txData.type,
        txData.amount, txData.category, txData.payment_mode || txData.paymentMode || 'cash',
        txData.customer_vendor_name || txData.customerVendorName || '',
        txData.customer_phone || txData.customerPhone || '',
        txData.notes || '', txData.created_at || new Date().toISOString()
      );
    } catch (_) {}

    return txData;
  },

  async deleteTransaction(id, shopId = '') {
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getTransactionsCollection();
        await col.deleteOne({ id });
      } catch (err) {
        console.warn('[DataStore] Mongo deleteTransaction error:', err.message);
      }
    }

    try {
      db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    } catch (_) {}

    return true;
  },

  async getTransactionSummary(shopId) {
    const txs = await this.getTransactions(shopId, { limit: 1000 });
    
    let totalIncome = 0;
    let totalExpense = 0;
    let totalUdhaarGiven = 0;
    let totalUdhaarRepaid = 0;
    let cashIncome = 0;
    let upiIncome = 0;
    const monthlySummary = {};

    txs.forEach(t => {
      const month = t.date ? t.date.substring(0, 7) : 'Unknown';
      if (!monthlySummary[month]) {
        monthlySummary[month] = { month, income: 0, expense: 0, profit: 0 };
      }

      if (t.type === 'income') {
        totalIncome += t.amount;
        monthlySummary[month].income += t.amount;
        if (t.payment_mode === 'cash') cashIncome += t.amount;
        if (t.payment_mode === 'upi') upiIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
        monthlySummary[month].expense += t.amount;
      } else if (t.type === 'udhaar_given') {
        totalUdhaarGiven += t.amount;
      } else if (t.type === 'udhaar_repaid') {
        totalUdhaarRepaid += t.amount;
      }
    });

    Object.values(monthlySummary).forEach(m => {
      m.profit = m.income - m.expense;
    });

    const netSurplus = totalIncome - totalExpense;
    const pendingUdhaar = Math.max(0, totalUdhaarGiven - totalUdhaarRepaid);
    const digitalSharePct = totalIncome > 0 ? Math.round((upiIncome / totalIncome) * 100) : 0;

    return {
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      netSurplus: Math.round(netSurplus),
      pendingUdhaar: Math.round(pendingUdhaar),
      totalUdhaarGiven: Math.round(totalUdhaarGiven),
      totalUdhaarRepaid: Math.round(totalUdhaarRepaid),
      cashIncome: Math.round(cashIncome),
      upiIncome: Math.round(upiIncome),
      digitalSharePct,
      totalTransactions: txs.length,
      monthlyTrend: Object.values(monthlySummary).sort((a, b) => a.month.localeCompare(b.month))
    };
  },

  // ==========================================
  // 3. CUSTOMERS
  // ==========================================

  async getCustomers(shopId) {
    if (!shopId) return [];
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getCustomersCollection();
        const docs = await col.find({ shop_id: shopId }).sort({ created_at: -1 }).toArray();
        if (docs && docs.length > 0) return docs.map(cleanDoc);
      } catch (err) {
        console.warn('[DataStore] Mongo getCustomers fallback:', err.message);
      }
    }

    try {
      return db.prepare('SELECT * FROM customers WHERE shop_id = ? ORDER BY created_at DESC').all(shopId);
    } catch (_) {
      return [];
    }
  },

  async createCustomer(custData) {
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getCustomersCollection();
        await col.updateOne({ id: custData.id }, { $set: custData }, { upsert: true });
      } catch (err) {
        console.warn('[DataStore] Mongo createCustomer error:', err.message);
      }
    }

    try {
      db.prepare(`
        INSERT OR REPLACE INTO customers (
          id, shop_id, name, phone, village_address, credit_limit, notes, last_reminder_sent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        custData.id, custData.shop_id, custData.name, custData.phone,
        custData.village_address || custData.village || '', custData.credit_limit || 5000,
        custData.notes || '', custData.last_reminder_sent || null, custData.created_at || new Date().toISOString()
      );
    } catch (_) {}

    return custData;
  },

  async updateCustomer(id, data) {
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getCustomersCollection();
        await col.updateOne({ id }, { $set: data });
      } catch (err) {
        console.warn('[DataStore] Mongo updateCustomer error:', err.message);
      }
    }

    try {
      const keys = Object.keys(data);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      db.prepare(`UPDATE customers SET ${setClause} WHERE id = ?`).run(...Object.values(data), id);
    } catch (_) {}

    return { id, ...data };
  },

  async deleteCustomer(id) {
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getCustomersCollection();
        await col.deleteOne({ id });
      } catch (err) {
        console.warn('[DataStore] Mongo deleteCustomer error:', err.message);
      }
    }

    try {
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    } catch (_) {}

    return true;
  },

  async recordCustomerReminder(id) {
    const nowIso = new Date().toISOString();
    await this.updateCustomer(id, { last_reminder_sent: nowIso });
    return nowIso;
  }
};

export default dataStore;
