import express from 'express';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { getShopsCollection } from '../db/mongoClient.js';

const router = express.Router();

// Get current active shop profile by explicit shopId
router.get('/current', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      // No shopId supplied: honest null state (prompts user to Register or view Demo)
      return res.json({ success: true, shop: null });
    }

    let shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);

    // If not found in SQLite, check MongoDB Atlas for serverless persistence
    if (!shop) {
      try {
        const col = await getShopsCollection();
        if (col) {
          const mongoShop = await col.findOne({ id: shopId });
          if (mongoShop) {
            const { _id, ...cleanShop } = mongoShop;
            shop = cleanShop;
            try {
              db.prepare(`
                INSERT OR REPLACE INTO shops (
                  id, name, owner_name, trade_type, trade_name, village, district, state,
                  vintage_years, monthly_revenue, ownership, bank_account_type, phone, owner_category, is_demo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                shop.id, shop.name, shop.owner_name, shop.trade_type, shop.trade_name || '',
                shop.village || '', shop.district || '', shop.state || '',
                shop.vintage_years || 0, shop.monthly_revenue || 0,
                shop.ownership || 'rented', shop.bank_account_type || 'savings',
                shop.phone || '', shop.owner_category || 'general', shop.is_demo || 0
              );
            } catch (_) {}
          }
        }
      } catch (mongoErr) {
        console.warn('[MongoDB Atlas] Error querying shop:', mongoErr.message);
      }
    }

    // If requesting ramesh-kirana specifically and database is unseeded, seed it
    if (!shop && shopId === 'ramesh-kirana') {
      seedDatabase();
      shop = db.prepare('SELECT * FROM shops WHERE id = ?').get('ramesh-kirana');
    }

    if (!shop) {
      return res.json({ success: true, shop: null });
    }

    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup new real shop profile (Onboarding — is_demo = 0)
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

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Shop name is required' });
    }
    if (!owner_name || !owner_name.trim()) {
      return res.status(400).json({ success: false, error: 'Owner name is required' });
    }
    if (!trade_type) {
      return res.status(400).json({ success: false, error: 'Trade category is required' });
    }

    const id = `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const insert = db.prepare(`
      INSERT INTO shops (
        id, name, owner_name, trade_type, trade_name, village, district, state,
        vintage_years, monthly_revenue, ownership, bank_account_type, phone, owner_category, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    insert.run(
      id,
      name.trim(),
      owner_name.trim(),
      trade_type,
      trade_name || 'Micro-Enterprise',
      village || 'Gram Panchayat',
      district || 'Balrampur',
      state || 'Uttar Pradesh',
      Math.max(0, Number(vintage_years) || 0),
      Math.max(0, Number(monthly_revenue) || 0),
      ownership || 'rented',
      bank_account_type || 'savings',
      phone || '',
      owner_category || 'general'
    );

    const createdShop = db.prepare('SELECT * FROM shops WHERE id = ?').get(id);

    // Sync to MongoDB Atlas for cross-container serverless persistence
    try {
      const col = await getShopsCollection();
      if (col && createdShop) {
        await col.updateOne({ id }, { $set: createdShop }, { upsert: true });
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas] Shop setup sync warning:', mErr.message);
    }

    res.json({ success: true, shop: createdShop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset / reload Ramesh's Kirana Demo Shop (is_demo = 1)
router.post('/reset-demo', async (req, res) => {
  try {
    seedDatabase();
    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get('ramesh-kirana');
    
    // Sync freshly seeded transactions to MongoDB Atlas in background
    try {
      const { syncToMongoDB } = await import('../db/mongoSync.js');
      syncToMongoDB().catch(e => console.warn('[MongoDB Atlas] Background sync on reset-demo error:', e.message));
    } catch (_) {}

    res.json({ success: true, message: 'Demo shop reloaded with 120 days of verified transactions', shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update shop details
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM shops WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

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
      vintage_years !== undefined ? Number(vintage_years) : null,
      monthly_revenue !== undefined ? Number(monthly_revenue) : null,
      bank_account_type, phone,
      id
    );

    const updated = db.prepare('SELECT * FROM shops WHERE id = ?').get(id);

    // Sync to MongoDB Atlas
    try {
      const col = await getShopsCollection();
      if (col && updated) {
        await col.updateOne({ id }, { $set: updated }, { upsert: true });
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas] Shop update sync warning:', mErr.message);
    }

    res.json({ success: true, shop: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
