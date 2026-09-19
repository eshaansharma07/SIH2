import { test } from 'node:test';
import assert from 'node:assert';
import dataStore from '../db/dataStore.js';
import { seedDatabase } from '../db/seed.js';

test('Admin Dashboard & Institutional Telemetry Suite', async (t) => {
  seedDatabase();

  await t.test('1. getAdminMetrics returns valid enterprise and transaction aggregations', async () => {
    const metrics = await dataStore.getAdminMetrics();

    assert.ok(metrics, 'Metrics object should be returned');
    assert.ok(typeof metrics.totalShops === 'number', 'totalShops should be a number');
    assert.ok(metrics.totalShops >= 1, 'There should be at least 1 registered shop');
    assert.ok(typeof metrics.totalTransactions === 'number', 'totalTransactions should be a number');
    assert.ok(typeof metrics.totalVolume === 'number', 'totalVolume should be a number');
    assert.ok(typeof metrics.scoredShops === 'number', 'scoredShops should be a number');
    assert.ok(typeof metrics.unratedShops === 'number', 'unratedShops should be a number');
    assert.ok(Array.isArray(metrics.states), 'states should be an array');
  });

  await t.test('2. getAllShops returns decorated shops with milestone progress', async () => {
    const result = await dataStore.getAllShops({ limit: 10, offset: 0 });

    assert.ok(result, 'Result should exist');
    assert.ok(Array.isArray(result.shops), 'shops should be an array');
    assert.ok(result.total >= 1, 'Total shops should be at least 1');

    const demoShop = result.shops.find(s => s.id === 'ramesh-kirana');
    assert.ok(demoShop, 'Ramesh Kirana shop should be in the list');
    assert.strictEqual(demoShop.isScored, true, 'Demo shop should be marked as scored');
    assert.strictEqual(demoShop.milestoneStatus, 'scored', 'Milestone status should be scored');
    assert.ok(demoShop.transactionCount >= 50, 'Ramesh Kirana should have at least 50 transactions');
    assert.strictEqual(demoShop.progressPct, 100, 'Scored shop progress should be 100%');
  });

  await t.test('3. getAllShops filters correctly by search query', async () => {
    const searchRes = await dataStore.getAllShops({ search: 'Ramesh' });
    assert.ok(searchRes.shops.length >= 1, 'Search for Ramesh should find at least 1 shop');
    assert.ok(searchRes.shops.some(s => s.name.includes('Ramesh') || s.ownerName.includes('Ramesh')));
  });

  await t.test('4. getAllShops filters correctly by milestone status', async () => {
    const scoredOnly = await dataStore.getAllShops({ milestone: 'scored' });
    scoredOnly.shops.forEach(s => {
      assert.strictEqual(s.isScored, true, 'All returned shops should be scored');
    });
  });

  t.after(async () => {
    try {
      const { closeMongoConnection } = await import('../db/mongoClient.js');
      await closeMongoConnection();
    } catch (_) {}
  });
});
