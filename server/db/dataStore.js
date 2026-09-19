import db from './database.js';
import {
  getShopsCollection,
  getTransactionsCollection,
  getCustomersCollection,
  getBenchmarksCollection,
  getSchemesCollection,
  isMongoConfigured
} from './mongoClient.js';
import { SCHEMES } from './schemesData.js';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

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

  syncShopToSqlite(shop) {
    if (!shop || !shop.id) return;
    try {
      db.prepare(`
        INSERT OR REPLACE INTO shops (
          id, name, owner_name, trade_type, trade_name, village, district, state,
          vintage_years, monthly_revenue, ownership, bank_account_type, phone, password, owner_category, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        shop.id, shop.name || '', shop.owner_name || '', shop.trade_type || 'kirana', shop.trade_name || 'kirana',
        shop.village || '', shop.district || '', shop.state || 'Uttar Pradesh',
        Number(shop.vintage_years) || 1, Number(shop.monthly_revenue) || 0, shop.ownership || 'rented',
        shop.bank_account_type || 'savings', shop.phone || '', shop.password || '1234',
        shop.owner_category || 'general', shop.is_demo ? 1 : 0
      );
    } catch (_) {}
  },

  async getShopById(id) {
    if (!id) return null;
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getShopsCollection();
        const doc = await col.findOne({ id });
        if (doc) {
          const cleaned = cleanDoc(doc);
          this.syncShopToSqlite(cleaned);
          return cleaned;
        }
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
    if (!input) return null;
    const strInput = String(input).trim();
    const cleanDigits = digitsOnly || strInput.replace(/\D/g, '').slice(-10);
    const escapedInput = strInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getShopsCollection();
        const orConditions = [
          { phone: strInput },
          { id: strInput },
          { name: { $regex: new RegExp(`^${escapedInput}$`, 'i') } }
        ];

        if (cleanDigits) {
          orConditions.push({ phone: cleanDigits });
          orConditions.push({ phone: `+91${cleanDigits}` });
          orConditions.push({ phone: `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}` });
          orConditions.push({ phone: { $regex: cleanDigits } });
        }

        const query = { $or: orConditions };
        const doc = await col.findOne(query, { sort: { is_demo: 1, created_at: -1 } });
        if (doc) {
          const cleaned = cleanDoc(doc);
          this.syncShopToSqlite(cleaned);
          return cleaned;
        }
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
    `).get(strInput, cleanDigits || strInput, strInput, strInput) || null;
  },

  async upsertShop(shopData) {
    this.syncShopToSqlite(shopData);
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getShopsCollection();
        await col.updateOne({ id: shopData.id }, { $set: shopData }, { upsert: true });
        if (isServerless) return shopData;
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
        if (isServerless) {
          const current = await this.getShopById(id);
          return { ...current, ...updateData };
        }
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

  async getTransactions(shopId, { type = '', limit = 100, customerId = '', customerName = '' } = {}) {
    if (!shopId) return [];
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getTransactionsCollection();
        const query = { shop_id: shopId };
        if (type) query.type = type;
        if (customerId) query.customer_id = customerId;
        if (customerName) query.customer_vendor_name = { $regex: new RegExp(`^${customerName}$`, 'i') };
        const docs = await col.find(query).sort({ date: -1, created_at: -1 }).limit(Number(limit) || 100).toArray();
        if (docs && docs.length > 0) return docs.map(cleanDoc);
        if (docs && isServerless) return [];
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
    if (customerId) {
      query += ' AND customer_id = ?';
      params.push(customerId);
    }
    if (customerName) {
      query += ' AND LOWER(customer_vendor_name) = LOWER(?)';
      params.push(customerName);
    }
    query += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(Number(limit) || 100);

    return db.prepare(query).all(...params);
  },

  async findTransactions(query = {}) {
    const shopId = query.shop_id || query.shopId;
    return this.getTransactions(shopId, { 
      type: query.type, 
      limit: query.limit || 200,
      customerId: query.customerId || query.customer_id,
      customerName: query.customerName
    });
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
        if (isServerless) return txData;
      } catch (err) {
        console.warn('[DataStore] Mongo createTransaction error:', err.message);
      }
    }

    // Mirror to SQLite
    try {
      db.prepare(`
        INSERT OR REPLACE INTO transactions (
          id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, customer_phone, customer_id, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txData.id, txData.shop_id || txData.shopId, txData.date, txData.type,
        txData.amount, txData.category, txData.payment_mode || txData.paymentMode || 'cash',
        txData.customer_vendor_name || txData.customerVendorName || '',
        txData.customer_phone || txData.customerPhone || '',
        txData.customer_id || txData.customerId || null,
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
        if (isServerless) return true;
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
        if (docs && isServerless) return [];
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
        if (isServerless) return custData;
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
        if (isServerless) return { id, ...data };
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
        if (isServerless) return true;
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
  },

  // ==========================================
  // 5. GOVERNMENT SCHEMES (DYNAMIC REGISTRY)
  // ==========================================

  normalizeSchemeRow(row) {
    if (!row) return null;
    const safeJsonParse = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val !== 'string') return val;
      try {
        return JSON.parse(val);
      } catch (_) {
        return fallback;
      }
    };

    return {
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.shortName || row.name,
      ministry: row.ministry,
      category: row.category,
      scope: row.scope || 'central',
      applicableStates: safeJsonParse(row.applicable_states, row.applicableStates || []),
      maxLoanAmount: Number(row.max_loan_amount || row.maxLoanAmount || 0),
      loanRangeText: row.loan_range_text || row.loanRangeText,
      interestRate: row.interest_rate || row.interestRate,
      subsidyText: row.subsidy_text || row.subsidyText,
      collateralRequired: Boolean(row.collateral_required !== undefined ? row.collateral_required : row.collateralRequired),
      collateralText: row.collateral_text || row.collateralText,
      tenure: row.tenure,
      plainLanguageSummary: row.plain_language_summary || row.plainLanguageSummary,
      plainLanguageSummaryHi: row.plain_language_summary_hi || row.plainLanguageSummaryHi,
      lastVerified: row.last_verified || row.lastVerified,
      officialSourceUrl: row.official_source_url || row.officialSourceUrl,
      statutoryReference: row.statutory_reference || row.statutoryReference,
      whyYouQualifyRules: safeJsonParse(row.why_you_qualify_rules, row.whyYouQualifyRules || {}),
      requiredDocuments: safeJsonParse(row.required_documents, row.requiredDocuments || []),
      applicationSteps: safeJsonParse(row.application_steps, row.applicationSteps || []),
      officialPortal: row.official_portal || row.officialPortal,
      isScraped: Boolean(row.is_scraped !== undefined ? row.is_scraped : row.isScraped),
      sourcePortal: row.source_portal || row.sourcePortal || 'official',
      scrapedAt: row.scraped_at || row.scrapedAt,
      createdAt: row.created_at || row.createdAt
    };
  },

  async getAllSchemes(filters = {}) {
    const dynamicMap = new Map();

    // 1. Seed statutory baseline schemes first
    for (const s of SCHEMES) {
      dynamicMap.set(s.id, { ...s, isScraped: false });
    }

    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getSchemesCollection();
        if (col) {
          const docs = await col.find({}).sort({ is_scraped: -1, created_at: -1 }).toArray();
          if (docs && docs.length > 0) {
            docs.forEach(doc => {
              const norm = this.normalizeSchemeRow(cleanDoc(doc));
              dynamicMap.set(norm.id, norm);
            });
          }
        }
      } catch (err) {
        console.warn('[DataStore] Mongo getAllSchemes fallback:', err.message);
      }
    }

    try {
      const rows = db.prepare('SELECT * FROM government_schemes ORDER BY is_scraped DESC, created_at DESC').all();
      if (rows && rows.length > 0) {
        rows.forEach(r => {
          const norm = this.normalizeSchemeRow(r);
          dynamicMap.set(norm.id, norm);
        });
      }
    } catch (err) {
      console.warn('[DataStore] SQLite getAllSchemes fallback:', err.message);
    }

    let results = Array.from(dynamicMap.values());

    if (filters.category && filters.category !== 'all') {
      const cat = filters.category.toLowerCase();
      results = results.filter(s => (s.category || '').toLowerCase().includes(cat));
    }

    if (filters.maxAmount) {
      results = results.filter(s => (s.maxLoanAmount || 0) <= Number(filters.maxAmount));
    }

    return results;
  },

  async getSchemeById(id) {
    if (!id) return null;
    const all = await this.getAllSchemes();
    return all.find(s => s.id === id) || null;
  },

  async upsertScheme(schemeData) {
    if (!schemeData || !schemeData.id) return null;
    const isMongo = await this.isPrimaryMongo();
    if (isMongo) {
      try {
        const col = await getSchemesCollection();
        if (col) {
          await col.updateOne({ id: schemeData.id }, { $set: schemeData }, { upsert: true });
        }
      } catch (err) {
        console.warn('[DataStore] Mongo upsertScheme error:', err.message);
      }
    }

    // Mirror to local SQLite
    try {
      db.prepare(`
        INSERT OR REPLACE INTO government_schemes (
          id, name, short_name, ministry, category, scope, applicable_states,
          max_loan_amount, loan_range_text, interest_rate, subsidy_text,
          collateral_required, collateral_text, tenure, plain_language_summary,
          plain_language_summary_hi, last_verified, official_source_url, statutory_reference,
          why_you_qualify_rules, required_documents, application_steps, official_portal,
          is_scraped, source_portal, scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        schemeData.id,
        schemeData.name,
        schemeData.shortName || schemeData.short_name || schemeData.name,
        schemeData.ministry,
        schemeData.category || 'Retail, Artisans & Small Services',
        schemeData.scope || 'central',
        JSON.stringify(schemeData.applicableStates || schemeData.applicable_states || []),
        Number(schemeData.maxLoanAmount || schemeData.max_loan_amount || 0),
        schemeData.loanRangeText || schemeData.loan_range_text || '',
        schemeData.interestRate || schemeData.interest_rate || '',
        schemeData.subsidyText || schemeData.subsidy_text || '',
        schemeData.collateralRequired ? 1 : 0,
        schemeData.collateralText || schemeData.collateral_text || '',
        schemeData.tenure || '',
        schemeData.plainLanguageSummary || schemeData.plain_language_summary || '',
        schemeData.plainLanguageSummaryHi || schemeData.plain_language_summary_hi || '',
        schemeData.lastVerified || schemeData.last_verified || new Date().toISOString().slice(0, 10),
        schemeData.officialSourceUrl || schemeData.official_source_url || '',
        schemeData.statutoryReference || schemeData.statutory_reference || '',
        JSON.stringify(schemeData.whyYouQualifyRules || schemeData.why_you_qualify_rules || {}),
        JSON.stringify(schemeData.requiredDocuments || schemeData.required_documents || []),
        JSON.stringify(schemeData.applicationSteps || schemeData.application_steps || []),
        schemeData.officialPortal || schemeData.official_portal || '',
        schemeData.isScraped ? 1 : 0,
        schemeData.sourcePortal || schemeData.source_portal || 'official',
        schemeData.scrapedAt || schemeData.scraped_at || new Date().toISOString()
      );
    } catch (err) {
      console.warn('[DataStore] SQLite upsertScheme error:', err.message);
    }

    return this.normalizeSchemeRow(schemeData);
  },

  // ==========================================
  // 6. ADMIN & INSTITUTIONAL DASHBOARD
  // ==========================================

  async getAllShops({ search = '', state = '', milestone = '', limit = 100, offset = 0 } = {}) {
    const isMongo = await this.isPrimaryMongo();
    let shopsList = [];
    const txAggMap = new Map();

    if (isMongo) {
      try {
        const shopsCol = await getShopsCollection();
        const txCol = await getTransactionsCollection();

        const txAgg = await txCol.aggregate([
          {
            $group: {
              _id: '$shop_id',
              count: { $sum: 1 },
              totalVolume: { $sum: '$amount' },
              lastTxDate: { $max: '$date' }
            }
          }
        ]).toArray();

        txAgg.forEach(t => {
          if (t._id) {
            txAggMap.set(String(t._id), {
              count: t.count || 0,
              totalVolume: Math.round(t.totalVolume || 0),
              lastTxDate: t.lastTxDate || null
            });
          }
        });

        const query = {};
        if (state && state !== 'all') {
          query.state = state;
        }
        if (search) {
          const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(esc, 'i');
          query.$or = [
            { name: regex },
            { owner_name: regex },
            { phone: regex },
            { village: regex },
            { district: regex }
          ];
        }

        const rawShops = await shopsCol.find(query).sort({ is_demo: -1, created_at: -1 }).toArray();
        shopsList = rawShops.map(cleanDoc);
      } catch (err) {
        console.warn('[DataStore] Mongo getAllShops fallback:', err.message);
      }
    }

    if (shopsList.length === 0) {
      try {
        let sql = 'SELECT * FROM shops WHERE 1=1';
        const params = [];
        if (state && state !== 'all') {
          sql += ' AND state = ?';
          params.push(state);
        }
        if (search) {
          sql += ' AND (name LIKE ? OR owner_name LIKE ? OR phone LIKE ? OR village LIKE ? OR district LIKE ?)';
          const p = `%${search}%`;
          params.push(p, p, p, p, p);
        }
        sql += ' ORDER BY is_demo DESC, created_at DESC';
        shopsList = db.prepare(sql).all(...params);

        const txRows = db.prepare(`
          SELECT shop_id, COUNT(*) as count, SUM(amount) as totalVolume, MAX(date) as lastTxDate
          FROM transactions GROUP BY shop_id
        `).all();
        txRows.forEach(r => {
          txAggMap.set(String(r.shop_id), {
            count: Number(r.count) || 0,
            totalVolume: Math.round(Number(r.totalVolume) || 0),
            lastTxDate: r.lastTxDate || null
          });
        });
      } catch (err) {
        console.warn('[DataStore] SQLite getAllShops fallback error:', err.message);
      }
    }

    const decorated = shopsList.map(shop => {
      const stats = txAggMap.get(String(shop.id)) || { count: 0, totalVolume: 0, lastTxDate: null };
      const txCount = stats.count;
      const isScored = Boolean(shop.is_demo || txCount >= 50);
      const progressPct = isScored ? 100 : Math.round((txCount / 50) * 100);

      return {
        id: shop.id,
        name: shop.name || 'Unnamed Enterprise',
        ownerName: shop.owner_name || 'Merchant',
        phone: shop.phone || '',
        tradeType: shop.trade_type || shop.trade_name || 'kirana',
        village: shop.village || '',
        district: shop.district || '',
        state: shop.state || 'Uttar Pradesh',
        vintageYears: Number(shop.vintage_years) || 1,
        isDemo: Boolean(shop.is_demo || shop.id === 'ramesh-kirana'),
        transactionCount: txCount,
        transactionVolume: stats.totalVolume,
        lastTransactionDate: stats.lastTxDate,
        isScored,
        milestoneStatus: isScored ? 'scored' : 'unrated',
        progressPct,
        createdAt: shop.created_at || null
      };
    });

    let filtered = decorated;
    if (milestone === 'scored') {
      filtered = filtered.filter(s => s.isScored);
    } else if (milestone === 'unrated') {
      filtered = filtered.filter(s => !s.isScored);
    }

    const total = filtered.length;
    const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

    return {
      total,
      limit: Number(limit),
      offset: Number(offset),
      shops: paginated
    };
  },

  async getAdminMetrics() {
    const isMongo = await this.isPrimaryMongo();
    let totalShops = 0;
    let totalTransactions = 0;
    let totalVolume = 0;
    let scoredShops = 0;
    let unratedShops = 0;
    const statesSet = new Set();
    const tradesMap = {};

    if (isMongo) {
      try {
        const shopsCol = await getShopsCollection();
        const txCol = await getTransactionsCollection();

        totalShops = await shopsCol.countDocuments();

        const txSummary = await txCol.aggregate([
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              totalVolume: { $sum: '$amount' }
            }
          }
        ]).toArray();

        if (txSummary.length > 0) {
          totalTransactions = txSummary[0].totalCount || 0;
          totalVolume = Math.round(txSummary[0].totalVolume || 0);
        }

        const txPerShop = await txCol.aggregate([
          { $group: { _id: '$shop_id', count: { $sum: 1 } } }
        ]).toArray();

        const shopsWith50 = new Set(txPerShop.filter(t => t.count >= 50).map(t => String(t._id)));
        const allShops = await shopsCol.find({}, { projection: { id: 1, is_demo: 1, state: 1, trade_type: 1 } }).toArray();

        allShops.forEach(s => {
          if (s.state) statesSet.add(s.state);
          const trade = s.trade_type || 'kirana';
          tradesMap[trade] = (tradesMap[trade] || 0) + 1;
          if (s.is_demo || shopsWith50.has(String(s.id))) {
            scoredShops++;
          } else {
            unratedShops++;
          }
        });
      } catch (err) {
        console.warn('[DataStore] Mongo getAdminMetrics fallback:', err.message);
      }
    }

    if (totalShops === 0) {
      try {
        const shops = db.prepare('SELECT * FROM shops').all();
        totalShops = shops.length;
        const txSummary = db.prepare('SELECT COUNT(*) as cnt, SUM(amount) as vol FROM transactions').get();
        totalTransactions = Number(txSummary?.cnt) || 0;
        totalVolume = Math.round(Number(txSummary?.vol) || 0);

        const txCounts = db.prepare('SELECT shop_id, COUNT(*) as cnt FROM transactions GROUP BY shop_id').all();
        const countMap = new Map(txCounts.map(r => [r.shop_id, r.cnt]));

        shops.forEach(s => {
          if (s.state) statesSet.add(s.state);
          const trade = s.trade_type || 'kirana';
          tradesMap[trade] = (tradesMap[trade] || 0) + 1;
          const c = countMap.get(s.id) || 0;
          if (s.is_demo || c >= 50) scoredShops++;
          else unratedShops++;
        });
      } catch (err) {
        console.warn('[DataStore] SQLite getAdminMetrics error:', err.message);
      }
    }

    return {
      totalShops,
      totalTransactions,
      totalVolume,
      scoredShops,
      unratedShops,
      milestonePassRate: totalShops > 0 ? Math.round((scoredShops / totalShops) * 100) : 0,
      coveredStatesCount: statesSet.size || 1,
      states: Array.from(statesSet),
      tradeDistribution: tradesMap
    };
  }
};

export default dataStore;
