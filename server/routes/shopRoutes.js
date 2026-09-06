import express from 'express';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';

const router = express.Router();

// Get current active shop profile
router.get('/current', (req, res) => {
  try {
    const shopId = req.query.shopId || 'ramesh-kirana';
    let shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);

    if (!shop) {
      // If db was empty, re-seed demo
      seedDatabase();
      shop = db.prepare('SELECT * FROM shops WHERE id = ?').get('ramesh-kirana');
    }

    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup new shop profile (Onboarding)
router.post('/setup', (req, res) => {
  try {
    const {
      name,
      owner_name,
      trade_type,
      trade_name,
      village,
      district,
      state,
      vintage_years,
      monthly_revenue,
      ownership,
      bank_account_type,
      phone,
      owner_category
    } = req.body;

    const id = `shop-${Date.now()}`;
    const insert = db.prepare(`
      INSERT INTO shops (
        id, name, owner_name, trade_type, trade_name, village, district, state,
        vintage_years, monthly_revenue, ownership, bank_account_type, phone, owner_category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      name || 'My Village Store',
      owner_name || 'Shopkeeper',
      trade_type || 'kirana',
      trade_name || 'Kirana & General Store',
      village || 'Gram Panchayat',
      district || 'Balrampur',
      state || 'Uttar Pradesh',
      Number(vintage_years) || 1,
      Number(monthly_revenue) || 35000,
      ownership || 'rented',
      bank_account_type || 'savings',
      phone || '',
      owner_category || 'general'
    );

    const createdShop = db.prepare('SELECT * FROM shops WHERE id = ?').get(id);
    res.json({ success: true, shop: createdShop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset / reload Ramesh's Kirana Demo Shop
router.post('/reset-demo', async (req, res) => {
  try {
    seedDatabase();
    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get('ramesh-kirana');
    
    // Sync freshly seeded transactions to MongoDB Atlas in background
    try {
      const { syncToMongoDB } = await import('../db/mongoSync.js');
      syncToMongoDB().catch(e => console.warn('[MongoDB Atlas] Background sync on reset-demo error:', e.message));
    } catch (_) {}

    res.json({ success: true, message: 'Demo shop reloaded with 90 days of transactions', shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update shop details
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      owner_name,
      trade_name,
      trade_type,
      village,
      district,
      state,
      vintage_years,
      monthly_revenue,
      bank_account_type,
      phone
    } = req.body;

    const update = db.prepare(`
      UPDATE shops SET
        name = COALESCE(?, name),
        owner_name = COALESCE(?, owner_name),
        trade_name = COALESCE(?, trade_name),
        trade_type = COALESCE(?, trade_type),
        village = COALESCE(?, village),
        district = COALESCE(?, district),
        state = COALESCE(?, state),
        vintage_years = COALESCE(?, vintage_years),
        monthly_revenue = COALESCE(?, monthly_revenue),
        bank_account_type = COALESCE(?, bank_account_type),
        phone = COALESCE(?, phone)
      WHERE id = ?
    `);

    update.run(
      name, owner_name, trade_name, trade_type, village, district, state,
      vintage_years ? Number(vintage_years) : null,
      monthly_revenue ? Number(monthly_revenue) : null,
      bank_account_type, phone,
      id
    );

    const updated = db.prepare('SELECT * FROM shops WHERE id = ?').get(id);
    res.json({ success: true, shop: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
