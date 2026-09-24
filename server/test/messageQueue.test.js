import test from 'node:test';
import assert from 'node:assert';
import { messageQueue } from '../services/messageQueueService.js';

test('Asynchronous Message Queue & Reliability Suite (Sessions 15 & 16)', async (t) => {

  await t.test('1.1 Producer publishes event and consumer receives asynchronously', async () => {
    let received = null;
    const unsubscribe = messageQueue.subscribe('TEST_TOPIC_1', async (payload) => {
      received = payload;
    });

    const res = messageQueue.publish('TEST_TOPIC_1', { orderId: 'ord-101', amount: 500 });
    assert.strictEqual(res.status, 'queued');

    // Wait a brief moment for async tick
    await new Promise(r => setTimeout(r, 50));
    assert.deepStrictEqual(received, { orderId: 'ord-101', amount: 500 });
    unsubscribe();
  });

  await t.test('1.2 Idempotency key prevents duplicate event execution', async () => {
    let executionCount = 0;
    const unsubscribe = messageQueue.subscribe('IDEMPOTENT_TOPIC', async () => {
      executionCount++;
    });

    const key = `idem-${Date.now()}`;
    const firstRes = messageQueue.publish('IDEMPOTENT_TOPIC', { test: 1 }, { idempotencyKey: key });
    assert.strictEqual(firstRes.status, 'queued');

    await new Promise(r => setTimeout(r, 50));
    assert.strictEqual(executionCount, 1);

    // Second publish with identical idempotencyKey
    const secondRes = messageQueue.publish('IDEMPOTENT_TOPIC', { test: 1 }, { idempotencyKey: key });
    assert.strictEqual(secondRes.status, 'skipped_idempotent');

    await new Promise(r => setTimeout(r, 50));
    assert.strictEqual(executionCount, 1, 'Should NOT execute duplicate idempotent message');
    unsubscribe();
  });

  await t.test('1.3 Retries with exponential backoff on transient consumer failure', async () => {
    let attempts = 0;
    const unsubscribe = messageQueue.subscribe('RETRY_TOPIC', async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary downstream failure');
      }
    });

    messageQueue.publish('RETRY_TOPIC', { data: 'retry_me' }, { maxRetries: 4, baseDelayMs: 20 });
    
    // Wait for 3 attempts (approx 20ms + 40ms + margin)
    await new Promise(r => setTimeout(r, 200));
    assert.strictEqual(attempts, 3);
    unsubscribe();
  });

  await t.test('1.4 Dead Letter Queue (DLQ) captures message when all retries are exhausted', async () => {
    messageQueue.purgeDLQ();
    const unsubscribe = messageQueue.subscribe('FAIL_TOPIC', async () => {
      throw new Error('Permanent database constraint error');
    });

    const key = `dlq-test-${Date.now()}`;
    messageQueue.publish('FAIL_TOPIC', { badData: true }, { idempotencyKey: key, maxRetries: 2, baseDelayMs: 20 });

    // Wait for retries to exhaust
    await new Promise(r => setTimeout(r, 150));
    
    const dlq = messageQueue.getDeadLetterQueue();
    const found = dlq.find(m => m.id === key);
    assert.ok(found, 'Message should be routed to Dead Letter Queue (DLQ)');
    assert.strictEqual(found.status, 'dlq');
    assert.strictEqual(found.attempt, 2);
    assert.ok(found.dlqReason.includes('Exhausted'));
    unsubscribe();
  });

  await t.test('1.5 Telemetry and stats report accurate queue metrics', async () => {
    const stats = messageQueue.getQueueStats();
    assert.ok(typeof stats.metrics.published === 'number');
    assert.ok(typeof stats.metrics.delivered === 'number');
    assert.ok(typeof stats.metrics.retried === 'number');
    assert.ok(typeof stats.metrics.dlqRouted === 'number');
  });
});
