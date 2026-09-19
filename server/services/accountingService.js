import db from '../db/database.js';
import dataStore from '../db/dataStore.js';
import { getMongoDb } from '../db/mongoClient.js';

/**
 * Vyapaar Accounting Domain Service
 * Provides lightweight billing, inventory, GST-ready accounting, and receivables management
 * for Indian rural micro-enterprises. Fully synchronizes with SaakhSetu's core ledger & credit engine.
 */

export const accountingService = {
  // =========================================================================
  // 1. PRODUCTS & INVENTORY
  // =========================================================================

  async getProducts(shopId, { search = '', category = '', lowStockOnly = false, limit = 100, offset = 0 } = {}) {
    if (!shopId) return [];

    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        const query = { shop_id: shopId, is_active: { $ne: 0 } };
        if (category && category !== 'all') query.category = category;
        if (search) {
          const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          query.$or = [{ name: regex }, { sku: regex }, { hsn_code: regex }];
        }
        let cursor = dbMongo.collection('accounting_products').find(query).sort({ name: 1 });
        if (offset) cursor = cursor.skip(Number(offset));
        if (limit) cursor = cursor.limit(Number(limit));
        const docs = await cursor.toArray();
        if (docs && docs.length > 0) {
          let results = docs.map(({ _id, ...rest }) => rest);
          if (lowStockOnly) {
            results = results.filter(p => (p.current_stock ?? 0) <= (p.reorder_level ?? 10));
          }
          return results;
        }
      }
    } catch (_) {}

    let query = 'SELECT * FROM products WHERE shop_id = ? AND is_active = 1';
    const params = [shopId];

    if (search) {
      query += ' AND (LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(hsn_code) LIKE ?)';
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (lowStockOnly) {
      query += ' AND current_stock <= reorder_level';
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(Number(limit) || 100, Number(offset) || 0);

    return db.prepare(query).all(...params);
  },

  async getProductById(shopId, id) {
    if (!shopId || !id) return null;
    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        const doc = await dbMongo.collection('accounting_products').findOne({ shop_id: shopId, id });
        if (doc) {
          const { _id, ...rest } = doc;
          return rest;
        }
      }
    } catch (_) {}
    return db.prepare('SELECT * FROM products WHERE shop_id = ? AND id = ?').get(shopId, id) || null;
  },

  async upsertProduct(shopId, data) {
    if (!shopId) throw new Error('shopId is required');
    if (!data.name || !String(data.name).trim()) throw new Error('Product name is required');

    const id = data.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const name = String(data.name).trim();
    const sku = data.sku ? String(data.sku).trim() : `SKU-${name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const hsnCode = data.hsnCode || data.hsn_code || '1905';
    const category = data.category || 'General';
    const unit = data.unit || 'pcs';
    const purchasePrice = Math.max(0, Number(data.purchasePrice ?? data.purchase_price ?? 0));
    const sellingPrice = Math.max(0, Number(data.sellingPrice ?? data.selling_price ?? 0));
    const gstRate = [0, 5, 12, 18, 28].includes(Number(data.gstRate ?? data.gst_rate)) ? Number(data.gstRate ?? data.gst_rate) : 5;
    const currentStock = Number(data.currentStock ?? data.current_stock ?? 0);
    const reorderLevel = Math.max(0, Number(data.reorderLevel ?? data.reorder_level ?? 10));

    const existing = await this.getProductById(shopId, id);

    try {
      if (existing) {
        db.prepare(`
          UPDATE products 
          SET name = ?, sku = ?, hsn_code = ?, category = ?, unit = ?, 
              purchase_price = ?, selling_price = ?, gst_rate = ?, 
              current_stock = ?, reorder_level = ?, updated_at = CURRENT_TIMESTAMP
          WHERE shop_id = ? AND id = ?
        `).run(
          name, sku, hsnCode, category, unit,
          purchasePrice, sellingPrice, gstRate,
          currentStock, reorderLevel, shopId, id
        );

        // If initial stock differed, log adjustment
        const stockDiff = currentStock - (existing.current_stock ?? 0);
        if (stockDiff !== 0) {
          await this.logStockMovement(shopId, id, {
            type: stockDiff > 0 ? 'adjustment_in' : 'adjustment_out',
            quantity: stockDiff,
            unitPrice: purchasePrice,
            referenceType: 'manual_adjustment',
            referenceId: 'edit',
            notes: 'Product inventory updated manually'
          });
        }
      } else {
        db.prepare(`
          INSERT INTO products (
            id, shop_id, name, sku, hsn_code, category, unit,
            purchase_price, selling_price, gst_rate, current_stock, reorder_level, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(
          id, shopId, name, sku, hsnCode, category, unit,
          purchasePrice, sellingPrice, gstRate, currentStock, reorderLevel
        );

        if (currentStock > 0) {
          await this.logStockMovement(shopId, id, {
            type: 'opening_stock',
            quantity: currentStock,
            unitPrice: purchasePrice,
            referenceType: 'initial_stock',
            referenceId: id,
            notes: 'Initial inventory logged on creation'
          });
        }
      }
    } catch (_) {}

    const prodDoc = {
      id,
      shop_id: shopId,
      name,
      sku,
      hsn_code: hsnCode,
      category,
      unit,
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      gst_rate: gstRate,
      current_stock: currentStock,
      reorder_level: reorderLevel,
      is_active: 1,
      updated_at: new Date().toISOString()
    };

    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        await dbMongo.collection('accounting_products').updateOne(
          { shop_id: shopId, id },
          { $set: prodDoc },
          { upsert: true }
        );
      }
    } catch (mErr) {
      console.warn('[AccountingService] Mongo product sync notice:', mErr.message);
    }

    return prodDoc;
  },

  async deleteProduct(shopId, id) {
    if (!shopId || !id) return false;
    try {
      const usedInInvoice = db.prepare('SELECT 1 FROM invoice_items WHERE product_id = ? LIMIT 1').get(id);
      if (usedInInvoice) {
        db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ? AND id = ?').run(shopId, id);
      } else {
        db.prepare('DELETE FROM stock_movements WHERE shop_id = ? AND product_id = ?').run(shopId, id);
        db.prepare('DELETE FROM products WHERE shop_id = ? AND id = ?').run(shopId, id);
      }
    } catch (_) {}

    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        await dbMongo.collection('accounting_products').updateOne(
          { shop_id: shopId, id },
          { $set: { is_active: 0, updated_at: new Date().toISOString() } }
        );
      }
    } catch (_) {}

    return { success: true, id };
  },

  async adjustStock(shopId, productId, { quantity, type = 'adjustment', unitPrice = 0, notes = '' } = {}) {
    const product = await this.getProductById(shopId, productId);
    if (!product) throw new Error('Product not found in this shop');

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty === 0) throw new Error('Valid non-zero adjustment quantity required');

    const newStock = Math.max(0, product.current_stock + numQty);
    db.prepare('UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE shop_id = ? AND id = ?')
      .run(newStock, shopId, productId);

    await this.logStockMovement(shopId, productId, {
      type: numQty > 0 ? 'adjustment_in' : 'adjustment_out',
      quantity: numQty,
      unitPrice: unitPrice || product.purchase_price,
      referenceType: 'manual_adjustment',
      referenceId: `adj-${Date.now()}`,
      notes: notes || 'Manual inventory correction'
    });

    return { ...product, current_stock: newStock };
  },

  async logStockMovement(shopId, productId, { type, quantity, unitPrice = 0, referenceType = 'manual', referenceId = '', notes = '' }) {
    const id = `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO stock_movements (
        id, shop_id, product_id, type, quantity, unit_price, reference_type, reference_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, shopId, productId, type, Number(quantity), Number(unitPrice), referenceType, referenceId, notes
    );
    return id;
  },

  async getInventorySummary(shopId) {
    if (!shopId) return { totalProducts: 0, totalStockUnits: 0, inventoryValuationCost: 0, inventoryValuationRetail: 0, lowStockCount: 0, outOfStockCount: 0 };

    const products = db.prepare('SELECT * FROM products WHERE shop_id = ? AND is_active = 1').all(shopId);

    let totalStockUnits = 0;
    let inventoryValuationCost = 0;
    let inventoryValuationRetail = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      const stock = Math.max(0, Number(p.current_stock) || 0);
      totalStockUnits += stock;
      inventoryValuationCost += stock * (Number(p.purchase_price) || 0);
      inventoryValuationRetail += stock * (Number(p.selling_price) || 0);
      if (stock === 0) outOfStockCount++;
      else if (stock <= (Number(p.reorder_level) || 10)) lowStockCount++;
    });

    return {
      totalProducts: products.length,
      totalStockUnits: Math.round(totalStockUnits * 10) / 10,
      inventoryValuationCost: Math.round(inventoryValuationCost),
      inventoryValuationRetail: Math.round(inventoryValuationRetail),
      lowStockCount,
      outOfStockCount
    };
  },

  async getStockMovements(shopId, { productId = '', limit = 50, offset = 0 } = {}) {
    if (!shopId) return [];
    let query = `
      SELECT sm.*, p.name as product_name, p.unit, p.sku
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      WHERE sm.shop_id = ?
    `;
    const params = [shopId];

    if (productId) {
      query += ' AND sm.product_id = ?';
      params.push(productId);
    }

    query += ' ORDER BY sm.timestamp DESC LIMIT ? OFFSET ?';
    params.push(Number(limit) || 50, Number(offset) || 0);

    return db.prepare(query).all(...params);
  },

  // =========================================================================
  // 2. SUPPLIERS
  // =========================================================================

  async getSuppliers(shopId) {
    if (!shopId) return [];
    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        const docs = await dbMongo.collection('accounting_suppliers').find({ shop_id: shopId }).sort({ name: 1 }).toArray();
        if (docs && docs.length > 0) {
          return docs.map(({ _id, ...rest }) => rest);
        }
      }
    } catch (_) {}
    return db.prepare('SELECT * FROM suppliers WHERE shop_id = ? ORDER BY name ASC').all(shopId);
  },

  async getSupplierById(shopId, id) {
    if (!shopId || !id) return null;
    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        const doc = await dbMongo.collection('accounting_suppliers').findOne({ shop_id: shopId, id });
        if (doc) {
          const { _id, ...rest } = doc;
          return rest;
        }
      }
    } catch (_) {}
    return db.prepare('SELECT * FROM suppliers WHERE shop_id = ? AND id = ?').get(shopId, id) || null;
  },

  async upsertSupplier(shopId, data) {
    if (!shopId) throw new Error('shopId is required');
    if (!data.name || !String(data.name).trim()) throw new Error('Supplier name is required');

    const id = data.id || `supp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const name = String(data.name).trim();
    const phone = data.phone ? String(data.phone).trim() : '';
    const gstin = data.gstin ? String(data.gstin).trim().toUpperCase() : '';
    const address = data.address ? String(data.address).trim() : '';
    const state = data.state || 'Uttar Pradesh';

    const record = { id, shop_id: shopId, name, phone, gstin, address, state };

    try {
      db.prepare(`
        INSERT OR REPLACE INTO suppliers (
          id, shop_id, name, phone, gstin, address, state
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, shopId, name, phone, gstin, address, state);
    } catch (_) {}

    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        await dbMongo.collection('accounting_suppliers').updateOne(
          { shop_id: shopId, id },
          { $set: record },
          { upsert: true }
        );
      }
    } catch (mErr) {
      console.warn('[AccountingService] Mongo supplier sync notice:', mErr.message);
    }

    return record;
  },

  async deleteSupplier(shopId, id) {
    if (!shopId || !id) return false;
    try {
      db.prepare('DELETE FROM suppliers WHERE shop_id = ? AND id = ?').run(shopId, id);
    } catch (_) {}
    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        await dbMongo.collection('accounting_suppliers').deleteOne({ shop_id: shopId, id });
      }
    } catch (_) {}
    return true;
  },

  // =========================================================================
  // 3. SALES INVOICES & BILLING
  // =========================================================================

  async createInvoice(shopId, invoiceData) {
    if (!shopId) throw new Error('shopId is required');
    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      throw new Error('At least one item is required on the invoice');
    }

    const shop = await dataStore.getShopById(shopId);
    if (!shop) throw new Error('Shop not found');

    const shopState = (shop.state || 'Uttar Pradesh').trim();
    const customerState = (invoiceData.customerState || invoiceData.customer_state || shopState).trim();
    const isInterstate = Boolean(invoiceData.isInterstate ?? (shopState.toLowerCase() !== customerState.toLowerCase()));

    // Invoice numbering: INV-YYYYMMDD-XXXX
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    let invoiceNumber = (invoiceData.invoiceNumber || invoiceData.invoice_number || '').trim();
    if (!invoiceNumber) {
      const countRow = db.prepare("SELECT count(*) as count FROM invoices WHERE shop_id = ? AND invoice_number LIKE ?")
        .get(shopId, `INV-${today}-%`);
      const nextSeq = String((countRow?.count || 0) + 1).padStart(4, '0');
      invoiceNumber = `INV-${today}-${nextSeq}`;
    }

    // Duplicate check within shop
    const existing = db.prepare('SELECT id FROM invoices WHERE shop_id = ? AND invoice_number = ?').get(shopId, invoiceNumber);
    if (existing) {
      throw new Error(`Invoice number "${invoiceNumber}" already exists for your shop`);
    }

    const invoiceId = invoiceData.id || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoiceDate = invoiceData.invoiceDate || invoiceData.invoice_date || new Date().toISOString().split('T')[0];
    const dueDate = invoiceData.dueDate || invoiceData.due_date || null;
    const notes = invoiceData.notes ? String(invoiceData.notes).trim().slice(0, 250) : '';

    // Customer association
    let customerId = invoiceData.customerId || invoiceData.customer_id || null;
    let customerName = (invoiceData.customerName || invoiceData.customer_name || 'Walk-in Customer').trim();
    let customerPhone = (invoiceData.customerPhone || invoiceData.customer_phone || '').trim().replace(/\D/g, '').slice(-10);

    if (customerId) {
      const c = db.prepare('SELECT * FROM customers WHERE shop_id = ? AND id = ?').get(shopId, customerId);
      if (c) {
        customerName = c.name;
        customerPhone = c.phone || customerPhone;
      }
    } else if (customerPhone && customerName !== 'Walk-in Customer') {
      const c = db.prepare('SELECT * FROM customers WHERE shop_id = ? AND phone = ?').get(shopId, customerPhone);
      if (c) {
        customerId = c.id;
      }
    }

    // Calculate line items and GST strictly server-side
    let calculatedSubtotal = 0;
    let calculatedDiscount = 0;
    let calculatedTaxable = 0;
    let calculatedCgst = 0;
    let calculatedSgst = 0;
    let calculatedIgst = 0;

    const processedItems = [];

    for (const item of invoiceData.items) {
      let productId = item.productId || item.product_id;
      let product = productId ? await this.getProductById(shopId, productId) : null;
      if (!product && item.name) {
        // Look up by name or auto-create in catalog
        const existing = db.prepare('SELECT * FROM products WHERE shop_id = ? AND LOWER(name) = ? LIMIT 1')
          .get(shopId, item.name.toLowerCase().trim());
        if (existing) {
          product = existing;
          productId = existing.id;
        } else {
          product = await this.upsertProduct(shopId, {
            name: item.name,
            sellingPrice: item.unitPrice || 0,
            gstRate: item.gstRate || 5,
            unit: item.unit || 'pcs'
          });
          productId = product.id;
        }
      }
      if (!product) throw new Error(`Product ${productId || item.name || 'unspecified'} not found`);

      const qty = Math.max(0.01, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice ?? item.unit_price ?? product.selling_price));
      const discount = Math.max(0, Number(item.discount) || 0);

      const itemSubtotal = qty * unitPrice;
      const itemTaxable = Math.max(0, itemSubtotal - discount);
      const gstRate = [0, 5, 12, 18, 28].includes(Number(product.gst_rate)) ? Number(product.gst_rate) : 5;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterstate) {
        igst = Math.round(itemTaxable * (gstRate / 100) * 100) / 100;
      } else {
        cgst = Math.round(itemTaxable * (gstRate / 200) * 100) / 100;
        sgst = Math.round(itemTaxable * (gstRate / 200) * 100) / 100;
      }

      const itemTotal = itemTaxable + cgst + sgst + igst;

      calculatedSubtotal += itemSubtotal;
      calculatedDiscount += discount;
      calculatedTaxable += itemTaxable;
      calculatedCgst += cgst;
      calculatedSgst += sgst;
      calculatedIgst += igst;

      processedItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        invoiceId,
        productId,
        productName: product.name,
        description: item.description || product.name,
        quantity: qty,
        unitPrice,
        discount,
        taxableAmount: itemTaxable,
        gstRate,
        cgst,
        sgst,
        igst,
        total: itemTotal,
        currentStock: product.current_stock
      });
    }

    const overallDiscount = Math.max(0, Number(invoiceData.discount) || 0);
    const finalTaxable = Math.max(0, calculatedTaxable - overallDiscount);
    const grandTotal = Math.round((finalTaxable + calculatedCgst + calculatedSgst + calculatedIgst) * 100) / 100;

    // Payment breakdown
    const paymentMode = invoiceData.paymentMode || invoiceData.payment_mode || 'cash'; // 'cash', 'upi', 'khata', 'bank_transfer', 'split'
    let paidAmount = 0;
    let balanceDue = 0;
    let paymentStatus = 'paid';

    if (paymentMode === 'khata' || paymentMode === 'credit') {
      paidAmount = 0;
      balanceDue = grandTotal;
      paymentStatus = 'unpaid';
    } else if (paymentMode === 'split') {
      paidAmount = Math.min(grandTotal, Math.max(0, Number(invoiceData.paidAmount ?? invoiceData.paid_amount ?? 0)));
      balanceDue = Math.max(0, grandTotal - paidAmount);
      paymentStatus = balanceDue === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid');
    } else {
      paidAmount = grandTotal;
      balanceDue = 0;
      paymentStatus = 'paid';
    }

    // Insert Invoice Record
    const invoiceDoc = {
      id: invoiceId,
      shop_id: shopId,
      invoice_number: invoiceNumber,
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone,
      invoice_date: invoiceDate,
      due_date: dueDate,
      subtotal: calculatedSubtotal,
      discount: calculatedDiscount + overallDiscount,
      taxable_amount: finalTaxable,
      cgst: calculatedCgst,
      sgst: calculatedSgst,
      igst: calculatedIgst,
      total_amount: grandTotal,
      paid_amount: paidAmount,
      balance_due: balanceDue,
      payment_status: paymentStatus,
      payment_mode: paymentMode,
      is_interstate: isInterstate ? 1 : 0,
      notes,
      items: processedItems,
      created_at: new Date().toISOString()
    };

    try {
      db.prepare(`
        INSERT INTO invoices (
          id, shop_id, invoice_number, customer_id, customer_name, customer_phone,
          invoice_date, due_date, subtotal, discount, taxable_amount,
          cgst, sgst, igst, total_amount, paid_amount, balance_due,
          payment_status, payment_mode, is_interstate, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId, shopId, invoiceNumber, customerId, customerName, customerPhone,
        invoiceDate, dueDate, calculatedSubtotal, calculatedDiscount + overallDiscount, finalTaxable,
        calculatedCgst, calculatedSgst, calculatedIgst, grandTotal, paidAmount, balanceDue,
        paymentStatus, paymentMode, isInterstate ? 1 : 0, notes
      );

      const insertItemStmt = db.prepare(`
        INSERT INTO invoice_items (
          id, invoice_id, product_id, description, quantity, unit_price,
          discount, taxable_amount, gst_rate, cgst, sgst, igst, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare('UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

      for (const item of processedItems) {
        insertItemStmt.run(
          item.id, item.invoiceId, item.productId, item.description, item.quantity, item.unitPrice,
          item.discount, item.taxableAmount, item.gstRate, item.cgst, item.sgst, item.igst, item.total
        );

        // Decrement stock & log movement
        const newStock = Math.max(0, item.currentStock - item.quantity);
        updateStockStmt.run(newStock, item.productId);

        await this.logStockMovement(shopId, item.productId, {
          type: 'sale',
          quantity: -item.quantity,
          unitPrice: item.unitPrice,
          referenceType: 'invoice',
          referenceId: invoiceNumber,
          notes: `Sales invoice #${invoiceNumber}`
        });
      }
    } catch (sqlErr) {
      console.warn('[AccountingService] SQLite invoice write notice:', sqlErr.message);
    }

    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        await dbMongo.collection('accounting_invoices').updateOne(
          { shop_id: shopId, id: invoiceId },
          { $set: invoiceDoc },
          { upsert: true }
        );
        for (const item of processedItems) {
          await dbMongo.collection('accounting_products').updateOne(
            { shop_id: shopId, id: item.productId },
            { $inc: { current_stock: -item.quantity }, $set: { updated_at: new Date().toISOString() } }
          );
        }
      }
    } catch (mErr) {
      console.warn('[AccountingService] Mongo invoice sync notice:', mErr.message);
    }

    // =========================================================================
    // LEDGER & ALTERNATIVE CREDIT ENGINE SYNCHRONIZATION
    // Automatically generates matching transactions so Bahi-Khata, 50-Tx Milestone,
    // and 4-Pillar Alternative Underwriting reflect this sale immediately!
    // =========================================================================

    // 1. If paid portion exists (cash or UPI): log income transaction
    if (paidAmount > 0) {
      const txMode = (paymentMode === 'upi' || invoiceData.splitUpiAmount > 0) ? 'upi' : 'cash';
      await dataStore.createTransaction({
        id: `tx-inv-${invoiceId}-paid`,
        shop_id: shopId,
        date: invoiceDate,
        type: 'income',
        amount: paidAmount,
        category: 'Counter Sales (Invoiced)',
        payment_mode: txMode,
        customer_vendor_name: customerName,
        customer_phone: customerPhone,
        customer_id: customerId,
        notes: `Settled payment for Bill #${invoiceNumber}`
      });
    }

    // 2. If credit/udhaar portion exists: log udhaar_given transaction & update customer
    if (balanceDue > 0) {
      await dataStore.createTransaction({
        id: `tx-inv-${invoiceId}-udhaar`,
        shop_id: shopId,
        date: invoiceDate,
        type: 'udhaar_given',
        amount: balanceDue,
        category: 'Customer Udhaar (Invoiced)',
        payment_mode: 'khata',
        customer_vendor_name: customerName,
        customer_phone: customerPhone,
        customer_id: customerId,
        notes: `Credit on Bill #${invoiceNumber}`
      });

      // Auto-register customer if name/phone supplied but not in directory
      if (!customerId && customerName !== 'Walk-in Customer') {
        const newCustId = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await dataStore.createCustomer({
          id: newCustId,
          shop_id: shopId,
          name: customerName,
          phone: customerPhone || '',
          village_address: shop.village || '',
          credit_limit: 5000,
          notes: 'Registered automatically from Sales Billing'
        });
        db.prepare('UPDATE invoices SET customer_id = ? WHERE id = ?').run(newCustId, invoiceId);
      }
    }

    return this.getInvoiceById(shopId, invoiceId);
  },

  async getInvoices(shopId, { search = '', status = '', paymentMode = '', from = '', to = '', limit = 50, offset = 0 } = {}) {
    if (!shopId) return [];

    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        const query = { shop_id: shopId };
        if (status && status !== 'all') query.payment_status = status;
        if (paymentMode && paymentMode !== 'all') query.payment_mode = paymentMode;
        if (search) {
          const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          query.$or = [{ invoice_number: regex }, { customer_name: regex }, { customer_phone: regex }];
        }
        if (from) query.invoice_date = { ...query.invoice_date, $gte: from };
        if (to) query.invoice_date = { ...query.invoice_date, $lte: to };

        let cursor = dbMongo.collection('accounting_invoices').find(query).sort({ invoice_date: -1, created_at: -1 });
        if (offset) cursor = cursor.skip(Number(offset));
        if (limit) cursor = cursor.limit(Number(limit));
        const docs = await cursor.toArray();
        if (docs && docs.length > 0) {
          return docs.map(({ _id, ...rest }) => rest);
        }
      }
    } catch (_) {}

    let query = 'SELECT * FROM invoices WHERE shop_id = ?';
    const params = [shopId];

    if (search) {
      query += ' AND (LOWER(invoice_number) LIKE ? OR LOWER(customer_name) LIKE ? OR customer_phone LIKE ?)';
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    if (status && status !== 'all') {
      query += ' AND payment_status = ?';
      params.push(status);
    }

    if (paymentMode && paymentMode !== 'all') {
      query += ' AND payment_mode = ?';
      params.push(paymentMode);
    }

    if (from) {
      query += ' AND invoice_date >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND invoice_date <= ?';
      params.push(to);
    }

    query += ' ORDER BY invoice_date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit) || 50, Number(offset) || 0);

    return db.prepare(query).all(...params);
  },

  async getInvoiceById(shopId, id) {
    if (!shopId || !id) return null;
    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        const doc = await dbMongo.collection('accounting_invoices').findOne({ shop_id: shopId, id });
        if (doc) {
          const { _id, ...rest } = doc;
          return rest;
        }
      }
    } catch (_) {}
    const invoice = db.prepare('SELECT * FROM invoices WHERE shop_id = ? AND id = ?').get(shopId, id);
    if (!invoice) return null;

    const items = db.prepare(`
      SELECT ii.*, p.name as product_name, p.unit, p.hsn_code, p.sku
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = ?
    `).all(id);

    return { ...invoice, items };
  },

  // =========================================================================
  // 4. PURCHASES & INCOMING STOCK
  // =========================================================================

  async createPurchase(shopId, purchaseData) {
    if (!shopId) throw new Error('shopId is required');
    if (!purchaseData.items || !Array.isArray(purchaseData.items) || purchaseData.items.length === 0) {
      throw new Error('At least one purchase item is required');
    }

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    let purchaseNumber = (purchaseData.purchaseNumber || purchaseData.purchase_number || '').trim();
    if (!purchaseNumber) {
      const countRow = db.prepare("SELECT count(*) as count FROM purchases WHERE shop_id = ? AND purchase_number LIKE ?")
        .get(shopId, `PUR-${today}-%`);
      const nextSeq = String((countRow?.count || 0) + 1).padStart(4, '0');
      purchaseNumber = `PUR-${today}-${nextSeq}`;
    }

    const purchaseId = purchaseData.id || `pur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const supplierId = purchaseData.supplierId || purchaseData.supplier_id || null;
    const supplierName = (purchaseData.supplierName || purchaseData.supplier_name || 'Wholesale Supplier').trim();
    const purchaseDate = purchaseData.purchaseDate || purchaseData.purchase_date || new Date().toISOString().split('T')[0];
    const notes = purchaseData.notes ? String(purchaseData.notes).trim().slice(0, 250) : '';

    let totalSubtotal = 0;
    let totalGst = 0;
    const processedItems = [];

    for (const item of purchaseData.items) {
      const productId = item.productId || item.product_id;
      if (!productId) throw new Error('Valid productId is required for each purchase item');

      const product = await this.getProductById(shopId, productId);
      if (!product) throw new Error(`Product ${productId} not found`);

      const qty = Math.max(0.01, Number(item.quantity) || 1);
      const price = Math.max(0, Number(item.purchasePrice ?? item.purchase_price ?? product.purchase_price));
      const gstRate = [0, 5, 12, 18, 28].includes(Number(item.gstRate ?? item.gst_rate ?? product.gst_rate))
        ? Number(item.gstRate ?? item.gst_rate ?? product.gst_rate)
        : 5;

      const lineSubtotal = qty * price;
      const lineGst = Math.round(lineSubtotal * (gstRate / 100) * 100) / 100;
      const lineTotal = lineSubtotal + lineGst;

      totalSubtotal += lineSubtotal;
      totalGst += lineGst;

      processedItems.push({
        id: `puritem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        purchaseId,
        productId,
        quantity: qty,
        purchasePrice: price,
        gstRate,
        total: lineTotal,
        currentStock: product.current_stock
      });
    }

    const grandTotal = Math.round((totalSubtotal + totalGst) * 100) / 100;
    const paymentMode = purchaseData.paymentMode || purchaseData.payment_mode || 'cash';
    const paymentStatus = purchaseData.paymentStatus || 'paid';
    const paidAmount = paymentStatus === 'paid' ? grandTotal : (Number(purchaseData.paidAmount) || 0);
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    const purchaseDoc = {
      id: purchaseId,
      shop_id: shopId,
      supplier_id: supplierId,
      supplier_name: supplierName,
      purchase_number: purchaseNumber,
      purchase_date: purchaseDate,
      subtotal: totalSubtotal,
      gst: totalGst,
      total_amount: grandTotal,
      paid_amount: paidAmount,
      balance_due: balanceDue,
      payment_status: paymentStatus,
      payment_mode: paymentMode,
      notes,
      items: processedItems,
      created_at: new Date().toISOString()
    };

    try {
      db.prepare(`
        INSERT INTO purchases (
          id, shop_id, supplier_id, supplier_name, purchase_number, purchase_date,
          subtotal, gst, total_amount, paid_amount, balance_due, payment_status, payment_mode, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        purchaseId, shopId, supplierId, supplierName, purchaseNumber, purchaseDate,
        totalSubtotal, totalGst, grandTotal, paidAmount, balanceDue, paymentStatus, paymentMode, notes
      );

      const insertItemStmt = db.prepare(`
        INSERT INTO purchase_items (
          id, purchase_id, product_id, quantity, purchase_price, gst_rate, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare('UPDATE products SET current_stock = ?, purchase_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

      for (const item of processedItems) {
        insertItemStmt.run(
          item.id, item.purchaseId, item.productId, item.quantity, item.purchasePrice, item.gstRate, item.total
        );

        // Increment inventory & log movement
        const newStock = item.currentStock + item.quantity;
        updateStockStmt.run(newStock, item.purchasePrice, item.productId);

        await this.logStockMovement(shopId, item.productId, {
          type: 'purchase',
          quantity: item.quantity,
          unitPrice: item.purchasePrice,
          referenceType: 'purchase',
          referenceId: purchaseNumber,
          notes: `Supplier stock procurement #${purchaseNumber}`
        });
      }
    } catch (sqlErr) {
      console.warn('[AccountingService] SQLite purchase write warning:', sqlErr.message);
    }

    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        await dbMongo.collection('accounting_purchases').updateOne(
          { shop_id: shopId, id: purchaseId },
          { $set: purchaseDoc },
          { upsert: true }
        );
        for (const item of processedItems) {
          await dbMongo.collection('accounting_products').updateOne(
            { shop_id: shopId, id: item.productId },
            { 
              $inc: { current_stock: item.quantity },
              $set: { purchase_price: item.purchasePrice, updated_at: new Date().toISOString() }
            }
          );
        }
      }
    } catch (mErr) {
      console.warn('[AccountingService] Mongo purchase sync notice:', mErr.message);
    }

    // Ledger Integration: Insert 'expense' transaction in Bahi-Khata ledger
    if (paidAmount > 0) {
      await dataStore.createTransaction({
        id: `tx-pur-${purchaseId}`,
        shop_id: shopId,
        date: purchaseDate,
        type: 'expense',
        amount: paidAmount,
        category: 'Stock Procurement (Wholesale)',
        payment_mode: paymentMode === 'upi' ? 'upi' : 'cash',
        customer_vendor_name: supplierName,
        notes: `Inventory Purchase #${purchaseNumber}`
      });
    }

    return this.getPurchaseById(shopId, purchaseId);
  },

  async getPurchases(shopId, { search = '', status = '', from = '', to = '', limit = 50, offset = 0 } = {}) {
    if (!shopId) return [];

    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        const query = { shop_id: shopId };
        if (status && status !== 'all') query.payment_status = status;
        if (search) {
          const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          query.$or = [{ purchase_number: regex }, { supplier_name: regex }];
        }
        if (from) query.purchase_date = { ...query.purchase_date, $gte: from };
        if (to) query.purchase_date = { ...query.purchase_date, $lte: to };

        let cursor = dbMongo.collection('accounting_purchases').find(query).sort({ purchase_date: -1, created_at: -1 });
        if (offset) cursor = cursor.skip(Number(offset));
        if (limit) cursor = cursor.limit(Number(limit));
        const docs = await cursor.toArray();
        if (docs && docs.length > 0) {
          return docs.map(({ _id, ...rest }) => rest);
        }
      }
    } catch (_) {}

    let query = 'SELECT * FROM purchases WHERE shop_id = ?';
    const params = [shopId];

    if (search) {
      query += ' AND (LOWER(purchase_number) LIKE ? OR LOWER(supplier_name) LIKE ?)';
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term);
    }

    if (status && status !== 'all') {
      query += ' AND payment_status = ?';
      params.push(status);
    }

    if (from) {
      query += ' AND purchase_date >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND purchase_date <= ?';
      params.push(to);
    }

    query += ' ORDER BY purchase_date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit) || 50, Number(offset) || 0);

    return db.prepare(query).all(...params);
  },

  async getPurchaseById(shopId, id) {
    if (!shopId || !id) return null;
    try {
      const dbMongo = await getMongoDb();
      if (dbMongo) {
        const doc = await dbMongo.collection('accounting_purchases').findOne({ shop_id: shopId, id });
        if (doc) {
          const { _id, ...rest } = doc;
          return rest;
        }
      }
    } catch (_) {}
    const purchase = db.prepare('SELECT * FROM purchases WHERE shop_id = ? AND id = ?').get(shopId, id);
    if (!purchase) return null;

    const items = db.prepare(`
      SELECT pi.*, p.name as product_name, p.unit, p.hsn_code, p.sku
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
    `).all(id);

    return { ...purchase, items };
  },

  // =========================================================================
  // 5. RECEIVABLES & AGING REPORT
  // =========================================================================

  async getReceivables(shopId) {
    if (!shopId) return { totalReceivables: 0, overdueAmount: 0, dueTodayAmount: 0, dueThisWeekAmount: 0, aging: {}, customers: [] };

    // Fetch unpaid or partial invoices
    const unpaidInvoices = db.prepare(`
      SELECT * FROM invoices 
      WHERE shop_id = ? AND balance_due > 0 
      ORDER BY invoice_date ASC
    `).all(shopId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const dayAfter7 = new Date();
    dayAfter7.setDate(now.getDate() + 7);
    const dayAfter7Str = dayAfter7.toISOString().split('T')[0];

    let totalReceivables = 0;
    let overdueAmount = 0;
    let dueTodayAmount = 0;
    let dueThisWeekAmount = 0;

    const aging = {
      '0_30': 0,
      '31_60': 0,
      '61_90': 0,
      '90_plus': 0
    };

    const customerMap = new Map();

    unpaidInvoices.forEach(inv => {
      const balance = Number(inv.balance_due) || 0;
      totalReceivables += balance;

      // Age calculation
      const invDate = new Date(inv.invoice_date);
      const diffTime = Math.max(0, now - invDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) aging['0_30'] += balance;
      else if (diffDays <= 60) aging['31_60'] += balance;
      else if (diffDays <= 90) aging['61_90'] += balance;
      else aging['90_plus'] += balance;

      // Due date checks
      if (inv.due_date) {
        if (inv.due_date < todayStr) overdueAmount += balance;
        else if (inv.due_date === todayStr) dueTodayAmount += balance;
        else if (inv.due_date <= dayAfter7Str) dueThisWeekAmount += balance;
      } else if (diffDays > 30) {
        overdueAmount += balance;
      }

      // Group by customer
      const cKey = inv.customer_id || inv.customer_name || 'Walk-in';
      if (!customerMap.has(cKey)) {
        customerMap.set(cKey, {
          customerId: inv.customer_id,
          customerName: inv.customer_name,
          customerPhone: inv.customer_phone,
          totalOwed: 0,
          invoices: [],
          oldestInvoiceDate: inv.invoice_date,
          maxDaysOverdue: diffDays
        });
      }

      const cData = customerMap.get(cKey);
      cData.totalOwed += balance;
      cData.maxDaysOverdue = Math.max(cData.maxDaysOverdue, diffDays);
      cData.invoices.push({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        invoiceDate: inv.invoice_date,
        totalAmount: inv.total_amount,
        balanceDue: inv.balance_due,
        daysOld: diffDays
      });
    });

    const customers = Array.from(customerMap.values()).sort((a, b) => b.totalOwed - a.totalOwed);

    return {
      totalReceivables: Math.round(totalReceivables),
      overdueAmount: Math.round(overdueAmount),
      dueTodayAmount: Math.round(dueTodayAmount),
      dueThisWeekAmount: Math.round(dueThisWeekAmount),
      aging: {
        '0_30': Math.round(aging['0_30']),
        '31_60': Math.round(aging['31_60']),
        '61_90': Math.round(aging['61_90']),
        '90_plus': Math.round(aging['90_plus'])
      },
      buckets: {
        d0_30: Math.round(aging['0_30']),
        d31_60: Math.round(aging['31_60']),
        d61_90: Math.round(aging['61_90']),
        d90_plus: Math.round(aging['90_plus'])
      },
      customerCount: customers.length,
      customers: customers.map(c => ({
        ...c,
        name: c.customerName,
        phone: c.customerPhone,
        totalDue: c.totalOwed,
        maxAgeDays: c.maxDaysOverdue,
        lastInvoiceDate: c.oldestInvoiceDate
      }))
    };
  },

  // =========================================================================
  // 6. SETTLEMENT PAYMENTS
  // =========================================================================

  async recordPayment(shopId, paymentData) {
    if (!shopId) throw new Error('shopId is required');
    const amount = Number(paymentData.amount);
    if (!amount || amount <= 0) throw new Error('Valid payment amount required');

    const paymentId = paymentData.id || `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const partyType = paymentData.partyType || 'customer'; // 'customer', 'supplier'
    const partyId = paymentData.partyId || null;
    const partyName = paymentData.partyName || 'Customer';
    const referenceType = paymentData.referenceType || 'invoice';
    const referenceId = paymentData.referenceId || null;
    const paymentMode = paymentData.paymentMode || 'cash';
    const paymentDate = paymentData.paymentDate || new Date().toISOString().split('T')[0];
    const notes = paymentData.notes || '';

    db.prepare(`
      INSERT INTO payments (
        id, shop_id, party_type, party_id, party_name, reference_type,
        reference_id, amount, payment_mode, payment_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId, shopId, partyType, partyId, partyName, referenceType,
      referenceId, amount, paymentMode, paymentDate, notes
    );

    // If payment is against an invoice, reduce invoice balance_due
    if (referenceType === 'invoice' && referenceId) {
      const inv = db.prepare('SELECT * FROM invoices WHERE shop_id = ? AND (id = ? OR invoice_number = ?)').get(shopId, referenceId, referenceId);
      if (inv) {
        const newPaid = Math.min(inv.total_amount, inv.paid_amount + amount);
        const newBalance = Math.max(0, inv.total_amount - newPaid);
        const newStatus = newBalance === 0 ? 'paid' : 'partial';

        db.prepare(`
          UPDATE invoices 
          SET paid_amount = ?, balance_due = ?, payment_status = ? 
          WHERE id = ?
        `).run(newPaid, newBalance, newStatus, inv.id);
      }
    }

    // Ledger integration: Record 'udhaar_repaid' transaction in core ledger
    if (partyType === 'customer') {
      await dataStore.createTransaction({
        id: `tx-pay-${paymentId}`,
        shop_id: shopId,
        date: paymentDate,
        type: 'udhaar_repaid',
        amount,
        category: 'Udhaar Settlement',
        payment_mode: paymentMode === 'upi' ? 'upi' : 'cash',
        customer_vendor_name: partyName,
        customer_id: partyId,
        notes: notes ? `${notes} (Receipt #${paymentId})` : `Payment receipt #${paymentId} ${referenceId ? `(Ref: ${referenceId})` : ''}`
      });
    }

    return { success: true, id: paymentId, paymentId, amount, paymentDate };
  },

  // =========================================================================
  // 7. COMPREHENSIVE BUSINESS DASHBOARD & REPORTS
  // =========================================================================

  async getDashboardMetrics(shopId) {
    if (!shopId) return null;

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's stats from Invoices & Purchases
    const todaySalesRow = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COALESCE(SUM(CASE WHEN payment_mode = 'cash' THEN paid_amount ELSE 0 END), 0) as cashSales,
        COALESCE(SUM(CASE WHEN payment_mode = 'upi' THEN paid_amount ELSE 0 END), 0) as upiSales
      FROM invoices 
      WHERE shop_id = ? AND invoice_date = ?
    `).get(shopId, todayStr);

    const todayPurchasesRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM purchases 
      WHERE shop_id = ? AND purchase_date = ?
    `).get(shopId, todayStr);

    // Operational expenses from ledger
    const todayExpensesRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE shop_id = ? AND type = 'expense' AND date = ? AND category NOT LIKE '%Stock Procurement%'
    `).get(shopId, todayStr);

    const inventory = await this.getInventorySummary(shopId);
    const receivables = await this.getReceivables(shopId);

    // Sales Trend (last 14 days)
    const salesTrend = db.prepare(`
      SELECT invoice_date as date, COALESCE(SUM(total_amount), 0) as sales, count(*) as invoices
      FROM invoices 
      WHERE shop_id = ? 
      GROUP BY invoice_date 
      ORDER BY invoice_date DESC 
      LIMIT 14
    `).all(shopId).reverse();

    // Purchases Trend (last 14 days)
    const purchaseTrend = db.prepare(`
      SELECT purchase_date as date, COALESCE(SUM(total_amount), 0) as purchases
      FROM purchases 
      WHERE shop_id = ? 
      GROUP BY purchase_date 
      ORDER BY purchase_date DESC 
      LIMIT 14
    `).all(shopId).reverse();

    // Payment Mode Distribution
    const paymentModes = db.prepare(`
      SELECT payment_mode, COALESCE(SUM(total_amount), 0) as amount, count(*) as count
      FROM invoices 
      WHERE shop_id = ? 
      GROUP BY payment_mode
    `).all(shopId);

    // Top Selling Products
    const topProducts = db.prepare(`
      SELECT p.name, COALESCE(SUM(ii.quantity), 0) as totalQty, COALESCE(SUM(ii.total), 0) as totalRevenue
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      JOIN invoices inv ON ii.invoice_id = inv.id
      WHERE inv.shop_id = ?
      GROUP BY ii.product_id
      ORDER BY totalRevenue DESC
      LIMIT 5
    `).all(shopId);

    const todaySales = Math.round(todaySalesRow?.total || 0);
    const todayPurchases = Math.round(todayPurchasesRow?.total || 0);
    const todayExpenses = Math.round(todayExpensesRow?.total || 0);
    const grossProfit = Math.round(todaySales - todayPurchases - todayExpenses);

    return {
      today: {
        sales: todaySales,
        purchases: todayPurchases,
        expenses: todayExpenses,
        grossProfit,
        cashSales: Math.round(todaySalesRow?.cashSales || 0),
        upiSales: Math.round(todaySalesRow?.upiSales || 0)
      },
      inventory,
      receivables: {
        total: receivables.totalReceivables,
        overdue: receivables.overdueAmount,
        aging: receivables.aging
      },
      charts: {
        salesTrend,
        purchaseTrend,
        paymentModes,
        topProducts,
        receivablesAging: receivables.aging
      }
    };
  },

  async getGstReport(shopId, { from = '', to = '' } = {}) {
    if (!shopId) return null;

    let invQuery = 'SELECT * FROM invoices WHERE shop_id = ?';
    let purQuery = 'SELECT * FROM purchases WHERE shop_id = ?';
    const invParams = [shopId];
    const purParams = [shopId];

    if (from) {
      invQuery += ' AND invoice_date >= ?';
      purQuery += ' AND purchase_date >= ?';
      invParams.push(from);
      purParams.push(from);
    }
    if (to) {
      invQuery += ' AND invoice_date <= ?';
      purQuery += ' AND purchase_date <= ?';
      invParams.push(to);
      purParams.push(to);
    }

    const invoices = db.prepare(invQuery + ' ORDER BY invoice_date DESC').all(...invParams);
    const purchases = db.prepare(purQuery + ' ORDER BY purchase_date DESC').all(...purParams);

    let taxableSales = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let grossSalesGst = 0;

    invoices.forEach(inv => {
      taxableSales += Number(inv.taxable_amount) || 0;
      totalCgst += Number(inv.cgst) || 0;
      totalSgst += Number(inv.sgst) || 0;
      totalIgst += Number(inv.igst) || 0;
    });

    grossSalesGst = totalCgst + totalSgst + totalIgst;

    let taxablePurchases = 0;
    let inputTaxCredit = 0;

    purchases.forEach(pur => {
      taxablePurchases += Number(pur.subtotal) || 0;
      inputTaxCredit += Number(pur.gst) || 0;
    });

    const netGstLiability = Math.max(0, grossSalesGst - inputTaxCredit);

    return {
      period: { from: from || 'All Time', to: to || new Date().toISOString().split('T')[0] },
      taxableSales: Math.round(taxableSales * 100) / 100,
      outputTax: {
        cgst: Math.round(totalCgst * 100) / 100,
        sgst: Math.round(totalSgst * 100) / 100,
        igst: Math.round(totalIgst * 100) / 100
      },
      outputTaxTotal: Math.round(grossSalesGst * 100) / 100,
      taxablePurchases: Math.round(taxablePurchases * 100) / 100,
      itcTotal: Math.round(inputTaxCredit * 100) / 100,
      netGstPayable: Math.round(netGstLiability * 100) / 100,
      summary: {
        taxableSales: Math.round(taxableSales * 100) / 100,
        cgst: Math.round(totalCgst * 100) / 100,
        sgst: Math.round(totalSgst * 100) / 100,
        igst: Math.round(totalIgst * 100) / 100,
        grossSalesGst: Math.round(grossSalesGst * 100) / 100,
        taxablePurchases: Math.round(taxablePurchases * 100) / 100,
        inputTaxCredit: Math.round(inputTaxCredit * 100) / 100,
        netGstLiability: Math.round(netGstLiability * 100) / 100
      },
      invoicesCount: invoices.length,
      invoiceCount: invoices.length,
      purchaseCount: purchases.length,
      recentInvoices: invoices.slice(0, 10),
      recentPurchases: purchases.slice(0, 10)
    };
  },

  async getProfitLoss(shopId, { from = '', to = '' } = {}) {
    if (!shopId) return null;

    let invQuery = 'SELECT COALESCE(SUM(total_amount), 0) as totalRevenue, COALESCE(SUM(taxable_amount), 0) as taxableSales FROM invoices WHERE shop_id = ?';
    let purQuery = 'SELECT COALESCE(SUM(total_amount), 0) as totalProcurement FROM purchases WHERE shop_id = ?';
    let expQuery = `SELECT category, COALESCE(SUM(amount), 0) as total FROM transactions WHERE shop_id = ? AND type = 'expense' AND category NOT LIKE '%Stock Procurement%'`;
    const params = [shopId];

    if (from) {
      invQuery += ' AND invoice_date >= ?';
      purQuery += ' AND purchase_date >= ?';
      expQuery += ' AND date >= ?';
      params.push(from);
    }
    if (to) {
      invQuery += ' AND invoice_date <= ?';
      purQuery += ' AND purchase_date <= ?';
      expQuery += ' AND date <= ?';
      params.push(to);
    }

    const salesRow = db.prepare(invQuery).get(...params);
    const purchaseRow = db.prepare(purQuery).get(...params);
    const expensesRows = db.prepare(expQuery + ' GROUP BY category').all(...params);

    const totalRevenue = Math.round(salesRow?.totalRevenue || 0);
    const cogs = Math.round(purchaseRow?.totalProcurement || 0);
    const grossProfit = totalRevenue - cogs;

    let operatingExpenses = 0;
    expensesRows.forEach(r => operatingExpenses += Number(r.total) || 0);
    operatingExpenses = Math.round(operatingExpenses);

    const netProfit = grossProfit - operatingExpenses;
    const profitMarginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

    return {
      totalSalesRevenue: totalRevenue,
      revenue: {
        grossSales: totalRevenue,
        taxableSales: Math.round(salesRow?.taxableSales || 0)
      },
      costOfGoodsSold: cogs,
      grossProfit,
      operatingExpenses: operatingExpenses,
      operatingExpensesDetails: {
        total: operatingExpenses,
        breakdown: expensesRows
      },
      netOperatingProfit: netProfit,
      netProfit,
      netMarginPct: profitMarginPct,
      profitMarginPct
    };
  }
};

export default accountingService;
