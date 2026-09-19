import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import {
  calculateRoundNumberClustering,
  detectAOVOutliers,
  evaluateCashLedgerIntegrity,
  evaluateWholesaleMargin,
  calculateUnderwritingIntegrity
} from '../services/transactionAuditService.js';
import { sybilMuleDetectorService } from '../services/sybilMuleDetectorService.js';
import { generateDossierHash } from '../routes/dossierRoutes.js';

test('Transaction Fair-Play & Anti-Fraud Audit Suite', async (t) => {
  seedDatabase();

  // =========================================================================
  // 1. Round-Number Clustering Suite (Detects Cashback Round-Tripping)
  // =========================================================================
  await t.test('1.1 Flags artificial round-number turnover inflation (e.g. repeated ₹500, ₹1000)', () => {
    const inflatedTxs = [
      { type: 'income', amount: 500 },
      { type: 'income', amount: 1000 },
      { type: 'income', amount: 500 },
      { type: 'income', amount: 2000 },
      { type: 'income', amount: 1000 },
      { type: 'income', amount: 500 },
      { type: 'income', amount: 1000 },
      { type: 'income', amount: 500 },
      { type: 'income', amount: 500 },
      { type: 'income', amount: 500 }
    ];

    const result = calculateRoundNumberClustering(inflatedTxs);
    assert.strictEqual(result.ratio, 100);
    assert.strictEqual(result.isSuspicious, true);
    assert.strictEqual(result.flag, 'EXCESSIVE_ROUND_NUMBER_CLUSTERING');
  });

  await t.test('1.2 Accepts organic retail transactions with natural price variation', () => {
    const organicTxs = [
      { type: 'income', amount: 37 },
      { type: 'income', amount: 84 },
      { type: 'income', amount: 112 },
      { type: 'income', amount: 45 },
      { type: 'income', amount: 220 },
      { type: 'income', amount: 65 },
      { type: 'income', amount: 18 },
      { type: 'income', amount: 140 },
      { type: 'income', amount: 95 },
      { type: 'income', amount: 33 }
    ];

    const result = calculateRoundNumberClustering(organicTxs);
    assert.ok(result.ratio <= 20, `Organic ratio (${result.ratio}) should be low`);
    assert.strictEqual(result.isSuspicious, false);
    assert.strictEqual(result.flag, 'NORMAL');
  });

  // =========================================================================
  // 2. Average Order Value (AOV) Outlier Detection (Z-Score)
  // =========================================================================
  await t.test('2.1 Detects abnormal high-ticket velocity spikes (Z-score > 3.0)', () => {
    const txsWithSpikes = [];
    // 20 normal small items (~₹40)
    for (let i = 0; i < 20; i++) {
      txsWithSpikes.push({ type: 'income', amount: 35 + (i % 10), payment_mode: 'upi' });
    }
    // 3 massive round transactions (e.g. ₹8,000 cashout)
    txsWithSpikes.push({ type: 'income', amount: 8000, payment_mode: 'upi' });
    txsWithSpikes.push({ type: 'income', amount: 9500, payment_mode: 'upi' });
    txsWithSpikes.push({ type: 'income', amount: 12000, payment_mode: 'upi' });

    const result = detectAOVOutliers(txsWithSpikes);
    assert.ok(result.outlierCount >= 3, `Expected at least 3 outliers, got ${result.outlierCount}`);
    assert.strictEqual(result.isSuspicious, true);
  });

  // =========================================================================
  // 3. Physical Cash-Drain Balancing Test
  // =========================================================================
  await t.test('3.1 Detects impossible physical cash deficit (Cash Outflow > Inflow)', () => {
    const drainTxs = [
      { date: '2026-09-01', type: 'income', amount: 1000, payment_mode: 'cash' },
      // Handing out ₹15,000 cash when only ₹1,000 was collected
      { date: '2026-09-02', type: 'expense', amount: 16000, payment_mode: 'cash' }
    ];

    const result = evaluateCashLedgerIntegrity(drainTxs);
    assert.strictEqual(result.hasNegativeCashDrain, true);
    assert.strictEqual(result.flag, 'IMPOSSIBLE_PHYSICAL_CASH_DEFICIT');
    assert.ok(result.minCashBalance <= -15000);
  });

  await t.test('3.2 Approves balanced cash flow where drawer maintains positive liquidity', () => {
    const healthyTxs = [
      { date: '2026-09-01', type: 'income', amount: 5000, payment_mode: 'cash' },
      { date: '2026-09-02', type: 'expense', amount: 2000, payment_mode: 'cash' },
      { date: '2026-09-03', type: 'income', amount: 3500, payment_mode: 'cash' }
    ];

    const result = evaluateCashLedgerIntegrity(healthyTxs);
    assert.strictEqual(result.hasNegativeCashDrain, false);
    assert.strictEqual(result.flag, 'HEALTHY');
    assert.strictEqual(result.currentCashBalance, 6500);
  });

  // =========================================================================
  // 4. Wholesale Margin Triangulation
  // =========================================================================
  await t.test('4.1 Flags phantom turnover with zero or implausible wholesale COGS', () => {
    // ₹2,00,000 sales on ₹5,000 inventory => 97.5% margin (impossible for rural retail)
    const result = evaluateWholesaleMargin(200000, 5000);
    assert.strictEqual(result.isSuspicious, true);
    assert.strictEqual(result.status, 'MARGIN_ANOMALY_DETECTED');
    assert.ok(result.grossMarginPct > 50);
  });

  await t.test('4.2 Validates typical retail gross margins (10-20%)', () => {
    // ₹1,00,000 sales on ₹85,000 stock procurement => 15% margin
    const result = evaluateWholesaleMargin(100000, 85000);
    assert.strictEqual(result.isSuspicious, false);
    assert.strictEqual(result.status, 'BENCHMARK_COMPLIANT');
    assert.strictEqual(result.grossMarginPct, 15);
  });

  // =========================================================================
  // 5. Composite Underwriting Integrity Index
  // =========================================================================
  await t.test('5.1 Computes Data Authenticity & Trust Index with clear penalties', () => {
    const fraudulentTxs = [
      { date: '2026-09-01', type: 'income', amount: 500, payment_mode: 'cash' },
      { date: '2026-09-02', type: 'income', amount: 1000, payment_mode: 'cash' },
      { date: '2026-09-03', type: 'expense', amount: 25000, payment_mode: 'cash' }, // Massive cash drain
      { date: '2026-09-04', type: 'income', amount: 500, payment_mode: 'cash' },
      { date: '2026-09-05', type: 'income', amount: 1000, payment_mode: 'cash' },
      { date: '2026-09-06', type: 'income', amount: 500, payment_mode: 'cash' },
      { date: '2026-09-07', type: 'income', amount: 1000, payment_mode: 'cash' },
      { date: '2026-09-08', type: 'income', amount: 500, payment_mode: 'cash' },
      { date: '2026-09-09', type: 'income', amount: 1000, payment_mode: 'cash' },
      { date: '2026-09-10', type: 'income', amount: 500, payment_mode: 'cash' }
    ];

    const audit = calculateUnderwritingIntegrity(fraudulentTxs, 7000, 25000);
    assert.ok(audit.integrityIndex < 70, `Integrity index (${audit.integrityIndex}) should be penalized`);
    assert.ok(audit.auditFlags.length >= 2, 'Should flag multiple violations');
    assert.ok(audit.penaltyPoints >= 50, 'Penalty points should accumulate');
  });

  // =========================================================================
  // 6. Sybil & Mule Ring Detector Suite
  // =========================================================================
  await t.test('6.1 Identity Deduplication rejects duplicate bank accounts and Udyam numbers', () => {
    // Seed sample shop
    db.prepare(`
      INSERT OR REPLACE INTO shops (
        id, name, owner_name, trade_type, trade_name, village, district, state,
        vintage_years, monthly_revenue, bank_account_type, udyam_number, is_demo
      ) VALUES (
        'test-shop-sybil-1', 'Sybil Shop 1', 'Owner A', 'kirana', 'Kirana', 'Utraula', 'Balrampur', 'Uttar Pradesh',
        2, 45000, 'SBI-99887766', 'UDYAM-UP-00-9999999', 0
      )
    `).run();

    // Try registering duplicate bank account
    const dupBankCheck = sybilMuleDetectorService.checkIdentityDeduplication('SBI-99887766', 'UDYAM-UP-00-1111111', 'new-shop');
    assert.strictEqual(dupBankCheck.allowed, false);
    assert.strictEqual(dupBankCheck.field, 'bank_account');

    // Try registering duplicate Udyam number
    const dupUdyamCheck = sybilMuleDetectorService.checkIdentityDeduplication('ICICI-112233', 'UDYAM-UP-00-9999999', 'new-shop');
    assert.strictEqual(dupUdyamCheck.allowed, false);
    assert.strictEqual(dupUdyamCheck.field, 'udyam_number');

    // Clean unique credentials pass
    const cleanCheck = sybilMuleDetectorService.checkIdentityDeduplication('HDFC-445566', 'UDYAM-UP-00-7777777', 'new-shop');
    assert.strictEqual(cleanCheck.allowed, true);

    // Cleanup
    db.prepare("DELETE FROM shops WHERE id = 'test-shop-sybil-1'").run();
  });

  // =========================================================================
  // 7. Cryptographic HMAC Dossier Verification Suite
  // =========================================================================
  await t.test('7.1 Generates verifiable SHA-256 HMAC hash for bankable dossier', () => {
    const hash = generateDossierHash('SS-DOC-BAL-123456', 'ramesh-kirana', 742, 185000);
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 32);

    // Determinism test: same parameters produce exact same cryptographic hash
    const repeatHash = generateDossierHash('SS-DOC-BAL-123456', 'ramesh-kirana', 742, 185000);
    assert.strictEqual(hash, repeatHash);

    // Tampering test: altering a single digit changes the hash entirely
    const tamperedHash = generateDossierHash('SS-DOC-BAL-123456', 'ramesh-kirana', 842, 185000);
    assert.notStrictEqual(hash, tamperedHash);
  });
});
