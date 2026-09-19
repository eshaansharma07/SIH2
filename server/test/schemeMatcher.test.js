import { test } from 'node:test';
import assert from 'node:assert';
import db from '../db/database.js';
import { seedDatabase } from '../db/seed.js';
import { matchSchemesForShop, getAllSchemes } from '../services/schemeMatcherService.js';

test('Government Scheme Matcher Suite', async (t) => {
  seedDatabase();

  await t.test('1. Library returns all 14 verified schemes with official source URLs', () => {
    const all = getAllSchemes();
    assert.ok(all.length >= 14, 'Should load all 14 verified statutory schemes');
    const baseline = all.filter(s => !s.isScraped);
    assert.strictEqual(baseline.length, 14, 'Must retain all 14 statutory baseline schemes');
    all.forEach(s => {
      assert.ok(s.id, 'Scheme must have an id');
      assert.ok(s.name, 'Scheme must have a name');
      assert.ok(s.scope === 'central' || s.scope === 'state', `Scheme ${s.id} must have scope`);
      assert.ok(s.officialPortal && s.officialPortal.startsWith('https://'), `Scheme ${s.id} must have https portal`);
      assert.ok(s.lastVerified, `Scheme ${s.id} must have a verification timestamp`);
    });
  });

  await t.test('2. Kirana shop (Ramesh, UP) matches MUDRA Kishor, NABARD, and UP ODOP, but isolates other states', () => {
    const result = matchSchemesForShop('ramesh-kirana');
    assert.ok(result, 'Match result must exist');
    assert.ok(result.eligibleCount > 0, 'Should be eligible for schemes');

    const matchedIds = result.schemes.filter(s => s.isEligible).map(s => s.id);
    assert.ok(matchedIds.includes('mudra-kishor'), 'Ramesh must match MUDRA Kishor');
    assert.ok(matchedIds.includes('nabard-agri-retail'), 'Ramesh must match NABARD Agri-Retail Refinance');
    assert.ok(matchedIds.includes('up-odop'), 'Ramesh (Uttar Pradesh) must match UP ODOP');

    // Must NOT match state schemes for MH, TN, GJ, RJ
    assert.strictEqual(matchedIds.includes('mh-cmegp'), false, 'UP shop must not match Maharashtra CMEGP');
    assert.strictEqual(matchedIds.includes('tn-uyegp'), false, 'UP shop must not match Tamil Nadu UYEGP');
    assert.strictEqual(matchedIds.includes('gj-svbs'), false, 'UP shop must not match Gujarat SVBS');
    assert.strictEqual(matchedIds.includes('rj-mlupy'), false, 'UP shop must not match Rajasthan MLUPY');
  });

  await t.test('3. State isolation: Maharashtra shop matches CMEGP and isolates UP, TN, GJ, RJ', () => {
    db.prepare(`
      INSERT OR REPLACE INTO shops (
        id, name, owner_name, trade_type, trade_name, village, district, state,
        vintage_years, monthly_revenue, ownership, bank_account_type, phone, owner_category, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'mh-test-shop',
      'Ganesh Agro Stores',
      'Ganesh Patil',
      'kirana',
      'Kirana & General Store (किराना)',
      'Shirpur',
      'Dhule',
      'Maharashtra',
      2.5,
      45000,
      'owned',
      'State Bank of India',
      '+91 98230 12345',
      'general',
      0
    );

    const result = matchSchemesForShop('mh-test-shop');
    const matchedIds = result.schemes.filter(s => s.isEligible).map(s => s.id);

    assert.ok(matchedIds.includes('mh-cmegp'), 'Maharashtra shop must match CMEGP');
    assert.strictEqual(matchedIds.includes('up-odop'), false, 'Maharashtra shop must NOT match UP ODOP');
    assert.strictEqual(matchedIds.includes('tn-uyegp'), false, 'Maharashtra shop must NOT match TN UYEGP');
    assert.strictEqual(matchedIds.includes('rj-mlupy'), false, 'Maharashtra shop must NOT match RJ MLUPY');
  });

  await t.test('4. Tailoring/Handicrafts enterprise matches PM Vishwakarma', () => {
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
