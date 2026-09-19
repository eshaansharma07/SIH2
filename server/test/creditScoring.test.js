import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { calculateCreditScore } from '../services/creditScoringService.js';

test('Credit Scoring Service Suite', async (t) => {
  seedDatabase();

  await t.test('1. Ramesh Kirana baseline score is within valid [300, 850] range', () => {
    const result = calculateCreditScore('ramesh-kirana');
    assert.ok(result, 'Result should exist');
    assert.strictEqual(typeof result.totalScore, 'number', 'Total score must be a number');
    assert.ok(result.totalScore >= 300 && result.totalScore <= 850, `Score ${result.totalScore} should be in [300, 850]`);
    assert.ok(Array.isArray(result.factors), 'Factors must be an array');
    assert.strictEqual(result.factors.length, 4, 'Must have exactly 4 explainable pillars');

    const pillarIds = result.factors.map(f => f.id);
    assert.deepStrictEqual(pillarIds.sort(), ['consistency', 'discipline', 'growth', 'vintage'].sort());
  });

  await t.test('2. Unpaid udhaar significantly penalizes the discipline factor', () => {
    const mockUnpaidTxs = [
      { id: 'tx-1', date: '2026-09-01', type: 'income', amount: 50000, payment_mode: 'cash' },
      { id: 'tx-2', date: '2026-09-02', type: 'udhaar_given', amount: 35000, payment_mode: 'khata' },
      { id: 'tx-3', date: '2026-09-03', type: 'income', amount: 20000, payment_mode: 'upi' },
      { id: 'tx-4', date: '2026-09-04', type: 'income', amount: 15000, payment_mode: 'cash' },
      { id: 'tx-5', date: '2026-09-05', type: 'income', amount: 10000, payment_mode: 'upi' }
    ];

    const mockRepaidTxs = [
      { id: 'tx-1', date: '2026-09-01', type: 'income', amount: 50000, payment_mode: 'cash' },
      { id: 'tx-2', date: '2026-09-02', type: 'udhaar_given', amount: 35000, payment_mode: 'khata' },
      { id: 'tx-3', date: '2026-09-03', type: 'udhaar_repaid', amount: 35000, payment_mode: 'khata' },
      { id: 'tx-4', date: '2026-09-04', type: 'income', amount: 15000, payment_mode: 'cash' },
      { id: 'tx-5', date: '2026-09-05', type: 'income', amount: 10000, payment_mode: 'upi' }
    ];

    const resultUnpaid = calculateCreditScore('ramesh-kirana', mockUnpaidTxs);
    const resultRepaid = calculateCreditScore('ramesh-kirana', mockRepaidTxs);

    const disciplineUnpaid = resultUnpaid.factors.find(f => f.id === 'discipline');
    const disciplineRepaid = resultRepaid.factors.find(f => f.id === 'discipline');

    assert.ok(
      disciplineRepaid.score > disciplineUnpaid.score,
      `Repaid discipline score (${disciplineRepaid.score}) must exceed unpaid discipline score (${disciplineUnpaid.score})`
    );
  });

  await t.test('3. Total score is always clamped within [300, 850]', () => {
    const mockHugeTxs = [];
    for (let i = 1; i <= 90; i++) {
      const day = i < 10 ? `0${i}` : `${i}`;
      mockHugeTxs.push({ id: `tx-h-${i}`, date: `2026-06-${day}`, type: 'income', amount: 100000, payment_mode: 'upi' });
    }
    const resultHuge = calculateCreditScore('ramesh-kirana', mockHugeTxs);
    assert.ok(resultHuge.totalScore <= 850, `Score ${resultHuge.totalScore} must not exceed 850`);
    assert.ok(resultHuge.totalScore >= 300, `Score ${resultHuge.totalScore} must be at least 300`);
  });

  await t.test('4. Newly registered shop with zero or 1 transaction receives valid dynamic foundation score', () => {
    const newShop = {
      id: 'new-kirana-store-01',
      name: 'Sharma General Store',
      vintage_years: 2,
      bank_account_type: 'State Bank of India',
      district: 'Balrampur'
    };

    // 0 transactions
    const resultZero = calculateCreditScore(newShop, []);
    assert.ok(resultZero, 'Result must exist');
    assert.strictEqual(typeof resultZero.totalScore, 'number', 'Total score must be a number');
    assert.ok(resultZero.totalScore >= 500 && resultZero.totalScore <= 700, `Initial score (${resultZero.totalScore}) should be in starter range [500, 700]`);
    assert.strictEqual(resultZero.isUnrated, false, 'Should not be locked as unrated');
    assert.strictEqual(resultZero.factors.length, 4, 'Must have 4 explainable pillars');

    // 1 transaction logged
    const tx1 = [{ id: 'tx-new-1', date: '2026-09-19', type: 'income', amount: 850, payment_mode: 'upi' }];
    const resultOne = calculateCreditScore(newShop, tx1);
    assert.ok(resultOne.totalScore >= resultZero.totalScore, 'Score must increase or remain solid after logging transaction');
    assert.strictEqual(resultOne.metrics.loggedDays, 1, 'Logged days should dynamically reflect 1');
  });
});
