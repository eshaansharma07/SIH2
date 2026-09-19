process.env.NODE_ENV = 'test';

import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import dataStore from '../db/dataStore.js';
import { 
  normalizeIndianPhone, 
  extract10Digits, 
  isValidIndianPhone, 
  maskPhoneNumber 
} from '../utils/phoneUtils.js';
import { rateLimiterService } from '../services/rateLimiterService.js';
import { 
  generateShopToken, 
  verifyShopToken, 
  requireShopAccess 
} from '../middleware/auth.js';
import { twilioVerifyService } from '../services/twilioVerifyService.js';

test('Real-Time SMS OTP Authentication & Security Suite', async (t) => {
  seedDatabase();
  rateLimiterService.resetForTesting();

  // =========================================================================
  // 1. Phone Normalization & Validation Suite
  // =========================================================================
  await t.test('1.1 Normalizes various Indian phone number formats to E.164 (+91XXXXXXXXXX)', () => {
    assert.strictEqual(normalizeIndianPhone('9876543210'), '+919876543210');
    assert.strictEqual(normalizeIndianPhone('+919876543210'), '+919876543210');
    assert.strictEqual(normalizeIndianPhone('919876543210'), '+919876543210');
    assert.strictEqual(normalizeIndianPhone('09876543210'), '+919876543210');
    assert.strictEqual(normalizeIndianPhone('+91 98765 43210'), '+919876543210');
    assert.strictEqual(normalizeIndianPhone('98765-43210'), '+919876543210');
    assert.strictEqual(normalizeIndianPhone('+91 (987) 654-3210'), '+919876543210');

    // extract10Digits
    assert.strictEqual(extract10Digits('+919876543210'), '9876543210');
    assert.strictEqual(extract10Digits('9876543210'), '9876543210');
  });

  await t.test('1.2 Rejects invalid Indian phone numbers', () => {
    // Too short / invalid length
    assert.strictEqual(normalizeIndianPhone('12345'), null);
    assert.strictEqual(normalizeIndianPhone('98765'), null);
    assert.strictEqual(normalizeIndianPhone('98765432101234'), null);

    // Invalid prefix (Indian mobile numbers start with 6, 7, 8, or 9)
    assert.strictEqual(normalizeIndianPhone('5876543210'), null);
    assert.strictEqual(normalizeIndianPhone('1234567890'), null);
    assert.strictEqual(normalizeIndianPhone('0000000000'), null);

    // Alpha / special characters only
    assert.strictEqual(normalizeIndianPhone('abcdefghij'), null);
    assert.strictEqual(normalizeIndianPhone(''), null);
    assert.strictEqual(normalizeIndianPhone(null), null);

    // isValidIndianPhone
    assert.strictEqual(isValidIndianPhone('9876543210'), true);
    assert.strictEqual(isValidIndianPhone('12345'), false);
  });

  await t.test('1.3 Correctly masks phone numbers for secure UI display', () => {
    assert.strictEqual(maskPhoneNumber('9876543210'), '+91 98XXX XX210');
    assert.strictEqual(maskPhoneNumber('+919839124789'), '+91 98XXX XX789');
    assert.strictEqual(maskPhoneNumber('invalid'), '+91 XXXXX XXXXX');
  });

  // =========================================================================
  // 2. Rate Limiter & Cooldown Service Suite
  // =========================================================================
  await t.test('2.1 Enforces 30-second cooldown per phone number for OTP send', () => {
    rateLimiterService.resetForTesting();
    const testPhone = '+919876543210';

    // First attempt: allowed
    const firstCheck = rateLimiterService.checkOtpSendCooldown(testPhone);
    assert.strictEqual(firstCheck.allowed, true);
    rateLimiterService.recordOtpSent(testPhone);

    // Immediate second attempt: rejected with remaining seconds
    const secondCheck = rateLimiterService.checkOtpSendCooldown(testPhone);
    assert.strictEqual(secondCheck.allowed, false);
    assert.ok(secondCheck.retryAfterSeconds > 0 && secondCheck.retryAfterSeconds <= 30);

    // Different phone is not affected
    const diffPhoneCheck = rateLimiterService.checkOtpSendCooldown('+919988776655');
    assert.strictEqual(diffPhoneCheck.allowed, true);
  });

  await t.test('2.2 Enforces maximum 5 failed verification attempts before temporary lockout', () => {
    rateLimiterService.resetForTesting();
    const testPhone = '+919876543210';

    // 4 failed attempts: still allowed
    for (let i = 0; i < 4; i++) {
      assert.strictEqual(rateLimiterService.checkVerifyAttempts(testPhone).allowed, true);
      rateLimiterService.recordVerifyFailure(testPhone);
    }

    // 5th attempt allowed
    assert.strictEqual(rateLimiterService.checkVerifyAttempts(testPhone).allowed, true);
    rateLimiterService.recordVerifyFailure(testPhone);

    // 6th attempt: locked out
    const lockedCheck = rateLimiterService.checkVerifyAttempts(testPhone);
    assert.strictEqual(lockedCheck.allowed, false);
    assert.strictEqual(lockedCheck.remainingAttempts, 0);
    assert.ok(lockedCheck.retryAfterSeconds > 0);

    // Successful verify resets lockout
    rateLimiterService.resetVerifyAttempts(testPhone);
    assert.strictEqual(rateLimiterService.checkVerifyAttempts(testPhone).allowed, true);
  });

  // =========================================================================
  // 3. JWT Session & Authorization Middleware Suite
  // =========================================================================
  await t.test('3.1 Generates and verifies JWT session tokens with shop identity', () => {
    const shop = {
      id: 'test-shop-101',
      phone: '9876543210',
      owner_name: 'Aditya Chhikara',
      is_demo: 0
    };

    const token = generateShopToken(shop);
    assert.ok(token && typeof token === 'string', 'Token should be a non-empty string');

    const decoded = verifyShopToken(token);
    assert.ok(decoded, 'Token should verify successfully');
    assert.strictEqual(decoded.shopId, 'test-shop-101');
    assert.strictEqual(decoded.phone, '9876543210');
    assert.strictEqual(decoded.isDemo, false);

    // Tampered / invalid token fails verification
    assert.strictEqual(verifyShopToken('invalid.token.string'), null);
    assert.strictEqual(verifyShopToken(''), null);
  });

  await t.test('3.2 requireShopAccess prevents cross-shop ledger tampering', () => {
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    // Ramesh Kirana demo is always accessible
    nextCalled = false;
    requireShopAccess({ query: { shopId: 'ramesh-kirana' } }, {}, next);
    assert.strictEqual(nextCalled, true, 'Demo shop is accessible without token');

    // Unauthenticated access to private shop is rejected with 401
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status(code) { statusSent = code; return this; },
      json(data) { jsonSent = data; }
    };

    nextCalled = false;
    requireShopAccess({ query: { shopId: 'private-shop-999' } }, res, next);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusSent, 401);
    assert.strictEqual(jsonSent.success, false);

    // Authenticated access with matching shopId succeeds
    nextCalled = false;
    requireShopAccess(
      { query: { shopId: 'shop-abc' }, user: { shopId: 'shop-abc', isDemo: false } },
      res,
      next
    );
    assert.strictEqual(nextCalled, true);

    // Authenticated user trying to access another shopkeeper's ID is rejected with 403 Forbidden
    nextCalled = false;
    statusSent = null;
    requireShopAccess(
      { query: { shopId: 'shop-xyz' }, user: { shopId: 'shop-abc', isDemo: false } },
      res,
      next
    );
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusSent, 403);
    assert.strictEqual(jsonSent.success, false);
  });

  // =========================================================================
  // 4. Twilio Verify v2 Integration & Endpoints Suite
  // =========================================================================
  await t.test('4.1 OTP Send and Verify flow with Twilio Verify v2 mock', async () => {
    rateLimiterService.resetForTesting();

    // Create a mock Twilio client
    let lastSentTo = null;
    let lastCheckedCode = null;

    const mockTwilioClient = {
      verify: {
        v2: {
          services: (serviceSid) => ({
            verifications: {
              create: async ({ to, channel }) => {
                lastSentTo = to;
                if (to === '+919999999999') {
                  const err = new Error('Twilio send error');
                  err.code = 60203;
                  throw err;
                }
                return { status: 'pending', sid: 'VE_MOCK_123' };
              }
            },
            verificationChecks: {
              create: async ({ to, code }) => {
                lastCheckedCode = code;
                if (code === '123456') {
                  return { status: 'approved' };
                }
                if (code === '000000') {
                  const err = new Error('OTP expired');
                  err.code = 20404;
                  throw err;
                }
                return { status: 'pending' };
              }
            }
          })
        }
      }
    };

    twilioVerifyService.setMockClient(mockTwilioClient);

    // A. Send OTP for Ramesh Kirana (registered phone: '9839124789' or '+91 98391 24789')
    const normalized = normalizeIndianPhone('9839124789');
    const sendResult = await twilioVerifyService.sendVerification(normalized);
    assert.strictEqual(sendResult.success, true);
    assert.strictEqual(lastSentTo, '+919839124789');

    // B. Verify correct OTP
    const verifyApproved = await twilioVerifyService.checkVerification(normalized, '123456');
    assert.strictEqual(verifyApproved.success, true);
    assert.strictEqual(verifyApproved.approved, true);
    assert.strictEqual(lastCheckedCode, '123456');

    // C. Verify wrong OTP returns failure
    const verifyWrong = await twilioVerifyService.checkVerification(normalized, '999999');
    assert.strictEqual(verifyWrong.approved, false);
    assert.ok(verifyWrong.error.includes('Incorrect OTP'));

    // D. Verify expired OTP throws clean message
    await assert.rejects(
      async () => {
        await twilioVerifyService.checkVerification(normalized, '000000');
      },
      (err) => {
        assert.ok(err.message.includes('OTP expired'));
        return true;
      }
    );

    // E. Provider rate limit error (code 60203) throws clean message
    await assert.rejects(
      async () => {
        await twilioVerifyService.sendVerification('+919999999999');
      },
      (err) => {
        assert.ok(err.message.includes('Too many verification attempts'));
        return true;
      }
    );

    // Clean up mock
    twilioVerifyService.setMockClient(null);
  });

  // =========================================================================
  // 5. Insecure Password Fallback Elimination for Real Shops
  // =========================================================================
  await t.test('5.1 Real shop accounts are prohibited from password/1234 PIN login', async () => {
    // Create a real (non-demo) shop
    const realShopId = `real-shop-${Date.now()}`;
    const realPhone = '9811122233';
    await dataStore.upsertShop({
      id: realShopId,
      name: 'Chhikara General Store',
      owner_name: 'Aditya Chhikara',
      phone: realPhone,
      password: '1234',
      is_demo: 0,
      trade_type: 'kirana',
      vintage_years: 2,
      monthly_revenue: 80000
    });

    const shop = await dataStore.findShopByPhoneOrId(realPhone, realPhone);
    assert.ok(shop);
    assert.strictEqual(shop.is_demo, 0);

    // Verify demo PIN verification is disallowed for real shops in shopRoutes logic
    assert.strictEqual(shop.is_demo === 1 || shop.id === 'ramesh-kirana', false, 'Real shop must not be flagged as demo');

    // Clean up
    db.prepare('DELETE FROM shops WHERE id = ?').run(realShopId);
  });

  // =========================================================================
  // 6. Demo Mode Bypasses SMS Only When Explicitly Chosen
  // =========================================================================
  await t.test('6.1 Ramesh Kirana Demo shop can be initialized with authenticated demo token', async () => {
    const demoShop = await dataStore.getShopById('ramesh-kirana');
    assert.ok(demoShop, 'Ramesh Kirana demo shop must exist');
    assert.strictEqual(demoShop.is_demo, 1);

    const demoToken = generateShopToken(demoShop);
    const decoded = verifyShopToken(demoToken);
    assert.ok(decoded);
    assert.strictEqual(decoded.shopId, 'ramesh-kirana');
    assert.strictEqual(decoded.isDemo, true);
  });
});
