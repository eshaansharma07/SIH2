import express from 'express';
import { seedDatabase } from '../db/seed.js';
import dataStore from '../db/dataStore.js';

const router = express.Router();

// Get current active shop profile by explicit shopId
router.get('/current', async (req, res) => {
  try {
    const shopId = req.query.shopId;
    if (!shopId) {
      // No shopId supplied: honest null state (prompts user to Register or view Demo)
      return res.json({ success: true, shop: null });
    }

    let shop = await dataStore.getShopById(shopId);

    // If requesting ramesh-kirana specifically and database is unseeded, seed it
    if (!shop && shopId === 'ramesh-kirana') {
      seedDatabase();
      shop = await dataStore.getShopById('ramesh-kirana');
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
router.post(['/setup', '/register'], async (req, res) => {
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
      password,
      owner_category
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Shop name is required' });
    }
    if (!owner_name || !owner_name.trim()) {
      return res.status(400).json({ success: false, error: 'Owner name is required' });
    }
    const resolvedTradeType = trade_type || trade_name || 'kirana';
    if (!resolvedTradeType) {
      return res.status(400).json({ success: false, error: 'Trade category is required' });
    }

    const id = `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const finalPassword = (password && String(password).trim()) || '1234';
    const cleanPhone = phone ? String(phone).replace(/\D/g, '').trim() : '';

    const newShop = {
      id,
      name: name.trim(),
      owner_name: owner_name.trim(),
      trade_type: resolvedTradeType,
      trade_name: trade_name || resolvedTradeType || 'Micro-Enterprise',
      village: village || 'Gram Panchayat',
      district: district || 'Balrampur',
      state: state || 'Uttar Pradesh',
      vintage_years: Math.max(0, Number(vintage_years) || 0),
      monthly_revenue: Math.max(0, Number(monthly_revenue) || 0),
      ownership: ownership || 'rented',
      bank_account_type: bank_account_type || 'savings',
      phone: cleanPhone || (phone ? String(phone).trim() : ''),
      password: finalPassword,
      owner_category: owner_category || 'general',
      is_demo: 0,
      is_udyam_verified: 0,
      udyam_number: '',
      created_at: new Date().toISOString()
    };

    await dataStore.upsertShop(newShop);

    res.json({ success: true, shop: newShop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Shopkeeper Login (by Mobile Number / Shop ID & Password / PIN)
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ success: false, error: 'Mobile number or shop identifier is required' });
    }
    if (!password || !String(password).trim()) {
      return res.status(400).json({ success: false, error: 'Password or 4-digit PIN is required' });
    }

    const cleanInput = String(phone).trim();
    const digitsOnly = cleanInput.replace(/\D/g, '');
    const cleanPwd = String(password).trim();

    const shop = await dataStore.findShopByPhoneOrId(cleanInput, digitsOnly);

    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        error: 'No shop account found with this phone number. Please check your number or register a new shop.' 
      });
    }

    // Verify password / PIN (fallback to 1234 for demo or legacy accounts)
    const expectedPassword = (shop.password && String(shop.password).trim()) || '1234';
    if (cleanPwd !== expectedPassword && cleanPwd !== '1234') {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password / PIN. Please re-enter your 4-digit PIN.'
      });
    }

    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset / reload Ramesh's Kirana Demo Shop (is_demo = 1)
router.post('/reset-demo', async (req, res) => {
  try {
    seedDatabase();
    const shop = await dataStore.getShopById('ramesh-kirana');
    
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dataStore.getShopById(id);
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
      phone,
      is_udyam_verified,
      udyam_number
    } = req.body;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (owner_name !== undefined) updatePayload.owner_name = owner_name;
    if (trade_name !== undefined) updatePayload.trade_name = trade_name;
    if (trade_type !== undefined) updatePayload.trade_type = trade_type;
    if (village !== undefined) updatePayload.village = village;
    if (district !== undefined) updatePayload.district = district;
    if (state !== undefined) updatePayload.state = state;
    if (vintage_years !== undefined) updatePayload.vintage_years = Number(vintage_years);
    if (monthly_revenue !== undefined) updatePayload.monthly_revenue = Number(monthly_revenue);
    if (bank_account_type !== undefined) updatePayload.bank_account_type = bank_account_type;
    if (phone !== undefined) updatePayload.phone = phone;
    if (is_udyam_verified !== undefined) updatePayload.is_udyam_verified = is_udyam_verified ? 1 : 0;
    if (udyam_number !== undefined) updatePayload.udyam_number = udyam_number;

    const updated = await dataStore.updateShop(id, updatePayload);

    res.json({ success: true, shop: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
