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

  await t.test('4. Real shop with under 50 transactions is unrated; unlocks formal score at 50 transactions', () => {
    const newShop = {
      id: 'new-kirana-store-01',
      name: 'Sharma General Store',
      vintage_years: 2,
      bank_account_type: 'State Bank of India',
      district: 'Balrampur'
    };

    // 0 transactions: must be locked under audit, no score, no previous score
    const resultZero = calculateCreditScore(newShop, []);
    assert.ok(resultZero, 'Result must exist');
    assert.strictEqual(resultZero.isUnrated, true, 'Zero transactions must be unrated');
    assert.strictEqual(resultZero.totalScore, null, 'Total score must be null for 0 transactions');
    assert.strictEqual(resultZero.score, null, 'Score must be null for 0 transactions');
    assert.strictEqual(resultZero.previousScore, null, 'Previous score must be null for 0 transactions');
    assert.strictEqual(resultZero.requiredTransactions, 50, 'Must require 50 transactions');
    assert.strictEqual(resultZero.transactionsRemaining, 50, 'Must have 50 transactions remaining');
    assert.strictEqual(resultZero.transactionCount, 0, 'Transaction count must be 0');

    // 1 transaction logged: still under audit
    const tx1 = [{ id: 'tx-new-1', date: '2026-09-19', type: 'income', amount: 850, payment_mode: 'upi' }];
    const resultOne = calculateCreditScore(newShop, tx1);
    assert.strictEqual(resultOne.isUnrated, true, '1 transaction must remain unrated');
    assert.strictEqual(resultOne.totalScore, null, 'Score must remain null');
    assert.strictEqual(resultOne.transactionsRemaining, 49, 'Must have 49 remaining');
    assert.strictEqual(resultOne.transactionCount, 1, 'Transaction count must be 1');

    // 50 transactions logged: score unlocks into valid [300, 850] range
    const tx50 = [];
    for (let i = 1; i <= 50; i++) {
      const day = String((i % 28) + 1).padStart(2, '0');
      tx50.push({
        id: `tx-50-${i}`,
        date: `2026-08-${day}`,
        type: i % 4 === 0 ? 'expense' : 'income',
        amount: 500 + i * 20,
        payment_mode: i % 3 === 0 ? 'upi' : 'cash'
      });
    }
    const resultFifty = calculateCreditScore(newShop, tx50);
    assert.strictEqual(resultFifty.isUnrated, false, 'Must unlock after 50 transactions');
    assert.strictEqual(typeof resultFifty.totalScore, 'number', 'Score must be a number');
    assert.ok(resultFifty.totalScore >= 300 && resultFifty.totalScore <= 850, `Score ${resultFifty.totalScore} must be within [300, 850]`);
    assert.strictEqual(resultFifty.factors.length, 4, 'Must have 4 explainable pillars');
    assert.strictEqual(resultFifty.transactionCount, 50, 'Transaction count should be 50');
    assert.strictEqual(resultFifty.transactionsRemaining, 0, 'Remaining should be 0');
  });
});
