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
    return {
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.shortName || row.name,
      ministry: row.ministry,
      category: row.category,
      scope: row.scope || 'central',
      applicableStates: typeof row.applicable_states === 'string' ? JSON.parse(row.applicable_states || '[]') : (row.applicableStates || []),
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
      whyYouQualifyRules: typeof row.why_you_qualify_rules === 'string' ? JSON.parse(row.why_you_qualify_rules || '{}') : (row.whyYouQualifyRules || {}),
      requiredDocuments: typeof row.required_documents === 'string' ? JSON.parse(row.required_documents || '[]') : (row.requiredDocuments || []),
      applicationSteps: typeof row.application_steps === 'string' ? JSON.parse(row.application_steps || '[]') : (row.applicationSteps || []),
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
  }
};

export default dataStore;
