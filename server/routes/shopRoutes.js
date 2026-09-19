import express from 'express';
import { seedDatabase } from '../db/seed.js';
import dataStore from '../db/dataStore.js';
import { normalizeIndianPhone, extract10Digits } from '../utils/phoneUtils.js';
import { twilioVerifyService } from '../services/twilioVerifyService.js';
import { rateLimiterService } from '../services/rateLimiterService.js';
import { generateShopToken } from '../middleware/auth.js';

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

// Setup / Register new real shop profile (Onboarding — is_demo = 0)
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
      owner_category,
      otp
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

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.'
      });
    }

    // Verify phone uniqueness for real shop accounts
    const digitsOnly = extract10Digits(normalizedPhone);
    const existingShop = await dataStore.findShopByPhoneOrId(normalizedPhone, digitsOnly);
    if (existingShop && existingShop.is_demo !== 1) {
      return res.status(409).json({
        success: false,
        error: 'An account with this mobile number already exists. Please log in instead.'
      });
    }

    // If OTP is provided, verify it with Twilio Verify v2
    if (otp) {
      const cleanOtp = String(otp).trim();
      if (!/^\d{6}$/.test(cleanOtp)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid 6-digit OTP.'
        });
      }

      // Check lockout status
      const attemptCheck = rateLimiterService.checkVerifyAttempts(normalizedPhone);
      if (!attemptCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many verification attempts. Please wait and try again later.'
        });
      }

      const verification = await twilioVerifyService.checkVerification(normalizedPhone, cleanOtp);
      if (!verification.approved) {
        rateLimiterService.recordVerifyFailure(normalizedPhone);
        return res.status(400).json({
          success: false,
          error: 'Incorrect OTP. Please check the SMS and try again.'
        });
      }

      // Reset verify attempts upon approval
      rateLimiterService.resetVerifyAttempts(normalizedPhone);
    } else if (twilioVerifyService.isConfigured() && process.env.NODE_ENV !== 'test') {
      return res.status(400).json({
        success: false,
        error: 'OTP verification is required to complete registration.'
      });
    }

    const id = `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const finalPassword = (password && String(password).trim()) || '1234';

    const newShop = {
      id,
      name: name.trim(),
      owner_name: owner_name.trim(),
      trade_type: resolvedTradeType,
      trade_name: trade_name || (resolvedTradeType.charAt(0).toUpperCase() + resolvedTradeType.slice(1)),
      village: village || 'Gram Panchayat',
      district: district || 'Balrampur',
      state: state || 'Uttar Pradesh',
      vintage_years: Math.max(0, Number(vintage_years) || 0),
      monthly_revenue: Math.max(0, Number(monthly_revenue) || 0),
      ownership: ownership || 'rented',
      bank_account_type: bank_account_type || 'savings',
      phone: normalizedPhone,
      password: finalPassword,
      owner_category: owner_category || 'general',
      is_demo: 0,
      is_udyam_verified: 0,
      udyam_number: '',
      created_at: new Date().toISOString()
    };

    await dataStore.upsertShop(newShop);
    const token = generateShopToken(newShop);

    res.json({ success: true, shop: newShop, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// REAL-TIME SMS OTP ENDPOINTS (TWILIO VERIFY V2)
// ==========================================

// Send Real-Time SMS OTP via Twilio Verify v2
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, type = 'login' } = req.body;
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.'
      });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.'
      });
    }

    // IP-level rate limiting
    const ip = req.ip || req.connection?.remoteAddress || '';
    if (!rateLimiterService.checkIpRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait and try again later.'
      });
    }

    // 30s per-phone cooldown
    const cooldown = rateLimiterService.checkOtpSendCooldown(normalizedPhone);
    if (!cooldown.allowed) {
      return res.status(429).json({
        success: false,
        error: `Please wait ${cooldown.retryAfterSeconds} seconds before requesting another OTP.`
      });
    }

    // Verify whether a shop exists for this phone number based on auth type
    const digitsOnly = extract10Digits(normalizedPhone);
    const shop = await dataStore.findShopByPhoneOrId(normalizedPhone, digitsOnly);

    if (type === 'register') {
      if (shop && shop.is_demo !== 1) {
        return res.status(409).json({
          success: false,
          error: 'An account with this mobile number already exists. Please log in instead.'
        });
      }
    } else {
      if (!shop) {
        return res.status(404).json({
          success: false,
          error: 'No shop account found with this phone number. Please register your shop first.'
        });
      }
    }

    // Dispatch SMS via Twilio Verify v2
    const verifyResult = await twilioVerifyService.sendVerification(normalizedPhone);
    rateLimiterService.recordOtpSent(normalizedPhone);

    return res.json({
      success: true,
      message: verifyResult?.isTrialFallback 
        ? `OTP generated (Trial Mode: ${verifyResult.sandboxCode})`
        : 'OTP sent successfully',
      isTrialFallback: Boolean(verifyResult?.isTrialFallback),
      sandboxCode: verifyResult?.sandboxCode || null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "We couldn't send the OTP right now. Please try again shortly."
    });
  }
});

// Verify Real-Time SMS OTP via Twilio Verify v2 & Issue Authenticated Session
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.'
      });
    }
    if (!otp || !String(otp).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit OTP.'
      });
    }

    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.'
      });
    }

    const cleanOtp = String(otp).trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit OTP.'
      });
    }

    // Lockout protection after repeated failures
    const attemptCheck = rateLimiterService.checkVerifyAttempts(normalizedPhone);
    if (!attemptCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too many verification attempts. Please wait and try again later.'
      });
    }

    // Check with Twilio Verify v2
    const verification = await twilioVerifyService.checkVerification(normalizedPhone, cleanOtp);

    if (!verification.approved) {
      rateLimiterService.recordVerifyFailure(normalizedPhone);
      return res.status(400).json({
        success: false,
        error: 'Incorrect OTP. Please check the SMS and try again.'
      });
    }

    // Reset attempt records on approval
    rateLimiterService.resetVerifyAttempts(normalizedPhone);

    // Retrieve verified shop
    const digitsOnly = extract10Digits(normalizedPhone);
    const shop = await dataStore.findShopByPhoneOrId(normalizedPhone, digitsOnly);

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'No shop account found with this phone number. Please register your shop first.'
      });
    }

    // Issue JWT token
    const token = generateShopToken(shop);

    return res.json({
      success: true,
      message: 'Phone number verified successfully',
      shop,
      token
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Verification failed. Please try again.'
    });
  }
});

// Explicit Demo Mode Login (Bypasses SMS exclusively for the seeded Ramesh Kirana demo shop)
router.post('/demo-login', async (req, res) => {
  try {
    seedDatabase();
    let shop = await dataStore.getShopById('ramesh-kirana');
    if (!shop) {
      shop = await dataStore.getDemoShop();
    }
    const demoShop = shop || {
      id: 'ramesh-kirana',
      name: "Ramesh's Kirana Store",
      owner_name: 'Ramesh Kumar',
      phone: '9839124789',
      is_demo: 1
    };

    const token = generateShopToken(demoShop);
    return res.json({
      success: true,
      message: 'Demo session initialized for Ramesh Kirana Store',
      shop: demoShop,
      token
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Shopkeeper Login (Legacy/Demo PIN fallback - real accounts MUST use SMS OTP)
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

    // Security requirement: Real shop accounts cannot bypass OTP via password
    if (shop.is_demo !== 1 && shop.id !== 'ramesh-kirana') {
      return res.status(403).json({
        success: false,
        error: 'Real shop accounts must authenticate using SMS OTP. Please use the Send OTP login flow.'
      });
    }

    // Demo accounts only: verify PIN
    const expectedPassword = (shop.password && String(shop.password).trim()) || '1234';
    if (cleanPwd !== expectedPassword && cleanPwd !== '1234') {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password / PIN. Please re-enter your 4-digit PIN.'
      });
    }

    const token = generateShopToken(shop);
    res.json({ success: true, shop, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset / reload Ramesh's Kirana Demo Shop (is_demo = 1)
router.post('/reset-demo', async (req, res) => {
  try {
    seedDatabase();
    const shop = await dataStore.getShopById('ramesh-kirana');
    
    // Sync freshly seeded transactions to MongoDB Atlas with timeout guard
    try {
      const { syncToMongoDB } = await import('../db/mongoSync.js');
      await Promise.race([
        syncToMongoDB(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 2500))
      ]).catch(e => console.warn('[MongoDB Atlas] Sync on reset-demo notice:', e.message));
    } catch (_) {}

    const token = generateShopToken(shop || { id: 'ramesh-kirana', phone: '9839124789', is_demo: 1 });

    res.json({
      success: true,
      message: 'Demo shop reloaded with 120 days of verified transactions',
      shop,
      token
    });
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
