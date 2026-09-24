import EventEmitter from 'events';

/**
 * Enterprise Message Queue & Reliability Service
 * Fulfills Capstone Syllabus:
 * - Session 15: Producer-Consumer Implementation (Decoupled Async Message Broker)
 * - Session 16: Reliability Engineering: Retries, Exponential Backoff, Idempotency & Dead Letter Queue (DLQ)
 */

class MessageQueueService extends EventEmitter {
  constructor() {
    super();
    this.topics = new Map(); // topicName -> Array of handlers
    this.queue = [];         // Active pending queue: Array of messages
    this.processing = false;
    this.processedMessageIds = new Set(); // Idempotency check cache
    this.deadLetterQueue = []; // DLQ for permanently failed messages after max retries
    this.stats = {
      published: 0,
      delivered: 0,
      retried: 0,
      dlqRouted: 0,
      idempotentSkipped: 0
    };

    // Auto-register built-in core event subscribers
    this._registerCoreSubscribers();
  }

  /**
   * PRODUCER: Publish a message to a topic
   * @param {string} topic - Event topic name (e.g., 'TRANSACTION_LOGGED', 'SCHEME_SYNC')
   * @param {object} payload - Message data
   * @param {object} options - { idempotencyKey, maxRetries, priority }
   */
  publish(topic, payload, options = {}) {
    const messageId = options.idempotencyKey || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Idempotency verification: reject duplicate processing
    if (this.processedMessageIds.has(messageId)) {
      this.stats.idempotentSkipped++;
      return {
        status: 'skipped_idempotent',
        messageId,
        topic,
        reason: 'Duplicate idempotency key detected; event already processed.'
      };
    }

    const message = {
      id: messageId,
      topic,
      payload,
      options: {
        maxRetries: options.maxRetries !== undefined ? options.maxRetries : 3,
        baseDelayMs: options.baseDelayMs || 200,
        ...options
      },
      attempt: 0,
      status: 'pending',
      publishedAt: new Date().toISOString(),
      errors: []
    };

    this.queue.push(message);
    this.stats.published++;
    this.emit('message:published', message);

    // Trigger async event loop dispatch
    setImmediate(() => this._processNext());

    return {
      status: 'queued',
      messageId: message.id,
      topic,
      queuedAt: message.publishedAt
    };
  }

  /**
   * CONSUMER: Subscribe a worker handler to a topic
   */
  subscribe(topic, handler) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }
    this.topics.get(topic).push(handler);
    return () => {
      const handlers = this.topics.get(topic) || [];
      this.topics.set(topic, handlers.filter(h => h !== handler));
    };
  }

  /**
   * INTERNAL: Dispatcher loop with exponential backoff & DLQ routing
   */
  async _processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const message = this.queue.shift();
    if (!message) {
      this.processing = false;
      return;
    }

    const handlers = this.topics.get(message.topic) || [];
    if (handlers.length === 0) {
      // No active consumers; acknowledge and record
      this.processedMessageIds.add(message.id);
      this.processing = false;
      return this._processNext();
    }

    message.attempt++;
    let success = true;

    for (const handler of handlers) {
      try {
        await handler(message.payload, message);
      } catch (err) {
        success = false;
        message.errors.push({
          attempt: message.attempt,
          error: err.message || String(err),
          timestamp: new Date().toISOString()
        });
      }
    }

    if (success) {
      message.status = 'delivered';
      message.deliveredAt = new Date().toISOString();
      this.processedMessageIds.add(message.id);
      this.stats.delivered++;
      this.emit('message:delivered', message);
    } else {
      // Check if eligible for retry or route to Dead Letter Queue (DLQ)
      if (message.attempt < message.options.maxRetries) {
        this.stats.retried++;
        message.status = 'retrying';
        
        // Exponential backoff: baseDelay * 2^(attempt - 1)
        const delay = message.options.baseDelayMs * Math.pow(2, message.attempt - 1);
        setTimeout(() => {
          this.queue.push(message);
          this._processNext();
        }, delay);
      } else {
        // Exceeded max retries -> Route to Dead Letter Queue (DLQ)
        message.status = 'dlq';
        message.dlqReason = `Exhausted ${message.options.maxRetries} retry attempts.`;
        message.failedAt = new Date().toISOString();
        this.deadLetterQueue.push(message);
        this.stats.dlqRouted++;
        this.emit('message:dlq', message);
      }
    }

    this.processing = false;
    this._processNext();
  }

  /**
   * Internal listeners for real-world asynchronous tasks
   */
  _registerCoreSubscribers() {
    // 1. Asynchronous transaction telemetry
    this.subscribe('TRANSACTION_LOGGED', async (payload) => {
      // Simulates asynchronous background processing without blocking user checkout
      if (payload.amount > 10000) {
        // High-value transaction audit logger
      }
    });

    // 2. Asynchronous scheme matching evaluator
    this.subscribe('SCHEME_REEVALUATE', async (payload) => {
      // Background recalculation
    });
  }

  /**
   * Telemetry and DLQ inspection methods
   */
  getQueueStats() {
    return {
      pendingQueueLength: this.queue.length,
      deadLetterQueueLength: this.deadLetterQueue.length,
      processedCacheSize: this.processedMessageIds.size,
      metrics: { ...this.stats }
    };
  }

  getDeadLetterQueue() {
    return [...this.deadLetterQueue];
  }

  purgeDLQ() {
    const count = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    return { purgedCount: count };
  }

  reprocessDLQ(messageId) {
    const idx = this.deadLetterQueue.findIndex(m => m.id === messageId);
    if (idx === -1) return { success: false, error: 'Message not found in DLQ' };

    const [msg] = this.deadLetterQueue.splice(idx, 1);
    msg.attempt = 0;
    msg.status = 'pending';
    this.queue.push(msg);
    setImmediate(() => this._processNext());
    return { success: true, messageId: msg.id };
  }
}

export const messageQueue = new MessageQueueService();
export default messageQueue;
