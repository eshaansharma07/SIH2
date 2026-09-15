import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { matchSchemesForShop, getAllSchemes } from '../services/schemeMatcherService.js';

test('Government Scheme Matcher Suite', async (t) => {
  seedDatabase();

  await t.test('1. Library returns all 10 verified schemes with official source URLs', () => {
    const all = getAllSchemes();
    assert.strictEqual(all.length, 10, 'Should load all 10 verified statutory schemes');
    all.forEach(s => {
      assert.ok(s.id, 'Scheme must have an id');
      assert.ok(s.name, 'Scheme must have a name');
      assert.ok(s.officialPortal && s.officialPortal.startsWith('https://'), `Scheme ${s.id} must have https portal`);
      assert.ok(s.lastVerified, `Scheme ${s.id} must have a verification timestamp`);
    });
  });

  await t.test('2. Kirana shop (Ramesh) matches MUDRA Kishor and NABARD Refinance', () => {
    const result = matchSchemesForShop('ramesh-kirana');
    assert.ok(result, 'Match result must exist');
    assert.ok(result.eligibleCount > 0, 'Should be eligible for schemes');

    const matchedIds = result.schemes.filter(s => s.isEligible).map(s => s.id);
    assert.ok(matchedIds.includes('mudra-kishor'), 'Ramesh must match MUDRA Kishor');
    assert.ok(matchedIds.includes('nabard-agri-retail'), 'Ramesh must match NABARD Agri-Retail Refinance');
  });

  await t.test('3. Tailoring/Handicrafts enterprise matches PM Vishwakarma', () => {
    // Insert a tailoring artisan shop
    db.prepare(`
      INSERT OR REPLACE INTO shops (
        id, name, owner_name, trade_type, trade_name, village, district, state,
        vintage_years, monthly_revenue, ownership, bank_account_type, phone, owner_category, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'artisan-test-shop',
      'Shyam Tailoring Works',
      'Shyam Lal',
      'tailoring',
      'Tailoring & Garments (दर्जी)',
      'Utraula Dehat',
      'Balrampur',
      'Uttar Pradesh',
      2.0,
      28000,
      'rented',
      'Gramin Bank',
      '+91 98391 11111',
      'obc',
      0
    );

    const result = matchSchemesForShop('artisan-test-shop');
    const vishwakarma = result.schemes.find(s => s.id === 'pm-vishwakarma');
    assert.ok(vishwakarma, 'PM Vishwakarma must be in results');
    assert.strictEqual(vishwakarma.isEligible, true, 'Tailoring artisan must be eligible for PM Vishwakarma');
    assert.ok(vishwakarma.matchScore >= 90, 'PM Vishwakarma match score should be high for artisan');
  });
});
